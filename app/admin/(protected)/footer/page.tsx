import AdminFooterPage from "@/components/admin/AdminFooterPage";
import { requireStaffAdmin } from "@/lib/admin-auth";

export default async function AdminFooterRoute() {
  await requireStaffAdmin();

  return <AdminFooterPage />;
}
