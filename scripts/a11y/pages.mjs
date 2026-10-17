// The audit's page list, as data. Add a page here and the audit covers it.
//
//   auth: "public"  renders without a session, so CI audits it today.
//   auth: "learner" needs a signed-in Student (test session, role "student").
//   auth: "admin"   needs a signed-in Admin   (test session, role "admin").
//
// vocabulary: true also fails the page if its visible text says "module(s)" (Stage, not module).
//
// Signed-in pages are skipped, with a TODO line, until a test-session helper exists
// (see scripts/a11y/session.mjs). Once #28's helper lands they run with no change here.
export const VIEWPORTS = [
  { name: "375", width: 375, height: 812 },
  { name: "1024", width: 1024, height: 768 },
];

export const PAGES = [
  { name: "Landing", path: "/", auth: "public", vocabulary: true },
  { name: "Privacy notice", path: "/privacy", auth: "public" },
  { name: "Sign in", path: "/login", auth: "public" },
  { name: "Register", path: "/register", auth: "public" },
  { name: "Under 18 refusal", path: "/enrol/refused", auth: "public" },
  { name: "Certificate verification (unknown ID)", path: "/certificate/UNKNOWN-ID", auth: "public" },

  { name: "Dashboard", path: "/dashboard", auth: "learner" },
  { name: "Profile", path: "/profile", auth: "learner" },
  { name: "Course introduction", path: "/course/introduction", auth: "learner" },
  { name: "Baseline", path: "/assessment/pre", auth: "learner" },
  { name: "Level (Beginner)", path: "/levels/beginner", auth: "learner", vocabulary: true },
  { name: "Stage", path: "/levels/beginner/modules/why-donation-matters", auth: "learner", vocabulary: true },

  { name: "Admin overview", path: "/admin", auth: "admin" },
  { name: "Admin students", path: "/admin/students", auth: "admin" },
  { name: "Admin content review", path: "/admin/content-review", auth: "admin" },
  { name: "Admin eligibility", path: "/admin/eligibility", auth: "admin" },
];
