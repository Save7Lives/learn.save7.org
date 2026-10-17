import type { Metadata } from "next";
import { loadCatalogue, loadStudents } from "@/lib/admin/data";
import {
  PAGE_SIZE,
  SIGNED_UP_OPTIONS,
  byNewestSignup,
  inWindow,
  matchesLevel,
  searchStudents,
  type SignedUpWindow,
} from "@/lib/admin/model";
import { StudentsView } from "@/components/admin/StudentsView";

// Rendered per request, never prerendered: this route reads runtime configuration
// (Supabase URL and key, SITE_URL) which Vercel supplies per environment. A
// prerender would bake whatever the build machine had. See src/lib/supabase/config.ts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Students" };

const first = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

export default async function StudentsPage(props: PageProps<"/admin/students">) {
  const params = await props.searchParams;
  const signed = SIGNED_UP_OPTIONS.some(([v]) => v === params.signed) ? (params.signed as SignedUpWindow) : "all";
  const catalogue = await loadCatalogue();
  const levelOptions = ["any", "awaiting", "complete", ...catalogue.map((l) => l.slug)];
  const requested = first(params.level);
  const level = levelOptions.includes(requested) ? requested : "any";
  const q = first(params.q).slice(0, 80);
  const requestedPage = Math.max(1, Number.parseInt(first(params.page), 10) || 1);

  const students = await loadStudents(catalogue);
  const now = new Date();
  const matching = searchStudents(
    students.filter((s) => inWindow(s, signed, now) && matchesLevel(s, level, catalogue)),
    q,
  ).sort(byNewestSignup);

  const pages = Math.max(1, Math.ceil(matching.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pages);

  return (
    <StudentsView
      catalogue={catalogue}
      rows={matching.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
      matching={matching.length}
      total={students.length}
      query={{ q, signed, level, page }}
    />
  );
}
