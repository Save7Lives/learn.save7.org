"use client";

import { useEffect, useState } from "react";
import { cx } from "@/components/ui/primitives";
import { CERTIFICATE_FONT_CSS } from "./certificate-fonts";

/**
 * The certificate artwork: a type poster on one white sheet (#69).
 *
 * Rendered as inline SVG, which stays the single source of truth for the artwork.
 * The page prints it through the browser's own print-to-PDF (genuine vector text),
 * the actions serialise it to a PNG and to a PDF on the client, and nothing runs on
 * the server. Every position, size and colour below is the spec's Certificate
 * Design section in CURRICULUM-ASSESSMENT-SPEC.md.
 *
 * The SVG carries its own @font-face rules with the three fonts inlined as base64,
 * so a serialised copy is set in Montserrat and Lexend and not in whatever the
 * viewer's machine falls back to. The family names are prefixed "S7" so they can
 * never collide with a font the page loads itself.
 *
 * An SVG does not wrap, so the learner's name is measured once the fonts have
 * loaded and the spec's fit rule applied. `data-fit` flips to "ready" when that is
 * done; the download actions wait for it.
 */

const W = 1123;
const H = 794;
const MARGIN = 72;
const CONTENT_W = W - MARGIN * 2;

const NAVY = "#0c173b";
const GREY = "#585858";
const PINK = "#df0e62";
const PINK_50 = "#fff7f9";
const PINK_LINE = "#fcd9e5";
const TEAL = "#16B9B4";
const INCORRECT = "#a3341c";

const NAME_BASE = 100;
const NAME_FLOOR = 44;
const NAME_MAX_WIDTH = 820;
const NAME_LINE_HEIGHT = 0.98;
const NAME_LAST_BASELINE = 410;

const PILL_FONT = 30;
const PILL_TRACKING = 0.04;
const PILL_PAD = 30;

const MONTSERRAT = '"S7 Montserrat", Montserrat, Arial, sans-serif';
const LEXEND = '"S7 Lexend", Lexend, Arial, sans-serif';

type Measure = (text: string, weight: 800 | 700, sizePx: number) => number;

type Fit = {
  lines: string[];
  size: number;
  pillTextWidth: number;
};

/** Rough widths, used for the server render and until the real fonts are measured. */
const estimate: Measure = (text, weight, sizePx) =>
  text.length * sizePx * (weight === 800 ? 0.7 : 0.66);

/**
 * The spec's fit rule. Two or more words stack on two lines, split at the space
 * that makes the lines most equal; one word stays on one line. The size shrinks
 * from 100 until the widest line fits 820 units, to a floor of 44.
 */
function fitName(name: string, measure: Measure): { lines: string[]; size: number } {
  const words = name.trim().split(/\s+/).filter(Boolean);
  let lines = [words.join(" ")];
  if (words.length >= 2) {
    let best = Infinity;
    for (let i = 1; i < words.length; i += 1) {
      const a = words.slice(0, i).join(" ");
      const b = words.slice(i).join(" ");
      const gap = Math.abs(measure(a, 800, NAME_BASE) - measure(b, 800, NAME_BASE));
      if (gap < best) {
        best = gap;
        lines = [a, b];
      }
    }
  }
  const widest = Math.max(...lines.map((line) => measure(line, 800, NAME_BASE)), 1);
  const size = Math.max(NAME_FLOOR, Math.min(NAME_BASE, (NAME_BASE * NAME_MAX_WIDTH) / widest));
  return { lines, size };
}

function computeFit(name: string, pillText: string, measure: Measure): Fit {
  return {
    ...fitName(name, measure),
    pillTextWidth: measure(pillText, 800, PILL_FONT) + pillText.length * PILL_TRACKING * PILL_FONT,
  };
}

/** The Level name as the pill prints it, in capitals: "Beginner" becomes "BEGINNER LEVEL". */
function pillLabel(levelTitle: string) {
  const title = levelTitle.trim();
  return (/\blevel$/i.test(title) ? title : `${title} Level`).toUpperCase();
}

const V7_MARK_PATHS = [
  "M9.893 1.18a.25.25 0 0 0-.24-.18H.344a.25.25 0 0 0-.238.327l9.598 29.5a.25.25 0 0 0 .238.173h1.473a.25.25 0 0 0 .239-.177l3.524-11.593a.25.25 0 0 0 0-.144z",
  "M22.056 30.83a.25.25 0 0 1-.237.17h-8.287a.25.25 0 0 1-.24-.32l6.055-20.992a.25.25 0 0 0-.24-.32h-3.158a.25.25 0 0 1-.24-.183l-2.182-7.868A.25.25 0 0 1 13.768 1h17.884a.25.25 0 0 1 .238.33z",
];

