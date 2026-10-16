/**
 * The Save7 V7 mark, as an inline vector (#40).
 *
 * Colour comes from `currentColor`, so a parent's text colour tints it. The
 * mark is decorative where the wordmark sits beside it; pass `title` when it
 * stands alone and has to be announced.
 */
export function Save7Logo({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <g fill="currentColor">
        <path d="M9.893 1.18a.25.25 0 0 0-.24-.18H.344a.25.25 0 0 0-.238.327l9.598 29.5a.25.25 0 0 0 .238.173h1.473a.25.25 0 0 0 .239-.177l3.524-11.593a.25.25 0 0 0 0-.144z" />
        <path d="M22.056 30.83a.25.25 0 0 1-.237.17h-8.287a.25.25 0 0 1-.24-.32l6.055-20.992a.25.25 0 0 0-.24-.32h-3.158a.25.25 0 0 1-.24-.183l-2.182-7.868A.25.25 0 0 1 13.768 1h17.884a.25.25 0 0 1 .238.33z" />
      </g>
    </svg>
  );
}
