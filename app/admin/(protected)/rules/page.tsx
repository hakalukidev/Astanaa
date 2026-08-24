import AdminRulesPage from "@/components/admin/AdminRulesPage";
import { requireSuperAdmin } from "@/lib/admin-auth";

export default async function AdminRulesRoute() {
  await requireSuperAdmin();

  return <AdminRulesPage />;
}
