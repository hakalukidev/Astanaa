import AdminSlidesPage from "@/components/admin/AdminSlidesPage";
import { requireStaffAdmin } from "@/lib/admin-auth";

export default async function AdminSlidesRoute() {
  await requireStaffAdmin();

  return <AdminSlidesPage />;
}
