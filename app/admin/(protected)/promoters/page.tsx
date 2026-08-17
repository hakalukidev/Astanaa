import AdminPromotersPage from "@/components/admin/AdminPromotersPage";
import { requireStaffAdmin } from "@/lib/admin-auth";

export default async function AdminPromotersRoute() {
  await requireStaffAdmin();

  return <AdminPromotersPage />;
}
