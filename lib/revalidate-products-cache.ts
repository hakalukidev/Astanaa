export async function revalidateProductsCache() {
  const response = await fetch("/api/revalidate-products", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Could not revalidate the products cache.");
  }
}
