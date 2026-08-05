import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["firebasestorage.googleapis.com", "res.cloudinary.com","images.unsplash.com"],
  },
};

export default nextConfig;
