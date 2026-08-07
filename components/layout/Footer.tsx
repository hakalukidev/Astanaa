'use client';

import { Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { FaFacebook, FaYoutube } from 'react-icons/fa';

import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/site-translations';

export default function Footer() {
  const { language } = useLanguage();
  const t = translations[language].footer;

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          
          {/* About Section */}
          <div className="text-center sm:text-left">
            <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Astanaa.com</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t.aboutBody}
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-center sm:text-left">
            <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">{t.quickLinks}</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-400 hover:text-white text-sm transition">{t.home}</Link></li>
              <li><Link href="/listings" className="text-gray-400 hover:text-white text-sm transition">{t.browseListings}</Link></li>
              <li><Link href="/post-ad" className="text-gray-400 hover:text-white text-sm transition">{t.postAnAd}</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-white text-sm transition">{t.aboutUs}</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white text-sm transition">{t.contact}</Link></li>
            </ul>
          </div>

          {/* Contact Info - Combined phone number format */}
          <div className="text-center sm:text-left">
            <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">{t.contactInfo}</h3>
            <div className="space-y-2">
              <p className="text-gray-400 text-sm flex items-center justify-center sm:justify-start gap-2">
                <MapPin size={14} className="shrink-0" />
                <span>Dhaka, Bangladesh</span>
              </p>
              <p className="text-gray-400 text-sm flex items-center justify-center sm:justify-start gap-2">
                <Phone size={14} className="shrink-0" />
                <span>+88 01897914480-83</span>
              </p>
              <p className="text-gray-400 text-sm flex items-center justify-center sm:justify-start gap-2">
                <Mail size={14} className="shrink-0" />
                <a
                  href="mailto:info@astanaa.com"
                  className="transition hover:text-white"
                >
                  info@astanaa.com
                </a>
              </p>
            </div>
          </div>

          {/* Social Media */}
          <div className="text-center sm:text-left">
            <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">{t.followUs}</h3>
            <div className="flex gap-3 justify-center sm:justify-start">
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 p-2 rounded-full hover:bg-blue-600 transition-colors duration-300"
                aria-label="Facebook"
              >
                <FaFacebook size={18} className="md:w-5 md:h-5" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 p-2 rounded-full hover:bg-red-600 transition-colors duration-300"
                aria-label="YouTube"
              >
                <FaYoutube size={18} className="md:w-5 md:h-5" />
              </a>
            </div>
            <p className="text-gray-500 text-xs mt-3">{t.socialCta}</p>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left">
            <p className="text-gray-400 text-xs md:text-sm">
              &copy; {new Date().getFullYear()} Astanaa.com. {t.rightsReserved}
            </p>
            <p className="text-gray-500 text-xs">
              {t.developedBy} <a href="https://www.hakaluki.dev/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition">hakaluki.dev</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
