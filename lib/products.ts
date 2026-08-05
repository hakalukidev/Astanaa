import type { DocumentData, DocumentSnapshot, QueryDocumentSnapshot, Timestamp } from "firebase/firestore";

export const PRODUCTS_COLLECTION = "products";

export const PRODUCT_CATEGORIES = [
  "Lift Series",
  "Fuel & Transmission Series",
  "A/C & Lubricant Series",
  "Wheel Equipment Series",
  "Washing Equipment Series",
  "Diagnostic Equipment Series (Car Series)",
  "Diagnostic Equipment Series (Bike Series)",
  "Regular Maintenance Equipment",
  "Special Tool Kit Series",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export type Product = {
  id: string;
  name: string;
  category: string;
  price: string;
  description: string;
  details: string;
  keyHighlights: string[];
  photoUrl: string;
  photoPublicId: string;
  photoUrls: string[];
  photoPublicIds: string[];
  isHot: boolean;
  createdAtMs: number | null;
  updatedAtMs: number | null;
};

export type ProductInput = Omit<Product, "id" | "createdAtMs" | "updatedAtMs">;

type ProductSnapshot =
  | QueryDocumentSnapshot<DocumentData>
  | DocumentSnapshot<DocumentData>;

function getTimestampMs(value: unknown) {
  if (!value) {
    return null;
  }

  if (typeof value === "object" && value !== null && "toMillis" in value) {
    return (value as Timestamp).toMillis();
  }

  if (typeof value === "number") {
    return value;
  }

  return null;
}

function normalizeHighlights(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).trim())
      .filter((entry) => entry.length > 0);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  return [];
}

function normalizeImageValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).trim())
      .filter((entry) => entry.length > 0);
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    return trimmedValue ? [trimmedValue] : [];
  }

  return [];
}

function dedupeImageValues(values: string[]) {
  const seen = new Set<string>();

  return values.filter((value) => {
    const normalizedValue = value.trim();

    if (!normalizedValue || seen.has(normalizedValue)) {
      return false;
    }

    seen.add(normalizedValue);
    return true;
  });
}

export function mapProductSnapshot(snapshot: ProductSnapshot): Product | null {
  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data() ?? {};
  const photoUrls = dedupeImageValues(
    normalizeImageValues(data.photoUrls).concat(
      normalizeImageValues(data.photoUrl)
    )
  );
  const photoPublicIds = dedupeImageValues(
    normalizeImageValues(data.photoPublicIds).concat(
      normalizeImageValues(data.photoPublicId)
    )
  );

  return {
    id: snapshot.id,
    name: String(data.name ?? ""),
    category: String(data.category ?? "Uncategorized"),
    price: String(data.price ?? "Contact for Price"),
    description: String(data.description ?? ""),
    details: String(data.details ?? ""),
    keyHighlights: normalizeHighlights(data.keyHighlights),
    photoUrl: photoUrls[0] ?? "",
    photoPublicId: photoPublicIds[0] ?? "",
    photoUrls,
    photoPublicIds,
    isHot: Boolean(data.isHot),
    createdAtMs: getTimestampMs(data.createdAt),
    updatedAtMs: getTimestampMs(data.updatedAt),
  };
}

export function getProductPhotoUrls(product: Pick<Product, "photoUrl" | "photoUrls">) {
  return dedupeImageValues(
    normalizeImageValues(product.photoUrls).concat(
      normalizeImageValues(product.photoUrl)
    )
  );
}

export function getProductPhotoPublicIds(
  product: Pick<Product, "photoPublicId" | "photoPublicIds">
) {
  return dedupeImageValues(
    normalizeImageValues(product.photoPublicIds).concat(
      normalizeImageValues(product.photoPublicId)
    )
  );
}

export function getPrimaryProductPhotoUrl(product: Pick<Product, "photoUrl" | "photoUrls">) {
  return getProductPhotoUrls(product)[0] ?? "";
}

export function sortProducts(products: Product[]) {
  return [...products].sort((left, right) => {
    const leftValue = left.createdAtMs ?? 0;
    const rightValue = right.createdAtMs ?? 0;

    return rightValue - leftValue;
  });
}

export function getProductCategories(products: Product[]) {
  const seen = new Set<string>();

  return products.reduce<string[]>((categories, product) => {
    const category = product.category.trim();

    if (!category || seen.has(category)) {
      return categories;
    }

    seen.add(category);
    categories.push(category);

    return categories;
  }, []);
}
