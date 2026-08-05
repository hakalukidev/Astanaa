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
  mapSlideSnapshot,
  SLIDES_COLLECTION,
  sortSlides,
  type Slide,
  type SlideInput,
} from "@/lib/slides";

export async function getAllSlides(): Promise<Slide[]> {
  if (!db) {
    return [];
  }

  const snapshot = await getDocs(collection(db, SLIDES_COLLECTION));

  return sortSlides(
    snapshot.docs
      .map((documentSnapshot) => mapSlideSnapshot(documentSnapshot))
      .filter((slide): slide is Slide => Boolean(slide))
  );
}

function getSlidesCollection() {
  if (!db) {
    throw new Error("Slide data is not available.");
  }

  return collection(db, SLIDES_COLLECTION);
}

export async function createSlide(input: SlideInput) {
  const slidesCollection = getSlidesCollection();

  return addDoc(slidesCollection, {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateSlide(id: string, input: SlideInput) {
  if (!db) {
    throw new Error("Slide data is not available.");
  }

  return updateDoc(doc(db, SLIDES_COLLECTION, id), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSlide(id: string) {
  if (!db) {
    throw new Error("Slide data is not available.");
  }

  return deleteDoc(doc(db, SLIDES_COLLECTION, id));
}
