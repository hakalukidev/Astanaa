'use client';

import {
  Clock,
  Mail,
  MapPin,
  Phone
} from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/site-translations';

export default function ContactPage() {
  const { language } = useLanguage();
  const t = translations[language].contact;

  const phoneNumbers = [
    { label: '+88 01897914480', value: '+8801897914480' },
    { label: '+88 01897914481', value: '+8801897914481' },
    { label: '+88 01897914482', value: '+8801897914482' },
    { label: '+88 01897914483', value: '+8801897914483' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-slate-100">
      <div className="relative overflow-hidden bg-green-600 py-16 text-white lg:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.12),rgba(15,23,42,0.32))]" />
        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
              {t.heroTitle}
            </h1>
            <p className="text-base text-green-100 sm:text-lg lg:text-xl">
              {t.heroBody}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)]">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <section className="flex min-w-0 flex-col">
              <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-600">
                  {t.onlineBadge}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                  {t.onlineTitle}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                  {t.onlineBody}
                </p>
              </div>

              <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-green-600 p-3 text-white shadow-lg shadow-green-200">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{t.basedIn}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {t.basedInValue}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {t.supportHours}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {t.supportDays}
                  </p>
                  <p className="text-sm text-slate-600">{t.supportTime}</p>
                  <p className="mt-2 text-sm text-slate-600">{t.fridayClosed}</p>
                </div>
              </div>
            </section>

            <section className="flex h-full flex-col justify-between bg-gradient-to-br from-green-600 via-green-700 to-slate-900 p-6 text-white shadow-[inset_1px_0_0_rgba(255,255,255,0.08)] sm:p-8 lg:p-10">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-100">
                  {t.contactInfoBadge}
                </p>
                <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                  {t.connectTitle}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-green-100 sm:text-base">
                  {t.connectBody}
                </p>
              </div>

              <div className="mt-8 grid gap-4">
                <div
                  id="phone-numbers"
                  className="scroll-mt-28 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-white/15 p-3">
                      <Phone size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{t.phoneNumbers}</h3>
                      <div className="mt-2 flex flex-col gap-1 text-sm text-green-50">
                        {phoneNumbers.map((phoneNumber) => (
                          <a
                            key={phoneNumber.value}
                            href={`tel:${phoneNumber.value}`}
                            className="transition hover:text-white hover:underline"
                          >
                            {phoneNumber.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-white/15 p-3">
                      <Mail size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{t.emailAddress}</h3>
                      <div className="mt-2 flex flex-col gap-1 text-sm text-green-50">
                        <a href="mailto:info@astanaa.com" className="transition hover:text-white hover:underline">
                          info@astanaa.com
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-white/15 p-3">
                      <Clock size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{t.workingHours}</h3>
                      <p className="mt-2 text-sm text-green-50">
                        {t.workingHoursValue}
                      </p>
                      <p className="text-sm text-green-100">{t.fridayClosed}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
