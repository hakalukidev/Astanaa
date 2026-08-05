import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  CATEGORIES_COLLECTION,
  mapCategorySnapshot,
  sortCategories,
  toCategoryInput,
  type Category,
  type CategoryInput,
} from "@/lib/categories";

export async function getAllCategories(): Promise<Category[]> {
  if (!db) {
    return [];
  }

  const snapshot = await getDocs(collection(db, CATEGORIES_COLLECTION));

  return sortCategories(
    snapshot.docs
      .map((documentSnapshot) => mapCategorySnapshot(documentSnapshot))
      .filter((category): category is Category => Boolean(category))
  );
}

function getCategoriesCollection() {
  if (!db) {
    throw new Error("Category data is not available.");
  }

  return collection(db, CATEGORIES_COLLECTION);
}

export async function createCategory(input: CategoryInput) {
  const categoriesCollection = getCategoriesCollection();
  const normalizedInput = toCategoryInput(input);

  return addDoc(categoriesCollection, {
    ...normalizedInput,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateCategory(id: string, input: CategoryInput) {
  if (!db) {
    throw new Error("Category data is not available.");
  }

  const normalizedInput = toCategoryInput(input);

  return updateDoc(doc(db, CATEGORIES_COLLECTION, id), {
    ...normalizedInput,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCategory(id: string) {
  if (!db) {
    throw new Error("Category data is not available.");
  }

  return deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
}
