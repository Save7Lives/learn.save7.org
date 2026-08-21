import { apiUser } from "@/lib/authz";
import { gradeCheckAnswer } from "@/lib/quiz";

/**
 * Edge runtime, required by Cloudflare Pages.
 *
 * `@cloudflare/next-on-pages` refuses to build a route that renders on the
 * Node runtime — every server-rendered route on Pages runs on workerd. This is
 * the whole reason the app is pinned to Next 15.5.2: the adapter supports no
 * higher, and OpenNext (which does not need this) supports no lower.
 */
export const runtime = "edge";

/**
 * Grade one inline "check your understanding" question.
 *
 * These are graded server-side like everything else. Grading them in the browser
 * would mean shipping the answer key to the browser, which would let a curious
 * learner read the answers to every check in the course.
 */
export async function POST(request: Request) {
  const auth = await apiUser();
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { questionId, choiceIds } = (body ?? {}) as {
    questionId?: unknown;
    choiceIds?: unknown;
  };

  if (typeof questionId !== "string" || !Array.isArray(choiceIds)) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = await gradeCheckAnswer(
    auth.user.id,
    questionId,
    choiceIds.filter((c): c is string => typeof c === "string"),
  );

  if ("error" in result) return Response.json(result, { status: 404 });
  return Response.json(result);
}
