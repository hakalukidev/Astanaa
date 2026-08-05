import Link from 'next/link';

export default function VideoSection() {
  return (
    <section className="py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
          <div className="w-full overflow-hidden rounded-2xl shadow-lg lg:w-1/2 lg:shrink-0">
            <div className="aspect-video w-full">
              <iframe
                className="h-full w-full"
                src="https://www.youtube.com/embed/_vH-xc1LMVk?si=3UDWdLM899VHPyT4"
                title="Muaz Technology - Garage Equipment Supplier Bangladesh"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>

          <div className="w-full lg:flex-1">
            <span className="inline-block border border-blue-600 px-3 py-1 text-xs font-bold tracking-widest text-blue-600">
              Upgrade your workshop performance
            </span>
            <h2 className="mt-4 max-w-2xl text-3xl font-black leading-snug text-gray-900 sm:text-4xl">
              Need top-quality garage equipment and expert installation?
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600 sm:text-base">
              Muaz Technology has you covered! We supply, install, and provide training on a wide
              range of garage equipment. With our skilled team and commitment to customer
              satisfaction, we ensure that your garage is equipped with the best tools and that
              your staff is fully trained to use them efficiently. Whether you&apos;re upgrading or
              starting from scratch,
            </p>
             {/* 🔥 Fixed: Proper button group with flex and gap */}
            <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
              <Link
                href="/products"
                className="inline-flex items-center justify-center bg-blue-700 px-5 py-3 text-xs sm:text-sm font-bold tracking-wide text-white transition hover:bg-blue-800 sm:px-6"
              >
                GARAGE EQUIPMENTS
              </Link>
              </div>
          </div>
        </div>
      </div>
    </section>
  );
}
