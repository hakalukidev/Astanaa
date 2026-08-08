import HeroSlider from "@/components/home/HeroSlider";
import LatestListings from "@/components/home/LatestListings";
import { getAllListings } from "@/lib/listing-service";

export default async function HomePage() {
  const listings = await getAllListings();

  return (
    <main className="bg-white">
      <HeroSlider />
      <LatestListings listings={listings} />
    </main>
  );
}
