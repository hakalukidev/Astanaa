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

export function sortSlides(slides: Slide[]) {
  return [...slides].sort((left, right) => {
    if (left.order === right.order) {
      return left.title.localeCompare(right.title);
    }

    return left.order - right.order;
  });
}
