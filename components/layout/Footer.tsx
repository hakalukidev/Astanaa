'use client';

import { FileText, ListChecks, Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FaFacebook, FaInstagram, FaTiktok, FaTwitter, FaYoutube } from 'react-icons/fa';

import { useLanguage } from '@/contexts/LanguageContext';
import { DEFAULT_FOOTER_SETTINGS, getFooterSettings, type FooterSettings } from '@/lib/footer-settings';
import { translations } from '@/lib/site-translations';

const SOCIAL_LINKS: {
  key: keyof Pick<
    FooterSettings,
    'facebookUrl' | 'instagramUrl' | 'twitterUrl' | 'youtubeUrl' | 'tiktokUrl'
  >;
  label: string;
  Icon: typeof FaFacebook;
  hoverClass: string;
}[] = [
  { key: 'facebookUrl', label: 'Facebook', Icon: FaFacebook, hoverClass: 'hover:bg-blue-600' },
  { key: 'instagramUrl', label: 'Instagram', Icon: FaInstagram, hoverClass: 'hover:bg-pink-600' },
  { key: 'twitterUrl', label: 'Twitter', Icon: FaTwitter, hoverClass: 'hover:bg-sky-500' },
  { key: 'youtubeUrl', label: 'YouTube', Icon: FaYoutube, hoverClass: 'hover:bg-red-600' },
  { key: 'tiktokUrl', label: 'TikTok', Icon: FaTiktok, hoverClass: 'hover:bg-black' },
];

export default function Footer() {
  const { language } = useLanguage();
  const t = translations[language].footer;
  const [settings, setSettings] = useState<FooterSettings>(DEFAULT_FOOTER_SETTINGS);

  useEffect(() => {
    let cancelled = false;

    getFooterSettings()
      .then((next) => {
        if (!cancelled) {
          setSettings(next);
        }
      })
      .catch(() => {
        // Keep the default settings already in state.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const aboutText = language === 'bn' ? settings.aboutTextBn : settings.aboutTextEn;
  const activeSocialLinks = SOCIAL_LINKS.filter((link) => settings[link.key].trim());

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">

          {/* About Section */}
          <div className="text-center sm:text-left">
            <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Astanaa.com</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {aboutText}
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
                <span>{settings.address}</span>
              </p>
              <p className="text-gray-400 text-sm flex items-center justify-center sm:justify-start gap-2">
                <Phone size={14} className="shrink-0" />
                <span>{settings.phone}</span>
              </p>
              <p className="text-gray-400 text-sm flex items-center justify-center sm:justify-start gap-2">
                <Mail size={14} className="shrink-0" />
                <a
                  href={`mailto:${settings.email}`}
                  className="transition hover:text-white"
                >
                  {settings.email}
                </a>
              </p>
            </div>
          </div>

          {/* Social Media */}
          <div className="text-center sm:text-left">
            <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">{t.followUs}</h3>
            {activeSocialLinks.length > 0 && (
              <div className="flex gap-3 justify-center sm:justify-start">
                {activeSocialLinks.map(({ key, label, Icon, hoverClass }) => (
                  <a
                    key={key}
                    href={settings[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`bg-gray-800 p-2 rounded-full ${hoverClass} transition-colors duration-300`}
                    aria-label={label}
                  >
                    <Icon size={18} className="md:w-5 md:h-5" />
                  </a>
                ))}
              </div>
            )}
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

      {/* Terms & Rules signboard — always visible, at the very bottom */}
      <div className="flex flex-col divide-y divide-amber-500/30 bg-amber-400 sm:flex-row sm:divide-x sm:divide-y-0">
        <Link
          href="/terms"
          className="flex flex-1 items-center justify-center gap-2 px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-gray-900 transition-colors hover:bg-amber-300 md:text-sm"
        >
          <FileText size={16} className="shrink-0" />
          {t.termsSignboard}
        </Link>
        <Link
          href="/rules"
          className="flex flex-1 items-center justify-center gap-2 px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-gray-900 transition-colors hover:bg-amber-300 md:text-sm"
        >
          <ListChecks size={16} className="shrink-0" />
          {t.rulesSignboard}
        </Link>
      </div>
    </footer>
  );
}
