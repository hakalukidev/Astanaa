import AdminCreateProductPage from "@/components/admin/AdminCreateProductPage";
import { getAllCategories } from "@/lib/category-service";

export default async function AdminNewProductRoute() {
  const initialCategories = await getAllCategories();

  return <AdminCreateProductPage initialCategories={initialCategories} />;
}
