import type { Metadata } from "next";
import Link from "next/link";
import { verifyCertificate } from "@/lib/certificates";
import { siteUrl } from "@/lib/site";
import { CertificateSheet } from "@/components/certificate/CertificateSheet";
import { CertificateActions } from "@/components/certificate/CertificateActions";
import { Badge, ButtonLink, Card, Display, Eyebrow } from "@/components/ui/primitives";
import { Save7Lockup } from "@/components/ui/Save7Lockup";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Vercel supplies per environment. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/certificate/[publicId]">,
): Promise<Metadata> {
  const { publicId } = await props.params;
  const cert = await verifyCertificate(publicId);
  return cert
    ? {
        title: `Certificate ${cert.publicId}`,
        description: `${cert.learnerName}: ${cert.awardTitle}, ${cert.courseTitle}.`,
      }
    : { title: "Certificate not found" };
}

/**
 * The certificate page, doubling as the public verification page.
 *
 * Deliberately reachable without signing in: a certificate nobody else can check is
 * not worth having. It exposes only the name, the award, the date and the validity —
 * never the email, the score or the answers.
 *
 * This route has its own bare layout so it prints without site furniture.
 */
export default async function CertificatePage(
  props: PageProps<"/certificate/[publicId]">,
) {
  const { publicId } = await props.params;
  const cert = await verifyCertificate(publicId);

  const base = siteUrl();
  const verifyUrl = `${base.replace(/^https?:\/\//, "")}/certificate/${publicId}`;

  if (!cert) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20 sm:px-8">
        <Link href="/" aria-label="Save7 Learn home" className="inline-flex">
          <Save7Lockup surface="white" className="text-xl" />
        </Link>
        <Display as="h1" className="mt-10 text-display text-navy">
          No certificate found
        </Display>
        <p className="mt-4 text-grey">
          We couldn&apos;t find a certificate with the ID{" "}
          <span className="font-mono font-semibold text-navy">{publicId}</span>. Check the
          ID and try again. They look like{" "}
          <span className="font-mono">S7-2026-B-000123</span>.
        </p>
        <div className="mt-8">
          <ButtonLink href="/">Go to the course</ButtonLink>
        </div>
      </div>
    );
  }

  const issuedAt = cert.issuedAt.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
      <div className="no-print">
        <Link href="/" aria-label="Save7 Learn home" className="inline-flex">
          <Save7Lockup surface="white" className="text-xl" />
        </Link>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Eyebrow>Certificate verification</Eyebrow>
          {cert.revoked ? (
            <Badge tone="incorrect">Revoked: no longer valid</Badge>
          ) : (
            <Badge tone="correct">✓ Valid certificate</Badge>
          )}
        </div>

        <Display as="h1" className="mt-4 text-display text-navy">
          {cert.learnerName}
        </Display>
        <p className="mt-2 text-lg text-grey">
          {cert.awardTitle} · {cert.courseTitle}
        </p>
      </div>

      <div className="print-sheet mt-8 overflow-hidden rounded-card border border-line bg-white shadow-sm">
        <CertificateSheet
          learnerName={cert.learnerName}
          levelTitle={cert.levelTitle}
          issuedAt={issuedAt}
          publicId={cert.publicId}
          verifyUrl={verifyUrl}
          revoked={cert.revoked}
        />
      </div>

      <div className="mt-8">
        <CertificateActions
          publicId={cert.publicId}
          learnerName={cert.learnerName}
          verifyUrl={`${base}/certificate/${cert.publicId}`}
        />
      </div>

      <Card className="no-print mt-10 p-6">
        <h2 className="font-bold text-navy">What this verifies</h2>
        <dl className="mt-4 space-y-3 text-sm">
          {[
            ["Certificate ID", cert.publicId],
            ["Awarded to", cert.learnerName],
            ["Award", cert.awardTitle],
            ["Level", cert.levelTitle],
            ["Course", cert.courseTitle],
            ["Date completed", issuedAt],
            ["Status", cert.revoked ? "Revoked" : "Valid"],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-4 border-b border-line pb-2">
              <dt className="w-36 shrink-0 font-semibold text-grey">{label}</dt>
              <dd className="text-navy">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-sm text-grey">
          Save7 publishes only these details. Scores, answers and contact details are
          never shown here.{" "}
          <Link href="/privacy" className="underline">
            Read the privacy notice
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
