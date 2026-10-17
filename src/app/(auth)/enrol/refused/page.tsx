import type { Metadata } from "next";

import { AuthHeading } from "@/components/auth/AuthHeading";
import { ButtonLink } from "@/components/ui/primitives";
import { IconChip } from "@/components/ui/shared-parts";

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
      {/* Neutral, not an alert colour: this is a rule, not a mistake to fix. */}
      <IconChip icon="shield" tone="neutral" className="mb-[18px]" />
      <AuthHeading eyebrow="Save7" title="18 or older only" />
      <p className="mt-3.5 font-medium text-navy" role="alert">
        You must be 18 or older to register for this course.
      </p>
      <p className="mt-3 text-grey">
        We have not kept the date of birth you entered, and your enrolment on the course
        has been removed. You have been signed out.
      </p>
      <ButtonLink href="/" variant="secondary" className="mt-7">
        Back to the homepage
      </ButtonLink>
    </div>
  );
}
