'use client';

import { allProducts } from '@/lib/home-data';
import { useState } from 'react';
import ProductCard from '../ui/productCard';

export default function MustHaveProducts() {
  const [activeTab, setActiveTab] = useState<'top' | 'featured' | 'all'>('top');

  const filtered = allProducts.filter((p) =>
    activeTab === 'all' ? true : p.tab === activeTab
  );

  return (
    <section className="py-14 container mx-auto px-4">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-gray-900">Must-have Products and more</h2>
        <div className="flex items-center gap-6">
          {(['top', 'featured', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-bold tracking-wide transition ${
                activeTab === tab ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab === 'top' ? 'TOP PRODUCTS' : tab === 'featured' ? 'FEATURED' : 'ALL OTHERS'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {filtered.map((product) => (
          <ProductCard key={product.id} id={product.id} name={product.name} image={product.image} />
        ))}
      </div>
    </section>
  );
}