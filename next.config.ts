import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // Typové chyby nesmí shodit produkční build (tsc kontrolujeme zvlášť).
  // Pojistka proti výpadku deploye. (ESLint v Next 16 build neblokuje;
  // skutečná příčina padání deploye byl peer konflikt v npm → .npmrc.)
  typescript: { ignoreBuildErrors: true },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
    ];
  },
};

export default nextConfig;
