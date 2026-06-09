"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Flashlight, X, Keyboard, ArrowLeft, Plus, ExternalLink } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { useGamificationStore } from "@/store/gamificationStore";
import { fetchProductByEAN } from "@/lib/openFoodFacts";
import { AddProductManual } from "@/components/AddProductManual";

const OPEN_DATABASES = [
  { id: "food", label: "Open Food Facts", emoji: "🍎", desc: "Potraviny & nápoje", url: "https://world.openfoodfacts.org/cgi/product.pl?type=add&code=" },
  { id: "beauty", label: "Open Beauty Facts", emoji: "💄", desc: "Kosmetika & drogerie", url: "https://world.openbeautyfacts.org/cgi/product.pl?type=add&code=" },
  { id: "pet", label: "Open Pet Food Facts", emoji: "🐾", desc: "Krmiva pro zvířata", url: "https://world.openpetfoodfacts.org/cgi/product.pl?type=add&code=" },
  { id: "products", label: "Open Products Facts", emoji: "🧴", desc: "Ostatní produkty", url: "https://world.openproductsfacts.org/cgi/product.pl?type=add&code=" },
];

type ScanState = "scanning" | "loading" | "found" | "notfound";

// onScanned: callback for embedded mode (e.g. from ProvozView)
// onClose: callback to close embedded scanner
interface ScannerProps {
  onScanned?: (ean: string) => void;
  onClose?: () => void;
}

