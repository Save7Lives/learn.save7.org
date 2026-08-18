/**
 * Lesson payload contracts.
 *
 * Every interactive lesson is a row in the database whose entire content lives
 * in `Lesson.payloadJson`. These types are the schema for that JSON. Authoring a
 * lesson means writing one of these objects — which is exactly what a future
 * Save7 CMS would edit. No lesson content is hardcoded inside a React
 * component, so content can change without a deploy.
 *
 * `pendingReview` on any item renders a visible "awaiting Save7 review" badge.
 * It defaults to true for anything carrying a medical, legal or statistical
 * claim, so unverified material can never present itself as authoritative.
 */

export type Pending = {
  /** Shows the learner-facing "pending Save7 review" badge. */
  pendingReview?: boolean;
  /**
   * Overrides the per-module default source hint in the generated review
   * register. Use it when one specific claim needs a named source that is not
   * the module's usual one — e.g. Module 12's FACTS sequence, which needs the
   * Organ and Tissue Donation Reference File rather than the study guide.
   */
  reviewSourceHint?: string;
};

/** Placeholder marker for prose awaiting the Save7 study guide. */
export type Placeholder = {
  /** True while the real study-guide text has not yet been supplied. */
  awaitingContent?: boolean;
};

// --- OrganExplorer ---------------------------------------------------------

export type OrganExplorerPayload = {
  intro?: string;
  /** Grouped so solid organs and tissue read as different kinds of gift. */
  groups: Array<{
    id: string;
    label: string;
    caption?: string;
    items: Array<
      Pending &
        Placeholder & {
          id: string;
          name: string;
          /** e.g. "Solid organ" | "Tissue" */
          category: string;
          /** The condition that leads someone here. */
          whyNeeded?: string;
          /** What a transplant gives back. */
          restores?: string;
          /** Anything notable about waiting or availability. */
          note?: string;
        }
    >;
  }>;
};

// --- PathwayJourney --------------------------------------------------------

export type PathwayJourneyPayload = {
  intro?: string;
  /** When true, each step also surfaces where a donation can be lost. */
  showLossPoints?: boolean;
  steps: Array<
    Pending &
      Placeholder & {
        id: string;
        label: string;
        /** One-line description of what happens at this step. */
        summary?: string;
        detail?: string;
        /** Where the pathway breaks down here. Module 2's whole argument. */
        lossPoints?: Array<{
          id: string;
          label: string;
          detail?: string;
        }>;
      }
  >;
};

// --- MythFlip --------------------------------------------------------------

export type MythFlipPayload = {
  intro?: string;
  cards: Array<
    Pending &
      Placeholder & {
        id: string;
        myth: string;
        fact?: string;
        /** Why this myth is persuasive — understanding that is half the job. */
        whyItPersists?: string;
      }
  >;
};

// --- ScenarioDialogue ------------------------------------------------------

export type ScenarioDialoguePayload = {
  intro?: string;
  /** Optional framework tags, e.g. the FACTS framework in Module 12. */
  framework?: {
    name: string;
    steps: Array<{ letter: string; label: string; detail?: string }>;
    pendingReview?: boolean;
  };
  scenarios: Array<
    Pending &
      Placeholder & {
        id: string;
        /** Who is speaking, e.g. "A family member". */
        speaker: string;
        /** What they actually say. Quoted verbatim, in their words. */
        quote: string;
        /** What is really going on underneath the objection. */
        whatsReallyHappening?: string;
        /** Optional free-text prompt shown before the choices are revealed. */
        reflectPrompt?: string;
        options: Array<{
          id: string;
          text: string;
          /** Best available response — there is usually more than one decent one. */
          quality: "strong" | "workable" | "poor";
          feedback: string;
        }>;
        /** The teaching point, shown after the learner commits to an answer. */
        debrief?: string;
      }
  >;
};

// --- ComparePanel ----------------------------------------------------------

