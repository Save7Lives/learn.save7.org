import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ConsentForm, DateOfBirthForm } from "@/components/auth/FinishEnrolment";
import { AuthHeading } from "@/components/auth/AuthHeading";
import { Icon } from "@/components/ui/icons";
import { Stepper } from "@/components/ui/shared-parts";
import { getSession } from "@/lib/auth";
import { safeNext } from "@/lib/authz";
import { recordConsentAction, recordDateOfBirthAction, signOutAction } from "../actions";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Vercel supplies per environment. A
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
      <Stepper
        label="Finish enrolling, two steps"
        steps={["Date of birth", "Consent"]}
        current={asking === "date-of-birth" ? 1 : 2}
      />

      {asking === "date-of-birth" ? (
        <>
          <AuthHeading
            eyebrow="Finish enrolling · Step 1 of 2"
            title="Your date of birth"
          >
            Before you start, Save7 needs two things it did not ask when you signed in:
            your date of birth, then your consent to record your progress.
          </AuthHeading>
          <div className="mt-7">
            <DateOfBirthForm action={recordDateOfBirthAction} next={next} />
          </div>
        </>
      ) : (
        <>
          <AuthHeading eyebrow="Finish enrolling · Step 2 of 2" title="Your information">
            Last step. Save7 needs your consent before it can record your progress or
            issue a certificate.
          </AuthHeading>
          <div className="mt-7">
            <ConsentForm action={recordConsentAction} next={next} />
          </div>
        </>
      )}

      <form
        action={signOutAction}
        className="mt-7 flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-line pt-4 text-sm text-grey"
      >
        <Icon name="user" className="size-5 shrink-0" />
        <span>
          Signed in as <span className="font-medium text-navy">{session.email}</span>.
        </span>
        <button type="submit" className="text-teal-ink underline underline-offset-[3px]">
          Sign out
        </button>
      </form>
    </div>
  );
}
