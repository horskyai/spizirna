"use client";

import { useState, useMemo } from "react";
import {
  Plus, X, Minus, Trash2, ShoppingCart, Check, Pencil,
  Settings2, Receipt, RotateCcw, Package, Soup, Ban, ScanLine, EyeOff, Eye, Calculator,
  Banknote, CreditCard, UtensilsCrossed,
} from "lucide-react";
import {
  useKasaStore, MenuPolozka, MenuVazbaTyp, CartItem, ZpusobPlatby,
} from "@/store/kasaStore";
import { useProvozStore, INVENTURA_KATEGORIE } from "@/store/provozStore";
import { useRecipeStore } from "@/store/recipeStore";
import { useBusinessStore } from "@/store/businessStore";
import { useEmployeeStore } from "@/store/employeeStore";
import { EmployeeUnlockButton } from "@/components/EmployeeLock";
import { Scanner } from "@/components/Scanner";
import { lookupProductByEAN } from "@/lib/productLookup";
import { useT, useLocale } from "@/lib/i18n";

// Dnešní datum jako YYYY-MM-DD (lokální, ne UTC — ať tržba sedí na den obsluhy).
function dnesISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Modal: přidat / upravit položku nabídky ────────────────────────────────────
function MenuModal({ edit, onClose }: { edit: MenuPolozka | null; onClose: () => void }) {
  const t = useT();
  const { addMenuPolozka, updateMenuPolozka, removeMenuPolozka } = useKasaStore();
  const polozky = useProvozStore((s) => s.polozky);
  const recepty = useRecipeStore((s) => s.recipes);
  const typProvozu = useBusinessStore((s) => s.typProvozu);
  const jeObchod = typProvozu === "obchod";

  const [nazev, setNazev] = useState(edit?.nazev ?? "");
  const [cena, setCena] = useState(edit ? String(edit.cena) : "");
  const [kategorie, setKategorie] = useState(edit?.kategorie ?? "");
  // Default vazba dle typu: obchod → kusové (sklad), restaurace → denní porce.
  const [vazbaTyp, setVazbaTyp] = useState<MenuVazbaTyp>(edit?.vazbaTyp ?? (jeObchod ? "sklad" : "porce"));
  const [polozkaId, setPolozkaId] = useState(edit?.polozkaId ?? "");
  const [odbet, setOdbet] = useState(edit?.odbet != null ? String(edit.odbet) : "1");
  const [receptId, setReceptId] = useState(edit?.receptId ?? "");
  const [navareno, setNavareno] = useState(edit?.navareno != null ? String(edit.navareno) : "");
  const [dphSazba, setDphSazba] = useState(edit?.dphSazba ?? 21);
  const [plu, setPlu] = useState(edit?.plu ?? "");
  // Přednastavené skupiny jídel (restaurace) — klik místo psaní.
  const SKUPINY = [
    t("kasa.skup.polevky"), t("kasa.skup.predkrmy"), t("kasa.skup.hlavni"),
    t("kasa.skup.priloha"), t("kasa.skup.dezerty"), t("kasa.skup.napoje"), t("kasa.skup.alkohol"),
  ];
  // Vlastní režim = položka má skupinu, která není mezi přednastavenými.
  const [vlastniSkup, setVlastniSkup] = useState(!!edit?.kategorie && !SKUPINY.includes(edit.kategorie));

  const recept = recepty.find((r) => r.id === receptId);
  // Kolik surovin receptu se nepodaří spárovat na sklad (upozornění obsluze).
  const nesparovane = useMemo(() => {
    if (vazbaTyp !== "recept" || !recept) return [];
    return recept.ingredients.filter(
      (ing) => !polozky.some((p) => p.nazev.toLowerCase().trim() === ing.name.toLowerCase().trim()),
    );
  }, [vazbaTyp, recept, polozky]);

  const save = () => {
    const c = parseFloat(cena);
    if (!nazev.trim() || isNaN(c)) return;
    const base = {
      nazev: nazev.trim(),
      cena: c,
      kategorie: kategorie.trim() || undefined,
      vazbaTyp,
      polozkaId: vazbaTyp === "sklad" ? polozkaId || undefined : undefined,
      odbet: vazbaTyp === "sklad" ? parseFloat(odbet) || 1 : undefined,
      receptId: vazbaTyp === "recept" ? receptId || undefined : undefined,
      // Denní porce: navařeno (prázdné = neomezeno). Datum/prodáno řeší store při prodeji.
      navareno: vazbaTyp === "porce" && navareno.trim() !== "" ? parseFloat(navareno) : undefined,
      navarenoDatum: vazbaTyp === "porce" ? edit?.navarenoDatum : undefined,
      prodanoDnes: vazbaTyp === "porce" ? edit?.prodanoDnes : undefined,
      dphSazba,
      plu: plu.trim() || undefined,
      fotoUrl: edit?.fotoUrl,
      aktivni: edit?.aktivni ?? true,
    };
    if (edit) updateMenuPolozka(edit.id, base);
    else addMenuPolozka(base);
    onClose();
  };

  const vsechnyVazby: { id: MenuVazbaTyp; icon: React.ReactNode; label: string; desc: string }[] = [
    { id: "porce", icon: <UtensilsCrossed size={16} />, label: t("kasa.vazba.porce"), desc: t("kasa.vazba.porceDesc") },
    { id: "recept", icon: <Soup size={16} />, label: t("kasa.vazba.recept"), desc: t("kasa.vazba.receptDesc") },
    { id: "sklad", icon: <Package size={16} />, label: t("kasa.vazba.sklad"), desc: t("kasa.vazba.skladDesc") },
    { id: "zadna", icon: <Ban size={16} />, label: t("kasa.vazba.zadna"), desc: t("kasa.vazba.zadnaDesc") },
  ];
  // Obchod prodává jen kusové zboží → skryj recept a denní porce.
  const vazby = jeObchod ? vsechnyVazby.filter((v) => v.id === "sklad" || v.id === "zadna") : vsechnyVazby;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
      <div className="relative rounded-t-3xl px-5 pt-5 pb-8 space-y-4 animate-slide-up"
        style={{ background: "var(--bg-primary)", paddingBottom: "max(32px, env(safe-area-inset-bottom, 32px))", maxHeight: "92dvh", overflowY: "auto" }}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {edit ? t("kasa.upravitMenuPolozku") : t("kasa.novaMenuPolozka")}
          </h3>
          <button onClick={onClose}><X size={20} style={{ color: "var(--text-tertiary)" }} /></button>
        </div>

        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("kasa.nazev")}</label>
          <input autoFocus value={nazev} onChange={(e) => setNazev(e.target.value)} placeholder={t("kasa.nazevPlaceholder")}
            className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
            style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
        </div>

        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("kasa.cena")}</label>
          <input type="number" inputMode="decimal" value={cena} onChange={(e) => setCena(e.target.value)} placeholder="0"
            className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
            style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
        </div>

        {/* Skupina — přednastavené (restaurace) na klik + vlastní */}
        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-tertiary)" }}>{t("kasa.kategorie")}</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SKUPINY.map((sk) => {
              const aktivni = kategorie === sk;
              return (
                <button key={sk} onClick={() => { setKategorie(sk); setVlastniSkup(false); }}
                  style={{ padding: "7px 12px", borderRadius: 20, fontSize: 12.5, fontWeight: aktivni ? 700 : 500, background: aktivni ? "var(--green-primary)" : "white", color: aktivni ? "white" : "var(--text-secondary)", border: `1.5px solid ${aktivni ? "var(--green-primary)" : "var(--border)"}` }}>
                  {sk}
                </button>
              );
            })}
            <button onClick={() => { setVlastniSkup(true); setKategorie(""); }}
              style={{ padding: "7px 12px", borderRadius: 20, fontSize: 12.5, fontWeight: vlastniSkup ? 700 : 500, background: vlastniSkup ? "var(--green-primary)" : "white", color: vlastniSkup ? "white" : "var(--text-secondary)", border: `1.5px solid ${vlastniSkup ? "var(--green-primary)" : "var(--border)"}` }}>
              {t("kasa.skupinaVlastni")}
            </button>
          </div>
          {vlastniSkup && (
            <input value={kategorie} onChange={(e) => setKategorie(e.target.value)} placeholder={t("kasa.kategoriePlaceholder")} autoFocus
              className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none mt-2"
              style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
          )}
        </div>

        <div className="flex gap-3">
          <div style={{ flex: 1 }}>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.plu")}</label>
            <input type="text" inputMode="numeric" value={plu} onChange={(e) => setPlu(e.target.value)} placeholder={t("kasa.volitelneKod")}
              className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
              style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-tertiary)" }}>{t("provoz.dphSazba")}</label>
            <div style={{ display: "flex", gap: 6 }}>
              {[21, 12, 0].map((s) => (
                <button key={s} onClick={() => setDphSazba(s)}
                  style={{ flex: 1, padding: "9px 0", borderRadius: 10, fontSize: 12, fontWeight: 700, background: dphSazba === s ? "var(--green-primary)" : "white", color: dphSazba === s ? "white" : "var(--text-secondary)", border: `1.5px solid ${dphSazba === s ? "var(--green-primary)" : "var(--border)"}` }}>
                  {s}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Jak odečítat ze skladu */}
        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: "var(--text-tertiary)" }}>{t("kasa.jakOdecist")}</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {vazby.map((v) => (
              <button key={v.id} onClick={() => setVazbaTyp(v.id)}
                className="flex items-start gap-3 text-left"
                style={{
                  padding: "10px 12px", borderRadius: 14,
                  background: vazbaTyp === v.id ? "var(--green-light)" : "white",
                  border: `1.5px solid ${vazbaTyp === v.id ? "var(--green-primary)" : "var(--border)"}`,
                }}>
                <span style={{ color: vazbaTyp === v.id ? "var(--green-dark)" : "var(--text-tertiary)", marginTop: 1 }}>{v.icon}</span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: vazbaTyp === v.id ? "var(--green-dark)" : "var(--text-primary)" }}>{v.label}</span>
                  <span style={{ display: "block", fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.35 }}>{v.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Detail vazby: sklad */}
        {vazbaTyp === "sklad" && (
          <div className="flex gap-3 animate-fade-in">
            <div style={{ flex: 2, minWidth: 0 }}>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("kasa.vyberSklad")}</label>
              <select value={polozkaId} onChange={(e) => setPolozkaId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
                style={{ border: "1.5px solid var(--border)", background: "white", color: polozkaId ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                <option value="">{t("kasa.vyberSkladPrazdno")}</option>
                {polozky.map((p) => <option key={p.id} value={p.id}>{p.nazev} ({p.jednotka})</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("kasa.odbet")}</label>
              <input type="number" inputMode="decimal" value={odbet} onChange={(e) => setOdbet(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none text-center"
                style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
            </div>
          </div>
        )}

        {/* Detail vazby: recept */}
        {vazbaTyp === "recept" && (
          <div className="animate-fade-in">
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("kasa.vyberRecept")}</label>
            <select value={receptId} onChange={(e) => setReceptId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
              style={{ border: "1.5px solid var(--border)", background: "white", color: receptId ? "var(--text-primary)" : "var(--text-tertiary)" }}>
              <option value="">{t("kasa.vyberReceptPrazdno")}</option>
              {recepty.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {recept && (
              <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 6 }}>
                {t("kasa.receptInfo").replace("{n}", String(recept.ingredients.length)).replace("{s}", String(recept.servings))}
              </p>
            )}
            {nesparovane.map((ing) => (
              <p key={ing.name} style={{ fontSize: 11, color: "#E65100", marginTop: 3 }}>
                {t("kasa.nesparovano").replace("{n}", ing.name)}
              </p>
            ))}
          </div>
        )}

        {/* Detail vazby: denní porce */}
        {vazbaTyp === "porce" && (
          <div className="animate-fade-in">
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("kasa.navareno")}</label>
            <input type="number" inputMode="numeric" value={navareno} onChange={(e) => setNavareno(e.target.value)} placeholder="—"
              className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
              style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 6 }}>{t("kasa.navarenoHint")}</p>
          </div>
        )}

        <button onClick={save} className="btn-primary" disabled={!nazev.trim() || isNaN(parseFloat(cena))}>
          <Check size={16} /> {edit ? t("kasa.ulozit") : t("kasa.pridat")}
        </button>

        {edit && (
          <button onClick={() => { removeMenuPolozka(edit.id); onClose(); }}
            style={{ width: "100%", padding: "10px 0", borderRadius: 14, fontSize: 13, fontWeight: 700, color: "#C0392B", background: "#FDE8E8", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Trash2 size={15} /> {t("kasa.smazat")}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Správa nabídky (seznam menu položek) ────────────────────────────────────────
function SpravaMenu({ onClose }: { onClose: () => void }) {
  const t = useT();
  const locale = useLocale();
  const dateLocale = locale === "sk" ? "sk-SK" : "cs-CZ";
  const menu = useKasaStore((s) => s.menu);
  const nastavNavareno = useKasaStore((s) => s.nastavNavareno);
  const getZbyvaPorci = useKasaStore((s) => s.getZbyvaPorci);
  const polozky = useProvozStore((s) => s.polozky);
  const updatePolozka = useProvozStore((s) => s.updatePolozka);
  const [edit, setEdit] = useState<MenuPolozka | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={onClose} style={{ fontSize: 13, fontWeight: 600, color: "var(--green-primary)", display: "flex", alignItems: "center", gap: 5 }}>
          <ShoppingCart size={15} /> {t("kasa.zpetNaProdej")}
        </button>
      </div>

      <button className="btn-primary mb-4" onClick={() => setShowAdd(true)}>
        <Plus size={16} /> {t("kasa.novaMenuPolozka")}
      </button>

      {/* Nabídka (jídla/recepty/ruční) */}
      {menu.length > 0 && (
        <>
          <p className="text-xs font-semibold uppercase mb-2 px-1" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>{t("kasa.sekce.menu")}</p>
          <div className="card overflow-hidden mb-5">
            {menu.map((m, idx) => {
              const zbyva = m.vazbaTyp === "porce" ? getZbyvaPorci(m.id) : null;
              return (
              <div key={m.id}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: idx < menu.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div onClick={() => setEdit(m)} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0, cursor: "pointer" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--green-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--green-dark)" }}>
                    {m.vazbaTyp === "porce" ? <UtensilsCrossed size={16} /> : m.vazbaTyp === "recept" ? <Soup size={16} /> : m.vazbaTyp === "sklad" ? <Package size={16} /> : <Ban size={16} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{m.nazev}</p>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {m.vazbaTyp === "porce" ? t("kasa.vazba.porce") : m.vazbaTyp === "recept" ? t("kasa.vazba.recept") : m.vazbaTyp === "sklad" ? t("kasa.vazba.sklad") : t("kasa.bezVazby")}
                    </p>
                  </div>
                </div>
                {/* U denních porcí rychlé pole „navařeno" (kuchař ráno) */}
                {m.vazbaTyp === "porce" && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                    <input
                      type="number" inputMode="numeric" defaultValue={m.navareno ?? ""}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={(e) => { const v = e.target.value.trim(); nastavNavareno(m.id, v === "" ? undefined : parseFloat(v)); }}
                      placeholder={t("kasa.porciDnes")}
                      style={{ width: 62, textAlign: "center", padding: "6px 4px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: "1.5px solid var(--border)", background: "white", outline: "none", color: "var(--text-primary)" }}
                    />
                    {zbyva != null && (
                      <span style={{ fontSize: 10, color: zbyva <= 0 ? "#C0392B" : "var(--text-tertiary)", marginTop: 2 }}>
                        {zbyva <= 0 ? t("kasa.vyprodano") : t("kasa.zbyva").replace("{n}", String(zbyva))}
                      </span>
                    )}
                  </div>
                )}
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", flexShrink: 0 }}>{m.cena} Kč</p>
                <Pencil size={15} style={{ color: "var(--text-tertiary)", flexShrink: 0, cursor: "pointer" }} onClick={() => setEdit(m)} />
              </div>
              );
            })}
          </div>
        </>
      )}

      {/* Sklad — automaticky v prodeji; tady jen prodejní cena + skrytí */}
      {polozky.length > 0 && (
        <>
          <p className="text-xs font-semibold uppercase mb-2 px-1" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>{t("kasa.sekce.sklad")}</p>
          <div className="card overflow-hidden">
            {polozky.map((p, idx) => {
              const skryto = !!p.skrytoZKasy;
              const cena = p.prodejniCena ?? p.cenaJednotka;
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: idx < polozky.length - 1 ? "1px solid var(--border)" : "none", opacity: skryto ? 0.55 : 1 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nazev}</p>
                    <p style={{ fontSize: 11, color: cena == null ? "#E65100" : "var(--text-secondary)" }}>
                      {cena == null ? t("kasa.bezCeny") : `${cena.toLocaleString(dateLocale)} Kč / ${p.jednotka}`}
                    </p>
                  </div>
                  {/* Inline prodejní cena */}
                  <input
                    type="number" inputMode="decimal" defaultValue={p.prodejniCena ?? ""}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      updatePolozka(p.id, { prodejniCena: v === "" ? undefined : parseFloat(v) });
                    }}
                    placeholder="cena"
                    style={{ width: 66, textAlign: "center", padding: "7px 4px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: "1.5px solid var(--border)", background: "white", outline: "none", color: "var(--text-primary)", flexShrink: 0 }}
                  />
                  {/* Skrýt / zobrazit z prodeje */}
                  <button onClick={() => updatePolozka(p.id, { skrytoZKasy: !skryto })}
                    title={skryto ? t("kasa.zobrazit") : t("kasa.skryt")}
                    style={{ width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: skryto ? "var(--border)" : "var(--green-light)", flexShrink: 0 }}>
                    {skryto ? <EyeOff size={15} style={{ color: "var(--text-tertiary)" }} /> : <Eye size={15} style={{ color: "var(--green-primary)" }} />}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {menu.length === 0 && polozky.length === 0 && (
        <div className="text-center py-8">
          <p style={{ color: "var(--text-tertiary)", fontSize: 14 }}>{t("kasa.skladPrazdny")}</p>
        </div>
      )}

      {(showAdd || edit) && (
        <MenuModal edit={edit} onClose={() => { setShowAdd(false); setEdit(null); }} />
      )}
    </div>
  );
}

// ── Sekce dlaždic (jedna kategorie) ─────────────────────────────────────────────
// zbyva: kolik porcí dnes zbývá (jen u denních porcí; null = neomezeno/neaplikuje se).
// prodano: kolik se dnes prodalo (u neomezených porcí ukazujeme počítadlo).
interface Dlazdice { key: string; nazev: string; cena: number; cenaChybi: boolean; foto?: string; zbyva?: number | null; prodano?: number }
function DlazdiceSekce({
  titulek, show, dlazdice, cart, onPridat, dateLocale, t,
}: {
  titulek: string;
  show: boolean;
  dlazdice: Dlazdice[];
  cart: Record<string, number>;
  onPridat: (key: string) => void;
  dateLocale: string;
  t: (k: string) => string;
}) {
  if (!show || dlazdice.length === 0) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <p className="text-xs font-semibold uppercase mb-2 px-1" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>{titulek}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(105px, 1fr))", gap: 10 }}>
        {dlazdice.map((d) => {
          const q = cart[d.key] ?? 0;
          const vyprodano = d.zbyva != null && d.zbyva <= 0;
          const dochazi = d.zbyva != null && d.zbyva > 0 && d.zbyva <= 3;
          return (
            <button key={d.key} onClick={() => { if (!vyprodano) onPridat(d.key); }}
              disabled={vyprodano}
              style={{
                position: "relative", padding: "14px 10px", borderRadius: 16, textAlign: "center",
                background: vyprodano ? "var(--border)" : q > 0 ? "var(--green-light)" : "white",
                border: `2px solid ${vyprodano ? "var(--border)" : q > 0 ? "var(--green-primary)" : "var(--border)"}`,
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)", minHeight: 84,
                display: "flex", flexDirection: "column", justifyContent: "center", gap: 4,
                opacity: vyprodano ? 0.6 : 1,
              }}>
              {q > 0 && (
                <span style={{ position: "absolute", top: -8, right: -8, minWidth: 24, height: 24, padding: "0 6px", borderRadius: 12, background: "var(--green-primary)", color: "white", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}>{q}</span>
              )}
              {d.foto && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.foto} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", margin: "0 auto 2px", opacity: vyprodano ? 0.5 : 1 }} />
              )}
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>{d.nazev}</span>
              {d.cenaChybi ? (
                <span style={{ fontSize: 10, fontWeight: 600, color: "#E65100", lineHeight: 1.2 }}>{t("kasa.bezCeny")}</span>
              ) : (
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--green-dark)" }}>{d.cena.toLocaleString(dateLocale)} Kč</span>
              )}
              {/* Denní porce — zbývá / vyprodáno / počítadlo */}
              {vyprodano ? (
                <span style={{ fontSize: 11, fontWeight: 800, color: "#C0392B", lineHeight: 1.2 }}>{t("kasa.vyprodano")}</span>
              ) : d.zbyva != null ? (
                <span style={{ fontSize: 11, fontWeight: 700, color: dochazi ? "#E65100" : "var(--text-secondary)", lineHeight: 1.2 }}>
                  {t("kasa.zbyva").replace("{n}", String(d.zbyva))}
                </span>
              ) : d.prodano != null && d.prodano > 0 ? (
                <span style={{ fontSize: 10, color: "var(--text-tertiary)", lineHeight: 1.2 }}>
                  {t("kasa.prodanoDnes").replace("{n}", String(d.prodano))}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Numpad (číselná klávesnice) ─────────────────────────────────────────────────
function NumpadModal({
  nasobic, setNasobic, onKod, onVolna, onClose, t, dateLocale,
}: {
  nasobic: number;
  setNasobic: (n: number) => void;
  onKod: (kod: string) => boolean;
  onVolna: (castka: number) => void;
  onClose: () => void;
  t: (k: string) => string;
  dateLocale: string;
}) {
  const [buf, setBuf] = useState("");
  const tlac = (d: string) => setBuf((b) => (b === "0" ? d : b + d));
  const cislo = parseFloat(buf || "0");

  const KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0", "⌫"];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 250, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
      <div className="relative rounded-t-3xl px-5 pt-5 pb-8 space-y-3 animate-slide-up"
        style={{ background: "var(--bg-primary)", paddingBottom: "max(28px, env(safe-area-inset-bottom, 28px))" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{t("kasa.numpadTitul")}</h3>
          <button onClick={onClose}><X size={20} style={{ color: "var(--text-tertiary)" }} /></button>
        </div>

        {/* Displej */}
        <div style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: 16, padding: "14px 18px", textAlign: "right", minHeight: 56, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
          <span style={{ fontSize: 30, fontWeight: 800, color: buf ? "var(--text-primary)" : "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
            {buf || t("kasa.zadejKod")}
          </span>
        </div>

        {nasobic !== 1 && (
          <p style={{ fontSize: 12, color: "var(--green-primary)", fontWeight: 600, textAlign: "center" }}>
            {t("kasa.nasobicAktivni").replace("{n}", String(nasobic))}
          </p>
        )}

        {/* Klávesy */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {KEYS.map((k) => (
            <button key={k}
              onClick={() => { if (k === "⌫") setBuf((b) => b.slice(0, -1)); else tlac(k); }}
              style={{ padding: "16px 0", borderRadius: 14, fontSize: 22, fontWeight: 700, background: "white", border: "1.5px solid var(--border)", color: "var(--text-primary)" }}>
              {k}
            </button>
          ))}
        </div>

        {/* Akce */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => { if (cislo >= 1) { setNasobic(Math.floor(cislo)); setBuf(""); } }}
            disabled={cislo < 1}
            style={{ flex: 1, padding: "12px 0", borderRadius: 14, fontSize: 14, fontWeight: 700, background: cislo >= 1 ? "var(--green-light)" : "var(--border)", color: cislo >= 1 ? "var(--green-dark)" : "var(--text-tertiary)" }}>
            {t("kasa.mnozstviNasobic")}
          </button>
          <button
            onClick={() => { if (onKod(buf)) setBuf(""); }}
            disabled={!buf}
            style={{ flex: 1, padding: "12px 0", borderRadius: 14, fontSize: 14, fontWeight: 700, background: buf ? "var(--green-light)" : "var(--border)", color: buf ? "var(--green-dark)" : "var(--text-tertiary)" }}>
            {t("kasa.pluNajit")}
          </button>
        </div>
        <button
          onClick={() => { if (cislo > 0) { onVolna(cislo); setBuf(""); onClose(); } }}
          disabled={!(cislo > 0)}
          style={{ width: "100%", padding: "13px 0", borderRadius: 14, fontSize: 15, fontWeight: 800, background: cislo > 0 ? "var(--green-primary)" : "var(--border)", color: cislo > 0 ? "white" : "var(--text-tertiary)" }}>
          {cislo > 0 ? t("kasa.pridatVolnou").replace("{n}", cislo.toLocaleString(dateLocale)) : t("kasa.volnaPolozka")}
        </button>
      </div>
    </div>
  );
}

// ── Hlavní obrazovka kasy ───────────────────────────────────────────────────────
export function KasaView() {
  const t = useT();
  const locale = useLocale();
  const dateLocale = locale === "sk" ? "sk-SK" : "cs-CZ";
  const { menu, prodejky, prodat, stornoProdejka, getTrzbaDne, getPocetProdejekDne, getZbyvaPorci } = useKasaStore();
  const polozky = useProvozStore((s) => s.polozky);
  const zamestnanec = useEmployeeStore((s) => s.enabled && s.locked);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [volne, setVolne] = useState<{ id: string; nazev: string; cena: number; mnozstvi: number }[]>([]);
  const [showSprava, setShowSprava] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showNumpad, setShowNumpad] = useState(false);
  const [nasobic, setNasobic] = useState(1); // množství, které se přidá k dalšímu kliknutému zboží
  const [prijato, setPrijato] = useState(""); // kolik zákazník dal hotově (volitelné → počítá vrácení)
  const [toast, setToast] = useState<string | null>(null);

  const dnes = dnesISO();
  const trzba = getTrzbaDne(dnes);
  const pocet = getPocetProdejekDne(dnes);
  const prodejeDnes = prodejky.filter((p) => p.datum.slice(0, 10) === dnes);

  // ── Dlaždice ze DVOU zdrojů ───────────────────────────────────────────────
  // Klíč košíku i dlaždice: "sklad:<polozkaId>" nebo "menu:<menuId>".
  // Cena skladové dlaždice = prodejniCena, fallback nákupní cenaJednotka.
  const skladProdej = polozky.filter((p) => !p.skrytoZKasy);
  const skrytychPocet = polozky.filter((p) => p.skrytoZKasy).length;
  const aktivniMenu = menu.filter((m) => m.aktivni !== false);
  const nicKProdeji = skladProdej.length === 0 && aktivniMenu.length === 0;

  const cenaDlazdice = (key: string): number => {
    const [typ, id] = key.split(":");
    if (typ === "sklad") { const p = polozky.find((x) => x.id === id); return p ? (p.prodejniCena ?? p.cenaJednotka ?? 0) : 0; }
    const m = menu.find((x) => x.id === id); return m ? m.cena : 0;
  };
  const nazevDlazdice = (key: string): string => {
    const [typ, id] = key.split(":");
    if (typ === "sklad") return polozky.find((x) => x.id === id)?.nazev ?? "";
    return menu.find((x) => x.id === id)?.nazev ?? "";
  };

  const cartCelkem = useMemo(
    () =>
      Object.entries(cart).reduce((sum, [key, q]) => sum + cenaDlazdice(key) * q, 0) +
      volne.reduce((sum, v) => sum + v.cena * v.mnozstvi, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cart, volne, menu, polozky],
  );
  const cartPocet = Object.values(cart).reduce((a, b) => a + b, 0) + volne.reduce((a, v) => a + v.mnozstvi, 0);

  // Přidá zboží; pokud je nastavený násobič (z numpadu), použije ho a resetuje na 1.
  const pridat = (key: string) => {
    const kolik = nasobic;
    setCart((c) => ({ ...c, [key]: (c[key] ?? 0) + kolik }));
    if (nasobic !== 1) setNasobic(1);
  };
  const ubrat = (key: string) => setCart((c) => {
    const q = (c[key] ?? 0) - 1;
    const next = { ...c };
    if (q <= 0) delete next[key]; else next[key] = q;
    return next;
  });
  const ubratVolnou = (id: string) => setVolne((v) => v.filter((x) => x.id !== id));

  // Numpad: najdi zboží podle PLU nebo EAN a přidej (s aktuálním násobičem).
  const najdiPodleKodu = (kod: string): boolean => {
    const k = kod.trim();
    if (!k) return false;
    const p = polozky.find((x) => x.plu === k || x.ean === k);
    if (p) { pridat(`sklad:${p.id}`); setToast(t("kasa.skenPridano").replace("{n}", p.nazev)); setTimeout(() => setToast(null), 2000); return true; }
    const m = menu.find((x) => x.plu === k);
    if (m) { pridat(`menu:${m.id}`); setToast(t("kasa.skenPridano").replace("{n}", m.nazev)); setTimeout(() => setToast(null), 2000); return true; }
    setToast(t("kasa.pluNenalezen").replace("{n}", k)); setTimeout(() => setToast(null), 2200);
    return false;
  };
  // Numpad: přidej volnou položku (částka bez vazby na sklad).
  const pridatVolnou = (castka: number) => {
    if (!(castka > 0)) return;
    const kolik = nasobic;
    // vary the id by index/length instead of Date.now()/random (unavailable safe)
    const id = `volna-${volne.length}-${castka}-${kolik}`;
    setVolne((v) => [...v, { id, nazev: t("kasa.volnaNazev"), cena: castka, mnozstvi: kolik }]);
    if (nasobic !== 1) setNasobic(1);
  };

  // Sken v kase: najdi skladovou položku podle EAN → přidej do košíku.
  const handleScanned = async (ean: string) => {
    setShowScanner(false);
    let p = polozky.find((x) => x.ean === ean);
    if (!p) {
      // Zkus dohledat název přes katalog, ať aspoň řekneme co to bylo.
      const prod = await lookupProductByEAN(ean).catch(() => null);
      const jmeno = prod?.product_name;
      p = jmeno ? polozky.find((x) => x.nazev.toLowerCase().trim() === jmeno.toLowerCase().trim()) : undefined;
    }
    if (p) {
      pridat(`sklad:${p.id}`);
      setToast(t("kasa.skenPridano").replace("{n}", p.nazev));
    } else {
      setToast(t("kasa.skenNenalezen").replace("{n}", ean));
    }
    setTimeout(() => setToast(null), 2500);
  };

  const zaplatit = (platba: ZpusobPlatby) => {
    const items: CartItem[] = Object.entries(cart).map(([key, mnozstvi]) => {
      const [typ, id] = key.split(":");
      return typ === "sklad" ? { polozkaId: id, mnozstvi } : { menuId: id, mnozstvi };
    });
    volne.forEach((v) => items.push({ volnaCena: v.cena, volnaNazev: v.nazev, mnozstvi: v.mnozstvi }));
    const castka = cartCelkem;
    const id = prodat(items, platba);
    if (id) {
      setCart({});
      setVolne([]);
      setNasobic(1);
      setPrijato("");
      setToast(t("kasa.zaplaceno").replace("{n}", castka.toLocaleString(dateLocale)));
      setTimeout(() => setToast(null), 2500);
    }
  };

  if (showSprava) return <SpravaMenu onClose={() => setShowSprava(false)} />;

  if (showScanner) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", flexDirection: "column" }}>
        <Scanner onScanned={handleScanned} onClose={() => setShowScanner(false)} />
      </div>
    );
  }

  return (
    <div>
      {/* Denní tržba */}
      <div className="hero-card mb-4" style={{ padding: 16 }}>
        <div className="flex justify-between items-start">
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {t("kasa.trzbaDnes")}
            </p>
            <p style={{ fontSize: 30, fontWeight: 800, color: "white", lineHeight: 1.1, marginTop: 2 }}>
              {trzba.toLocaleString(dateLocale)} Kč
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
              {pocet === 1 ? t("kasa.uctenka1") : t("kasa.uctenek").replace("{n}", String(pocet))}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end", maxWidth: 200 }}>
            <button onClick={() => setShowNumpad(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 12, fontSize: 12, fontWeight: 600, color: "white", background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>
              <Calculator size={14} /> {t("kasa.numpad")}
            </button>
            <button onClick={() => setShowScanner(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 12, fontSize: 12, fontWeight: 600, color: "white", background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>
              <ScanLine size={14} /> {t("kasa.skenovat")}
            </button>
            {/* Zaměstnanec: místo Správy nabídky tlačítko Odemknout (majitel zadá PIN).
                Správa mění ceny → v režimu zaměstnance skrytá. */}
            {zamestnanec ? (
              <EmployeeUnlockButton />
            ) : (
              <button onClick={() => setShowSprava(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 12, fontSize: 12, fontWeight: 600, color: "white", background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>
                <Settings2 size={14} /> {t("kasa.spravaMenu")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nic k prodeji → onboarding */}
      {nicKProdeji ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "var(--green-light)" }}>
            <ShoppingCart size={32} style={{ color: "var(--green-primary)" }} strokeWidth={1.5} />
          </div>
          <div className="text-center" style={{ maxWidth: 320 }}>
            <p className="font-bold text-lg mb-1" style={{ color: "var(--text-primary)" }}>{t("kasa.skladPrazdny")}</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>{t("kasa.skladPrazdnyDesc")}</p>
          </div>
          <button className="btn-primary" style={{ width: "auto", paddingLeft: 24, paddingRight: 24 }} onClick={() => setShowSprava(true)}>
            <Plus size={16} /> {t("kasa.pridatPrvni")}
          </button>
        </div>
      ) : (
        <>
          {/* Pult — dlaždice ze skladu (obchod) + z nabídky (restaurace), po kategoriích */}
          <div style={{ marginBottom: cartPocet > 0 ? 180 : 24 }}>
            <DlazdiceSekce
              titulek={t("kasa.sekce.menu")}
              show={aktivniMenu.length > 0}
              dlazdice={aktivniMenu.map((m) => {
                const prodano = m.vazbaTyp === "porce" && m.navarenoDatum === dnes ? (m.prodanoDnes ?? 0) : 0;
                return {
                  key: `menu:${m.id}`, nazev: m.nazev, cena: m.cena, cenaChybi: false, foto: m.fotoUrl,
                  zbyva: m.vazbaTyp === "porce" ? getZbyvaPorci(m.id) : undefined,
                  prodano: m.vazbaTyp === "porce" ? prodano : undefined,
                };
              })}
              cart={cart}
              onPridat={pridat}
              dateLocale={dateLocale}
              t={t}
            />
            {/* Sklad seskupený podle 8 kategorií */}
            {INVENTURA_KATEGORIE.map((kat) => {
              const vKat = skladProdej.filter((p) => p.kategorie === kat.id);
              if (vKat.length === 0) return null;
              return (
                <DlazdiceSekce
                  key={kat.id}
                  titulek={`${kat.emoji} ${t(`provoz.kat.${kat.id}`)}`}
                  show
                  dlazdice={vKat.map((p) => ({
                    key: `sklad:${p.id}`,
                    nazev: p.nazev,
                    cena: p.prodejniCena ?? p.cenaJednotka ?? 0,
                    cenaChybi: (p.prodejniCena ?? p.cenaJednotka) == null,
                    foto: p.fotoUrl,
                  }))}
                  cart={cart}
                  onPridat={pridat}
                  dateLocale={dateLocale}
                  t={t}
                />
              );
            })}
            {skrytychPocet > 0 && (
              <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 8, textAlign: "center" }}>
                {t("kasa.skrytoInfo").replace("{n}", String(skrytychPocet))} · <button onClick={() => setShowSprava(true)} style={{ color: "var(--green-primary)", fontWeight: 600 }}>{t("kasa.spravovatSkryte")}</button>
              </p>
            )}
          </div>

          {/* Historie dnešních prodejů */}
          <div style={{ marginBottom: cartPocet > 0 ? 0 : 24 }}>
            <p className="text-xs font-semibold uppercase mb-2 px-1" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}>
              {t("kasa.historieDnes")}
            </p>
            {prodejeDnes.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--text-tertiary)", padding: "8px 4px" }}>{t("kasa.zadneProdeje")}</p>
            ) : (
              <div className="card overflow-hidden">
                {prodejeDnes.map((p, idx) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: idx < prodejeDnes.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <Receipt size={16} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                        {new Date(p.datum).toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })} · {p.celkem.toLocaleString(dateLocale)} Kč
                      </p>
                      <p style={{ fontSize: 11, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.radky.map((r) => `${r.mnozstvi}× ${r.nazev}`).join(", ")}
                      </p>
                    </div>
                    <button onClick={() => { if (confirm(t("kasa.stornoQ"))) stornoProdejka(p.id); }}
                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 9px", borderRadius: 9, fontSize: 11, fontWeight: 600, color: "#C0392B", background: "#FDE8E8", flexShrink: 0 }}>
                      <RotateCcw size={12} /> {t("kasa.storno")}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Fixní košík dole */}
      {cartPocet > 0 && (
        <div style={{
          position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 90,
          background: "var(--bg-primary)", borderTop: "1px solid var(--border)",
          padding: "12px 20px", paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.12)",
        }}>
          <div style={{ maxWidth: 720, margin: "0 auto", width: "100%" }}>
          <div style={{ maxHeight: 140, overflowY: "auto", marginBottom: 10 }}>
            {Object.entries(cart).map(([key, q]) => {
              const nazev = nazevDlazdice(key);
              if (!nazev) return null;
              const cena = cenaDlazdice(key);
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0" }}>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{nazev}</span>
                  <button onClick={() => ubrat(key)} style={{ width: 28, height: 28, borderRadius: 8, background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Minus size={14} style={{ color: "var(--text-secondary)" }} />
                  </button>
                  <span style={{ minWidth: 22, textAlign: "center", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{q}</span>
                  <button onClick={() => pridat(key)} style={{ width: 28, height: 28, borderRadius: 8, background: "var(--green-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Plus size={14} style={{ color: "var(--green-primary)" }} />
                  </button>
                  <span style={{ minWidth: 64, textAlign: "right", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{(cena * q).toLocaleString(dateLocale)} Kč</span>
                </div>
              );
            })}
            {/* Volné položky z numpadu */}
            {volne.map((v) => (
              <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0" }}>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{v.nazev} {v.mnozstvi > 1 ? `${v.mnozstvi}×` : ""}</span>
                <button onClick={() => ubratVolnou(v.id)} style={{ width: 28, height: 28, borderRadius: 8, background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Trash2 size={13} style={{ color: "var(--text-secondary)" }} />
                </button>
                <span style={{ minWidth: 64, textAlign: "right", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{(v.cena * v.mnozstvi).toLocaleString(dateLocale)} Kč</span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8 }}>
            {t("kasa.celkem")}: <span style={{ color: "var(--text-primary)", fontSize: 16 }}>{cartCelkem.toLocaleString(dateLocale)} Kč</span>
          </div>

          {/* Volitelné: kolik zákazník dal hotově → spočítej vrácení */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)", flexShrink: 0 }}>{t("kasa.prijato")}</span>
            <input
              type="number" inputMode="decimal" value={prijato}
              onChange={(e) => setPrijato(e.target.value)}
              placeholder="—"
              style={{ flex: 1, minWidth: 0, textAlign: "right", padding: "8px 12px", borderRadius: 12, fontSize: 15, fontWeight: 700, border: "1.5px solid var(--border)", background: "white", outline: "none", color: "var(--text-primary)" }}
            />
            <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Kč</span>
          </div>
          {(() => {
            const p = parseFloat(prijato);
            if (isNaN(p) || prijato.trim() === "") return null;
            const rozdil = p - cartCelkem;
            const vraci = rozdil >= 0;
            return (
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 14px", borderRadius: 12, marginBottom: 10,
                background: vraci ? "var(--green-light)" : "#FDE8E8",
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: vraci ? "var(--green-dark)" : "#C0392B" }}>
                  {vraci ? t("kasa.vratit") : t("kasa.chybi")}
                </span>
                <span style={{ fontSize: 20, fontWeight: 800, color: vraci ? "var(--green-dark)" : "#C0392B" }}>
                  {Math.abs(rozdil).toLocaleString(dateLocale)} Kč
                </span>
              </div>
            );
          })()}

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => { setCart({}); setVolne([]); setNasobic(1); }} style={{ width: 46, height: 50, borderRadius: 14, background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Trash2 size={18} style={{ color: "var(--text-secondary)" }} />
            </button>
            <button onClick={() => zaplatit("hotovost")}
              style={{ flex: 1, height: 50, borderRadius: 14, background: "var(--green-primary)", color: "white", fontSize: 15, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Banknote size={19} /> {t("kasa.hotove")}
            </button>
            <button onClick={() => zaplatit("karta")}
              style={{ flex: 1, height: 50, borderRadius: 14, background: "var(--green-dark)", color: "white", fontSize: 15, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <CreditCard size={19} /> {t("kasa.kartou")}
            </button>
          </div>
          </div>
        </div>
      )}

      {/* Numpad */}
      {showNumpad && (
        <NumpadModal
          nasobic={nasobic}
          setNasobic={setNasobic}
          onKod={najdiPodleKodu}
          onVolna={pridatVolnou}
          onClose={() => setShowNumpad(false)}
          t={t}
          dateLocale={dateLocale}
        />
      )}

      {/* Toast po zaplacení */}
      {toast && (
        <div style={{ position: "fixed", left: "50%", bottom: 90, transform: "translateX(-50%)", zIndex: 300, background: "var(--green-primary)", color: "white", padding: "12px 20px", borderRadius: 14, fontSize: 14, fontWeight: 700, boxShadow: "0 6px 24px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <span>{toast}</span>
          <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.9 }}>{t("kasa.odectenoZeSkladu")}</span>
        </div>
      )}
    </div>
  );
}
