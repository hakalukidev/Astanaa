import type {
  DocumentData,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase/firestore";

export const CATEGORIES_COLLECTION = "categories";

export type Category = {
  id: string;
  name: string;
  subcategories: string[];
  createdAtMs: number | null;
  updatedAtMs: number | null;
};

export type CategoryInput = Omit<Category, "id" | "createdAtMs" | "updatedAtMs">;

export type ManagedCategoryOption = {
  label: string;
  parentName: string | null;
  type: "main" | "subcategory";
  value: string;
};

type CategorySnapshot =
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

export function normalizeCategoryName(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function getCategoryKey(value: string) {
  return normalizeCategoryName(value).toLocaleLowerCase("en-US");
}

export function normalizeSubcategories(values: Iterable<string>) {
  const seen = new Set<string>();
  const subcategories: string[] = [];

  for (const value of values) {
    const normalizedValue = normalizeCategoryName(String(value));
    const normalizedKey = getCategoryKey(normalizedValue);

    if (!normalizedValue || seen.has(normalizedKey)) {
      continue;
    }

    seen.add(normalizedKey);
    subcategories.push(normalizedValue);
  }

  return subcategories;
}

export function toCategoryInput(input: CategoryInput): CategoryInput {
  return {
    name: normalizeCategoryName(input.name),
    subcategories: normalizeSubcategories(input.subcategories),
  };
}

export function mapCategorySnapshot(snapshot: CategorySnapshot): Category | null {
  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data() ?? {};

  return {
    id: snapshot.id,
    name: normalizeCategoryName(String(data.name ?? "")),
    subcategories: normalizeSubcategories(
      Array.isArray(data.subcategories) ? data.subcategories.map(String) : []
    ),
    createdAtMs: getTimestampMs(data.createdAt),
    updatedAtMs: getTimestampMs(data.updatedAt),
  };
}

export function sortCategories(categories: Category[]) {
  return [...categories].sort((left, right) =>
    left.name.localeCompare(right.name, "en-US", {
      sensitivity: "base",
    })
  );
}

function appendManagedCategoryOption(
  options: ManagedCategoryOption[],
  seen: Set<string>,
  option: ManagedCategoryOption
) {
  const normalizedValue = normalizeCategoryName(option.value);
  const key = getCategoryKey(normalizedValue);

  if (!normalizedValue || seen.has(key)) {
    return;
  }

  seen.add(key);
  options.push({
    ...option,
    value: normalizedValue,
  });
}

export function getManagedCategoryOptions(categories: Category[]) {
  const seen = new Set<string>();
  const options: ManagedCategoryOption[] = [];

  for (const category of sortCategories(categories)) {
    appendManagedCategoryOption(options, seen, {
      label: category.name,
      parentName: null,
      type: "main",
      value: category.name,
    });

    for (const subcategory of category.subcategories) {
      appendManagedCategoryOption(options, seen, {
        label: `${category.name} / ${subcategory}`,
        parentName: category.name,
        type: "subcategory",
        value: subcategory,
      });
    }
  }

  return options;
}

export function getTotalSubcategoryCount(categories: Category[]) {
  return categories.reduce(
    (totalSubcategories, category) =>
      totalSubcategories + category.subcategories.length,
    0
  );
}

export function findManagedMainCategory(value: string, categories: Category[]) {
  const normalizedValue = getCategoryKey(value);

  if (!normalizedValue) {
    return null;
  }

  return (
    categories.find(
      (category) => getCategoryKey(category.name) === normalizedValue
    ) ?? null
  );
}

export function matchesManagedCategoryValue(value: string, category: Category) {
  const normalizedValue = getCategoryKey(value);

  if (!normalizedValue) {
    return false;
  }

  return (
    getCategoryKey(category.name) === normalizedValue ||
    category.subcategories.some(
      (subcategory) => getCategoryKey(subcategory) === normalizedValue
    )
  );
}

export function filterItemsByManagedCategory<T extends { category: string }>(
  items: T[],
  category: Category
) {
  return items.filter((item) => matchesManagedCategoryValue(item.category, category));
}
