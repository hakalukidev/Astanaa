import AdminAboutPage from "@/components/admin/AdminAboutPage";
import { requireStaffAdmin } from "@/lib/admin-auth";

export default async function AdminAboutRoute() {
  await requireStaffAdmin();

  return <AdminAboutPage />;
}
