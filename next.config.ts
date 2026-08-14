import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // @napi-rs/canvas má nativní binárku (rendering PDF stránek letáků na
  // serveru) — nesmí se bundlovat, musí se načíst přes normální require().
  serverExternalPackages: ["@napi-rs/canvas", "pdfjs-dist"],
  // pdfjs-dist si i v Node.js dotahuje "worker" soubor (pdf.worker.mjs) —
  // Next.js ho při trasování souborů pro serverless funkci samo nenajde,
  // protože se importuje dynamicky až za běhu. Bez tohohle build na Vercelu
  // ten soubor do balíčku nezahrne a sync-leaflets padá s "Cannot find module".
  outputFileTracingIncludes: {
    "/api/cron/sync-leaflets": ["./node_modules/pdfjs-dist/legacy/build/*.mjs"],
  },
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
