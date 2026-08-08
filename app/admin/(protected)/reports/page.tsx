import AdminReportsPage from "@/components/admin/AdminReportsPage";
import { requireStaffAdmin } from "@/lib/admin-auth";

export default async function AdminReportsRoute() {
  await requireStaffAdmin();

  return <AdminReportsPage />;
}
