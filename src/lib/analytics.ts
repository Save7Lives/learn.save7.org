import "server-only";

import { supabaseServer } from "./supabase/server";
import { SITTING_COLUMNS, levelImprovement, mapSitting, type Sitting } from "./baseline";


/**
 * Save7's analytics.
 *
 * The brief is explicit that the question to answer is "are people learning?",
 * not "how many people clicked things". So the numbers here are built around
 * knowledge movement and where learners get stuck, and there is deliberately no
 * per-learner behavioural profile, no funnel of individual actions, and no
 * ranking of learners against each other.
 *
 * **Knowledge movement is the Baseline's** (#54). Every Sitting is the same twenty
 * questions, so the change between a learner's first Sitting and a later one is
 * like against like, which a Stage Quiz score never was: a Stage Quiz is five
 * questions from one Stage. The Baseline is capped at four Sittings on a fixed
 * schedule, so there are no retakes to inflate it.
 *
 * The Stage Quiz figures that remain here (`averagePostPct`, `passRatePct`,
 * `postDistribution`) still read POST `attempt_no = 1` as a Level score, which
 * stopped being true when #57 made each POST attempt one Stage's five-question
 * paper. They are the map's open admin-indicator audit against #18, and are left
 * for it rather than guessed at here.
 */

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export type LearnerSummary = {
  registered: number;
  /** Sat the first Baseline, which is what opens the course. */
  active: number;
  /** Completed at least one level. */
  completedAnyLevel: number;
  /** Completed every level. */
  completedCourse: number;
  /** Of those who started, the share who finished at least one level. */
  completionRatePct: number | null;
  registeredLast30Days: number;
};

export async function getLearnerSummary(): Promise<LearnerSummary> {
  const supabase = await supabaseServer();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();

  /* Every `learners` row is a learner, so there is no role to filter on any more:
     staff and volunteers are `people` and `volunteers` rows, and a staff member
     who enrols gets a learners row like anybody else and counts as one — which is
     what the old `role = 'LEARNER'` filter was approximating. */
  const [registeredResult, recentResult, baselineResult, completionResult, levelResult] =
    await Promise.all([
      supabase.from("learners").select("id", { count: "exact", head: true }),
      supabase
        .from("learners")
        .select("id", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo),
      supabase.from("learn_baseline_sittings").select("learner_id").eq("sitting_no", 1),
      supabase
        .from("learn_level_progress")
        .select("learner_id, level_slug")
        .eq("status", "COMPLETE"),
      supabase.from("learn_levels").select("slug", { count: "exact", head: true }),
    ]);

  const registered = registeredResult.count ?? 0;
  const registeredLast30Days = recentResult.count ?? 0;
  const levelsTotal = levelResult.count ?? 0;

  // One Sitting 1 per learner, by the table's unique constraint; the set is kept
  // anyway so this does not quietly depend on it.
  const withBaseline = new Set(
    ((baselineResult.data ?? []) as unknown as Array<{ learner_id: string }>).map(
      (a) => a.learner_id,
    ),
  );

  const levelCompletions = (completionResult.data ?? []) as unknown as Array<{
    learner_id: string;
    level_slug: string;
  }>;

  const active = withBaseline.size;

  const levelsByUser = new Map<string, Set<string>>();
  for (const row of levelCompletions) {
    const set = levelsByUser.get(row.learner_id) ?? new Set<string>();
    set.add(row.level_slug);
    levelsByUser.set(row.learner_id, set);
  }

  const completedAnyLevel = levelsByUser.size;
  const completedCourse = [...levelsByUser.values()].filter(
    (set) => set.size === levelsTotal,
  ).length;

  return {
    registered,
    active,
    completedAnyLevel,
    completedCourse,
    // Denominated on learners who actually started, not on everyone who signed
    // up: a sign-up that never began the course says nothing about the teaching.
    completionRatePct: active > 0 ? Math.round((completedAnyLevel / active) * 100) : null,
    registeredLast30Days,
  };
}

export type KnowledgeSummary = {
  /** Sitting 1, the "before". */
  averageBaselinePct: number | null;
  baselineCount: number;
  /** Each learner's latest Sitting after the first, among those who have one. */
  averageLatestPct: number | null;
  resatCount: number;
  /** Latest later Sitting minus Sitting 1, averaged over the same learners. */
  averageImprovement: number | null;
  perLevel: Array<{
    levelId: string;
    slug: string;
    title: string;
    tier: string;
    averagePostPct: number | null;
    postCount: number;
    /** Average change in this Level's Baseline sub-score, from Sitting 1 to the
     *  first Sitting after the Level was completed (CONTEXT.md, Improvement). */
    averagePointChange: number | null;
    /** Learners with both of those Sittings. */
    improvementCount: number;
    passRatePct: number | null;
  }>;
  /** Sitting 1 score distribution, for a histogram. */
  baselineDistribution: Array<{ bucket: string; count: number }>;
  postDistribution: Array<{ bucket: string; count: number }>;
};

