import type { DocumentData, DocumentSnapshot, QueryDocumentSnapshot, Timestamp } from "firebase/firestore";

export const SLIDES_COLLECTION = "slides";

export type Slide = {
  id: string;
  title: string;
  image: string;
  imagePublicId: string;
  order: number;
  isActive: boolean;
  tag: string;
  cta: string;
  ctaHref: string;
  bg: string;
  createdAtMs: number | null;
  updatedAtMs: number | null;
};

export type SlideInput = Omit<Slide, "id" | "createdAtMs" | "updatedAtMs">;

type SlideSnapshot =
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

export function mapSlideSnapshot(snapshot: SlideSnapshot): Slide | null {
  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data() ?? {};

  return {
    id: snapshot.id,
    title: String(data.title ?? ""),
    image: String(data.image ?? ""),
    imagePublicId: String(data.imagePublicId ?? ""),
    order: Number(data.order ?? 0),
    isActive: Boolean(data.isActive ?? true),
    tag: String(data.tag ?? "Featured"),
    cta: String(data.cta ?? "VIEW PRODUCTS"),
    ctaHref: String(data.ctaHref ?? "/products"),
    bg: String(data.bg ?? "bg-slate-100"),
    createdAtMs: getTimestampMs(data.createdAt),
    updatedAtMs: getTimestampMs(data.updatedAt),
  };
}

export function sortSlides(slides: Slide[]) {
  return [...slides].sort((left, right) => {
    if (left.order === right.order) {
      return left.title.localeCompare(right.title);
    }

    return left.order - right.order;
  });
}
