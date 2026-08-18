/**
 * Bare layout for certificates.
 *
 * No header and no footer: this page is meant to be printed and shared, and site
 * furniture around a certificate looks like a screenshot rather than a document.
 */
export default function CertificateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main id="main">{children}</main>;
}