const BUCKETS = [
  { label: "0–20%", min: 0, max: 20 },
  { label: "21–40%", min: 21, max: 40 },
  { label: "41–60%", min: 41, max: 60 },
  { label: "61–80%", min: 61, max: 80 },
  { label: "81–100%", min: 81, max: 100 },
];

function distribute(scores: number[]): Array<{ bucket: string; count: number }> {
  return BUCKETS.map((b) => ({
    bucket: b.label,
    count: scores.filter((s) => s >= b.min && s <= b.max).length,
  }));
}

export async function getKnowledgeSummary(): Promise<KnowledgeSummary> {
  const supabase = await supabaseServer();

  const [sittingResult, completionResult, levelResult, postResult] = await Promise.all([
    supabase
      .from("learn_baseline_sittings")
      .select(`learner_id, ${SITTING_COLUMNS}`)
      .order("sitting_no"),

    supabase
      .from("learn_level_progress")
      .select("learner_id, level_slug, completed_at")
      .not("completed_at", "is", null),

    supabase
      .from("learn_levels")
      .select("slug, title, tier, pass_mark_pct")
      .order("position"),

    supabase
      .from("learn_attempts")
      .select("learner_id, level_slug, score_pct, attempt_no")
      .eq("scope", "POST")
      .not("submitted_at", "is", null),
  ]);

  // Each learner's Sittings, oldest first.
  const sittingsByUser = new Map<string, Sitting[]>();
  for (const row of (sittingResult.data ?? []) as unknown as Array<
    { learner_id: string } & Parameters<typeof mapSitting>[0]
  >) {
    const list = sittingsByUser.get(row.learner_id) ?? [];
    list.push(mapSitting(row));
    sittingsByUser.set(row.learner_id, list);
  }

  const completedAt = new Map<string, Date>();
  for (const row of (completionResult.data ?? []) as unknown as Array<{
    learner_id: string;
    level_slug: string;
    completed_at: string;
  }>) {
    completedAt.set(`${row.learner_id}:${row.level_slug}`, new Date(row.completed_at));
  }

  const levels = ((levelResult.data ?? []) as unknown as Array<{
    slug: string;
    title: string;
    tier: string;
    pass_mark_pct: number;
  }>).map((l) => ({
    id: l.slug,
    slug: l.slug,
    title: l.title,
    tier: l.tier,
    passMarkPct: l.pass_mark_pct,
  }));

  const postAttempts = ((postResult.data ?? []) as unknown as Array<{
    learner_id: string;
    level_slug: string | null;
    score_pct: number | null;
    attempt_no: number;
  }>).map((a) => ({
    userId: a.learner_id,
    levelId: a.level_slug,
    scorePct: a.score_pct,
    attemptNo: a.attempt_no,
  }));

  const baselineScores: number[] = [];
  const latestScores: number[] = [];
  const overallChanges: number[] = [];
  for (const sittings of sittingsByUser.values()) {
    const first = sittings.find((s) => s.sittingNo === 1);
    if (!first) continue;
    baselineScores.push(first.totalPct);
    const latest = sittings.filter((s) => s.sittingNo > 1).at(-1);
    if (!latest) continue;
    latestScores.push(latest.totalPct);
    overallChanges.push(latest.totalPct - first.totalPct);
  }

  const perLevel = levels.map((level) => {
    const recorded = postAttempts.filter(
      (a) => a.levelId === level.id && a.attemptNo === 1,
    );
    const scores = recorded.map((a) => a.scorePct ?? 0);

    // Baseline Improvement on this Level's sub-score, for learners who have both
    // Sittings it needs.
    const changes = [...sittingsByUser].flatMap(([userId, sittings]) => {
      const done = completedAt.get(`${userId}:${level.slug}`) ?? null;
      const improvement = levelImprovement(sittings, level.slug, done);
      return improvement ? [improvement.change] : [];
    });

    // Pass rate uses the best attempt, because that is what earns a certificate.
    const allForLevel = postAttempts.filter((a) => a.levelId === level.id);
    const bestByUser = new Map<string, number>();
    for (const a of allForLevel) {
      const current = bestByUser.get(a.userId) ?? 0;
      bestByUser.set(a.userId, Math.max(current, a.scorePct ?? 0));
    }
    const passed = [...bestByUser.values()].filter((s) => s >= level.passMarkPct).length;

    return {
      levelId: level.id,
      slug: level.slug,
      title: level.title,
      tier: level.tier,
      averagePostPct: mean(scores),
      postCount: scores.length,
      averagePointChange: mean(changes),
      improvementCount: changes.length,
      passRatePct:
        bestByUser.size > 0 ? Math.round((passed / bestByUser.size) * 100) : null,
    };
  });

  return {
    averageBaselinePct: mean(baselineScores),
    baselineCount: baselineScores.length,
    averageLatestPct: mean(latestScores),
    resatCount: latestScores.length,
    averageImprovement: mean(overallChanges),
    perLevel,
    baselineDistribution: distribute(baselineScores),
    postDistribution: distribute(
      postAttempts.filter((a) => a.attemptNo === 1).map((a) => a.scorePct ?? 0),
    ),
  };
}

