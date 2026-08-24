import AdminFooterPage from "@/components/admin/AdminFooterPage";
import { requireSuperAdmin } from "@/lib/admin-auth";

export default async function AdminFooterRoute() {
  await requireSuperAdmin();

  return <AdminFooterPage />;
}
