import AdminTermsPage from "@/components/admin/AdminTermsPage";
import { requireStaffAdmin } from "@/lib/admin-auth";

export default async function AdminTermsRoute() {
  await requireStaffAdmin();

  return <AdminTermsPage />;
}
