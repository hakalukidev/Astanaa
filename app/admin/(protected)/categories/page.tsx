import AdminCategoriesPage from "@/components/admin/AdminCategoriesPage";
import { requireStaffAdmin } from "@/lib/admin-auth";
import { getAllCategories } from "@/lib/category-service";
import { getAllProducts } from "@/lib/product-service";

export default async function AdminCategoriesRoute() {
  await requireStaffAdmin();

  const [categories, products] = await Promise.all([
    getAllCategories(),
    getAllProducts(),
  ]);

  return (
      <AdminCategoriesPage
        initialCategories={categories}
        initialProducts={products}
      />
  );
}