export function Scanner({ onScanned, onClose }: ScannerProps = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastScannedRef = useRef<string | null>(null);
  const scanStateRef = useRef<ScanState>("scanning");

  const { openSheet, activeSheet, setTab } = useUIStore();
  const recordScanned = useGamificationStore((s) => s.recordScanned);

  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [error, setError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualEAN, setManualEAN] = useState("");
  const [zxingReady, setZxingReady] = useState(false);
  const zxingRef = useRef<any>(null);
  const [notFoundEAN, setNotFoundEAN] = useState<string | null>(null);
  const [showNotFoundPanel, setShowNotFoundPanel] = useState(false);
  const [showAddManual, setShowAddManual] = useState(false);
  const [showDbPicker, setShowDbPicker] = useState(false);

  const isEmbedded = !!onScanned;

  const resetScan = useCallback(() => {
    setScanState("scanning");
    scanStateRef.current = "scanning";
    lastScannedRef.current = null;
    setNotFoundEAN(null);
    setShowNotFoundPanel(false);
    setShowDbPicker(false);
  }, []);

  // keep ref in sync with state for use inside rAF loop
  useEffect(() => { scanStateRef.current = scanState; }, [scanState]);

  // Init ZXing
  useEffect(() => {
    let active = true;
    async function initZXing() {
      try {
        const zxingModule = await import("zxing-wasm").catch(() => null);
        if (!zxingModule) return;
        const { readBarcodes, prepareZXingModule } = zxingModule;
        // Default locateFile loads WASM from jsDelivr CDN automatically
        prepareZXingModule({ fireImmediately: true });
        if (!active) return;
        zxingRef.current = readBarcodes;
        setZxingReady(true);
      } catch (e) {
        console.error("ZXing init failed", e);
      }
    }
    initZXing();
    return () => { active = false; };
  }, []);

  // Init camera — checks existing permission first to avoid repeated prompts
  useEffect(() => {
    let active = true;

    async function startCamera() {
      try {
        // Check if permission already granted (avoids re-prompt on supported browsers)
        if (navigator.permissions) {
          try {
            const perm = await navigator.permissions.query({ name: "camera" as PermissionName });
            if (perm.state === "denied") {
              setError("Přístup ke kameře byl zamítnut. Povolte kameru v nastavení prohlížeče nebo zadejte EAN ručně.");
              return;
            }
          } catch {}
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err: any) {
        if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
          setError("Přístup ke kameře byl zamítnut. Povolte kameru v nastavení prohlížeče nebo zadejte EAN ručně.");
        } else {
          setError("Nepodařilo se spustit kameru. Povolte přístup ke kameře nebo zadejte EAN ručně.");
        }
      }
    }

    startCamera();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Scan loop using ZXing via canvas
  useEffect(() => {
    if (!zxingReady) return;

    const scan = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (
        !video ||
        !canvas ||
        video.readyState < 2 ||
        scanStateRef.current === "loading" ||
        scanStateRef.current === "found" ||
        activeSheet === "product"
      ) {
        animFrameRef.current = requestAnimationFrame(scan);
        return;
      }

      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w === 0 || h === 0) {
        animFrameRef.current = requestAnimationFrame(scan);
        return;
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) { animFrameRef.current = requestAnimationFrame(scan); return; }

      ctx.drawImage(video, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);

      try {
        const results = await zxingRef.current(imageData, {
          formats: ["EAN-13", "EAN-8", "UPC-A", "UPC-E", "Code128", "Code39"],
          maxNumberOfSymbols: 1,
          tryHarder: true,
        });

        if (results.length > 0) {
          const code = results[0].text;
          if (code && code !== lastScannedRef.current) {
            lastScannedRef.current = code;
            setScanState("loading");
            scanStateRef.current = "loading";

            if (isEmbedded && onScanned) {
              // Embedded mode — just return the EAN code
              setScanState("found");
              scanStateRef.current = "found";
              onScanned(code);
            } else {
              const product = await fetchProductByEAN(code);
              if (product) {
                setScanState("found");
                scanStateRef.current = "found";
                openSheet("product", product);
                recordScanned();
              } else {
                setScanState("notfound");
                scanStateRef.current = "notfound";
                setNotFoundEAN(code);
                setTimeout(() => {
                  setShowNotFoundPanel(true);
                }, 600);
              }
            }
          }
        }
      } catch {}

      animFrameRef.current = requestAnimationFrame(scan);
    };

    animFrameRef.current = requestAnimationFrame(scan);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [zxingReady, activeSheet, openSheet, isEmbedded, onScanned]);

  // Reset after sheet closes
  useEffect(() => {
    if (activeSheet === null && scanState === "found") {
      setTimeout(() => {
        setScanState("scanning");
        scanStateRef.current = "scanning";
        lastScannedRef.current = null;
      }, 400);
    }
  }, [activeSheet, scanState]);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as any] });
      setTorchOn((t) => !t);
    } catch {}
  }, [torchOn]);

  const handleManualSubmit = async () => {
    const ean = manualEAN.trim();
    if (!ean) return;
    setShowManualInput(false);
    setManualEAN("");
    setScanState("loading");
    const product = await fetchProductByEAN(ean);
    if (product) {
      setScanState("found");
      openSheet("product", product);
    } else {
      setScanState("notfound");
      setNotFoundEAN(ean);
      setTimeout(() => { setShowNotFoundPanel(true); }, 600);
    }
  };

  const stateColor = {
    scanning: "rgba(107,143,94,0.9)",
    loading: "rgba(232,184,75,0.9)",
    found: "rgba(107,143,94,1)",
    notfound: "rgba(217,87,87,0.9)",
  }[scanState];

  const stateLabel = {
    scanning: zxingReady ? "Namiřte kameru na čárový kód" : "Inicializace skeneru...",
    loading: "Načítám produkt...",
    found: "Produkt nalezen!",
    notfound: "Produkt nebyl nalezen v databázi",
  }[scanState];

  return (
    <div className="flex-1 relative overflow-hidden" style={{ background: "#000" }}>
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        playsInline
        autoPlay
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 28%, transparent 68%, rgba(0,0,0,0.55) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Scan frame */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ pointerEvents: "none" }}>
        <div className="relative" style={{ width: 272, height: 168 }}>
          {/* Corner brackets */}
          {[
            { cls: "top-0 left-0", borders: "border-t-2 border-l-2 rounded-tl-xl" },
            { cls: "top-0 right-0", borders: "border-t-2 border-r-2 rounded-tr-xl" },
            { cls: "bottom-0 left-0", borders: "border-b-2 border-l-2 rounded-bl-xl" },
            { cls: "bottom-0 right-0", borders: "border-b-2 border-r-2 rounded-br-xl" },
          ].map(({ cls, borders }, i) => (
            <div
              key={i}
              className={`absolute w-7 h-7 ${cls} ${borders}`}
              style={{ borderColor: stateColor }}
            />
          ))}

          {/* Scan line */}
          {scanState === "scanning" && zxingReady && (
            <div
              className="scan-line absolute left-2 right-2 h-0.5"
              style={{
                background: `linear-gradient(to right, transparent, ${stateColor}, transparent)`,
                borderRadius: 1,
              }}
            />
          )}

          {/* Loading spinner */}
          {scanState === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: `${stateColor} transparent transparent transparent` }}
              />
            </div>
          )}

          {/* Found checkmark */}
          {scanState === "found" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: stateColor }}>
                <span style={{ fontSize: 22, color: "white" }}>✓</span>
              </div>
            </div>
          )}

          {/* Not found X */}
          {scanState === "notfound" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: stateColor }}>
                <X size={22} color="white" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status pill */}
      <div className="absolute bottom-28 left-0 right-0 flex justify-center">
        <div
          className="px-4 py-2.5 rounded-full"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
        >
          <p className="text-white text-sm font-medium text-center">{stateLabel}</p>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8" style={{ background: "rgba(0,0,0,0.85)" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
            <span style={{ fontSize: 32 }}>📷</span>
          </div>
          <p className="text-white font-semibold text-center">{error}</p>
          <button
            onClick={() => setShowManualInput(true)}
            className="btn-primary"
            style={{ width: "auto", paddingLeft: 24, paddingRight: 24 }}
          >
            <Keyboard size={16} /> Zadat EAN ručně
          </button>
        </div>
      )}

      {/* Top left — back/close button */}
      <div className="absolute top-4 left-4">
        <button
          onClick={() => {
            if (onClose) {
              onClose();
            } else {
              setTab("spizirna");
            }
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}
          title="Zavřít"
        >
          {isEmbedded ? <X size={18} style={{ color: "white" }} /> : <ArrowLeft size={18} style={{ color: "white" }} />}
        </button>
      </div>

      {/* Top controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={toggleTorch}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
          style={{
            background: torchOn ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.45)",
            backdropFilter: "blur(8px)",
          }}
        >
          <Flashlight size={18} style={{ color: torchOn ? "#1A1A1A" : "white" }} />
        </button>

        <button
          onClick={() => setShowManualInput(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}
          title="Zadat EAN ručně"
        >
          <Keyboard size={18} style={{ color: "white" }} />
        </button>
      </div>

      {/* Manual EAN input modal */}
      {showManualInput && (
        <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", zIndex: 100 }}>
          <div
            className="sheet-overlay animate-fade-in"
            style={{ position: "absolute", inset: 0 }}
            onClick={() => { setShowManualInput(false); setManualEAN(""); }}
          />
          <div
            className="relative animate-slide-up rounded-t-3xl overflow-hidden"
            style={{ background: "var(--bg-primary)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
            </div>
            <div className="px-5 pt-3 pb-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Zadat EAN ručně</h3>
                <button
                  onClick={() => { setShowManualInput(false); setManualEAN(""); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "var(--border)" }}
                >
                  <X size={15} style={{ color: "var(--text-secondary)" }} />
                </button>
              </div>

              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Zadejte 13-místný EAN kód z obalu produktu.
              </p>

              <input
                type="number"
                value={manualEAN}
                onChange={(e) => setManualEAN(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleManualSubmit(); }}
                placeholder="např. 8594013425054"
                autoFocus
                className="w-full px-4 py-3.5 rounded-2xl text-base font-semibold outline-none tracking-widest text-center"
                style={{
                  background: "white",
                  border: `1.5px solid ${manualEAN.length >= 8 ? "var(--green-primary)" : "var(--border)"}`,
                  color: "var(--text-primary)",
                  letterSpacing: "0.15em",
                }}
              />

              {manualEAN.length > 0 && manualEAN.length < 8 && (
                <p className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>
                  EAN kód má obvykle 13 číslic ({manualEAN.length}/13)
                </p>
              )}

              <button
                onClick={handleManualSubmit}
                className="btn-primary"
                disabled={manualEAN.length < 6}
              >
                Vyhledat produkt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Produkt nenalezen — panel s možnostmi ── */}
      {showNotFoundPanel && notFoundEAN && !showDbPicker && (
        <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", zIndex: 110 }}>
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }}
            onClick={resetScan}
          />
          <div
            className="relative animate-slide-up rounded-t-3xl px-5 pt-5 pb-8 space-y-3"
            style={{ background: "var(--bg-primary)", paddingBottom: "max(32px, env(safe-area-inset-bottom, 32px))" }}
          >
            <div className="flex justify-center mb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "#FDE8E8" }}>
                <X size={20} style={{ color: "#C0392B" }} />
              </div>
              <div>
                <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Produkt nenalezen</p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>EAN: {notFoundEAN}</p>
              </div>
            </div>

            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Produkt není v žádné databázi. Co chceš udělat?
            </p>

            {/* Přidat ručně do Spižírny */}
            <button
              onClick={() => { setShowNotFoundPanel(false); setShowAddManual(true); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px", borderRadius: 18, textAlign: "left",
                background: "var(--green-light)", border: "1.5px solid var(--green-primary)",
              }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--green-primary)" }}>
                <Plus size={18} color="white" />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: "var(--green-dark)" }}>Přidat ručně do Spižírny</p>
                <p className="text-xs" style={{ color: "var(--green-primary)" }}>Jen pro tebe, uloženo lokálně</p>
              </div>
            </button>

            {/* Přidat do veřejné databáze */}
            <button
              onClick={() => setShowDbPicker(true)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px", borderRadius: 18, textAlign: "left",
                background: "#EEF4FF", border: "1.5px solid #4A6BC4",
              }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#4A6BC4" }}>
                <ExternalLink size={18} color="white" />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: "#1E3A8A" }}>Přidat do veřejné databáze</p>
                <p className="text-xs" style={{ color: "#4A6BC4" }}>Pomůže všem uživatelům — Open*Facts</p>
              </div>
            </button>

            <button onClick={resetScan} style={{ width: "100%", padding: "12px 0", borderRadius: 16, fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", background: "var(--border)" }}>
              Skenovat znovu
            </button>
          </div>
        </div>
      )}

      {/* ── Výběr databáze ── */}
      {showDbPicker && notFoundEAN && (
        <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", zIndex: 110 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} onClick={() => setShowDbPicker(false)} />
          <div
            className="relative animate-slide-up rounded-t-3xl px-5 pt-5 pb-8 space-y-3"
            style={{ background: "var(--bg-primary)", paddingBottom: "max(32px, env(safe-area-inset-bottom, 32px))" }}
          >
            <div className="flex justify-center mb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
            </div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Vyberte databázi</p>
              <button onClick={() => setShowDbPicker(false)}>
                <X size={18} style={{ color: "var(--text-tertiary)" }} />
              </button>
            </div>
            <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
              Otevře se web v prohlížeči kde produkt přidáte. EAN <b>{notFoundEAN}</b> bude předvyplněný.
            </p>
            {OPEN_DATABASES.map(db => (
              <a
                key={db.id}
                href={`${db.url}${notFoundEAN}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={resetScan}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "13px 16px", borderRadius: 16,
                  background: "white", border: "1.5px solid var(--border)",
                  textDecoration: "none",
                }}
              >
                <span style={{ fontSize: 24 }}>{db.emoji}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{db.label}</p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>{db.desc}</p>
                </div>
                <ExternalLink size={15} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── Manuální přidání produktu ── */}
      {showAddManual && (
        <AddProductManual
          prefillEAN={notFoundEAN ?? undefined}
          onClose={() => { setShowAddManual(false); resetScan(); }}
        />
      )}

    </div>
  );
}
