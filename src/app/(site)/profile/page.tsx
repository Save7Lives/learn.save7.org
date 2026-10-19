import { redirect } from "next/navigation";

// Profile now lives on My progress. Kept so old links and bookmarks still land.
export const dynamic = "force-dynamic";

export default function ProfilePage() {
  redirect("/dashboard#profile");
}
