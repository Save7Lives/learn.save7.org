import type { Metadata } from "next";

import { ButtonLink, Display, Eyebrow } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "18 or older only" };

/**
 * Where an under-18 date of birth ends.
 *
 * Terminal on purpose. By the time anyone sees this, `learn_record_date_of_birth()`
 * has deleted their `learners` row and the session has been ended. A page that
 * offered the form again would loop: `learn_claim_me()` enrols them afresh on the
 * next signed-in load. Needs no session, so it is safe to reach directly.
 */
export default function EnrolRefusedPage() {
  return (
    <div>
      <Eyebrow>Save7</Eyebrow>
      <Display className="mt-3">18 or older only</Display>
      <p className="mt-4 text-ink" role="alert">
        You must be 18 or older to register for this course.
      </p>
      <p className="mt-4 text-ink/70">
        We have not kept the date of birth you entered, and your enrolment on the course
        has been removed. You have been signed out.
      </p>
      <ButtonLink href="/" variant="outline" className="mt-8">
        Back to the homepage
      </ButtonLink>
    </div>
  );
}
