import { redirect } from "next/navigation";

import { getCurrentAdmin } from "@/lib/admin-auth";

export default async function AdminPage() {
  const admin = await getCurrentAdmin();

  if (admin?.role === "promoter") {
    redirect("/admin/my-posts");
  }

  if (admin?.role === "moderator") {
    redirect("/admin/moderation");
  }

  redirect("/admin/posts");
}
