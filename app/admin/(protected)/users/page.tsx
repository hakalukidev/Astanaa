import { redirect } from "next/navigation";

import AdminUsersPage from "@/components/admin/AdminUsersPage";
import { getCurrentAdmin } from "@/lib/admin-auth";

export default async function AdminUsersRoute() {
  const admin = await getCurrentAdmin();

  // AdminShell already redirects to /admin/login when there's no session at
  // all; here we only need to gate the extra "manage other admins" power.
  if (!admin || admin.role !== "super_admin") {
    redirect("/admin/products");
  }

  return <AdminUsersPage currentUid={admin.uid} />;
}
