import AdminAboutPage from "@/components/admin/AdminAboutPage";
import { requireSuperAdmin } from "@/lib/admin-auth";

export default async function AdminAboutRoute() {
  await requireSuperAdmin();

  return <AdminAboutPage />;
}
