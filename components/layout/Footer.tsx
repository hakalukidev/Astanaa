'use client';

import { Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { FaFacebook, FaYoutube } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          
          {/* About Section */}
          <div className="text-center sm:text-left">
            <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Muaz Technology</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Trusted supplier of industrial machinery and automobile equipment in Bangladesh
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-center sm:text-left">
            <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-400 hover:text-white text-sm transition">Home</Link></li>
              <li><Link href="/products" className="text-gray-400 hover:text-white text-sm transition">Products</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-white text-sm transition">About Us</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white text-sm transition">Contact</Link></li>
            </ul>
          </div>

          {/* Contact Info - Combined phone number format */}
          <div className="text-center sm:text-left">
            <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Contact Info</h3>
            <div className="space-y-2">
              <p className="text-gray-400 text-sm flex items-center justify-center sm:justify-start gap-2">
                <MapPin size={14} className="shrink-0" />
                <span>92, Wise Market, Nawabpur Road, Dhaka-1100</span>
              </p>
              <p className="text-gray-400 text-sm flex items-center justify-center sm:justify-start gap-2">
                <Phone size={14} className="shrink-0" />
                <span>+88 01897914480-83</span>
              </p>
              <p className="text-gray-400 text-sm flex items-center justify-center sm:justify-start gap-2">
                <Mail size={14} className="shrink-0" />
                <a
                  href="mailto:info@muazbd.com"
                  className="transition hover:text-white"
                >
                  info@muazbd.com
                </a>
              </p>
            </div>
          </div>

          {/* Social Media */}
          <div className="text-center sm:text-left">
            <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Follow Us</h3>
            <div className="flex gap-3 justify-center sm:justify-start">
              <a 
                href="https://facebook.com/muaztechnology" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-gray-800 p-2 rounded-full hover:bg-blue-600 transition-colors duration-300"
                aria-label="Facebook"
              >
                <FaFacebook size={18} className="md:w-5 md:h-5" />
              </a>
              <a 
                href="https://youtube.com/@muaztechnology3326" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-gray-800 p-2 rounded-full hover:bg-red-600 transition-colors duration-300"
                aria-label="YouTube"
              >
                <FaYoutube size={18} className="md:w-5 md:h-5" />
              </a>
            </div>
            <p className="text-gray-500 text-xs mt-3">Connect with us on social media</p>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left">
            <p className="text-gray-400 text-xs md:text-sm">
              &copy; {new Date().getFullYear()} Muaz Technology. All rights reserved.
            </p>
            <p className="text-gray-500 text-xs">
              Developed by <a href="https://www.hakaluki.dev/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition">hakaluki.dev</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
