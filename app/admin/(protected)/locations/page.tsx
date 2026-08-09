import AdminLocationsPage from "@/components/admin/AdminLocationsPage";
import { requireStaffAdmin } from "@/lib/admin-auth";

export default async function AdminLocationsRoute() {
  await requireStaffAdmin();

  return <AdminLocationsPage />;
}
