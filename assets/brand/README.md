# Save7 Brand Assets

Source of truth: https://save7.org/brand-kit#files (page's own words: "Keep this page bookmarked — it is the single source of truth for Save7 brand files.")

## Files (all PNG, copied from the brand-kit page)

- `Save7-logo-stacked.png` (1201×585) — default lockup: covers, hero banners, signage
- `Save7-logo-horizontal.png` (2182×273) — tight/wide spaces: app bars, headers, banners
- `Save7-V7-mark.png` (1385×1291) — icon mark only: favicons, avatars, small formats
- `Save7-V7-with-url.png` (1473×1570) — mark + save7.org, no wordmark: posters, stickers
- `Save7-V7-with-type.png` (1473×1570) — full lockup: mark + SAVE7 wordmark + save7.org
- `Save7-social-overlay.png` (900×1600) — transparent social post template; don't recolor/reposition

## Palette

> **Amended 2026-10-08 (#68).** Learn's look is derived from the KEPSA Deck
> (see `CONTEXT.md`) per #67, and #68 fixed the concrete token set below by
> measurement. This replaces the five-token set settled in #21. The numbers
> are from the style tile, which computes them from the hex values and also
> audits every text/surface pair it renders (0 failing pairs, in all 144
> combinations of its switches).
>
> **These tokens disambiguate the brand-kit page; they do not mirror it.**
> The brand-kit page is not single-valued: it carries both `#ED0E69` and
> `#df0e62` (plus `#d00a5c` / `#c40c58`), and names three typefaces. The
> values below are the resolved set for Save7 web properties, chosen on
> measured WCAG contrast. Please don't "correct" them back to the
> brand-kit page's first-listed values, or to the deck's: the deck is a
> projected presentation and fails web AA in several places (below).

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `navy` | `#0c173b` | Text, and the only dark surface. Replaces `ink` `#111111`. | 17.48:1 on white |
| `grey` | `#585858` | Body text (the deck's grey). | 7.11:1 on white, 6.7+ on both card tints |
| `pink` | `#df0e62` | Hero pink: CTA fills, links, active states. **One pink everywhere, fills included.** | 4.80:1 on white; white on pink 4.80:1; 3.64:1 on navy (large text only) |
| `pink-50` | `#fff7f9` | Pink card surface. May hold text. | pink on it 4.55:1; navy 16.58:1 |
| `pink-100` | `#fce8f0` | Pink icon-chip fill. **Icons only, never text.** | pink icon 4.10:1 |
| `pink-line` | `#fcd9e5` | Hairline on `pink-50`. Decorative. | 1.3:1 by design |
| `teal` | `#16B9B4` | The true brand teal. **Fills, and text on navy.** Never as text on white. | 7.19:1 on navy; navy on it 7.19:1; 2.43:1 on white |
| `teal-ink` | `#00807B` | Teal text on white and `teal-50`. | 4.80:1 on white; 4.57:1 on `teal-50` |
| `teal-50` | `#f3fbfb` | Teal card surface. May hold text. | teal-ink on it 4.57:1; navy 16.65:1 |
| `teal-100` | `#e6f7f7` | Teal icon-chip fill. **Icons only, never text** (teal-ink text on it is 4.35:1). | teal-ink icon 4.35:1 |
| `teal-line` | `#c9eeee` | Hairline on `teal-50`. Decorative. | 1.24:1 by design |
| `amber` | `#ffab40` | Accent: timeline ticks, connectors. **Never text, never the only carrier of meaning.** | 1.88:1 on white |
| `white` | `#FFFFFF` | Page and card background. | |
| `line` | `#e3e6ee` | Neutral hairline, neutral chip fill, empty progress track. No coloured text on it. | |
| `line-strong` | `#7d8294` | Control borders and dotted connectors. | 3.82:1 on white; 3.6+ on both card tints |
| `correct` | `#0b6f6c` | Quiz: correct. Carried over from the build. | 5.71:1 on `teal-50` |
| `incorrect` | `#a3341c` | Quiz: incorrect, form errors. Carried over from the build. | 6.50:1 on `pink-50` |

**Retired:** `ink` `#111111` (now `navy`), `teal-on-ink` (now `teal`),
`teal-on-white` (now `teal-ink`). Mind the trap in the new name: `teal-ink`
is teal *as text on a light surface*; it is not the retired "teal on ink".

**Not adopted:** `sand-50` `#fbfaf8` as the page background. The page is
white, so `themeColor` is `#ffffff` (this reverses the `#fbfaf8` chosen on
2026-09-23 in #39 and #40, which was picked to blend with a sand header).

### Which surface may carry which colour of text

Coloured text is only legal on **white, `pink-50` and `teal-50`**. The
chip fills `pink-100`, `teal-100` and `line` hold icons only. The deck
breaks this rule in both places that matter, which is why the tints below
differ from it:

| Deck colour | Measured | Learn |
|---|---|---|
| Pink `#ed186b` | 4.25:1 on white, fails AA | `#df0e62`, 4.80:1. The pink #39 already ruled out. |
| Teal `#00b7b5` as text | 2.49:1 on white, fails | Kept as a **fill** (ΔE 1.8 from `#16B9B4`, under the roughly 2.3 just-noticeable difference); text is `teal-ink`. #67 recorded this ΔE as under 1; measured it is 1.8. |
| Pink tint `#fff5f7` | pink text on it is 4.49:1, **fails AA by 0.01** | `pink-50` `#fff7f9` (ΔE 0.9, invisible), 4.55:1. Thin margin: do not lighten the pink instead. |
| Teal tint `#e6f7f7` | teal text on it is 4.35:1, fails | Kept as `teal-100` but icons only. Text-bearing teal cards use `teal-50`. |
| Amber `#ffab40` | 1.88:1; fails as text and as a meaningful graphic | Decoration with a text twin. |

### Rules the style tile established

- **Graphics and controls need 3:1.** Input and option borders use `line-strong`. Fills below 3:1 (`teal`, `amber`, the tints, hairlines) are decoration or sit beside a text label; the fill alone is never the signal.
- **A clickable card carries an arrow or a text link.** A 1.3:1 hairline does not mark something as clickable.
- **Feedback is never colour alone.** Quiz states and status pills carry an icon and a word. Status pills are a tinted background, hairline, icon and **navy** text; the colour lives in the icon and border.
- **Focus ring:** 3px navy, 3px offset, on light surfaces; 3px white on navy surfaces. Navy is 17.48:1 on white and 16.5+ on both card tints.
- **No Level colour-coding.** #10 stands: the Level name is always text. The deck's teal/pink/amber alternation is positional, and amber cannot carry meaning. Pink progress also reads as a call to action or an alert.

### Superseded

`#ED0E69` was the previously recorded hero pink here. It measures 4.31:1
on white and **fails** AA for normal text. `#df0e62` replaces it: it is
also the incumbent `--color-primary` on the live save7.org Astro site.

### The PNGs above do not match this palette

Measured off the pixels (2026-09-21, tickets #28 and #39), not assumed:

| File | Colours in the file |
|---|---|
| `Save7-V7-mark.png` | `#ED0E6A` |
| `Save7-V7-with-type.png` | `#ED0E6A` + white |
| `Save7-V7-with-url.png` | `#ED0E6A` |
| `Save7-logo-horizontal.png` | `#ED186B` + `#00B9B5` |
| `Save7-logo-stacked.png` | `#ED186B` + `#00B9B5` |
| `Save7-social-overlay.png` | `#ED0E69` + `#ED186B` + white |

> **Re-measured 2026-09-21 (#39), all six files.** The earlier table here
> covered only four: `Save7-logo-stacked.png` and `Save7-social-overlay.png`
> were never measured. The kit does not hold *one* superseded pink — it holds
> **three**, and the social overlay carries two of them inside a single file.

### The pink census

Five distinct colours occupy the "hero pink" role across the Save7 estate:

| Hex | Where | ΔE76 vs `#df0e62` |
|---|---|---|
| `#df0e62` | **resolved token** — live save7.org `--color-primary` | — |
| `#ED0E6A` | `V7-mark`, `V7-with-type`, `V7-with-url` rasters | 4.80 |
| `#ED186B` | `logo-horizontal`, `logo-stacked` rasters | 4.34 |
| `#ED0E69` | brand-kit page `--pink` token; `social-overlay` | 4.73 |
| `#EC0F68` | save7.org's own `favicon.svg` plate | 4.34 |

All four superseded values sit well past the ~2.3 ΔE just-noticeable
threshold from the resolved token, so at close proximity any of them reads
as a printing error rather than a palette.

**The teal is a non-issue.** `#00B9B5` vs `teal-on-ink #16B9B4` is
**ΔE76 = 0.9** — below the JND. The lockups' teal *is* `teal-on-ink`,
perceptually; only the pink mismatch is visible.

### A true vector mark exists

Recorded here because #24 and #28 both reasoned from "the logo exists only
as PNG." That is true of this kit, and **false of Save7**: the live
save7.org header renders an inline SVG V7 mark, two paths,
`fill="currentColor"`, computing to `#df0e62`. Its favicon is a 548-byte
true vector. The homepage uses **zero** raster lockups and exactly one
pink in the whole document.

Verified against `Save7-V7-mark.png`: **IoU 0.9754**, 1.49% pixel
disagreement — the same mark, in vector form.

Both vectors are now versioned here:

- `Save7-V7-mark.svg` (532 B) — `currentColor`, tints to any token, scales
  from a 16px header to a certificate.
- `Save7-favicon.svg` (634 B) — white mark on a `#df0e62` rounded plate.
  Follows save7.org's own favicon pattern with the plate corrected from
  `#EC0F68` (white 4.34:1) to the resolved token (white 4.80:1).

### What this means for baked-in text

**Text baked into a lockup cannot be recoloured for contrast.** The small
"WWW.SAVE7.ORG" in `Save7-V7-with-type.png` is 120px of a 1570px-tall
image; it fails AA at body size under either pink (3.94:1 new, 4.38:1 old).
The fixes are to render the lockup large enough to qualify as AA-Large, or
to stop using a raster. Note `Save7-logo-horizontal.png` is a **pure
wordmark** — "SAVE" teal, "SEVEN" pink, no URL text — so it does not carry
this problem, and wordmark text is exempt from WCAG 1.4.3 under the
logotype exception regardless.

### Learn's rule (#39)

**Learn does not ship the raster lockups in its chrome.** Header, footer
and auth panels use `Save7-V7-mark.svg` tinted to the resolved tokens plus
live wordmark text (set in Montserrat 800, see Wordmark below); the favicon
is `Save7-favicon.svg`; the Certificate is re-cut to the vector mark plus
the live wordmark. This is convergence on what save7.org already does in
production, not a fork of it: shipping the frozen raster is what would make
Learn diverge from the parent site.

The rasters stay in this directory as the kit of record, unmodified.

## Typography

Two typefaces (both on Google Fonts). **Anton is dropped** (#68).

- **Montserrat**: headings, 700 and 800. Matches the deck's lettering.
- **Lexend**: body, UI, captions. This is `--font-sans` on the live
  save7.org site; Learn matches it for consistency across Save7 web
  properties. If the deck becomes Save7's house look and save7.org
  follows, Learn's body face revisits as a fresh effort (#67).

**Inter stays dropped.** The running site uses Lexend and the brand-kit
page lists all three.

| Role | Face | Size / line | Notes |
|---|---|---|---|
| Display | Montserrat 800 | 48/52 | -0.02em |
| H1 | Montserrat 800 | 36/41 | -0.015em |
| H2 | Montserrat 700 | 28/34 | -0.01em |
| H3 | Montserrat 700 | 22/28 | |
| H4 | Montserrat 700 | 18/23 | |
| Lesson body | Lexend 400 | 18/31.5 | `grey`, on plain white, about 62 characters wide |
| UI body | Lexend 400/500/600 | 16/24 | buttons, labels, table cells |
| Small | Lexend 400 | 14/20 | helper text; nothing in the system is under 12px |
| Eyebrow | Montserrat 700 | 13, +0.07em | always small capitals |

**Heading case is sentence case** (#68). The deck's own headings are mostly
Title Case, so this is a deliberate departure: Stage and Level titles are
long, a sentence-case rule is simpler for content authors to apply, and the
audience is the general public. Eyebrows and pills are always capitals.

## Wordmark

The V7 vector mark plus live text, as the deck sets it: **SAVE** in teal,
**SEVEN** in pink, set in **Montserrat 800**, tracking -0.01em. (#39 said
"live Lexend text"; that predates the deck, whose wordmark is a heavy
geometric sans.)

- On navy, pink SEVEN is 3.64:1, so the wordmark must be **20px or larger**
  there (bold counts as large text from 18.66px, which needs 3:1). On
  white, `pink-50` and `teal-50` SEVEN is 4.55:1 or better at any size.
- SAVE in `teal` on white is 2.43:1. It stands on the WCAG 1.4.3 logotype
  exception that #39 recorded; use `teal-ink` instead wherever a surface
  is not carrying the brand wordmark itself.

## Shape language and Registers

Carried over from the deck (#67): an eyebrow over a navy title, tinted
cards with a hairline border, numbered pills, the dotted stepper and
timeline (they map onto Level to Stage progress), outline icons in tinted
circles. Corner blobs and the teal-and-pink circle pair appear on public
pages only, never behind lesson reading. The dark hero is gone and the
lesson reader stays plain white. Two Registers share these tokens:
**Editorial** (landing, sign-in, lessons, the Certificate) and **Portal**
(a Student's My Progress, and Admin); see `CONTEXT.md`. The icon set is
outline only, 1.75px stroke, no stock clip-art.

## Tailwind v4 note

Tailwind is used for consistency with the sibling Astro site, **not** for
enforcement. Enforcement is a separate, explicit act, in `@theme`:

```css
@theme {
  --color-*: initial; /* drop Tailwind's default palette entirely */

  --color-navy: #0c173b;
  --color-grey: #585858;
  --color-pink: #df0e62;
  --color-pink-50: #fff7f9;
  --color-pink-100: #fce8f0;
  --color-pink-line: #fcd9e5;
  --color-teal: #16B9B4;
  --color-teal-ink: #00807B;
  --color-teal-50: #f3fbfb;
  --color-teal-100: #e6f7f7;
  --color-teal-line: #c9eeee;
  --color-amber: #ffab40;
  --color-white: #FFFFFF;
  --color-line: #e3e6ee;
  --color-line-strong: #7d8294;
  --color-correct: #0b6f6c;
  --color-incorrect: #a3341c;

  --font-sans: "Lexend Variable", sans-serif;       /* body, UI */
  --font-display: "Montserrat Variable", sans-serif; /* headings */
}
```

Without the `--color-*: initial` reset the default palette stays live.
That is how the existing save7.org site went from four colours to nine:
its compiled CSS currently emits `indigo-600`, `emerald-700`,
`orange-700`, `sky-600/700/800`, `cyan-900`, `red-500` and
`pink-300/900` alongside the brand tokens, because Tailwind v4 emits a
`--color-*` custom property for every utility actually used in the build.

## Provenance

The measured tables and the components these tokens were fixed against are
a throwaway style tile on the `prototype/design-language` branch,
`wayfinder/prototypes/design-language-style-tile.html` (commit `4b89fd0`),
under wayfinder ticket #68. It computes every contrast figure here from
the hex values and audits the DOM it renders.
