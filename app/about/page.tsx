import {
  Award,
  Car,
  CheckCircle,
  Gauge,
  Mail,
  MapPin,
  Phone,
  Settings,
  Shield,
  Sparkles,
  Truck,
  Users,
  Waves,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';

import { getAllCategories } from '@/lib/category-service';

const showcaseIcons = [Wrench, Car, Gauge, Waves] as const;

export default async function AboutPage() {
  const categories = await getAllCategories();
  const featuredCategories = categories.slice(0, showcaseIcons.length);

  return (
    <main className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-900 to-blue-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            YOUR TRUSTED PARTNER
          </h1>
          <p className="text-xl md:text-2xl mb-6">
            FOR INDUSTRIAL MACHINERY AND AUTOMOBILE EQUIPMENT
          </p>
          <p className="text-lg max-w-3xl mx-auto">
            Providing top-quality solutions to drive your business forward with reliability and efficiency.
          </p>
        </div>
      </section>

      {/* Company Overview Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-gray-800">
                About Muaz Technology
              </h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Muaz Technology is a trusted industrial machinery and automobile equipment supplier in Bangladesh.
              </p>
              <p className="text-gray-600 mb-4 leading-relaxed">
                We are providing high-quality, reliable, and innovative machinery to a wide range of industries. 
                With over 8 years of experience, we are committed to delivering cutting-edge technology, 
                exceptional customer service, and tailored solutions to help you enhance productivity and efficiency.
              </p>
              <p className="text-gray-600 leading-relaxed">
                We offer heavy-duty industrial machineries and automobile workshop equipment, also we provide 
                industrial machineries services.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="flex items-center gap-3">
                  <Award className="text-blue-600" size={24} />
                  <span className="text-gray-700 font-medium">8+ Years Experience</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="text-blue-600" size={24} />
                  <span className="text-gray-700 font-medium">Trusted Supplier</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="text-blue-600" size={24} />
                  <span className="text-gray-700 font-medium">Quality Guaranteed</span>
                </div>
                <div className="flex items-center gap-3">
                  <Truck className="text-blue-600" size={24} />
                  <span className="text-gray-700 font-medium">Timely Delivery</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-gray-100 rounded-lg p-8">
              <div className="text-center">
                <div className="text-6xl mb-4">🏭</div>
                <h3 className="text-2xl font-bold text-blue-800 mb-4">Our Mission</h3>
                <p className="text-gray-600">
                  To provide top-quality industrial solutions that drive businesses forward with reliability and efficiency.
                </p>
                <div className="mt-6 pt-6 border-t border-gray-300">
                  <h3 className="text-2xl font-bold text-blue-800 mb-4">Our Vision</h3>
                  <p className="text-gray-600">
                  To become Bangladesh's most trusted partner for industrial machinery and automobile equipment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              WE TAKE PRIDE IN BEING BANGLADESH'S TRUSTED SUPPLIER
            </h2>
            <p className="text-xl text-gray-600">
              OF INDUSTRIAL MACHINERY AND AUTOMOBILE EQUIPMENT
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Automotive Diagnosis & Testing Equipment */}
            <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-600 p-3 rounded-full">
                  <Car className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Automotive Diagnosis & Testing Equipment</h3>
              </div>
              <ul className="space-y-2 ml-12">
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span>Car Scanning Tool</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span>Motorcycle Scanning Tool</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span>Inspection & Testing Equipment</span>
                </li>
              </ul>
            </div>

            {/* Automotive Workshop Equipment */}
            <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-600 p-3 rounded-full">
                  <Settings className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Automotive Workshop Equipment</h3>
              </div>
              <ul className="space-y-2 ml-12">
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span>Professional Hand Tools & Power Tools</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span>Industrial Equipment</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span>Motorcycle Accessories</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Products Showcase */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Premium Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredCategories.map((category, index) => (
              <div
                key={category.id}
                className="text-center p-4 border rounded-lg hover:shadow-lg transition"
              >
                <div className="mb-3 flex justify-center">
                  {(() => {
                    const Icon = showcaseIcons[index] ?? Sparkles;

                    return <Icon size={40} strokeWidth={1.8} className="text-black" />;
                  })()}
                </div>
                <h3 className="font-semibold text-gray-800">{category.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

   
    </main>
  );
}
