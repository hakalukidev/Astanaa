import AdminListingPurposesPage from "@/components/admin/AdminListingPurposesPage";
import { requireSuperAdmin } from "@/lib/admin-auth";

export default async function AdminListingPurposesRoute() {
  await requireSuperAdmin();

  return <AdminListingPurposesPage />;
}
