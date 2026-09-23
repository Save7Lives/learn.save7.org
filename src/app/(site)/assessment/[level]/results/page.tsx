import { redirect } from "next/navigation";

/**
 * Retired with the Level-wide assessment it reported on (#57). A Stage Quiz shows
 * its own marked paper in the Stage, and the Certificate lives on the Level page.
 */
export default async function RetiredLevelResults(
  props: PageProps<"/assessment/[level]/results">,
) {
  const { level } = await props.params;
  redirect(`/levels/${level}`);
}
