'use client';

import { fallbackSlides } from "@/lib/home-data";
import { getAllSlides } from "@/lib/slide-service";
import { type Slide } from "@/lib/slides";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HeroSlider() {
  const [slides, setSlides] = useState<Slide[]>(fallbackSlides);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    async function loadSlides() {
      try {
        const nextSlides = await getAllSlides();
        const activeSlides = nextSlides.filter((slide) => slide.isActive && slide.image);

        if (activeSlides.length > 0) {
          setSlides(activeSlides);
        }
      } catch {
        setSlides(fallbackSlides);
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

  const prev = () => setCurrent((p) => (p - 1 + slides.length) % slides.length);
  const next = () => setCurrent((p) => (p + 1) % slides.length);
  const activeSlide = slides[current];

  if (!activeSlide) {
    return null;
  }

  return (
    <section className={`${activeSlide.bg} overflow-hidden`}>
      <div className="flex flex-col md:min-h-[480px] md:flex-row">
        <div className="h-1.5 w-full shrink-0 bg-blue-600 md:h-auto md:w-2" />

        <div className="order-2 w-full md:order-3 md:flex-1">
          <div className="relative aspect-[16/11] min-h-[260px] overflow-hidden sm:aspect-[5/3] md:h-full md:min-h-[480px] md:aspect-auto">
            <img
              src={activeSlide.image}
              alt={activeSlide.title}
              className="absolute inset-0 h-full w-full object-cover"
            />

            <button
              onClick={prev}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 shadow transition hover:bg-white"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={next}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 shadow transition hover:bg-white"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="order-3 flex w-full flex-col justify-center px-4 py-6 sm:px-6 sm:py-8 md:order-2 md:w-72 md:px-10 md:py-12 lg:w-80">
          <span className="mb-3 text-sm font-semibold text-blue-600">{activeSlide.tag}</span>
          <h2 className="text-2xl font-black leading-tight text-gray-900 sm:text-3xl">
            {activeSlide.title}
          </h2>
          <Link
            href={activeSlide.ctaHref}
            className="mt-5 inline-flex text-xs font-bold tracking-widest text-gray-900 underline underline-offset-4 transition hover:text-blue-600"
          >
            {activeSlide.cta}
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 px-4 py-4 sm:px-6">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="flex items-center gap-1.5"
          >
            <span className={`text-xs font-bold ${i === current ? 'text-gray-900' : 'text-gray-400'}`}>
              0{i + 1}
            </span>
            <span
              className={`block h-0.5 transition-all duration-300 ${i === current ? 'w-10 bg-blue-600' : 'w-5 bg-gray-400'}`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
