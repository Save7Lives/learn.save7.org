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

### Third-party controls (#70)

**Google's sign-in button is the one control Learn does not colour from its
own tokens.** Google's branding guidance (developers.google.com/identity/
branding-guidelines, read 2026-10-09) puts the standard-colour G on a white,
dark or neutral fill and does not allow it on a coloured one, so the button on
`/login` uses Google's light theme: `#ffffff` fill, a 1px `#747775` stroke,
`#1f1f1f` text, label "Continue with Google". Those three values are Google's,
not the palette's, so please don't map them onto `white`, `line-strong` or
`navy`. Every other primary button stays `pink` with white text. The prototype
follows the theme's colours only; the build should follow Google's button
specification for the rest (shape, type, spacing).

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
| UI body | Lexend 400/500 | 16/24 | buttons, labels, table cells |
| Small | Lexend 400 | 14/20 | helper text; nothing in the system is under 12px |
| Eyebrow | Montserrat 700 | 13, +0.07em | always small capitals |

**Heading case is sentence case** (#68). The deck's own headings are mostly
Title Case, so this is a deliberate departure: Stage and Level titles are
long, a sentence-case rule is simpler for content authors to apply, and the
audience is the general public. Eyebrows and pills are always capitals.

**Bold is rare** (#74, from the user, 2026-10-09). The KEPSA Deck bolds far
more than the web needs. Only headings, eyebrows, scores and the current item
(the Stage you are in, the step you are on) are bold. Buttons, pills, links,
labels, table cells and emphasis inside a lesson are Lexend 500 at most, and
emphasis in prose is told apart by `navy` against the `grey` body, not by
weight. The earlier re-cut prototypes (#69 to #73) still set some UI text at
600; builds follow this rule, not those.

**The table is the wide scale, from about 640px.** The phone is the primary
device, so below that the headings step down (#74): Display 32/36, H1 28/33,
H2 22/28, H3 18/24, H4 16/22. Lesson body stays 18/31.5 at every width.

**Heading levels in a lesson.** The Stage title is the page's H1 and a
step's title is its H2, so a lesson's `##` is styled and marked up as H3 and
its `###` as H4 (#74).

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
pages, and on the Baseline's before-you-start and results screens (#74),
never behind lesson reading or a question. The dark hero is gone and the
lesson reader stays plain white. Two Registers share these tokens:
**Editorial** (landing, sign-in, lessons, the Certificate) and **Portal**
(a Student's My Progress, and Admin); see `CONTEXT.md`. The icon set is
outline only, 1.75px stroke, no stock clip-art.

## Reader, Stage Quiz and Baseline (#74)

Settled against a 375px prototype, `wayfinder/prototypes/reader-quiz-baseline-prototype.html`
on `prototype/reader-quiz-baseline` (commit `5268289`). Its DOM audit reports
0 failing pairs in 3,456 combinations of screen and switch, and it fails when
a bad pair is planted. Behaviour is unchanged: the Stage Quiz stays 5
questions, 4 to pass, unlimited retries (#8), and the Baseline never shows
answers.

**The reader is plain white.**
- *Stage header:* back link, a `teal-ink` eyebrow ("Beginner Level · Stage 3 of 3"), the Stage title at H1, the core question, "About 8 minutes · 7 steps", then the **Stage stepper**: one dot per Stage, `teal` with a navy check when that Stage's quiz is passed, a navy ring for the Stage you are in, a grey ring for the rest. On a phone it is dots only, since a Level can hold four Stages with long names; names and status words show from about 640px. Each dot is a link.
- *Step rail:* a slim sticky bar, "Step 2 of 7" over the step's short name, an "All steps" button and a 4px `teal-ink` progress line, about 52px of a phone screen. "All steps" opens a vertical dotted list of the seven steps (numbered, a check once read). From about 640px it becomes the labelled stepper. Rail labels are the short ones: Why this matters, Learn, Key takeaways, Check, Study guide, Further reading, Finish; a step's heading is its own title. **The site header scrolls away in the reader and only the rail sticks.**
- *Back and Continue* sit inline at the end of a step. They are not docked: a learner presses Continue after reading to the end, and a dock costs about 68px and invites tapping past a step.
- *Prose:* Lexend 18/31.5 in `grey`, 62 characters wide, with emphasis in `navy` at Lexend 500 rather than bold. Bullets take a `teal-ink` marker. A numbered list uses numbered pills (`teal`, navy numerals). A blockquote is a `teal-50` card with a 5px `teal-ink` bar. Links are `teal-ink` and underlined. Code is navy on `line`. The Key takeaways step shows each takeaway as a `teal-50` row with an outline check in a `teal-100` circle.
- *Tables* (#58): a table from about 640px, and below it one card per row, the row header as the card title and every cell labelled by its column header in small capitals.
- *The film* (Beginner Stage 3's first step) runs the full width of a phone, with its caption under the player (title, length, size) and nothing else. **There is no note on where the film and the course differ, and no transcript or text version of the film.** The user does not want either on the site (2026-10-09), and said not to take the film out.

**The Stage Quiz** lives inside the Check step.
- *Status card:* eyebrow, a status pill, one sentence, three fact chips (5 questions, 4 right to pass, retry as often as you like) and one primary button. The pills are Not started, Not passed yet, Passed, Practice attempt, Answered and Not answered; each is a tint, a hairline, an icon and navy text.
- *Progress:* one 6px segment per question: `teal-ink` answered, a taller navy segment for the current one, `line` for the rest, with "Question 3 of 5" and "n answered" in text. The Baseline uses the same strip with 20 segments.
- *A scenario* sits in a `teal-50` box with an info icon, in italics. The prompt is H3, and "Select all that apply" follows it on a multiple-answer question.
- *Choices* are whole-row targets, 56px or taller, with a letter pill (A to D; rounded squares when several answers apply). Unmarked, a selected choice is a 2px navy border and a filled navy pill with a check. Marked:

| State | Surface | Border | Pill | Words beside it | Measured |
|---|---|---|---|---|---|
| Idle | white | 1.5px `line-strong` | outline, letter | none | border 3.82:1 on white, 3.64:1 on `teal-50` |
| Selected | white | 2px `navy` | navy fill, check | none | 17.48:1 |
| Yours, correct | `teal-50` | 2px `correct` | `correct` fill, check | "Your answer, correct" | border 5.71:1, glyph 5.99:1 |
| Correct, missed | `teal-50` | 2px `correct` | `correct` fill, check | "Correct answer" | as above |
| Yours, not correct | `pink-50` | 2px `incorrect` | `incorrect` fill, cross | "Your answer, not correct", then the choice's own feedback | border 6.50:1, glyph 6.85:1 |
| Not chosen | white | 1px `line` | outline, letter | none | decorative |

- *Explanation* under each marked question: `teal-50` with a Correct pill, or `pink-50` with a Not quite pill, navy text.
- *Result:* a status pill, the score at Display ("3 of 5"), one sentence, Try again (primary) and Done. On the last Stage Quiz of a Level a pass adds a `pink-50` Certificate callout with an award icon and a "View my certificate" button.
- *Finish step:* the question the Stage asked on `teal-50`, then "Finish this Stage". Finishing records the Stage as read; a `pink-50` card says a Stage counts as complete when its quiz is passed and links to the Check step.

**The Baseline.**
- *Before you start* is a new screen, and replaces the one-line box above question 1: a pink eyebrow, a Display title, a lede, three numbered cards (not a test; you won't see the answers afterwards, because the same 20 questions come back; the course opens when you submit, or for a later sitting that your score gates nothing) and one primary button. Later sittings use the same layout with "Sitting 2 of 4".
- *Results:* a Display title, then a card with the score at 56px, "n of 20 questions", and **one row per Level**: name, percent, a 12px `teal-ink` bar on `line`, and "n of m questions". No Level colour. After a later sitting each bar carries a 4px navy mark at the first sitting's value, "First sitting n%" beside the count, a "+10 points since your first sitting" pill, and a four-dot stepper of the sittings, named from about 640px. `BaselineResults`' table is not used here, because at 375px it scrolls sideways; it stays as the twin on My Progress (#71).
- The blob and circle pair appear on before-you-start and results, and nowhere on a question.

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
