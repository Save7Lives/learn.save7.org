import { cx } from "@/components/ui/primitives";

/**
 * The certificate artwork.
 *
 * Rendered as inline SVG rather than generated as a PDF. That choice buys three
 * things at once: it prints crisply at any size through the browser's own
 * print-to-PDF, it can be serialised to a PNG on the client with no library, and it
 * keeps a heavyweight PDF dependency out of the bundle.
 *
 * The Save7 logo is embedded as a data URI by the server so that a downloaded PNG is
 * self-contained — a certificate that renders a broken image once saved would be
 * worse than no download at all.
 */
export function CertificateSheet({
  learnerName,
  awardTitle,
  courseTitle,
  courseSubtitle,
  levelTitle,
  issuedAt,
  publicId,
  verifyUrl,
  logoDataUri,
  revoked,
  className,
}: {
  learnerName: string;
  awardTitle: string;
  courseTitle: string;
  courseSubtitle: string;
  levelTitle: string;
  issuedAt: string;
  publicId: string;
  verifyUrl: string;
  logoDataUri: string | null;
  revoked: boolean;
  className?: string;
}) {
  // A4 landscape proportions, so print-to-PDF needs no scaling.
  const W = 1123;
  const H = 794;

  return (
    <svg
      id="certificate-svg"
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`Certificate of completion for ${learnerName}: ${awardTitle}, ${courseTitle}, issued ${issuedAt}. Certificate ID ${publicId}.`}
      className={cx("h-auto w-full", className)}
    >
      <defs>
        {/* Fonts are referenced by family name. The page loads Anton and Inter, so
            the on-screen SVG uses them; a serialised PNG falls back to the generic
            families, which is why the stack is spelled out. */}
        <style>{`
          .cert-display { font-family: Anton, "Arial Black", sans-serif; text-transform: uppercase; }
          .cert-body { font-family: Inter, system-ui, sans-serif; }
        `}</style>
      </defs>

      <rect width={W} height={H} fill="#FFFFFF" />

      {/* Pink rule across the top — restrained use of the hero colour. */}
      <rect x="0" y="0" width={W} height="14" fill="#ED0E69" />

      {/* Teal corner block: teal on white is not legible for text, so it appears
          only as a block, per the brand guidelines. */}
      <path d={`M0 ${H} L0 ${H - 120} L120 ${H} Z`} fill="#16B9B4" opacity="0.18" />

      <rect
        x="46"
        y="46"
        width={W - 92}
        height={H - 92}
        fill="none"
        stroke="#E8E3DC"
        strokeWidth="2"
      />

      {logoDataUri ? (
        <image href={logoDataUri} x="88" y="92" width="230" height="29" />
      ) : (
        <text x="88" y="118" className="cert-display" fontSize="30" fill="#111111">
          Save Seven
        </text>
      )}

      <text
        x="88"
        y="188"
        className="cert-body"
        fontSize="15"
        fontWeight="700"
        letterSpacing="3.4"
        fill="#7D7568"
      >
        CERTIFICATE OF COMPLETION
      </text>

      <text x="88" y="252" className="cert-body" fontSize="17" fill="#5C554B">
        This certifies that
      </text>

      {/* The learner's name, the largest element on the sheet. */}
      <text
        x="88"
        y="336"
        className="cert-display"
        fontSize={learnerName.length > 26 ? 54 : 68}
        fill="#111111"
      >
        {learnerName}
      </text>

      <line x1="88" y1="368" x2={W - 88} y2="368" stroke="#E8E3DC" strokeWidth="2" />

      <text x="88" y="416" className="cert-body" fontSize="17" fill="#5C554B">
        has successfully completed
      </text>

      <text x="88" y="470" className="cert-display" fontSize="42" fill="#111111">
        {courseTitle}
      </text>

      <text x="88" y="506" className="cert-body" fontSize="16" fill="#5C554B">
        {courseSubtitle}
      </text>

      {/* The award, in the hero colour — the thing the learner actually earned. */}
      <text x="88" y="566" className="cert-body" fontSize="15" fill="#7D7568">
        Level achieved
      </text>
      <text x="88" y="606" className="cert-display" fontSize="34" fill="#ED0E69">
        {awardTitle}
      </text>
      <text x="88" y="634" className="cert-body" fontSize="15" fill="#5C554B">
        {levelTitle}
      </text>

      {/* Footer: date, id, verification. */}
      <text x="88" y="706" className="cert-body" fontSize="13" fontWeight="700" fill="#7D7568">
        DATE COMPLETED
      </text>
      <text x="88" y="728" className="cert-body" fontSize="16" fill="#111111">
        {issuedAt}
      </text>

      <text x="392" y="706" className="cert-body" fontSize="13" fontWeight="700" fill="#7D7568">
        CERTIFICATE ID
      </text>
      <text x="392" y="728" className="cert-body" fontSize="16" fill="#111111">
        {publicId}
      </text>

      <text x="700" y="706" className="cert-body" fontSize="13" fontWeight="700" fill="#7D7568">
        VERIFY AT
      </text>
      <text x="700" y="728" className="cert-body" fontSize="14" fill="#111111">
        {verifyUrl}
      </text>

      <text
        x={W - 88}
        y="188"
        className="cert-body"
        fontSize="14"
        fill="#7D7568"
        textAnchor="end"
      >
        save7.org
      </text>
      <text
        x={W - 88}
        y="212"
        className="cert-body"
        fontSize="14"
        fontWeight="700"
        fill="#16B9B4"
        textAnchor="end"
      >
        One decision can save seven lives.
      </text>

      {/* A revoked certificate must be unmistakable, not subtly annotated. */}
      {revoked ? (
        <g>
          <rect x="0" y={H / 2 - 70} width={W} height="140" fill="#A3341C" opacity="0.93" />
          <text
            x={W / 2}
            y={H / 2 + 18}
            className="cert-display"
            fontSize="56"
            fill="#FFFFFF"
            textAnchor="middle"
          >
            Revoked
          </text>
        </g>
      ) : null}
    </svg>
  );
}
