import AdminBlogPage from '@/components/admin/AdminBlogPage';
import { requireStaffAdmin } from '@/lib/admin-auth';

export default async function AdminBlogRoute() {
  await requireStaffAdmin();

  return (
      <AdminBlogPage />
  );
}