export function CertificateSheet({
  learnerName,
  levelTitle,
  issuedAt,
  publicId,
  verifyUrl,
  revoked,
  className,
}: {
  learnerName: string;
  /** The Level's name as stored, for example "Beginner". */
  levelTitle: string;
  issuedAt: string;
  publicId: string;
  verifyUrl: string;
  revoked: boolean;
  className?: string;
}) {
  const pill = pillLabel(levelTitle);
  const [fit, setFit] = useState<Fit>(() => computeFit(learnerName, pill, estimate));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function measureWithRealFonts() {
      try {
        await Promise.all([
          document.fonts.load(`800 ${NAME_BASE}px "S7 Montserrat"`, learnerName),
          document.fonts.load(`800 ${PILL_FONT}px "S7 Montserrat"`, pill),
          document.fonts.load(`400 20px "S7 Lexend"`),
          document.fonts.load(`700 14px "S7 Montserrat"`),
        ]);
        await document.fonts.ready;
        const context = document.createElement("canvas").getContext("2d");
        if (!context || cancelled) return;
        const measure: Measure = (text, weight, sizePx) => {
          context.font = `${weight} ${sizePx}px "S7 Montserrat"`;
          return context.measureText(text).width;
        };
        setFit(computeFit(learnerName, pill, measure));
      } catch {
        // Keep the estimate: a slightly loose fit beats a certificate that never shows.
      }
      if (!cancelled) setReady(true);
    }
    void measureWithRealFonts();
    return () => {
      cancelled = true;
    };
  }, [learnerName, pill]);

  const lineHeight = fit.size * NAME_LINE_HEIGHT;
  const firstBaseline = NAME_LAST_BASELINE - (fit.lines.length - 1) * lineHeight;
  const pillWidth = fit.pillTextWidth + PILL_PAD * 2;
  const label = (x: number, text: string, y: number) => (
    <text
      x={x}
      y={y}
      fontFamily={MONTSERRAT}
      fontWeight="700"
      fontSize="13"
      letterSpacing="1.1"
      fill={GREY}
    >
      {text}
    </text>
  );

  return (
    <svg
      id="certificate-svg"
      data-fit={ready ? "ready" : "pending"}
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`Certificate of completion for ${learnerName}: ${levelTitle.trim().replace(/\s+level$/i, "")} Level of Save7 Learn, issued ${issuedAt}. Certificate ID ${publicId}. Verify at ${verifyUrl}.`}
      className={cx("h-auto w-full", className)}
    >
      <defs>
        <style>{CERTIFICATE_FONT_CSS}</style>
        <clipPath id="certificate-sheet-clip">
          <rect width={W} height={H} />
        </clipPath>
      </defs>

      <rect width={W} height={H} fill="#FFFFFF" />

      {/* Ghost V7 mark: decoration only, bleeding off the top right. */}
      <g clipPath="url(#certificate-sheet-clip)" aria-hidden="true">
        <g transform={`translate(560 -70) scale(${700 / 32})`}>
          {V7_MARK_PATHS.map((d) => (
            <path
              key={d}
              d={d}
              fill={PINK_50}
              stroke={PINK_LINE}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      </g>

      {/* Wordmark: the vector mark in pink, then SAVE in teal and SEVEN in pink. */}
      <g transform={`translate(${MARGIN} 70) scale(${30 / 32})`} fill={PINK} aria-hidden="true">
        {V7_MARK_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <text x={MARGIN + 40} y="100" fontFamily={MONTSERRAT} fontWeight="800" fontSize="30">
        <tspan fill={TEAL}>SAVE</tspan>
        <tspan fill={PINK}>SEVEN</tspan>
      </text>

      <rect x={MARGIN} y="130.5" width={CONTENT_W} height="3" fill={NAVY} />

      <text
        x={MARGIN}
        y="172"
        fontFamily={MONTSERRAT}
        fontWeight="700"
        fontSize="14"
        letterSpacing="1.3"
        fill={PINK}
      >
        CERTIFICATE OF COMPLETION
      </text>

      <text x={MARGIN} y="210" fontFamily={LEXEND} fontWeight="400" fontSize="20" fill={GREY}>
        This certifies that
      </text>

      {fit.lines.map((line, index) => (
        <text
          key={`${index}-${line}`}
          x={MARGIN}
          y={firstBaseline + index * lineHeight}
          fontFamily={MONTSERRAT}
          fontWeight="800"
          fontSize={fit.size}
          fill={NAVY}
        >
          {line}
        </text>
      ))}

      <text x={MARGIN} y="466" fontFamily={LEXEND} fontWeight="400" fontSize="20" fill={GREY}>
        has completed the following Level of Save7 Learn
      </text>

      <rect x={MARGIN} y="492" width={pillWidth} height="68" rx="34" fill={PINK} />
      <text
        x={MARGIN + PILL_PAD}
        y="536.5"
        fontFamily={MONTSERRAT}
        fontWeight="800"
        fontSize={PILL_FONT}
        letterSpacing={PILL_TRACKING * PILL_FONT}
        fill="#FFFFFF"
      >
        {pill}
      </text>

      <rect x={MARGIN} y="639" width={CONTENT_W} height="2" fill={NAVY} />

      {label(MARGIN, "ISSUED BY", 678)}
      {label(320, "DATE", 678)}
      {label(600, "CERTIFICATE ID", 678)}
      {[
        [MARGIN, "Save7"],
        [320, issuedAt],
        [600, publicId],
      ].map(([x, value]) => (
        <text
          key={x}
          x={x}
          y="706"
          fontFamily={LEXEND}
          fontWeight="400"
          fontSize="17"
          fill={NAVY}
        >
          {value}
        </text>
      ))}

      {label(MARGIN, "VERIFY AT", 744)}
      <text x="190" y="744" fontFamily={LEXEND} fontWeight="400" fontSize="15" fill={NAVY}>
        {verifyUrl}
      </text>

      {/* A revoked certificate must be unmistakable, not subtly annotated. */}
      {revoked ? (
        <g>
          <rect x="0" y="327" width={W} height="140" fill={INCORRECT} opacity="0.93" />
          <text
            x={W / 2}
            y="417"
            fontFamily={MONTSERRAT}
            fontWeight="800"
            fontSize="56"
            letterSpacing="3"
            fill="#FFFFFF"
            textAnchor="middle"
          >
            REVOKED
          </text>
        </g>
      ) : null}
    </svg>
  );
}
