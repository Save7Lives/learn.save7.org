import type { ResourceSeed } from "./types";

/**
 * The resource library.
 *
 * Every entry here is a real, supplied document with a real citation. The earlier
 * version of this file was deliberately full of stubs, because inventing an
 * author, journal, year or DOI to make a reference list look finished is worse
 * than an obviously incomplete one — a plausible fake citation gets repeated.
 *
 * Save7 has now supplied the material, so the citations below are transcribed
 * from the study guide's own reference list and from the documents themselves.
 * Nothing here is reconstructed from memory.
 *
 * The PDFs are served from /public/resources so a learner can actually open the
 * further reading rather than being pointed at a paywall.
 */
export const resourceSeeds: ResourceSeed[] = [
  // --- Course-wide -----------------------------------------------------------
  {
    key: "save7",
    moduleSlug: null,
    title: "Save7",
    description:
      "Save7's own site: donor registration, the LifePod project, and current campaigns.",
    type: "WEBSITE",
    source: "Save7",
    externalUrl: "https://save7.org",
  },
  {
    key: "organ-donor-foundation-of-south-africa",
    moduleSlug: null,
    title: "Organ Donor Foundation of South Africa",
    description:
      "The national umbrella body for promoting awareness and managing the donor database. The right place to send anyone who wants to register, or who asks for current South African figures.",
    type: "WEBSITE",
    source: "Organ Donor Foundation of South Africa",
    externalUrl: "https://odf.org.za",
  },
  {
    key: "transplant-alchemy-101-study-guide",
    moduleSlug: null,
    title: "Transplant Alchemy 101 — Study Guide",
    description:
      "Save7's own study guide, structured around five learning objectives: who needs organs, where and why organs are lost, the transplant team, the legislation, and donor eligibility. This is the source of truth for the course.",
    type: "PDF",
    source: "Save7",
    isRequired: true,
    filePath: "/resources/transplant-alchemy-101-study-guide.pdf",
  },
  {
    key: "amboss-transplantation",
    moduleSlug: null,
    title: "Transplantation — AMBOSS Knowledge Library",
    description:
      "General clinical reference on transplantation, cited by the study guide.",
    type: "WEBSITE",
    source: "AMBOSS GmbH",
    externalUrl: "https://next.amboss.com/us/article/gn0Fsg",
    licenceNote: "Cited by the Save7 study guide, accessed 10 February 2026. Requires an AMBOSS subscription.",
  },

  // --- M1 · Who Needs Organs -------------------------------------------------
  {
    key: "mehra-2016-ishlt-listing-criteria",
    moduleSlug: "who-needs-organs",
    title:
      "The 2016 International Society for Heart Lung Transplantation listing criteria for heart transplantation: A 10-year update",
    description:
      "The international listing criteria for heart transplantation. Cited by the study guide for heart transplant indications.",
    type: "ACADEMIC_PAPER",
    author:
      "Mehra, M. R., Canter, C. E., Hannan, M. M., Semigran, M. J., Uber, P. A., Baran, D. A., Danziger-Isakov, L., Kirklin, J. K., Kirk, R., Kushwaha, S. S., Lund, L. H., Potena, L., Ross, H. J., Taylor, D. O., Verschuuren, E. A. M., & Zuckermann, A.",
    source: "The Journal of Heart and Lung Transplantation, 35(1), 1–23 (2016)",
    licenceNote:
      "Cited in the Save7 study guide reference list. The full text was not among the supplied PDFs.",
  },
  {
    key: "weill-2015-lung-candidate-selection",
    moduleSlug: "who-needs-organs",
    title:
      "A consensus document for the selection of lung transplant candidates: 2014 — An update from the Pulmonary Transplantation Council of the ISHLT",
    description:
      "International consensus on which patients are considered for lung transplantation. Underpins the study guide's statement that lung transplants are indicated for advanced lung disease with a risk of death exceeding 50% over two years.",
    type: "ACADEMIC_PAPER",
    author:
      "Weill, D., Benden, C., Corris, P. A., Dark, J. H., Davis, R. D., Keshavjee, S., Lederer, D. J., Mulligan, M. J., Patterson, G. A., Singer, L. G., Snell, G. I., Verleden, G. M., Zamora, M. R., & Glanville, A. R.",
    source: "The Journal of Heart and Lung Transplantation, 34(1), 1–15 (2015)",
    filePath: "/resources/weill-2015-lung-candidate-selection.pdf",
  },
  {
    key: "canter-2007-paediatric-heart-indications",
    moduleSlug: "who-needs-organs",
    title:
      "Indications for heart transplantation in pediatric heart disease: A scientific statement from the American Heart Association",
    description:
      "Paediatric heart transplant indications. Cited by the study guide.",
    type: "ACADEMIC_PAPER",
    author:
      "Canter, C. E., Shaddy, R. E., Bernstein, D., Hsu, D. T., Chrisant, M. R. K., Kirklin, J. K., Kanter, K. R., Higgins, R. S. D., Blume, E. D., Rosenthal, D. N., Boucek, M. M., Uzark, K. C., Friedman, A. H., & Young, J. K.",
    source: "Circulation, 115(5), 658–676 (2007)",
    licenceNote:
      "Cited in the Save7 study guide reference list. The full text was not among the supplied PDFs.",
  },

  // --- M2 · Why Are We Losing Organs ----------------------------------------
  {
    key: "han-2017-family-decision-delay",
    moduleSlug: "why-are-we-losing-organs",
    title:
      "Factors associated with a family's delay of decision for organ donation after brain death",
    description:
      "A study of 107 brain-dead potential donors. Families who took longer than 48 hours to decide had a consent rate of 73%, compared with 55% for those deciding sooner — so a slower decision was not a worse one. The authors conclude that counselling should continue even when a family cannot decide immediately.",
    type: "ACADEMIC_PAPER",
    author: "Han, S. Y., Kim, J. I., Lee, E.-W., Jang, H.-Y., Han, K. H., Oh, S. W., & Roh, Y.-N.",
    source: "Annals of Transplantation, 22, 17–23 (2017). DOI: 10.12659/AOT.901616",
    filePath: "/resources/han-2017-family-decision-delay.pdf",
  },

  // --- M3 · The Basics of Organ Donation ------------------------------------
  {
    key: "satcs-red-file",
    moduleSlug: "basics-of-organ-donation",
    title: "The Organ and Tissue Donation Reference File (the “Red File”)",
    description:
      "SATCS's reference file for transplant coordinators: the donation process end to end, consent, documentation and tissue criteria. The practical handbook behind much of this course.",
    type: "PDF",
    source: "South African Transplant Coordinators Society (SATCS)",
    isRequired: true,
    filePath: "/resources/satcs-red-file.pdf",
  },

  // --- M4 · Having the Conversation ----------------------------------------
  {
    key: "7-lives-in-7-steps",
    moduleSlug: "having-the-conversation",
    title: "7 Lives in 7 Steps",
    description:
      "Save7's own clinical referral pathway, as a flowchart and a seven-step checklist. Note step 7: the family is told the diagnosis of brain death and organ donation is deliberately not mentioned at that point — the two conversations are kept separate.",
    type: "PDF",
    source: "Save7",
    isRequired: true,
    filePath: "/resources/7-lives-in-7-steps.pdf",
  },

  // --- M5 · The Journey of a Gift -------------------------------------------
  {
    key: "the-journey-of-a-gift",
    moduleSlug: "journey-of-a-gift",
    title: "The Journey of a Gift",
    description:
      "Save7's visual storytelling resource, following a donation from potential donor through to the recipient. 6 minutes 59 seconds. Module 5 is built around it.",
    type: "VIDEO",
    source: "Save7",
    isRequired: true,
    filePath: "/media/journey-of-a-gift.mp4",
    licenceNote:
      "Still needed for launch: a WebVTT captions track and a text transcript (both accessibility requirements), and chapter timecodes so the chapter list beside the player becomes seekable.",
  },
  {
    key: "excellence-in-deceased-donation-2025",
    moduleSlug: "journey-of-a-gift",
    title: "Excellence in Deceased Donation — Course Manual (updated 2025)",
    description:
      "The clinical manual behind the donation pathway: Western Cape organ and tissue donation policy, brain death and circulatory death certification, apnoea testing, donor management (optimising organ function, haemodynamic and respiratory support), family support, and the HPCSA guidelines on informed consent and palliative care.",
    type: "PDF",
    source: "Excellence in Deceased Donation course, updated 2025",
    isRequired: true,
    filePath: "/resources/excellence-in-deceased-donation-2025.pdf",
  },

  // --- M6 · What Does Death Mean -------------------------------------------
  {
    key: "sa-guidelines-determination-of-death-ccssa",
    moduleSlug: "what-does-death-mean",
    title: "South African Guidelines on the Determination of Death",
    description:
      "The authoritative South African source for Module 6. Defines death as the irreversible loss of the capacity for consciousness together with the irreversible loss of the capacity to breathe, sets the preconditions and clinical testing standards, and records that no person meeting the criteria for brain death has ever subsequently regained brain function.",
    type: "PDF",
    author:
      "Thomson, D., Joubert, I., De Vasconcellos, K., Paruk, F., Mokgokong, S., Mathivha, R., McCulloch, M., Morrow, B., Baker, D., Rossouw, B., Mdladla, N., Richards, G. A., Welkovics, N., Levy, B., Coetzee, I., Spruyt, M., Ahmed, N., & Gopalan, D.",
    source: "Critical Care Society of Southern Africa (2021) — CCSSA website version",
    isRequired: true,
    filePath: "/resources/sa-guidelines-determination-of-death-ccssa.pdf",
  },
  {
    key: "sa-guidelines-determination-of-death-sajcc",
    moduleSlug: "what-does-death-mean",
    title:
      "South African guidelines on the determination of death (published journal version)",
    description:
      "The peer-reviewed publication of the same guidelines. Cite this version in written material.",
    type: "ACADEMIC_PAPER",
    author:
      "Thomson, D., Joubert, I., De Vasconcellos, K., Paruk, F., Mokgokong, S., Mathivha, R., McCulloch, M., Morrow, B., Baker, D., Rossouw, B., Mdladla, N., Richards, G. A., Welkovics, N., Levy, B., Coetzee, I., Spruyt, M., Ahmed, N., & Gopalan, D.",
    source:
      "South African Medical Journal, 111(4b), 367–380 (2021); also South African Journal of Critical Care, 37(1) Part 2, March 2021",
    isRequired: true,
    filePath: "/resources/sa-guidelines-determination-of-death-sajcc.pdf",
  },

  // --- M7 · Who Makes It Happen --------------------------------------------
  {
    key: "satcs-organisation",
    moduleSlug: "who-makes-it-happen",
    title: "South African Transplant Coordinators Society (SATCS)",
    description:
      "The body that represents, unites and supports transplant coordinators in South Africa. Publisher of the Red File.",
    type: "WEBSITE",
    source: "SATCS",
    isStub: true,
    licenceNote:
      "Current URL still to be confirmed by Save7 — deliberately not guessed. The Red File itself is attached to Module 3.",
  },

  // --- M9 · The Law ---------------------------------------------------------
  {
    key: "national-health-act-chapter-8",
    moduleSlug: "the-law",
    title: "National Health Act No. 61 of 2003 — Chapter 8",
    description:
      "The primary legislation governing organ and tissue donation and transplantation in South Africa. Chapter 8 covers donation, post-mortem examination and related matters.",
    type: "WEBSITE",
    source: "Republic of South Africa",
    isRequired: true,
    isStub: true,
    licenceNote:
      "Act and chapter confirmed from the Save7 study guide. Save7 should add a link to the current consolidated text including amendments in force, and have the module's legal statements reviewed before launch.",
  },
  {
    key: "hpcsa-informed-consent",
    moduleSlug: "the-law",
    title:
      "Seeking patients' informed consent: the ethical considerations (Booklet 4)",
    description:
      "HPCSA guidance on informed consent — who may consent, capacity, voluntariness, and consent on behalf of others. Reproduced within the Excellence in Deceased Donation manual.",
    type: "PDF",
    source:
      "Health Professions Council of South Africa, Guidelines for Good Practice in the Healthcare Professions, Booklet 4, revised December 2021",
    filePath: "/resources/excellence-in-deceased-donation-2025.pdf",
    licenceNote: "Included within the Excellence in Deceased Donation manual.",
  },
  {
    key: "hpcsa-palliative-care",
    moduleSlug: "the-law",
    title: "Ethical guidelines on palliative care (Booklet 1)",
    description:
      "HPCSA guidance on palliative care, including withholding and withdrawal of treatment — the context in which donation after circulatory death arises. Reproduced within the Excellence in Deceased Donation manual.",
    type: "PDF",
    source:
      "Health Professions Council of South Africa, Guidelines for Good Practice in the Health Care Professions, Booklet 1",
    filePath: "/resources/excellence-in-deceased-donation-2025.pdf",
    licenceNote: "Included within the Excellence in Deceased Donation manual.",
  },

  // --- M10 · The Transplant Landscape --------------------------------------
  {
    key: "mancini-lietz-2010-cardiac-candidates",
    moduleSlug: "transplant-landscape",
    title: "Selection of cardiac transplantation candidates in 2010",
    description:
      "How heart transplant candidates are actually selected: indications, prognostic assessment, mechanical circulatory support, and how contraindications such as age, diabetes, renal dysfunction and obesity are weighed rather than applied as absolute rules.",
    type: "ACADEMIC_PAPER",
    author: "Mancini, D., & Lietz, K.",
    source: "Circulation, 122(2), 173–183 (2010)",
    filePath: "/resources/mancini-lietz-2010-cardiac-candidates.pdf",
  },

  // --- M11 · Life After Donation -------------------------------------------
  {
    key: "porrett-2009-liver-complications",
    moduleSlug: "life-after-donation",
    title: "Late surgical complications following liver transplantation",
    description:
      "Advanced reading on what can go wrong months and years after a liver transplant — biliary, vascular and other late complications. Useful for understanding why transplantation is a lifelong medical relationship rather than a completed repair.",
    type: "ACADEMIC_PAPER",
    author: "Porrett, P. M., Hsu, J., & Shaked, A.",
    source: "Liver Transplantation, 15(S2), S12–S18 (2009). AASLD/ILTS Syllabus",
    filePath: "/resources/porrett-2009-liver-complications.pdf",
  },

  // --- M12 · The Art of the Conversation ------------------------------------
  {
    key: "de-jager-2019-wits-transplant-procurement-model",
    moduleSlug: "art-of-the-conversation",
    title:
      "Increasing deceased organ donor numbers in Johannesburg, South Africa: 18-month results of the Wits Transplant Procurement Model",
    description:
      "The primary source for FACTS — the Family Approach to Consent for Transplant Strategy. Describes FACTS as a stepwise process guiding transplant procurement coordinators through the donation conversation, adapted for South Africa from the UK NHS Blood and Transplant model. Read this to understand that FACTS is a clinical procurement strategy, not a volunteer script.",
    type: "ACADEMIC_PAPER",
    isRequired: true,
    author: "de Jager, M., Wilmans, C., Fabian, J., Botha, J. F., & Etheredge, H. R.",
    source: "South African Medical Journal, 109(9) (2019). doi:10.7196/samj.2019.v109i9.14313",
    externalUrl:
      "https://scielo.org.za/scielo.php?pid=S0256-95742019000900006&script=sci_arttext",
  },
  {
    key: "satcs-organ-and-tissue-donation-reference-file",
    moduleSlug: "art-of-the-conversation",
    title: "Organ and Tissue Donation Reference File",
    description:
      "The reference file distributed to South African public and private facilities. Save7 identifies this as the document that sets out the eight steps of the FACTS process in full. It was not accessible when this module was written, so the step list in the study guide is flagged for verification against it.",
    type: "PDF",
    source: "South African Transplant Coordinators Society",
    isStub: true,
    licenceNote:
      "Citation incomplete: authors, year and a stable public link are still needed. Save7 to supply the file so the eight-step sequence can be verified and this stub completed.",
  },

  // --- M13 · Become a Save7 Advocate ---------------------------------------
  {
    key: "register-as-an-organ-donor",
    moduleSlug: "become-a-save7-advocate",
    title: "Register as an organ donor",
    description:
      "Registration takes under a minute and is free. Remember that registering records your wishes — telling your family is what makes them actionable, because consent from next of kin is always required.",
    type: "WEBSITE",
    source: "Save7",
    externalUrl: "https://save7.org/register",
  },
];
