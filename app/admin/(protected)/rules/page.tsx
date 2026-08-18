import AdminRulesPage from "@/components/admin/AdminRulesPage";
import { requireStaffAdmin } from "@/lib/admin-auth";

export default async function AdminRulesRoute() {
  await requireStaffAdmin();

  return <AdminRulesPage />;
}
