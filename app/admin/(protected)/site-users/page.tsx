import AdminSiteUsersPage from "@/components/admin/AdminSiteUsersPage";
import { requireStaffAdmin } from "@/lib/admin-auth";

export default async function AdminSiteUsersRoute() {
  await requireStaffAdmin();

  return <AdminSiteUsersPage />;
}
