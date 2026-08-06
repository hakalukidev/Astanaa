import BrandHeadline from "@/components/home/BrandHeadline";
import HeroSlider from "@/components/home/HeroSlider";
import LatestListings from "@/components/home/LatestListings";
import ListingSearchExplorer from "@/components/home/ListingSearchExplorer";
import { getAllListings } from "@/lib/listing-service";

export default async function HomePage() {
  const listings = await getAllListings();

  return (
    <main className="bg-white">
      <HeroSlider />
      <ListingSearchExplorer />
      <BrandHeadline />
      <LatestListings listings={listings} />
    </main>
  );
}
