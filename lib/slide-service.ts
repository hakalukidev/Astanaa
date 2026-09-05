import { sortSlides, type Slide, type SlideInput } from "@/lib/slides";

export async function getAllSlides(): Promise<Slide[]> {
  try {
    const response = await fetch("/api/slides");
    if (!response.ok) return [];
    const data = (await response.json()) as { slides: Slide[] };
    return sortSlides(data.slides);
  } catch {
    return [];
  }
}

export async function createSlide(input: SlideInput): Promise<Slide> {
  const response = await fetch("/api/slides", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Could not create slide.");
  }

  const data = (await response.json()) as { slide: Slide };
  return data.slide;
}

export async function updateSlide(id: string, input: SlideInput) {
  await fetch(`/api/slides/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function deleteSlide(id: string) {
  await fetch(`/api/slides/${id}`, { method: "DELETE" });
}
