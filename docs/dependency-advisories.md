# Dependency advisories (#30)

Assessed 2026-10-17 with `npm audit` on the lockfile.

## CI threshold

CI fails on any advisory of severity **high or critical**, the same threshold as
`npm audit --audit-level=high`. The step is `node scripts/audit-gate.mjs` in
`.github/workflows/build.yml`. It runs `npm audit --json` and ignores only the advisories
listed in `scripts/audit-allowlist.json`.

## Allowlist

Each entry names one advisory (GHSA id), a reason, the date accepted and an `expires` date.
Once the date passes, CI fails again, so an accepted advisory is re-assessed rather than
forgotten. Accept an advisory only when no fixed release exists, and only after checking
whether it is reachable at runtime. Remove the entry as soon as a fix ships.

## Assessment

The ticket named two high advisories (an image-processing package and a source-map
package). Neither is in the tree now. The audit on the day showed two real advisories.

| Advisory | Package | Reach | Outcome |
| --- | --- | --- | --- |
| Six Next.js advisories (cache poisoning of SSG/ISR, SSRF in image optimization, metadata image routes, Draft Mode leak, dev-server MCP endpoint), all fixed in 16.3.8 | `next` 16.3.6 | Runtime dependency. The app is built on Next, so the framework is exposed. This site has no `use cache`, ISR or Draft Mode, and no remote image optimization, so exploitability is low, but the framework is on the request path. | Patched: `next` raised to `^16.4.2` (lockfile 16.4.2). Typecheck, lint and build pass. |
| GHSA-vfj7-8cjw-p6xm, stack-exhaustion denial of service in `braces` (<=3.0.3) | `braces` 3.0.3, via eslint-config-next, fast-glob, micromatch | Dev only. `npm audit --omit=dev` reports 0 vulnerabilities and `npm ls braces --omit=dev` is empty. It expands glob patterns when ESLint runs on our own files, never on untrusted input, and is not in the deployed build. | No fix exists: 3.0.3 is the latest release, and the only `npm audit fix --force` path downgrades eslint-config-next to 14, a breaking change. Accepted in the allowlist until 2027-01-17. |

Re-check `braces` when the allowlist entry nears expiry.

## Evidence that the two named advisories were already gone

The ticket named an image-processing advisory and a source-map advisory. They are
`sharp` (GHSA-wq5f-xc86-pv6w, a flaw in the librsvg it bundles) and `source-map-js`
(GHSA-68fv-2mgg-jv7q, event-loop denial of service). Neither was cleared by this ticket:
an earlier commit, `dd25afb` (7 October 2026, lockfile only), had already moved them to
fixed releases, and the tree #30 started from (`3ba673a`, the parent of `4fa480d`) carried
the fixed versions. The versions below are read from `package-lock.json` at each commit,
and the audit output is `npm audit --package-lock-only` run on that commit's `package.json`
and lockfile in a scratch directory (the working tree is never touched). The advisory
database moves, so a re-run today can list more than the table does; what it cannot do is
bring back `sharp` or `source-map-js` at these versions.

| Commit | `sharp` | `source-map-js` | `next` | `npm audit` |
| --- | --- | --- | --- | --- |
| `dd25afb^` (before the lockfile refresh) | 0.35.4 | 1.2.1 | 16.3.6 | 8 high: `braces` chain, `next`, **`sharp`**, **`source-map-js`** |
| `dd25afb` (the refresh) | 0.35.5 | 1.2.2 | 16.3.6 | 6 high: `braces` chain, `next` |
| `4fa480d^` (the tree #30 started from) | 0.35.5 | 1.2.2 | 16.3.6 | 6 high: `braces` chain, `next` |
| `4fa480d` (#30) | 0.35.5 | 1.2.2 | 16.4.2 | 5 high: `braces` chain only |

To repeat any row:

```
mkdir /tmp/audit-check && cd /tmp/audit-check
git -C <repo> show <commit>:package.json > package.json
git -C <repo> show <commit>:package-lock.json > package-lock.json
npm audit --package-lock-only
```

The "5 high" of the last row is one advisory counted across the five packages that
depend on it (`braces`, `micromatch`, `fast-glob`, `@next/eslint-plugin-next`,
`eslint-config-next`); it is the `braces` entry in the allowlist above.
