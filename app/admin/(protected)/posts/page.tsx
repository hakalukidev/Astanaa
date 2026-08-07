import AdminPostsPage from "@/components/admin/AdminPostsPage";
import { requireStaffAdmin } from "@/lib/admin-auth";

export default async function AdminPostsRoute() {
  const admin = await requireStaffAdmin();

  return <AdminPostsPage role={admin.role} />;
}
