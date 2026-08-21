/**
 * `PageProps` for Next 15.
 *
 * Next 16 generates a global `PageProps<"/levels/[level]">` from the route tree,
 * typing `params` per route. Next 15 has no such global, and the Pages adapter
 * (`@cloudflare/next-on-pages`) pins Next to `<=15.5.2` — so the twelve call
 * sites that name their route in a type argument would all fail to compile.
 *
 * Rather than rewrite them, the global is declared here with the same shape and
 * the same call signature. Every existing `PageProps<"/some/route">` keeps
 * compiling, and the route string keeps documenting which page it is.
 *
 * **What is lost, stated plainly:** `params` is `Record<string, string>` rather
 * than the exact keys of that route, so a typo in `await props.params` is no
 * longer caught by the compiler. That is the cost of the downgrade, not a design
 * choice — delete this file when the app returns to Next 16 and the real
 * generated types come back.
 */
// The route string is documentation, not a constraint, until Next 16's generated
// types come back — hence the unused parameter.
/* eslint-disable @typescript-eslint/no-unused-vars */
declare type PageProps<_Route extends string = string> = {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

declare type LayoutProps<_Route extends string = string> = {
  children: React.ReactNode;
  params: Promise<Record<string, string>>;
};
/* eslint-enable @typescript-eslint/no-unused-vars */
