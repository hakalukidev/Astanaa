import AdminModeratorsPage from "@/components/admin/AdminModeratorsPage";
import { requireStaffAdmin } from "@/lib/admin-auth";

export default async function AdminModeratorsRoute() {
  await requireStaffAdmin();

  return <AdminModeratorsPage />;
}
