import AdminProductsPage from "@/components/admin/AdminProductsPage";
import { getAllCategories } from "@/lib/category-service";
import { getAllProducts } from "@/lib/product-service";

export default async function AdminProductsRoute() {
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
