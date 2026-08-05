'use client';

import Link from 'next/link';
import { useState } from 'react';

interface ProductCardProps {
  id: number;
  name: string;
  image: string;
}

export default function ProductCard({ id, name, image }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  
  return (
    <div
      className="border border-gray-200 rounded group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[1/1.08] overflow-hidden bg-gray-50 rounded-t">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {hovered && (
          <div className="absolute inset-x-0 bottom-0">
            <Link
              href={`/product/${id}`}
              className="block bg-blue-600 text-white text-center text-xs font-bold py-2 hover:bg-blue-700 transition"
            >
              READ MORE
            </Link>
          </div>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-xs text-gray-800 leading-snug line-clamp-2">{name}</p>
      </div>
    </div>
  );
}
