import AdminPropertyTypesPage from "@/components/admin/AdminPropertyTypesPage";
import { requireStaffAdmin } from "@/lib/admin-auth";

export default async function AdminPropertyTypesRoute() {
  await requireStaffAdmin();

  return <AdminPropertyTypesPage />;
}
