/**
 * The decoration of a public hero (landing page, course introduction): a `teal-100`
 * blob top right, a `pink-50` blob with a `pink-line` border bottom left, and the
 * teal-and-pink circle pair. Signed-in pages have none.
 *
 * Nothing here ever carries text: `teal-100` is an icon fill only (#68). The copy
 * column is held to 58% of the hero so it never reaches a blob, and below 760px the
 * big blob and the pair are hidden and the small one shrinks. The parent needs
 * `relative overflow-hidden`, and its content needs `relative z-10`.
 */
export function HeroDecoration() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[190px] -top-[230px] hidden size-[520px] rounded-full bg-teal-100 min-[760px]:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[150px] -left-[140px] size-[240px] rounded-full border border-pink-line bg-pink-50 min-[760px]:-bottom-[230px] min-[760px]:-left-[190px] min-[760px]:size-[360px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-16 top-[52px] hidden h-[90px] w-[120px] min-[760px]:block"
      >
        <i className="absolute right-0 top-0 size-[72px] rounded-full bg-teal" />
        <i className="absolute bottom-0 left-0 size-10 rounded-full bg-pink" />
      </div>
    </>
  );
}
