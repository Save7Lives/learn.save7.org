import type { Metadata } from "next";
import Link from "next/link";
import { getCertificates } from "@/lib/analytics";
import { DataTable, PageTitle, Section, StatCard } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui/primitives";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Cloudflare applies at deploy time. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Certificates" };

export default async function CertificatesPage() {
  const certificates = await getCertificates(200);

  const valid = certificates.filter((c) => !c.revokedAt);
  const byAward = new Map<string, number>();
  for (const cert of valid) {
    byAward.set(cert.awardTitle, (byAward.get(cert.awardTitle) ?? 0) + 1);
  }

  return (
    <>
      <PageTitle
        title="Certificates"
        description="Every certificate is publicly verifiable from its ID. Names and award titles are snapshotted at the moment of issue, so renaming an account never rewrites a certificate somebody has already shared."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Issued" value={certificates.length} sub="All time" />
        <StatCard label="Valid" value={valid.length} tone="teal" />
        <StatCard
          label="Revoked"
          value={certificates.length - valid.length}
          tone={certificates.length - valid.length > 0 ? "warn" : "neutral"}
        />
        <StatCard
          label="Distinct awards"
          value={byAward.size}
          sub={[...byAward.entries()].map(([a, n]) => `${a}: ${n}`).join(" · ") || undefined}
        />
      </div>

      <Section title="Issued certificates" className="mt-6">
        <DataTable
          caption="Issued certificates"
          columns={["Certificate ID", "Learner", "Award", "Score", "Issued", "Status"]}
          rows={certificates.map((cert) => [
            <Link
              key="id"
              href={`/certificate/${cert.publicId}`}
              className="font-mono text-xs font-semibold text-pink-600 underline"
            >
              {cert.publicId}
            </Link>,
            <span key="n" className="font-semibold text-ink">
              {cert.learnerName}
            </span>,
            cert.awardTitle,
            `${cert.scorePct}%`,
            <span key="d" className="whitespace-nowrap text-xs text-sand-500">
              {cert.issuedAt.toLocaleDateString("en-ZA", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>,
            cert.revokedAt ? (
              <Badge key="s" tone="incorrect">
                Revoked
              </Badge>
            ) : (
              <Badge key="s" tone="correct">
                Valid
              </Badge>
            ),
          ])}
          emptyMessage="No certificates issued yet."
        />
      </Section>
    </>
  );
}
