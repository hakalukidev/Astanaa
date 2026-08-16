export async function revalidateListingsCache() {
  const response = await fetch("/api/revalidate-listings", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Could not revalidate the listings cache.");
  }
}
