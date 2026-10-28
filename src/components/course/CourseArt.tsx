/**
 * The landing page's drawings, made only from the brand's own shapes: circles, the
 * dotted connector, the heart. Every one is decorative (aria-hidden) and carries no
 * text; the words beside it carry the meaning. Glyphs differ by shape, never by
 * colour, so no Level is colour-coded (#10). Teal and amber are fills here, which is
 * all the brand allows them on white (#68).
 */

const HEART = "M12 20.5s-8.5-5-8.5-11A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8.5 2.5c0 6-8.5 11-8.5 11Z";

/**
 * One gift, seven lives (the footer's line): a pink heart linked to seven circles.
 * The circles drift slowly while the page sits still (globals.css), alternating
 * between the hero pair's two drifts so neighbours never move together.
 */
export function GiftCircles({ className }: { className?: string }) {
  const R = 150;
  const nodes = [
    { r: 26, fill: "fill-teal" },
    { r: 18, fill: "fill-navy" },
    { r: 22, fill: "fill-white stroke-teal" },
    { r: 30, fill: "fill-teal" },
    { r: 18, fill: "fill-white stroke-navy" },
    { r: 24, fill: "fill-navy" },
    { r: 20, fill: "fill-teal" },
  ].map((n, i) => {
    const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
    return { ...n, i, x: 200 + R * Math.cos(a), y: 200 + R * Math.sin(a) };
  });

  return (
    <svg viewBox="0 0 400 400" aria-hidden="true" className={className}>
      <circle cx="200" cy="200" r={R} fill="none" className="stroke-line-strong" strokeWidth="2" strokeDasharray="2 9" strokeLinecap="round" />
      {nodes.map((n) => (
        <line key={`l${n.i}`} x1="200" y1="200" x2={n.x} y2={n.y} className="stroke-amber" strokeWidth="3" strokeLinecap="round" strokeDasharray="0.5 10" />
      ))}
      <circle cx="200" cy="200" r="78" className="fill-pink" />
      <path transform="translate(162 164) scale(3.2)" d={HEART} className="fill-white" />
      {nodes.map((n) => (
        <g key={n.i} className={n.i % 2 ? "animate-drift-b" : "animate-drift-a"}>
          <circle cx={n.x} cy={n.y} r={n.r} className={n.fill} strokeWidth="5" />
        </g>
      ))}
    </svg>
  );
}

/**
 * A glyph per Level, by its position in the course: awareness (rings), the process
 * (linked steps), advocacy (one voice reaching many).
 */
export function LevelGlyph({ index, className }: { index: number; className?: string }) {
  const fan = [14, 32, 50, 68, 86];
  return (
    <svg viewBox="0 0 160 100" aria-hidden="true" className={className}>
      {index === 0 ? (
        <>
          <circle cx="80" cy="50" r="44" fill="none" className="stroke-line-strong" strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" />
          <circle cx="80" cy="50" r="30" className="fill-teal" />
          <circle cx="80" cy="50" r="13" className="fill-white" />
          <circle cx="80" cy="50" r="6" className="fill-pink" />
        </>
      ) : index === 1 ? (
        <>
          <path d="M28 64 Q 54 18 80 50 T 132 36" fill="none" className="stroke-amber" strokeWidth="4" strokeLinecap="round" strokeDasharray="0.5 9" />
          <circle cx="28" cy="64" r="16" className="fill-teal" />
          <circle cx="80" cy="50" r="16" className="fill-white stroke-navy" strokeWidth="5" />
          <circle cx="132" cy="36" r="16" className="fill-pink" />
        </>
      ) : (
        <>
          {fan.map((y) => (
            <line key={y} x1="44" y1="50" x2="122" y2={y} className="stroke-amber" strokeWidth="3" strokeLinecap="round" strokeDasharray="0.5 8" />
          ))}
          {fan.map((y, i) => (
            <circle key={`c${y}`} cx="128" cy={y} r={i % 2 ? 7 : 9} className={i % 2 ? "fill-navy" : "fill-teal"} />
          ))}
          <circle cx="40" cy="50" r="26" className="fill-pink" />
          <path transform="translate(26 36) scale(1.2)" d="M4 6h16v9H9l-5 4z" className="fill-white" />
        </>
      )}
    </svg>
  );
}

/** A glyph per course step: the baseline, the lessons, the Stage Quiz, the certificate. */
export function StepGlyph({ index, className }: { index: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      {index === 0 ? (
        [0, 1, 2, 3].map((i) => (
          <rect key={i} x={8 + i * 13} y={44 - i * 9} width="9" height={12 + i * 9} rx="4.5" className={i === 3 ? "fill-pink" : "fill-teal"} />
        ))
      ) : index === 1 ? (
        <>
          <path d="M6 14h18a8 8 0 0 1 8 8v30a6 6 0 0 0-6-6H6z" className="fill-teal" />
          <path d="M58 14H40a8 8 0 0 0-8 8v30a6 6 0 0 1 6-6h20z" className="fill-navy" />
        </>
      ) : index === 2 ? (
        <>
          <circle cx="32" cy="32" r="24" className="fill-teal" />
          <path d="m21 33 8 8 15-17" fill="none" className="stroke-navy" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <path d="M22 38 16 60l16-8 16 8-6-22" className="fill-navy" />
          <circle cx="32" cy="26" r="20" className="fill-pink" />
          <circle cx="32" cy="26" r="9" className="fill-white" />
        </>
      )}
    </svg>
  );
}

/** A quote mark in the brand teal, standing in for the old 4px side-bar on the hero quote. */
export function QuoteMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 36" aria-hidden="true" className={className}>
      <path d="M0 36V22C0 9 7 2 20 0l2 6c-7 2-10 6-10 12h8v18zm26 0V22C26 9 33 2 46 0l2 6c-7 2-10 6-10 12h8v18z" className="fill-teal" />
    </svg>
  );
}
