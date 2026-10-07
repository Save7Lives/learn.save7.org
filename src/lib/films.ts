/**
 * The films a lesson can open with.
 *
 * A film is registered here, in typed code, and a lesson names it by key: the
 * `video:` field in its front matter, carried to `learn_lessons.component_key` by
 * the content emitter (#61). Content never names a URL. The loader refuses any
 * key that is not in this registry, and the app resolves a key through it, so the
 * only way a new file reaches a learner is a commit to this file.
 *
 * This file is plain data with no imports from the app. The content loader
 * (`prisma/content/markdown.ts`) and the upload script read it too, and they run
 * under tsx, outside Next.
 *
 * **Every file name carries the first eight hex characters of the SHA-256 of its
 * bytes.** The files are served with a one-year cache (#23), so a corrected file
 * must ship under a new name or the old one lingers in caches for a year.
 * `npm run media:check` fails if a name and its contents disagree.
 *
 * Paths start with `/media/` and go through `mediaUrl()`: with `MEDIA_BASE_URL`
 * unset they are served from `public/media`, and with it set from the Supabase
 * Storage bucket `learn-media`, under `media/`.
 */

export type FilmCorrection = {
  /** What the film says, as it says it. */
  film: string;
  /** What the course teaches instead. */
  course: string;
  /** Why they differ. */
  why: string;
};

export type Film = {
  title: string;
  durationSeconds: number;
  sizeBytes: number;
  video: { src: string; type: "video/mp4" };
  /** The title card at one second, shown until the learner chooses to play. */
  poster: { src: string; type: "image/jpeg" };
  captions: { src: string; srclang: string; label: string };
  /** The spoken words, one paragraph per utterance, exactly as supplied in T04. */
  transcript: readonly string[];
  /**
   * Where the film contradicts the course. Shown beside the player. A set of
   * facts about the film, so it lives with the film and not in lesson prose.
   */
  corrections: readonly FilmCorrection[];
};