export type MissedQuestion = {
  questionId: string;
  authoringKey: string;
  prompt: string;
  topicTag: string;
  scope: string;
  levelTitle: string | null;
  moduleTitle: string | null;
  answered: number;
  incorrect: number;
  incorrectRatePct: number;
};

/**
 * The most commonly missed questions.
 *
 * The single most actionable report Save7 gets: a question most learners fail is
 * usually a teaching problem in the module before it, not a cohort of poor learners.
 * A minimum sample is enforced so one wrong answer cannot top the list.
 */
export async function getMostMissedQuestions(
  minimumAnswers = 3,
  limit = 12,
): Promise<MissedQuestion[]> {
  const supabase = await supabaseServer();

  /* Answers are embedded through the foreign key on learn_answers.question_id.
     Level and module titles are looked up separately rather than embedded twice:
     a question hangs off one or the other, never both, and two small maps are
     cheaper to read than a query with two optional embeds. */
  const [questionResult, levelResult, moduleResult] = await Promise.all([
    supabase
      .from("learn_questions")
      .select(
        "id, authoring_key, prompt, topic_tag, scope, level_slug, module_slug, learn_answers(was_correct)",
      ),
    supabase.from("learn_levels").select("slug, title"),
    supabase.from("learn_modules").select("slug, title"),
  ]);

  const levelTitles = new Map(
    ((levelResult.data ?? []) as unknown as Array<{ slug: string; title: string }>).map((l) => [
      l.slug,
      l.title,
    ]),
  );
  const moduleTitles = new Map(
    ((moduleResult.data ?? []) as unknown as Array<{ slug: string; title: string }>).map((m) => [
      m.slug,
      m.title,
    ]),
  );

  const questions = ((questionResult.data ?? []) as unknown as Array<{
    id: string;
    authoring_key: string;
    prompt: string;
    topic_tag: string;
    scope: string;
    level_slug: string | null;
    module_slug: string | null;
    learn_answers: Array<{ was_correct: boolean }> | null;
  }>).map((q) => ({
    id: q.id,
    authoringKey: q.authoring_key,
    prompt: q.prompt,
    topicTag: q.topic_tag,
    scope: q.scope,
    level: q.level_slug ? { title: levelTitles.get(q.level_slug) ?? null } : null,
    module: q.module_slug ? { title: moduleTitles.get(q.module_slug) ?? null } : null,
    answers: (q.learn_answers ?? []).map((a) => ({ isCorrect: a.was_correct })),
  }));

  return questions
    .map((q) => {
      const answered = q.answers.length;
      const incorrect = q.answers.filter((a) => !a.isCorrect).length;
      return {
        questionId: q.id,
        authoringKey: q.authoringKey,
        prompt: q.prompt,
        topicTag: q.topicTag,
        scope: q.scope,
        levelTitle: q.level?.title ?? null,
        moduleTitle: q.module?.title ?? null,
        answered,
        incorrect,
        incorrectRatePct: answered > 0 ? Math.round((incorrect / answered) * 100) : 0,
      };
    })
    .filter((q) => q.answered >= minimumAnswers && q.incorrect > 0)
    .sort(
      (a, b) =>
        b.incorrectRatePct - a.incorrectRatePct || b.answered - a.answered,
    )
    .slice(0, limit);
}

export type ModuleEngagement = {
  moduleId: string;
  slug: string;
  title: string;
  order: number;
  levelTitle: string;
  levelSlug: string;
  started: number;
  completed: number;
  completionRatePct: number | null;
  /** Median rather than mean: one learner leaving a tab open would skew a mean. */
  medianSeconds: number | null;
  estMinutes: number;
  /** Learners who started this module and did not complete it. */
  dropped: number;
};

