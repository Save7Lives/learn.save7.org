import "server-only";

import { supabaseServer } from "./supabase/server";

/**
 * Certificates.
 *
 * Two rules govern issuance, and both are now enforced in the database rather
 * than here, because `learn_certificates` has no insert policy — a client that
 * could write the table could award itself one:
 *
 *   1. Every mandatory module in the level must be complete.
 *   2. The learner must have reached the level's pass mark on some attempt.
 *
 * The learner's name and the award title are *snapshotted* onto the certificate.
 * Renaming an account later must not silently rewrite a certificate someone has
 * already shown to an employer, and re-wording a level's award must not
 * retroactively change what past learners were given.
 *
 * The public id — "S7-2026-B-000123" — is minted by the same function, so the
 * year, the level letter and the per-level sequence cannot be assigned by two
 * different implementations that disagree.
 */

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
 * certificate, which a unique index on (learner_id, level_slug) also enforces.
 */
export async function issueCertificateIfEarned(
  userId: string,
  levelId: string,
): Promise<IssuedCertificate | null> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("learn_issue_certificate", {
    p_level_slug: levelId,
  });

  if (error || !data) return null;

  const row = data as {
    public_id: string;
    award_title_snapshot: string | null;
    learner_name_snapshot: string;
    issued_at: string;
    score_pct: number | null;
  };

  return {
    publicId: row.public_id,
    awardTitleSnapshot: row.award_title_snapshot ?? "",
    learnerNameSnapshot: row.learner_name_snapshot,
    issuedAt: new Date(row.issued_at),
    scorePct: row.score_pct ?? 0,
  };
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
 * Returns only what a verifier legitimately needs: the name on it, what it is
 * for, when it was issued, and whether it is still valid. Never the email, the
 * score, or the answers — see the privacy notice.
 *
 * Goes through `learn_verify_certificate()` because a verifier has no account,
 * and the table's select policy scopes reads to the learner who earned it. The
 * function is executable by `anon` for exactly that reason, and returns those
 * fields and no others.
 */
export async function verifyCertificate(
  publicId: string,
): Promise<PublicCertificate | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.rpc("learn_verify_certificate", { p_code: publicId });

  if (!data) return null;

  const row = data as {
    public_id: string;
    learner_name: string;
    award_title: string | null;
    course_title: string | null;
    level_title: string | null;
    issued_at: string;
    revoked: boolean;
  };

  return {
    publicId: row.public_id,
    learnerName: row.learner_name,
    awardTitle: row.award_title ?? "",
    courseTitle: row.course_title ?? "",
    levelTitle: row.level_title ?? "",
    issuedAt: new Date(row.issued_at),
    revoked: row.revoked,
  };
}