export const FILMS = {
  "journey-of-a-gift": {
    title: "The Journey of a Gift",
    durationSeconds: 419,
    sizeBytes: 36239535,
    video: { src: "/media/journey-of-a-gift.5e5b3bab.mp4", type: "video/mp4" },
    poster: { src: "/media/journey-of-a-gift.91c4e4f6.jpg", type: "image/jpeg" },
    captions: { src: "/media/journey-of-a-gift.en.9cfe81c6.vtt", srclang: "en", label: "English" },
    corrections: [
      {
        film: "over 65 lives transformed through tissue donation",
        course: "up to fifty",
        why: "Fifty is the Organ Donor Foundation's published figure. The larger number could not be traced to a source.",
      },
      {
        film: "a state pathologist has to sign off after an accidental death",
        course: "the Forensic Pathology Service authorises it",
        why: "The state pathologist's office no longer performs that function.",
      },
      {
        film: "by law, there is absolutely no financial cost to the donor's family",
        course: "no cost, in practice",
        why: "The hospital or tissue bank carries the cost, but neither the National Health Act nor its regulations says who pays.",
      },
    ],
    transcript: [
      "So today we're going to talk about something really profound. We're not looking at organ donation as some cold, clinical procedure, but as what it really is: a deeply human story. This is the story of a gift and the incredible journey it takes.",
      "Let me just start by asking you a question. What do you think is the single greatest gift one person can possibly give to another? It's a pretty big question, right? Well, the answer is even bigger, and it really comes in two parts.",
      "Okay, so part one of the answer, it's this number: a single organ donor can give seven or more life-saving organs. We're talking about hearts, lungs, kidneys, livers, giving people who are right on the brink a second chance at life itself.",
      "And that's not even the whole story. The second part of that answer is over 65. That's how many lives can be completely transformed through tissue donation from that very same person. I mean, we're talking about giving sight back, restoring mobility, saving burn victims. The scale of what one decision can do is just staggering.",
      "But, you know, to really get why this gift is so incredible, we first have to understand the need. Who are the people waiting, hoping for that life-altering call?",
      "Look, behind these clinical terms, these are real people. Someone with end-stage organ failure isn't just a diagnosis on a chart. They're a person whose body just can't keep going, whether it's their kidneys or their heart, or someone with such advanced lung disease they have less than a fifty-fifty chance of surviving two years.",
      "For them, a transplant isn't just an option. It is their only hope.",
      "And it's the same for severe burn victims who need skin to live, or for those living in darkness just waiting for corneas to be able to see again.",
      "Okay, so how does this whole journey from a donor to a recipient even begin?",
      "Well, it all starts at a very specific and honestly a very misunderstood medical and legal moment. So let's get really clear on exactly when donation can become a possibility.",
      "The key concept we absolutely have to understand is brain death, and it's so important to get this right.",
      "This is not a coma. It's not a vegetative state. It is the complete, total, and irreversible end of all brain function.",
      "A person who is brain-dead is legally and medically dead. Period.",
      "And this image right here shows you exactly why brain death is so final. That highlighted part, the brainstem, that's the body's command center. It controls everything, and I mean everything that's essential for life, including our most basic function: breathing.",
      "When it stops working for good, the body simply cannot function on its own, even if machines are temporarily keeping the oxygen flowing.",
      "And if there's any lingering doubt, the medical certainty here is absolute. This quote is incredibly important. It confirms that no one, not a single person who has been correctly diagnosed as brain-dead, has ever recovered. Ever.",
      "The diagnosis is final.",
      "So based on that, there are really two main paths for deceased organ donation.",
      "The first and the most common one is donation after brain death, which is what we've just been talking about.",
      "The second is something called donation after circulatory death. This can happen in a palliative care situation when it's known that death is unavoidable after life support is withdrawn.",
      "Now you might be thinking this all sounds very complicated, but you need to know this process doesn't just happen in a vacuum. It's governed by an incredibly strict legal and ethical framework.",
      "It's all designed to protect everyone involved and to make sure the entire process is handled with total integrity.",
      "In South Africa, that framework is Chapter Eight of the National Health Act.",
      "This isn't some informal guideline. It's a matter of national law with crystal-clear, non-negotiable rules.",
      "And this right here shows you just how many checks and balances there are.",
      "First, two totally separate doctors who have absolutely nothing to do with the transplant team have to agree on the diagnosis of brain death, and one of them has to be pretty experienced, with at least five years under their belt.",
      "Then, and only then, can a transplant coordinator even approach the family for consent.",
      "And if the death was, say, from an accident, a state pathologist has to sign off on it too.",
      "It's a system with multiple layers of oversight.",
      "This is something I really want to emphasize because it's so important.",
      "The teams are kept completely separate. The doctors who are focused on saving a patient's life are not the same doctors who certify death, and they're definitely not the people involved in a transplant.",
      "This separation is a legal requirement. It's there to eliminate any possible conflict of interest and to guarantee that the patient's care is always, always the number one priority.",
      "And let's talk about money, because this is a huge worry for a lot of people.",
      "It's really simple: by law, there is absolutely no financial cost to the donor's family for the act of donation.",
      "Not a cent.",
      "Once death has been declared and the family has given consent, all the costs from that point on are covered.",
      "It is a gift in every single sense of the word.",
      "Okay, so we've talked about the medicine and the law, but now we get to the most human part of this whole journey.",
      "Because when it's all said and done, everything comes down to a single compassionate conversation.",
      "And this conversation is handled with such incredible care.",
      "A trained transplant coordinator gets involved early on, but the topic of donation is never ever brought up until the family has had time to really absorb and accept the diagnosis of death from their doctor.",
      "There's no false hope, no misleading information, and absolutely no rush.",
      "The family's grief and their understanding always come first.",
      "And this brings us to what might be the single most important piece of information in this entire explainer.",
      "So please listen closely.",
      "In South Africa, even if you have registered to be an organ donor, the final legal authority, the final say, rests with your next of kin.",
      "Your family must give their consent for donation to happen.",
      "So after that incredibly difficult decision is made, what happens next?",
      "What is the legacy of this amazing gift?",
      "Well, the ripple effect is almost hard to wrap your head around.",
      "And remember, it goes beyond the life-saving organs.",
      "Tissue donation can be just as miraculous.",
      "Corneas from a donor can let someone see their kids' faces again; donated bone can help a person walk without pain; and skin grafts are absolutely life-saving for people with terrible burns.",
      "It's about restoring life and the quality of that life in the most fundamental ways.",
      "So let's bring it all back to where we started.",
      "This chart just powerfully sums up the whole story.",
      "One person's decision, supported by their family in the worst moment of their lives, can lead to over seven lives being saved and more than 65 lives being healed, restored, and transformed.",
      "That is a legacy of life, sight, and movement.",
      "Which really leaves us with one final personal thought.",
      "Knowing that your family has the final say, the most important step you can take isn't just signing a card or registering online.",
      "It's talking.",
      "You've spent a lifetime sharing your life with the people you love.",
      "Have you taken a moment to share your wishes?"
    ],
  },
} as const satisfies Record<string, Film>;

export type FilmKey = keyof typeof FILMS;

export const FILM_KEYS = Object.keys(FILMS) as FilmKey[];

/** True only for a registered key. `hasOwn`, so `constructor` and `__proto__` are not keys. */
export function isFilmKey(key: unknown): key is FilmKey {
  return typeof key === "string" && Object.hasOwn(FILMS, key);
}

/** The registered film for a key, or null for a missing or unknown one. Never throws. */
export function filmFor(key: string | null | undefined): Film | null {
  return isFilmKey(key) ? FILMS[key] : null;
}
