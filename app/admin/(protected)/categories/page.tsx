import AdminCategoriesPage from "@/components/admin/AdminCategoriesPage";
import { getAllCategories } from "@/lib/category-service";
import { getAllProducts } from "@/lib/product-service";

export default async function AdminCategoriesRoute() {
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

