import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // ESLint chyby nesmí blokovat produkční build (Vercel deploy). ESLint
  // zůstává jako lokální varování při vývoji, ale nezhatí nasazení appky.
  eslint: { ignoreDuringBuilds: true },
  // Totéž pro typové chyby — build appky nesmí spadnout kvůli typu (tsc
  // kontrolujeme zvlášť). Bezpečnostní pojistka proti výpadku deploye.
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
