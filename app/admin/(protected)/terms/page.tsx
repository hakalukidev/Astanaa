import AdminTermsPage from "@/components/admin/AdminTermsPage";
import { requireSuperAdmin } from "@/lib/admin-auth";

export default async function AdminTermsRoute() {
  await requireSuperAdmin();

  return <AdminTermsPage />;
}
