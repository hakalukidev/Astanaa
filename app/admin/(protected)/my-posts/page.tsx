import { redirect } from "next/navigation";

import AdminMyPosts from "@/components/admin/AdminMyPosts";
import { getCurrentAdmin } from "@/lib/admin-auth";

export default async function AdminMyPostsRoute() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return <AdminMyPosts uid={admin.uid} name={admin.email} />;
}
