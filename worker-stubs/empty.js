/**
 * Empty stub for Node-only database drivers in the Cloudflare Workers bundle.
 *
 * src/lib/db.ts picks its Prisma driver adapter at runtime and supports three
 * targets: D1 (Workers), SQLite (local dev) and Postgres (the original target).
 * On Workers only the D1 branch can ever run, but because the choice is made at
 * runtime the bundler cannot tree-shake the other two away, and it fails trying
 * to resolve `pg`'s optional native helper.
 *
 * Aliasing those modules here keeps them out of the Worker. If the alias is ever
 * wrong — if a Worker somehow reached the Postgres branch — it would throw
 * immediately and visibly rather than silently misbehaving.
 */
const emptyStub = {};
export default emptyStub;
