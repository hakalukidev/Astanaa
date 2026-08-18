import AdminPaymentsPage from "@/components/admin/AdminPaymentsPage";
import { requireStaffAdmin } from "@/lib/admin-auth";

export default async function AdminPaymentsRoute() {
  await requireStaffAdmin();

  return <AdminPaymentsPage />;
}
