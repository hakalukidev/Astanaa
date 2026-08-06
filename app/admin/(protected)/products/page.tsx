import AdminProductsPage from "@/components/admin/AdminProductsPage";
import { requireStaffAdmin } from "@/lib/admin-auth";
import { getAllCategories } from "@/lib/category-service";
import { getAllProducts } from "@/lib/product-service";

export default async function AdminProductsRoute() {
  await requireStaffAdmin();

  const [initialCategories, initialProducts] = await Promise.all([
    getAllCategories(),
    getAllProducts(),
  ]);

  return (
    <AdminProductsPage
      initialCategories={initialCategories}
      initialProducts={initialProducts}
    />
  );
}
