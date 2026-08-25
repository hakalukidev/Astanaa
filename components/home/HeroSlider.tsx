'use client';

import { getAllSlides } from "@/lib/slide-service";
import { type Slide } from "@/lib/slides";
import { useEffect, useState } from 'react';

export default function HeroSlider() {
  // Starts empty (not some hardcoded placeholder) — the section renders
  // nothing until real slides arrive, so there's no flash of stale/fallback
  // images on reload before Firestore's actual slides show up.
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    async function loadSlides() {
      try {
        const nextSlides = await getAllSlides();
        const activeSlides = nextSlides.filter((slide) => slide.isActive && slide.image);
        setSlides(activeSlides);
      } catch {
        setSlides([]);
      }
    }

    void loadSlides();
  }, []);

  useEffect(() => {
    if (slides.length === 0) {
      return;
    }

    const t = setInterval(() => setCurrent((p) => (p + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides]);

  useEffect(() => {
    if (current >= slides.length) {
      setCurrent(0);
    }
  }, [current, slides.length]);

  const activeSlide = slides[current];

  if (!activeSlide) {
    return null;
  }

  return (
    <section className={`${activeSlide.bg} overflow-hidden`}>
      <div className="flex flex-col md:flex-row">
        <div className="h-1.5 w-full shrink-0 bg-blue-600 md:h-auto md:w-2" />

        <div className="order-2 w-full md:order-3 md:flex-1">
          {/* Matches the wide banner-style images admins upload (3637x1022,
           * see the upload hint in AdminSlidesPage) so object-cover has
           * nothing to crop — the box's shape already matches the image's. */}
          <div className="relative aspect-[3637/1022] min-h-[90px] overflow-hidden">
            <img
              src={activeSlide.image}
              alt={activeSlide.title}
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-x-0 bottom-3 z-20 flex items-center justify-center gap-2">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === current ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="order-3 flex w-full flex-col justify-center px-4 py-6 sm:px-6 sm:py-8 md:order-2 md:w-72 md:px-10 md:py-12 lg:w-80">
          <h2 className="text-base font-black leading-tight text-gray-900 sm:text-lg">
            {activeSlide.title}
          </h2>
        </div>
      </div>
    </section>
  );
}
