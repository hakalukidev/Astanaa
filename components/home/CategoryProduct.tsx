'use client';

import { categories } from '@/lib/home-data';
import { ChevronLeft, ChevronRight, Paintbrush, Scan, Settings, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
import ProductCard from '../ui/productCard';

const iconMap = {
  wrench: <Wrench size={22} className="text-blue-600" />,
  scan: <Scan size={22} className="text-blue-600" />,
  settings: <Settings size={22} className="text-blue-600" />,
  paintbrush: <Paintbrush size={22} className="text-blue-600" />,
};

export default function CategoryProducts() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [sliderStart, setSliderStart] = useState(0);
  const active = categories[activeIdx];

  const prevSlide = () => setSliderStart((p) => Math.max(0, p - 1));
  const nextSlide = () => setSliderStart((p) => Math.min(active.products.length - 4, p + 1));
  const visible = active.products.slice(sliderStart, sliderStart + 4);

  useEffect(() => setSliderStart(0), [activeIdx]);

  return (
    <section className="py-14 container mx-auto px-4">
      <div className="flex gap-10">
        {/* Left: category list */}
        <div className="w-64 shrink-0">
          <h3 className="text-lg font-black text-gray-900 mb-1">Upgrade your workshop?</h3>
          <p className="text-gray-500 text-sm mb-6">Everything you need for repairs in one place</p>
          <ul className="space-y-3">
            {categories.map((cat, i) => (
              <li key={cat.id}>
                <button
                  onClick={() => setActiveIdx(i)}
                  className={`flex items-center gap-3 w-full text-left text-sm font-bold tracking-wide transition py-1 ${
                    activeIdx === i ? 'text-blue-700' : 'text-gray-500 hover:text-blue-600'
                  }`}
                >
                  {iconMap[cat.icon as keyof typeof iconMap]}
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: product slider */}
        <div className="flex-1 relative">
          <div className="grid grid-cols-4 gap-4">
            {visible.map((product) => (
              <ProductCard key={product.id} id={product.id} name={product.name} image={product.image} />
            ))}
          </div>
          {/* Arrows */}
          {sliderStart > 0 && (
            <button
              onClick={prevSlide}
              className="absolute -left-5 top-1/2 -translate-y-1/2 w-9 h-9 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow hover:bg-gray-50 z-10"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          {sliderStart + 4 < active.products.length && (
            <button
              onClick={nextSlide}
              className="absolute -right-5 top-1/2 -translate-y-1/2 w-9 h-9 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow hover:bg-gray-50 z-10"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}