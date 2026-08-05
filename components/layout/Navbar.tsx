"use client";

import { ChevronDown, ChevronRight, Menu, Search, Settings, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import ProductSearchBox from "@/components/layout/ProductSearchBox";
import { useCategoriesQuery } from "@/hooks/use-categories-query";
import { useProductsQuery } from "@/hooks/use-products-query";
import { getProductCategories } from "@/lib/products";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBrowseCategoriesOpen, setIsBrowseCategoriesOpen] = useState(false);
  const browseDropdownRef = useRef<HTMLDivElement>(null);
  const { data: products = [] } = useProductsQuery();
  const { data: managedCategories = [] } = useCategoriesQuery();
  const categoryOptions = useMemo(
    () =>
      managedCategories.length > 0
        ? managedCategories.map((category) => category.name)
        : getProductCategories(products),
    [managedCategories, products]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (browseDropdownRef.current && !browseDropdownRef.current.contains(event.target as Node)) {
        setIsBrowseCategoriesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="px-6 py-3">
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center justify-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/Mlogo.png"
              alt="Muaz Technology"
              width={60}
              height={35}
              className="object-contain"
              priority
            />
            <div className="flex flex-col ml-2">
              <span className="text-base font-bold text-blue-700 leading-tight">
                MUAZ
              </span>
              <span className="text-[7px] font-semibold text-gray-500 tracking-wider">
                TECHNOLOGY
              </span>
            </div>
          </Link>

        

          <div className="relative" ref={browseDropdownRef}>
            <button
              onClick={() => setIsBrowseCategoriesOpen(!isBrowseCategoriesOpen)}
              className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded text-sm font-semibold text-gray-700 transition whitespace-nowrap"
            >
              <Menu size={15} />
              BROWSE IN CATEGORIES
              <ChevronDown size={13} className={`transition-transform ${isBrowseCategoriesOpen ? "rotate-180" : ""}`} />
            </button>

            {isBrowseCategoriesOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-3 py-2 border-b border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Shop by Category
                  </h3>
                </div>
                <ul className="py-1">
                  <li>
                    <Link
                      href="/products"
                      className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                      onClick={() => setIsBrowseCategoriesOpen(false)}
                    >
                      <span>All Products</span>
                      <ChevronRight size={14} />
                    </Link>
                  </li>
                  {categoryOptions.map((category) => (
                    <li key={category}>
                      <Link
                        href={`/products?category=${encodeURIComponent(category)}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => setIsBrowseCategoriesOpen(false)}
                      >
                        {category}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="w-72">
            <ProductSearchBox products={products} />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex lg:hidden items-center justify-between">
          {/* Logo - Left for mobile */}
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/Mlogo.png"
              alt="Muaz Technology"
              width={50}
              height={30}
              className="object-contain"
              priority
            />
            <div className="flex flex-col ml-1">
              <span className="text-sm font-bold text-blue-700 leading-tight">
                MUAZ
              </span>
              <span className="text-[5px] font-semibold text-gray-500 tracking-wider">
                TECHNOLOGY
              </span>
            </div>
          </Link>

          {/* Mobile Icons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Search size={18} className="text-gray-600" />
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="lg:hidden mt-3">
            <ProductSearchBox
              products={products}
              onNavigate={() => setIsSearchOpen(false)}
            />
          </div>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-3 space-y-2">
            {/* Garage Equipments button */}
            <button className="w-full flex items-center justify-between gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded text-sm font-semibold text-gray-700 transition">
              <span className="flex items-center gap-2">
                <Settings size={16} className="text-blue-600" />
                GARAGE EQUIPMENT&apos;S
              </span>
              <ChevronDown size={14} />
            </button>

            <div>
              <button
                onClick={() => setIsBrowseCategoriesOpen(!isBrowseCategoriesOpen)}
                className="w-full flex items-center justify-between gap-2 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded text-sm font-semibold text-gray-700 transition"
              >
                <span className="flex items-center gap-2">
                  <Menu size={16} />
                  BROWSE IN CATEGORIES
                </span>
                <ChevronDown size={14} className={`transition-transform ${isBrowseCategoriesOpen ? "rotate-180" : ""}`} />
              </button>

              {isBrowseCategoriesOpen && (
                <div className="mt-2 ml-4 space-y-1 border-l-2 border-blue-200 pl-3">
                  <Link
                    href="/products"
                    className="block py-2 text-sm text-gray-600 hover:text-blue-600"
                    onClick={() => {
                      setIsBrowseCategoriesOpen(false);
                      setIsMenuOpen(false);
                    }}
                  >
                    All Products
                  </Link>
                  {categoryOptions.map((category) => (
                    <Link
                      key={category}
                      href={`/products?category=${encodeURIComponent(category)}`}
                      className="block py-2 text-sm text-gray-600 hover:text-blue-600"
                      onClick={() => {
                        setIsBrowseCategoriesOpen(false);
                        setIsMenuOpen(false);
                      }}
                    >
                      {category}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom navigation links */}
            <div className="pt-2 border-t border-gray-200">
              <Link
                href="/"
                className="block py-2 text-sm text-gray-600 hover:text-blue-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/products"
                className="block py-2 text-sm text-gray-600 hover:text-blue-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                href="/about"
                className="block py-2 text-sm text-gray-600 hover:text-blue-600"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/contact"
                className="block py-2 text-sm text-gray-600 hover:text-blue-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <Link
                href="/blog"
                className="block py-2 text-sm text-gray-600 hover:text-blue-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Blog
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
