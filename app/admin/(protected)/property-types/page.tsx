import AdminPropertyTypesPage from "@/components/admin/AdminPropertyTypesPage";
import { requireSuperAdmin } from "@/lib/admin-auth";

export default async function AdminPropertyTypesRoute() {
  await requireSuperAdmin();

  return <AdminPropertyTypesPage />;
}
