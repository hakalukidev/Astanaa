'use client';

import {
  Clock,
  Mail,
  MapPin,
  Phone
} from 'lucide-react';

export default function ContactPage() {
  const mapUrl = 'https://www.google.com/maps/place/Muaz+Technology/@23.719186,90.4094433,17z/data=!4m7!3m6!1s0x3755b93eeb19d727:0xb774586735f37c8b!4b1!8m2!3d23.7184837!4d90.4115032!16s%2Fg%2F11xlnxv_ts?hl=en&entry=ttu&g_ep=EgoyMDI2MDYxMC4wIKXMDSoASAFQAw%3D%3D';
  const phoneNumbers = [
    { label: '+88 01897914480', value: '+8801897914480' },
    { label: '+88 01897914481', value: '+8801897914481' },
    { label: '+88 01897914482', value: '+8801897914482' },
    { label: '+88 01897914483', value: '+8801897914483' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-slate-100">
      <div className="relative overflow-hidden bg-blue-600 py-16 text-white lg:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.12),rgba(15,23,42,0.32))]" />
        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
              Contact Us
            </h1>
            <p className="text-base text-blue-100 sm:text-lg lg:text-xl">
              Get in touch with us for product details, pricing, delivery support,
              and in-store assistance.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)]">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <section className="flex min-w-0 flex-col">
              <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                  Visit Our Office
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                  Location and store details in one place
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                  Drop by our Nawabpur office to explore workshop equipment,
                  discuss your requirements, and get direct support from our
                  team.
                </p>
              </div>

              <div className="flex flex-1 flex-col lg:flex-row">
                <div className="flex w-full flex-col justify-between bg-slate-50 p-6 sm:p-8 lg:max-w-sm">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="rounded-2xl bg-blue-600 p-3 text-white shadow-lg shadow-blue-200">
                        <MapPin size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Our Address</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                          Muaz Technology, 92 Wise Market,
                          <br />
                          Nawabpur, Dhaka-1100
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Business Hours
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-900">
                        Saturday - Thursday
                      </p>
                      <p className="text-sm text-slate-600">9:00 AM - 8:00 PM</p>
                      <p className="mt-2 text-sm text-slate-600">Friday: Closed</p>
                    </div>
                  </div>

                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    Open in Google Maps
                  </a>
                </div>

                <div className="h-80 w-full sm:h-96 lg:h-auto">
                  <iframe
                    src="https://www.google.com/maps?q=23.7184837,90.4115032&z=17&output=embed"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="h-full w-full"
                    title="Muaz Technology - Nawabpur, Dhaka"
                  ></iframe>
                </div>
              </div>
            </section>

            <section className="flex h-full flex-col justify-between bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 p-6 text-white shadow-[inset_1px_0_0_rgba(255,255,255,0.08)] sm:p-8 lg:p-10">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">
                  Contact Info
                </p>
                <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                  Let&apos;s Connect
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-blue-100 sm:text-base">
                  Call, email, or message us for equipment details, pricing, and
                  delivery support.
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
                      <h3 className="text-lg font-semibold">Phone Numbers</h3>
                      <div className="mt-2 flex flex-col gap-1 text-sm text-blue-50">
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
                      <h3 className="text-lg font-semibold">Email Address</h3>
                      <div className="mt-2 flex flex-col gap-1 text-sm text-blue-50">
                        <a href="mailto:info@muazbd.com" className="transition hover:text-white hover:underline">
                          info@muazbd.com
                        </a>
                        <a href="mailto:muaztech.bd@gmail.com" className="transition hover:text-white hover:underline">
                          muaztech.bd@gmail.com
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
                      <h3 className="text-lg font-semibold">Working Hours</h3>
                      <p className="mt-2 text-sm text-blue-50">
                        Saturday - Thursday: 9:00 AM - 8:00 PM
                      </p>
                      <p className="text-sm text-blue-100">Friday: Closed</p>
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
