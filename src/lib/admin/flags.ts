/**
 * Eligibility flags (#83), with no server-only imports so the rule editor, a client
 * component, can share them with the server pages.
 *
 * One flag family exists: `level_complete:<level slug>`, true once that Level's
 * `completed_at` is set. Any other string is a flag nobody holds, so a rule that
 * names one reads as nobody eligible rather than raising.
 */
export const levelFlag = (levelSlug: string) => `level_complete:${levelSlug}`;

export function flagLabel(flag: string, levels: Array<{ slug: string; title: string }>): string {
  const level = levels.find((l) => levelFlag(l.slug) === flag);
  return level ? `${level.title} Level complete` : flag;
}

/** An empty list is nobody: an AND of nothing would make every Student eligible. */
export function readsEligible(held: string[], flags: string[]): boolean {
  return flags.length > 0 && flags.every((f) => held.includes(f));
}