export async function getModuleEngagement(): Promise<ModuleEngagement[]> {
  const supabase = await supabaseServer();

  /* Ordered by level then module. PostgREST cannot order by a parent's column
     either, so the level order is fetched and applied below — the same shape the
     previous implementation needed, for the same reason. */
  const [levelResult, moduleResult] = await Promise.all([
    supabase.from("learn_levels").select("slug, title, position"),
    supabase
      .from("learn_modules")
      .select(
        "slug, title, position, est_minutes, level_slug, learn_module_progress(status, seconds_spent)",
      ),
  ]);

  const levelRows = (levelResult.data ?? []) as unknown as Array<{
    slug: string;
    title: string;
    position: number;
  }>;
  if (levelRows.length === 0) return [];

  const levelOrder = new Map(levelRows.map((l) => [l.slug, l.position]));
  const levelTitles = new Map(levelRows.map((l) => [l.slug, l.title]));

  const modules = ((moduleResult.data ?? []) as unknown as Array<{
    slug: string;
    title: string;
    position: number;
    est_minutes: number;
    level_slug: string;
    learn_module_progress: Array<{ status: string; seconds_spent: number }> | null;
  }>)
    .map((m) => ({
      id: m.slug,
      slug: m.slug,
      title: m.title,
      order: m.position,
      estMinutes: m.est_minutes,
      levelId: m.level_slug,
      level: { title: levelTitles.get(m.level_slug) ?? "", slug: m.level_slug },
      progress: (m.learn_module_progress ?? []).map((p) => ({
        status: p.status,
        secondsSpent: p.seconds_spent,
      })),
    }))
    .sort(
      (a, b) =>
        (levelOrder.get(a.levelId) ?? 0) - (levelOrder.get(b.levelId) ?? 0) || a.order - b.order,
    );

  return modules.map((m) => {
    const started = m.progress.length;
    const completed = m.progress.filter((p) => p.status === "COMPLETE").length;

    const times = m.progress
      .map((p) => p.secondsSpent)
      .filter((s) => s > 0)
      .sort((a, b) => a - b);
    const medianSeconds = times.length
      ? times[Math.floor(times.length / 2)]
      : null;

    return {
      moduleId: m.id,
      slug: m.slug,
      title: m.title,
      order: m.order,
      levelTitle: m.level.title,
      levelSlug: m.level.slug,
      started,
      completed,
      completionRatePct: started > 0 ? Math.round((completed / started) * 100) : null,
      medianSeconds,
      estMinutes: m.estMinutes,
      dropped: started - completed,
    };
  });
}

export type CertificateRow = {
  publicId: string;
  learnerName: string;
  awardTitle: string;
  levelTitle: string;
  scorePct: number;
  issuedAt: Date;
  revokedAt: Date | null;
};

export async function getCertificates(limit = 100): Promise<CertificateRow[]> {
  const supabase = await supabaseServer();

  const [certResult, levelResult] = await Promise.all([
    supabase
      .from("learn_certificates")
      .select("code, issued_name, award_title, level_slug, score_pct, issued_at, revoked_at")
      .order("issued_at", { ascending: false })
      .limit(limit),
    supabase.from("learn_levels").select("slug, title"),
  ]);

  const levelTitles = new Map(
    ((levelResult.data ?? []) as unknown as Array<{ slug: string; title: string }>).map((l) => [
      l.slug,
      l.title,
    ]),
  );

  return ((certResult.data ?? []) as unknown as Array<{
    code: string;
    issued_name: string;
    award_title: string | null;
    level_slug: string | null;
    score_pct: number | null;
    issued_at: string;
    revoked_at: string | null;
  }>).map((r) => ({
    publicId: r.code,
    learnerName: r.issued_name,
    awardTitle: r.award_title ?? "",
    levelTitle: r.level_slug ? (levelTitles.get(r.level_slug) ?? "") : "",
    scorePct: r.score_pct ?? 0,
    issuedAt: new Date(r.issued_at),
    revokedAt: r.revoked_at ? new Date(r.revoked_at) : null,
  }));
}

export type ReviewSummary = {
  total: number;
  needsVerification: number;
  approved: number;
  rejected: number;
  blockingLaunch: number;
  byCategory: Array<{ category: string; count: number }>;
};

export async function getReviewSummary(): Promise<ReviewSummary> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("learn_review_items")
    .select("status, category, severity");

  const items = (data ?? []) as unknown as Array<{
    status: string;
    category: string;
    severity: number;
  }>;

  const byCategory = ["MEDICAL", "LEGAL", "STATISTIC"].map((category) => ({
    category,
    count: items.filter(
      (i) => i.category === category && i.status === "NEEDS_VERIFICATION",
    ).length,
  }));

  return {
    total: items.length,
    needsVerification: items.filter((i) => i.status === "NEEDS_VERIFICATION").length,
    approved: items.filter((i) => i.status === "APPROVED").length,
    rejected: items.filter((i) => i.status === "REJECTED").length,
    blockingLaunch: items.filter(
      (i) => i.status === "NEEDS_VERIFICATION" && i.severity === 1,
    ).length,
    byCategory,
  };
}
