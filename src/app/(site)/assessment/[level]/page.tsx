import { redirect } from "next/navigation";

/**
 * There is no Level-wide assessment any more. The Assessment Blueprint (#8) gives
 * each Stage its own quiz, taken in the Stage's Check step, and a Level's
 * Certificate is earned by passing all of them (#57, migration 0113). This route
 * stays only so an old link lands on the Level rather than a 404.
 */
export default async function RetiredLevelAssessment(
  props: PageProps<"/assessment/[level]">,
) {
  const { level } = await props.params;
  redirect(`/levels/${level}`);
}
