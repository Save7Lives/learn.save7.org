import "server-only";

import { and, eq, gte, isNotNull, sql } from "drizzle-orm";

import { db } from "./db";
import { certificates, levels, quizAttempts, users } from "@/db/schema";
import { isLevelContentComplete, recordEvent } from "./progress";

/**
 * Certificates.
 *
 * Two rules govern issuance, and both are enforced here rather than in the UI so
 * that no route can bypass them:
 *
 *   1. Every mandatory module in the level must be complete.
 *   2. The learner must have reached the level's pass mark on some attempt.
 *
 * The learner's name and the award title are *snapshotted* onto the certificate.
 * Renaming an account later must not silently rewrite a certificate someone has
 * already shown to an employer, and re-wording a level's award must not retroactively
 * change what past learners were given.
 */

/** e.g. "S7-2026-B-000123" — year, level letter, then a per-level sequence. */
function formatPublicId(year: number, code: string, sequence: number): string {
  return `S7-${year}-${code}-${String(sequence).padStart(6, "0")}`;
}

export type IssuedCertificate = {
  publicId: string;
  awardTitleSnapshot: string;
  learnerNameSnapshot: string;
  issuedAt: Date;
  scorePct: number;
};

/**
 * Issue a certificate if it has been earned, or return the existing one.
 *
 * Idempotent: a learner refreshing the results screen must not mint a second
 * certificate, which the unique constraint on (userId, levelId) also enforces at
 * the database level.
 */
export async function issueCertificateIfEarned(
  userId: string,
  levelId: string,
): Promise<IssuedCertificate | null> {
  const [existing] = await db
    .select({
      publicId: certificates.publicId,
      awardTitleSnapshot: certificates.awardTitleSnapshot,
      learnerNameSnapshot: certificates.learnerNameSnapshot,
      issuedAt: certificates.issuedAt,
      scorePct: certificates.scorePct,
      revokedAt: certificates.revokedAt,
    })
    .from(certificates)
    .where(and(eq(certificates.userId, userId), eq(certificates.levelId, levelId)))
    .limit(1);
  if (existing) return existing.revokedAt ? null : existing;

  const [level] = await db
    .select({
      id: levels.id,
      courseId: levels.courseId,
      certificateTitle: levels.certificateTitle,
      certificateCode: levels.certificateCode,
      passMarkPct: levels.passMarkPct,
    })
    .from(levels)
    .where(eq(levels.id, levelId))
    .limit(1);
  if (!level) return null;

  // Gate 1: all mandatory modules complete.
  if (!(await isLevelContentComplete(userId, levelId))) return null;

  // Gate 2: pass mark reached on some attempt.
  const attempts = await db
    .select({ scorePct: quizAttempts.scorePct })
    .from(quizAttempts)
    .where(
      and(
        eq(quizAttempts.userId, userId),
        eq(quizAttempts.levelId, levelId),
        eq(quizAttempts.kind, "POST"),
        isNotNull(quizAttempts.submittedAt),
      ),
    );
  const best = attempts.length ? Math.max(...attempts.map((a) => a.scorePct ?? 0)) : 0;
  if (best < level.passMarkPct) return null;

  const [user] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return null;

  const year = new Date().getFullYear();

  // Sequence per level per year. Counting existing rows is adequate here — a
  // Postgres deployment with real concurrency should use a sequence, which is
  // noted in prisma/README.md. The unique index means a collision fails loudly
  // rather than issuing a duplicate id.
  const [{ count: issuedThisYear }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(certificates)
    .where(
      and(
        eq(certificates.levelId, levelId),
        gte(certificates.issuedAt, new Date(`${year}-01-01T00:00:00.000Z`)),
      ),
    );

  const [created] = await db
    .insert(certificates)
    .values({
      publicId: formatPublicId(year, level.certificateCode, Number(issuedThisYear) + 1),
      userId,
      courseId: level.courseId,
      levelId,
      learnerNameSnapshot: user.name,
      awardTitleSnapshot: level.certificateTitle,
      scorePct: best,
    })
    .returning({
      publicId: certificates.publicId,
      awardTitleSnapshot: certificates.awardTitleSnapshot,
      learnerNameSnapshot: certificates.learnerNameSnapshot,
      issuedAt: certificates.issuedAt,
      scorePct: certificates.scorePct,
    });

  await recordEvent(userId, "certificate_issue", {
    metaJson: JSON.stringify({ publicId: created.publicId, scorePct: best }),
  });

  return created;
}

export type PublicCertificate = {
  publicId: string;
  learnerName: string;
  awardTitle: string;
  courseTitle: string;
  levelTitle: string;
  issuedAt: Date;
  revoked: boolean;
};

/**
 * Look up a certificate for public verification.
 *
 * Returns only what a verifier legitimately needs: the name on it, what it is for,
 * when it was issued, and whether it is still valid. Never the email, the score, or
 * the answers — see the privacy notice.
 */
export async function verifyCertificate(
  publicId: string,
): Promise<PublicCertificate | null> {
  const row = await db.query.certificates.findFirst({
    where: eq(certificates.publicId, publicId.trim().toUpperCase()),
    columns: {
      publicId: true,
      learnerNameSnapshot: true,
      awardTitleSnapshot: true,
      issuedAt: true,
      revokedAt: true,
    },
    with: {
      course: { columns: { title: true, subtitle: true } },
      level: { columns: { title: true } },
    },
  });
  if (!row) return null;

  return {
    publicId: row.publicId,
    learnerName: row.learnerNameSnapshot,
    awardTitle: row.awardTitleSnapshot,
    courseTitle: row.course.title,
    levelTitle: row.level.title,
    issuedAt: row.issuedAt,
    revoked: row.revokedAt !== null,
  };
}
