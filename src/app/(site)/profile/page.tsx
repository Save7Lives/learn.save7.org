import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/authz";
import { getProfile } from "@/lib/profile";
import { getLearnerCertificates } from "@/lib/course";
import { Card, Display, Eyebrow } from "@/components/ui/primitives";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { updateProfileAction } from "./actions";

/**
 * Edge runtime, required by Cloudflare Pages.
 *
 * `@cloudflare/next-on-pages` refuses to build a route that renders on the
 * Node runtime — every server-rendered route on Pages runs on workerd. This is
 * the whole reason the app is pinned to Next 15.5.2: the adapter supports no
 * higher, and OpenNext (which does not need this) supports no lower.
 */
export const runtime = "edge";

export const metadata: Metadata = { title: "My profile" };

/**
 * The learner's own account page.
 *
 * Only the name is editable. Email is shown but fixed: it is the login identifier
 * and the unique key, so changing it is an account-recovery flow rather than a
 * profile field, and there is no email verification in this build to do it safely.
 */
export default async function ProfilePage() {
  const user = await requireUser("/profile");
  const profile = await getProfile(user.id);

  // Only reachable if the account was deleted mid-session.
  if (!profile) notFound();

  // The first live certificate, only to decide whether to show the "your name is
  // printed on a certificate" note beside the name field.
  const [liveCertificate] = await getLearnerCertificates(user.id);

  const joined = profile.createdAt.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
      <Eyebrow>My profile</Eyebrow>
      <Display as="h1" className="mt-4 text-display text-ink">
        {profile.name}
      </Display>
      <p className="mt-3 text-sand-600">
        Your name is the only thing here that appears anywhere else — on your
        certificate.
      </p>

      <Card className="mt-8 p-6">
        <h2 className="font-display text-2xl text-ink">Your name</h2>
        <ProfileForm
          action={updateProfileAction}
          firstName={profile.firstName}
          lastName={profile.lastName}
          hasCertificates={Boolean(liveCertificate)}
        />
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="font-display text-2xl text-ink">Account</h2>
        <dl className="mt-4 space-y-4 text-sm">
          <div>
            <dt className="font-semibold text-ink">Email address</dt>
            <dd className="mt-0.5 text-sand-600">{profile.email}</dd>
            <dd className="mt-1 text-xs text-sand-500">
              This is how you sign in, so it cannot be changed here. Email{" "}
              <a
                href="mailto:info@save7.org"
                className="font-semibold text-pink-600 underline"
              >
                info@save7.org
              </a>{" "}
              if you need it moved to a different address.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Learning with Save7 since</dt>
            <dd className="mt-0.5 text-sand-600">{joined}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Your information</dt>
            <dd className="mt-0.5 text-sand-600">
              {profile.popiaConsentAt
                ? "You agreed that Save7 may store your name, email and course progress."
                : "No consent is recorded on this account."}{" "}
              <Link href="/privacy" className="font-semibold text-pink-600 underline">
                How we handle your information
              </Link>
            </dd>
          </div>
        </dl>
      </Card>

      <p className="mt-8 text-sm">
        <Link href="/dashboard" className="font-semibold text-pink-600 underline">
          Back to my progress
        </Link>
      </p>
    </div>
  );
}
