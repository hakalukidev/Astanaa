import {
  Building2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-green-900 to-green-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            YOUR TRUSTED APARTMENT MARKETPLACE
          </h1>
          <p className="text-xl md:text-2xl mb-6">
            BUY, SELL & RENT APARTMENTS ACROSS BANGLADESH
          </p>
          <p className="text-lg max-w-3xl mx-auto">
            Post your apartment for sale or rent in minutes, and connect
            directly with buyers and renters — no middleman required.
          </p>
        </div>
      </section>

      {/* Company Overview Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-gray-800">
                About Astanaa.com
              </h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Astanaa.com is an online marketplace where anyone can post an
                apartment for sale or rent, and buyers can browse, chat, and
                connect directly with sellers.
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                We built Astanaa.com to make finding and posting a home
                simple — a clean listing flow, real-time chat with sellers,
                and optional boosted visibility to help your ad get seen
                faster.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Whether you&apos;re looking for your next apartment or
                listing your own for sale or rent, Astanaa.com connects you
                directly with the right people.
              </p>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="flex items-center gap-3">
                  <Sparkles className="text-green-600" size={24} />
                  <span className="text-gray-700 font-medium">Free to Post</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="text-green-600" size={24} />
                  <span className="text-gray-700 font-medium">Direct Buyer-Seller Chat</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-green-600" size={24} />
                  <span className="text-gray-700 font-medium">No Middleman</span>
                </div>
                <div className="flex items-center gap-3">
                  <Zap className="text-green-600" size={24} />
                  <span className="text-gray-700 font-medium">Boost for More Views</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-gray-100 rounded-lg p-8">
              <div className="text-center">
                <div className="text-6xl mb-4">🏢</div>
                <h3 className="text-2xl font-bold text-green-800 mb-4">Our Mission</h3>
                <p className="text-gray-600">
                  To make posting and finding an apartment in Bangladesh as
                  simple as a few taps — no brokers, no hassle.
                </p>
                <div className="mt-6 pt-6 border-t border-gray-300">
                  <h3 className="text-2xl font-bold text-green-800 mb-4">Our Vision</h3>
                  <p className="text-gray-600">
                    To become Bangladesh&apos;s most trusted place to buy,
                    sell, and rent apartments online.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              HOW ASTANAA.COM WORKS
            </h2>
            <p className="text-xl text-gray-600">
              Post an ad, get discovered, and connect directly
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-600 p-3 rounded-full">
                  <Building2 className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Post Your Listing</h3>
              </div>
              <p className="ml-1 text-sm text-gray-600">
                Add photos, price, and details of your apartment for sale or
                rent in just a few minutes.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-600 p-3 rounded-full">
                  <Zap className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Boost for Visibility</h3>
              </div>
              <p className="ml-1 text-sm text-gray-600">
                Optionally boost your post to appear at the top of search
                results and get seen by more buyers.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-600 p-3 rounded-full">
                  <MessageCircle className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Chat & Close the Deal</h3>
              </div>
              <p className="ml-1 text-sm text-gray-600">
                Interested buyers can message you directly through the
                platform to ask questions and negotiate.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Ready to post your apartment?
          </h2>
          <Link
            href="/post-ad"
            className="inline-flex items-center justify-center rounded-md bg-green-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            Post your ad now
          </Link>
        </div>
      </section>
    </main>
  );
}
