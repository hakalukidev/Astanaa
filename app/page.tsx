import HeroSlider from "@/components/home/HeroSlider";
import LatestListings from "@/components/home/LatestListings";
import { getCachedListings } from "@/lib/listing-cache";

export default async function HomePage() {
  const listings = await getCachedListings();

  return (
    <main className="bg-white">
      <HeroSlider />
      <LatestListings listings={listings} />
    </main>
  );
}
