import Link from "next/link";

import { Card } from "@/components/ui/primitives";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { updateProfileAction } from "@/app/(site)/dashboard/actions";
import type { Profile } from "@/lib/profile";

/**
 * The learner's own account details, shown at the foot of My progress.
 *
 * Only the name is editable. Email is shown but fixed: it is the login identifier
 * and the unique key, so changing it is an account-recovery flow rather than a
 * profile field, and there is no email verification in this build to do it safely.
 */
export function ProfileSection({
  profile,
  hasCertificates,
}: {
  profile: Profile;
  hasCertificates: boolean;
}) {
  const joined = profile.createdAt.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section
      id="profile"
      aria-labelledby="profile-heading"
      className="mx-auto max-w-[70rem] scroll-mt-20 px-4 pb-16 sm:px-6"
    >
      <h2 id="profile-heading" className="font-display text-[1.75rem] font-bold leading-tight text-navy">
        My profile
      </h2>
      <p className="mt-1 text-grey">
        Your name is the only thing here that appears anywhere else: on your certificate.
      </p>

      <div className="mt-6 grid max-w-2xl gap-6">
        <Card className="p-6">
          <h3 className="font-display text-2xl text-navy">Your name</h3>
          <ProfileForm
            action={updateProfileAction}
            firstName={profile.firstName}
            lastName={profile.lastName}
            hasCertificates={hasCertificates}
          />
        </Card>

        <Card className="p-6">
          <h3 className="font-display text-2xl text-navy">Account</h3>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-navy">Email address</dt>
              <dd className="mt-0.5 text-grey">{profile.email}</dd>
              <dd className="mt-1 text-xs text-grey">
                This is how you sign in, so it cannot be changed here. Email{" "}
                <a href="mailto:info@save7.org" className="font-semibold text-pink underline">
                  info@save7.org
                </a>{" "}
                if you need it moved to a different address.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-navy">Learning with Save7 since</dt>
              <dd className="mt-0.5 text-grey">{joined}</dd>
            </div>
            <div>
              <dt className="font-semibold text-navy">Your information</dt>
              <dd className="mt-0.5 text-grey">
                {profile.popiaConsentAt
                  ? "You agreed that Save7 may store your name, email, date of birth and course progress."
                  : "No consent is recorded on this account."}{" "}
                <Link href="/privacy" className="font-semibold text-pink underline">
                  How we handle your information
                </Link>
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    </section>
  );
}
