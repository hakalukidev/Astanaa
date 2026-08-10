import AdminListingPurposesPage from "@/components/admin/AdminListingPurposesPage";
import { requireStaffAdmin } from "@/lib/admin-auth";

export default async function AdminListingPurposesRoute() {
  await requireStaffAdmin();

  return <AdminListingPurposesPage />;
}
