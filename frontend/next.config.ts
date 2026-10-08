import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Seed listing photos are hotlinked from Unsplash (Unsplash License). The URLs carry
    // sizing query params, so `search` is left unset (any query string allowed).
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com", port: "", pathname: "/photo-*" }],
  },
};

export default nextConfig;
