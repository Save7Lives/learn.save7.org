import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ConsentForm, DateOfBirthForm } from "@/components/auth/FinishEnrolment";
import { Display, Eyebrow } from "@/components/ui/primitives";
import { getSession } from "@/lib/auth";
import { safeNext } from "@/lib/authz";
import { recordConsentAction, recordDateOfBirthAction, signOutAction } from "../actions";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Cloudflare applies at deploy time. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Finish enrolling" };

/**
 * Finish enrolling: the screen `requireUser()` sends a learner to while their row
 * lacks a date of birth or a consent.
 *
 * Which step shows is read from the row, not carried in the URL, so a refresh, a
 * second tab or coming back next week all land on the question still unanswered.
 */
export default async function EnrolPage(props: PageProps<"/enrol">) {
  const { next: rawNext } = await props.searchParams;
  // Never back here: a finished learner redirected to /enrol would redirect forever.
  const next = safeNext(rawNext).startsWith("/enrol") ? "/dashboard" : safeNext(rawNext);

  // Not requireUser(): that is what sends people here.
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (session.enrolment === "complete") redirect(next);

  const asking = session.enrolment;

  return (
    <div>
      <Eyebrow>Finish enrolling · Step {asking === "date-of-birth" ? 1 : 2} of 2</Eyebrow>

      {asking === "date-of-birth" ? (
        <>
          <Display className="mt-3">Your date of birth</Display>
          <p className="mt-4 text-ink/70">
            Before you start, Save7 needs two things it did not ask when you signed in:
            your date of birth, then your consent to record your progress.
          </p>
          <div className="mt-8">
            <DateOfBirthForm action={recordDateOfBirthAction} next={next} />
          </div>
        </>
      ) : (
        <>
          <Display className="mt-3">Your information</Display>
          <p className="mt-4 text-ink/70">
            Last step. Save7 needs your consent before it can record your progress or
            issue a certificate.
          </p>
          <div className="mt-8">
            <ConsentForm action={recordConsentAction} next={next} />
          </div>
        </>
      )}

      <form action={signOutAction} className="mt-8 text-sm text-ink/60">
        Signed in as {session.email}.{" "}
        <button type="submit" className="underline">
          Sign out
        </button>
      </form>
    </div>
  );
}
