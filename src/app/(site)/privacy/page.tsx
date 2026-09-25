import type { Metadata } from "next";
import { Badge, Card, Display, Eyebrow } from "@/components/ui/primitives";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Cloudflare applies at deploy time. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy & POPIA",
  description:
    "What information Transplant Alchemy 101 collects, why, and what Save7 does with it.",
};

/**
 * Plain-language privacy notice.
 *
 * Written to be read rather than to be legally impenetrable. It states exactly
 * which fields exist, because the honest answer is short: a name, an email, and
 * course progress.
 *
 * This is a factual description of what the application does, not legal advice —
 * Save7 should have it reviewed before launch, which the note at the bottom says.
 */
export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <Eyebrow>Privacy</Eyebrow>
      <Display as="h1" className="mt-5 text-display text-ink">
        Your information
      </Display>
      <p className="mt-6 text-lg text-sand-700">
        Short version: we store your name, your email address, and how you are getting on
        with the course. Nothing else. We do not sell it, we do not track you around the
        internet, and you can ask us to delete it.
      </p>

      <section className="mt-14">
        <Display as="h2" className="text-title text-ink">
          What we collect
        </Display>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
            <caption className="sr-only">
              Information collected, and the reason for each
            </caption>
            <thead>
              <tr className="border-b-2 border-sand-300">
                <th scope="col" className="py-2.5 pr-4 font-bold text-ink">
                  What
                </th>
                <th scope="col" className="py-2.5 pr-4 font-bold text-ink">
                  Why
                </th>
              </tr>
            </thead>
            <tbody className="text-sand-700">
              {[
                ["Your name", "To greet you, and to print on your certificate."],
                ["Your email address", "To sign you in. It is your account identifier."],
                [
                  "Your date of birth",
                  "This course is 18+ only. We check your age when you register, or before you start if you signed in without registering, and keep the date rather than just a yes/no so that check can be reviewed later. If you are under 18 we keep neither the date nor your enrolment.",
                ],
                [
                  "Your password",
                  "Stored only as a bcrypt hash. We cannot read it, and neither can anyone with database access.",
                ],
                [
                  "Which modules you have completed",
                  "So you can stop and pick up where you left off.",
                ],
                [
                  "Your quiz answers and scores",
                  "To show you what you have learned, and to tell Save7 whether the course is working.",
                ],
                [
                  "Time spent in a module",
                  "So Save7 can see which modules are too long or unclear.",
                ],
                [
                  "Your certificates",
                  "So they can be re-issued if you lose them, and verified by anyone you show them to.",
                ],
              ].map(([what, why]) => (
                <tr key={what} className="border-b border-sand-200">
                  <th scope="row" className="py-3 pr-4 align-top font-semibold text-ink">
                    {what}
                  </th>
                  <td className="py-3 pr-4 align-top">{why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-14">
        <Display as="h2" className="text-title text-ink">
          What we deliberately do not collect
        </Display>
        <ul className="prose-save7 mt-5">
          <li>
            <strong>No health information.</strong> We never ask whether you are a
            registered donor, what your medical history is, or anything about your family.
            This is a course, not a registry.
          </li>
          <li>
            <strong>No IP addresses and no device fingerprints.</strong> The analytics that
            record which lessons are being used store no IP address and no browser or device
            details.
          </li>
          <li>
            <strong>No third-party trackers.</strong> There are no advertising pixels,
            social widgets or analytics scripts from other companies on this site.
          </li>
          <li>
            <strong>No demographic profiling beyond the 18+ check.</strong> We ask your date
            of birth because this course is for adults only, and nothing else about it. We do
            not ask your race, gender, religion or location.
          </li>
        </ul>
      </section>

      <section className="mt-14">
        <Display as="h2" className="text-title text-ink">
          How Save7 uses it
        </Display>
        <div className="prose-save7 mt-5">
          <p>
            Save7 staff can see aggregate figures — average scores, how many people
            finished a level, which questions most people get wrong. That is the whole
            purpose of measuring: to find out whether people are actually learning, and to
            fix the parts of the course that are not working.
          </p>
          <p>
            Your individual answers are not circulated, discussed, or used to assess you as
            a person. The course has no leaderboard and no ranking, deliberately.
          </p>
        </div>
      </section>

      <section className="mt-14">
        <Display as="h2" className="text-title text-ink">
          Your certificate is public — on purpose
        </Display>
        <div className="prose-save7 mt-5">
          <p>
            A certificate is only useful if someone else can check it. Anyone with your
            certificate ID can see the name on it, which level it is for, the date, and
            whether it is still valid. Nothing else — not your email, not your scores, not
            your answers.
          </p>
          <p>
            If you would prefer your certificate not to be verifiable, tell us and we will
            revoke it.
          </p>
        </div>
      </section>

      <section className="mt-14">
        <Display as="h2" className="text-title text-ink">
          Your rights under POPIA
        </Display>
        <p className="mt-4 text-sand-600">
          South Africa&apos;s Protection of Personal Information Act gives you the right to:
        </p>
        <ul className="prose-save7 mt-4">
          <li>ask what information we hold about you, and get a copy;</li>
          <li>have anything inaccurate corrected;</li>
          <li>have your information deleted;</li>
          <li>withdraw the consent you gave;</li>
          <li>complain to the Information Regulator if you are not satisfied.</li>
        </ul>
        <p className="mt-5 text-sand-600">
          Deleting your account removes your name, email, answers and progress. Your
          certificate is revoked at the same time, so it will no longer verify.
        </p>
      </section>

      <section className="mt-14">
        <Display as="h2" className="text-title text-ink">
          Consent
        </Display>
        <p className="mt-4 text-sand-600">
          We record the moment you consented, when you tick the box at registration or, if
          you signed in without registering, on the screen that asks before you start. We
          do not treat visiting the site, or ignoring a banner, as consent.
        </p>
      </section>

      <Card className="mt-14 border-review/30 bg-review-soft p-6">
        <Badge tone="review">Pending Save7 review</Badge>
        <h2 className="mt-3 font-bold text-ink">Before this course is published</h2>
        <div className="prose-save7 mt-2 text-sm">
          <p>
            This page accurately describes what the application does, and it is written to
            be understood rather than to be legally exhaustive. Save7 should complete it
            before launch with:
          </p>
          <ul>
            <li>the responsible party&apos;s registered name and address;</li>
            <li>the information officer&apos;s name and contact details;</li>
            <li>an email address for access, correction and deletion requests;</li>
            <li>where the data is hosted, and in which country;</li>
            <li>how long records are kept after a learner becomes inactive;</li>
            <li>a legal review against POPIA as currently in force.</li>
          </ul>
          <p>
            This notice is a factual description of the software, not legal advice.
          </p>
        </div>
      </Card>
    </article>
  );
}