export type ComparePanelPayload = {
  intro?: string;
  /** Rows are the dimensions compared; columns are the states being compared. */
  columns: Array<{ id: string; label: string; caption?: string; emphasis?: boolean }>;
  rows: Array<
    Pending & {
      id: string;
      label: string;
      /** Keyed by column id. */
      cells: Record<string, string>;
    }
  >;
  /** The one sentence the learner must leave with. */
  bottomLine?: string;
  bottomLinePendingReview?: boolean;
};

// --- TeamRoster ------------------------------------------------------------

export type TeamRosterPayload = {
  intro?: string;
  members: Array<
    Pending &
      Placeholder & {
        id: string;
        role: string;
        /** Short label for the card, e.g. "Coordinates the whole process". */
        oneLiner?: string;
        responsibilities?: string[];
        /** Where in the pathway this person appears. */
        appearsAt?: string;
        /** Set for organisations rather than individuals. */
        isOrganisation?: boolean;
        externalUrl?: string;
      }
  >;
};

// --- EligibilityMatrix -----------------------------------------------------

export type EligibilityMatrixPayload = {
  intro?: string;
  /** The framing that must survive even if a learner forgets everything else. */
  bottomLine: string;
  bottomLinePendingReview?: boolean;
  factors: Array<
    Pending &
      Placeholder & {
        id: string;
        factor: string;
        /** The assumption people arrive with. */
        commonAssumption: string;
        /**
         * For most factors the honest answer is "assessed individually" rather
         * than a rule. But the Save7 study guide *does* state firm criteria for
         * tissue — corneas 6–65, skin and bone 16–80, heart valves 6 months to
         * 55 — so `stated-criteria` exists to carry those faithfully. Suppressing
         * them in the name of never stating a rule would misreport the source.
         */
        reality?: string;
        verdict:
          | "assessed-individually"
          | "depends"
          | "rarely-absolute"
          | "stated-criteria";
      }
  >;
};

// --- ChapterVideo ----------------------------------------------------------

export type ChapterVideoPayload = {
  title: string;
  /** Local file under /public, or an external URL. */
  src?: string;
  poster?: string;
  /** WebVTT captions track. Required before launch for accessibility. */
  captionsSrc?: string;
  /** Plain-text transcript, shown in a panel beside the video. */
  transcript?: string;
  /** Runtime in seconds, for display before metadata loads. */
  durationSeconds?: number;
  awaitingAsset?: boolean;
  /** Chapter markers, in seconds. Drives the jump-to-chapter list. */
  chapters?: Array<{
    id: string;
    label: string;
    startSeconds: number;
    summary?: string;
  }>;
};

// --- TakeawayList ----------------------------------------------------------

export type TakeawayListPayload = {
  takeaways: Array<
    Pending & {
      id: string;
      text: string;
      /** Optional expansion for learners who want one more sentence. */
      detail?: string;
    }
  >;
};

// --- ResourceList ----------------------------------------------------------

export type ResourceListPayload = {
  intro?: string;
  /** Resources are read from the Resource table; this only adds framing. */
  note?: string;
};

// --- Study guide -----------------------------------------------------------

export type StudyGuidePayload = Placeholder & {
  summary?: string;
  sections?: Array<
    Pending & {
      id: string;
      heading: string;
      body?: string;
      bullets?: string[];
    }
  >;
};

export type LessonPayload =
  | OrganExplorerPayload
  | PathwayJourneyPayload
  | MythFlipPayload
  | ScenarioDialoguePayload
  | ComparePanelPayload
  | TeamRosterPayload
  | EligibilityMatrixPayload
  | ChapterVideoPayload
  | TakeawayListPayload
  | ResourceListPayload
  | StudyGuidePayload;

/** Parse a stored payload, tolerating nulls so a half-authored lesson still renders. */
export function parsePayload<T>(json: string | null | undefined): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
