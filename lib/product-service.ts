import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  PRODUCTS_COLLECTION,
  mapProductSnapshot,
  sortProducts,
  type ProductInput,
  type Product,
} from "@/lib/products";

export async function getAllProducts(): Promise<Product[]> {
  if (!db) {
    return [];
  }

  const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));

  return sortProducts(
    snapshot.docs
      .map((documentSnapshot) => mapProductSnapshot(documentSnapshot))
      .filter((product): product is Product => Boolean(product))
  );
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!db) {
    return null;
  }

  const snapshot = await getDoc(doc(db, PRODUCTS_COLLECTION, id));

  return mapProductSnapshot(snapshot);
}

function getProductsCollection() {
  if (!db) {
    throw new Error("Product data is not available.");
  }

  return collection(db, PRODUCTS_COLLECTION);
}

export async function createProduct(input: ProductInput) {
  const productsCollection = getProductsCollection();

  return addDoc(productsCollection, {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateProduct(id: string, input: ProductInput) {
  if (!db) {
    throw new Error("Product data is not available.");
  }

  return updateDoc(doc(db, PRODUCTS_COLLECTION, id), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(id: string) {
  if (!db) {
    throw new Error("Product data is not available.");
  }

  return deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
}
