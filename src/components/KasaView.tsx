"use client";

import { useState, useMemo } from "react";
import {
  Plus, X, Minus, Trash2, ShoppingCart, Check, Pencil,
  Settings2, Receipt, RotateCcw, Package, Soup, Ban, ScanLine, EyeOff, Eye, Calculator,
  Banknote, CreditCard, UtensilsCrossed, GraduationCap, UserRound, SplitSquareHorizontal, ChefHat,
} from "lucide-react";
import {
  useKasaStore, MenuPolozka, MenuVazbaTyp, CartItem, ZpusobPlatby, formatCisloUctenky,
} from "@/store/kasaStore";
import { useProvozStore, INVENTURA_KATEGORIE } from "@/store/provozStore";
import { useRecipeStore } from "@/store/recipeStore";
import { useBusinessStore } from "@/store/businessStore";
import { useEmployeeStore, useJeZamestnanec } from "@/store/employeeStore";
import { EmployeeUnlockButton } from "@/components/EmployeeLock";
import { Scanner } from "@/components/Scanner";
import { lookupProductByEAN } from "@/lib/productLookup";
import { useT, useLocale } from "@/lib/i18n";
import { Capacitor } from "@capacitor/core";
import { najdiTiskarny, najdiSitoveTiskarny, tiskUctenky, TiskarnaTyp } from "@/lib/tiskUctenky";
import { skenZvuk } from "@/lib/skenZvuk";
import { useStaffStore, useAktivniJmeno } from "@/store/staffStore";
import { useTicketStore, hadejPracoviste } from "@/store/ticketStore";

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
    <div className="provoz-modal" style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
      <div className="relative rounded-t-3xl px-5 pt-5 pb-8 space-y-4 animate-slide-up provoz-modal-card"
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
          {/* Zdůraznění: volbu má KAŽDÁ položka (jídla i nápoje), jinak se sklad neodečítá. */}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "9px 11px", borderRadius: 12, background: "#FFF7ED", border: "1px solid #FCD9A8", marginBottom: 10 }}>
            <span style={{ fontSize: 14, lineHeight: 1.3, flexShrink: 0 }}>💡</span>
            <span style={{ fontSize: 11.5, lineHeight: 1.4, color: "#8A5A17" }}>{t("kasa.jakOdecistHint")}</span>
          </div>
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
          polozky.length === 0 ? (
            <div className="animate-fade-in" style={{ padding: "12px 14px", borderRadius: 12, background: "#FFF3D6", border: "1.5px solid #F0C24B" }}>
              <p style={{ fontSize: 13, color: "#7a4f00", fontWeight: 700, margin: 0 }}>{t("kasa.skladPrazdnyVazba")}</p>
              <p style={{ fontSize: 12, color: "#9a6a1a", margin: "3px 0 0", lineHeight: 1.4 }}>{t("kasa.skladPrazdnyVazbaHint")}</p>
            </div>
          ) : (
          <div className="flex gap-3 animate-fade-in">
            <div style={{ flex: 2, minWidth: 0 }}>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("kasa.vyberSklad")}</label>
              <select value={polozkaId} onChange={(e) => setPolozkaId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none"
                style={{ border: "1.5px solid var(--border)", background: "white", color: polozkaId ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                <option value="">{t("kasa.vyberSkladPrazdno")}</option>
                {polozky.map((p) => <option key={p.id} value={p.id}>{p.nazev} ({p.jednotka}) · skladem {p.aktualniStav}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-tertiary)" }}>{t("kasa.odbet")}</label>
              <input type="number" inputMode="decimal" value={odbet} onChange={(e) => setOdbet(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl text-sm outline-none text-center"
                style={{ border: "1.5px solid var(--border)", background: "white", color: "var(--text-primary)" }} />
            </div>
          </div>
          )
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
// ── Modal: dělení účtu (restaurace) ─────────────────────────────────────────
// Dvě věci, které obsluha reálně potřebuje:
//  1) Rozpočet na N osob — kolik platí každý (jen kalkulačka, nemění zápis).
//  2) Dělená platba — část hotově, část kartou (uloží se rozpis pro účetnictví).
function RozdelitModal({ celkem, dateLocale, onZaplatitDeleno, onClose, t }: {
  celkem: number;
  dateLocale: string;
  onZaplatitDeleno: (hotovost: number, karta: number) => void;
  onClose: () => void;
  t: (k: string) => string;
}) {
  const [osoby, setOsoby] = useState(2);
  const [hotovost, setHotovost] = useState(""); // kolik z celku platí hotově; zbytek kartou
  const hot = Math.min(Math.max(0, parseFloat(hotovost.replace(",", ".")) || 0), celkem);
  const kartou = Math.max(0, celkem - hot);
  const naOsobu = osoby > 0 ? celkem / osoby : celkem;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 260, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div className="sheet-overlay animate-fade-in" onClick={onClose} style={{ position: "absolute", inset: 0 }} />
      <div className="relative animate-slide-up rounded-t-3xl overflow-hidden" onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--bg-primary)", maxHeight: "88dvh" }}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} /></div>
        <div className="overflow-y-auto px-5 pt-2" style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))" }}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{t("kasa.rozdelit.titul")}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--border)" }}>
              <X size={16} style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 18 }}>
            {t("kasa.celkem")}: <b style={{ color: "var(--text-primary)" }}>{celkem.toLocaleString(dateLocale)} Kč</b>
          </p>

          {/* 1) Rozpočet na osoby */}
          <div style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: 16, padding: 16, marginBottom: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>{t("kasa.rozdelit.naOsoby")}</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 10 }}>
              <button onClick={() => setOsoby((o) => Math.max(1, o - 1))} style={{ width: 40, height: 40, borderRadius: 12, background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}><Minus size={18} /></button>
              <span style={{ fontSize: 26, fontWeight: 800, minWidth: 40, textAlign: "center", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{osoby}</span>
              <button onClick={() => setOsoby((o) => Math.min(20, o + 1))} style={{ width: 40, height: 40, borderRadius: 12, background: "var(--green-light)", display: "flex", alignItems: "center", justifyContent: "center", border: "none" }}><Plus size={18} style={{ color: "var(--green-primary)" }} /></button>
            </div>
            <div style={{ textAlign: "center", padding: "10px", borderRadius: 12, background: "var(--green-light)" }}>
              <span style={{ fontSize: 13, color: "var(--green-dark)" }}>{t("kasa.rozdelit.kazdy")} </span>
              <span style={{ fontSize: 22, fontWeight: 800, color: "var(--green-dark)", fontVariantNumeric: "tabular-nums" }}>{naOsobu.toLocaleString(dateLocale, { maximumFractionDigits: 2 })} Kč</span>
            </div>
          </div>

          {/* 2) Dělená platba hotovost / karta */}
          <div style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>{t("kasa.rozdelit.platba")}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)", flexShrink: 0, width: 70 }}>{t("kasa.hotove")}</span>
              <input type="number" inputMode="decimal" value={hotovost} onChange={(e) => setHotovost(e.target.value)} placeholder="0"
                style={{ flex: 1, minWidth: 0, textAlign: "right", padding: "9px 12px", borderRadius: 12, fontSize: 15, fontWeight: 700, border: "1.5px solid var(--border)", background: "var(--bg-primary)", outline: "none", color: "var(--text-primary)" }} />
              <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Kč</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 12, background: "var(--bg-primary)" }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{t("kasa.rozdelit.zbytekKartou")}</span>
              <span style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{kartou.toLocaleString(dateLocale, { maximumFractionDigits: 2 })} Kč</span>
            </div>
          </div>

          <button onClick={() => onZaplatitDeleno(hot, kartou)} disabled={hot <= 0 && kartou <= 0} className="btn-primary">
            <Check size={18} /> {t("kasa.rozdelit.zaplatit")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: obsluha na směně (přihlášení + správa zaměstnanců) ───────────────
// Přihlášená obsluha se zapíše ke každé účtence i stornu → majitel vidí, kdo
// co udělal. Přidání/mazání zaměstnanců jen pro majitele (ne pro zaměstnance).
function ObsluhaModal({ onClose, zamestnanec, t }: { onClose: () => void; zamestnanec: boolean; t: (k: string) => string }) {
  const zamestnanci = useStaffStore((s) => s.zamestnanci);
  const aktivniId = useStaffStore((s) => s.aktivniId);
  const prihlas = useStaffStore((s) => s.prihlas);
  const odhlas = useStaffStore((s) => s.odhlas);
  const pridej = useStaffStore((s) => s.pridej);
  const smaz = useStaffStore((s) => s.smaz);
  const [pridavam, setPridavam] = useState(false);
  const [noveJmeno, setNoveJmeno] = useState("");
  const [novePin, setNovePin] = useState("");

  const prihlasit = (id: string, jmeno: string) => {
    const pin = window.prompt(t("kasa.obsluha.zadejPin").replace("{n}", jmeno));
    if (pin == null) return;
    if (!prihlas(id, pin)) window.alert(t("kasa.obsluha.spatnyPin"));
    else onClose();
  };
  const ulozitNoveho = () => {
    if (!noveJmeno.trim() || novePin.trim().length < 4) return;
    pridej(noveJmeno.trim(), novePin.trim());
    setNoveJmeno(""); setNovePin(""); setPridavam(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 260, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div className="sheet-overlay animate-fade-in" onClick={onClose} style={{ position: "absolute", inset: 0 }} />
      <div className="relative animate-slide-up rounded-t-3xl overflow-hidden" onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--bg-primary)", maxHeight: "88dvh" }}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} /></div>
        <div className="overflow-y-auto px-5 pt-2" style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))" }}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{t("kasa.obsluha.titul")}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--border)" }}>
              <X size={16} style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 16 }}>{t("kasa.obsluha.popis")}</p>

          {zamestnanci.length === 0 && !pridavam && (
            <p style={{ fontSize: 13.5, color: "var(--text-tertiary)", textAlign: "center", padding: "8px 0 16px" }}>{t("kasa.obsluha.zadni")}</p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {zamestnanci.map((z) => {
              const aktivni = z.id === aktivniId;
              return (
                <div key={z.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 14, background: aktivni ? "var(--green-light)" : "white", border: `1.5px solid ${aktivni ? "var(--green-primary)" : "var(--border)"}` }}>
                  <UserRound size={18} style={{ color: aktivni ? "var(--green-primary)" : "var(--text-tertiary)", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{z.jmeno}</span>
                  {aktivni ? (
                    <button onClick={odhlas} style={{ padding: "6px 12px", borderRadius: 9, fontSize: 12.5, fontWeight: 700, background: "var(--green-primary)", color: "white", border: "none" }}>{t("kasa.obsluha.odhlasit")}</button>
                  ) : (
                    <button onClick={() => prihlasit(z.id, z.jmeno)} style={{ padding: "6px 12px", borderRadius: 9, fontSize: 12.5, fontWeight: 700, background: "white", color: "var(--green-dark)", border: "1.5px solid var(--green-primary)" }}>{t("kasa.obsluha.prihlasitBtn")}</button>
                  )}
                  {!zamestnanec && (
                    <button onClick={() => { if (window.confirm(t("kasa.obsluha.smazatQ").replace("{n}", z.jmeno))) smaz(z.id); }} style={{ width: 30, height: 30, borderRadius: 8, background: "#FDE8E8", display: "flex", alignItems: "center", justifyContent: "center", border: "none", flexShrink: 0 }}>
                      <Trash2 size={14} style={{ color: "#C0392B" }} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Přidání zaměstnance — jen majitel */}
          {!zamestnanec && (pridavam ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "14px", borderRadius: 14, background: "white", border: "1.5px solid var(--border)" }}>
              <input autoFocus value={noveJmeno} onChange={(e) => setNoveJmeno(e.target.value)} placeholder={t("kasa.obsluha.jmenoPlaceholder")}
                style={{ padding: "11px 14px", borderRadius: 12, fontSize: 15, border: "1.5px solid var(--border)", background: "var(--bg-primary)", outline: "none", color: "var(--text-primary)" }} />
              <input value={novePin} onChange={(e) => setNovePin(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder={t("kasa.obsluha.pinPlaceholder")}
                style={{ padding: "11px 14px", borderRadius: 12, fontSize: 15, border: "1.5px solid var(--border)", background: "var(--bg-primary)", outline: "none", color: "var(--text-primary)", letterSpacing: "0.2em" }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setPridavam(false); setNoveJmeno(""); setNovePin(""); }} style={{ flex: 1, padding: "10px", borderRadius: 12, fontSize: 14, fontWeight: 600, background: "var(--border)", color: "var(--text-secondary)", border: "none" }}>{t("kasa.obsluha.zrusit")}</button>
                <button onClick={ulozitNoveho} disabled={!noveJmeno.trim() || novePin.length < 4} style={{ flex: 1, padding: "10px", borderRadius: 12, fontSize: 14, fontWeight: 700, background: "var(--green-primary)", color: "white", border: "none", opacity: (!noveJmeno.trim() || novePin.length < 4) ? 0.5 : 1 }}>{t("kasa.obsluha.ulozit")}</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setPridavam(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "12px", borderRadius: 14, fontSize: 14, fontWeight: 700, background: "var(--green-light)", color: "var(--green-dark)", border: "1.5px dashed var(--green-primary)" }}>
              <Plus size={16} /> {t("kasa.obsluha.pridat")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Modal: rychlé založení nového zboží přímo z kasy ────────────────────────
// Otevře se, když obsluha naskenuje / zadá kód zboží, které ještě NENÍ ve skladu.
// Po uložení se položka založí do skladu (s počátečním počtem kusů) a rovnou
// se přidá na účtenku. Od té chvíle se prodej odečítá ze skladu automaticky.
function NovaSkladovaPolozka({
  initNazev, ean, onUlozit, onClose, t,
}: {
  initNazev: string;
  ean?: string;
  onUlozit: (d: { nazev: string; cena: number; pocet: number; kategorie: string; ean?: string }) => void;
  onClose: () => void;
  t: (k: string) => string;
}) {
  const [nazev, setNazev] = useState(initNazev);
  const [cena, setCena] = useState("");
  const [pocet, setPocet] = useState("1");
  const [kategorie, setKategorie] = useState<string>("ostatni");

  const ulozit = () => {
    const c = parseFloat(cena.replace(",", "."));
    const p = parseInt(pocet, 10);
    onUlozit({
      nazev: nazev.trim(),
      cena: isNaN(c) ? 0 : c,
      pocet: isNaN(p) || p < 0 ? 0 : p,
      kategorie,
      ean,
    });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 14, fontSize: 15,
    border: "1.5px solid var(--border)", background: "white", outline: "none", color: "var(--text-primary)",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 260, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div className="sheet-overlay animate-fade-in" onClick={onClose} style={{ position: "absolute", inset: 0 }} />
      <div className="relative animate-slide-up rounded-t-3xl overflow-hidden" onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--bg-primary)", maxHeight: "90dvh" }}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
        </div>
        <div className="overflow-y-auto px-5 pt-2" style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))" }}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{t("kasa.nove.titul")}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--border)" }}>
              <X size={16} style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 16 }}>{t("kasa.nove.popis")}</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", display: "block", marginBottom: 5 }}>{t("kasa.nove.nazev")}</label>
              <input autoFocus value={nazev} onChange={(e) => setNazev(e.target.value)} placeholder={t("kasa.nove.nazevPlaceholder")} style={inputStyle} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", display: "block", marginBottom: 5 }}>{t("kasa.nove.cena")}</label>
                <input value={cena} onChange={(e) => setCena(e.target.value)} inputMode="decimal" placeholder="0" style={{ ...inputStyle, textAlign: "right", fontWeight: 700 }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", display: "block", marginBottom: 5 }}>{t("kasa.nove.pocet")}</label>
                <input value={pocet} onChange={(e) => setPocet(e.target.value)} inputMode="numeric" placeholder="1" style={{ ...inputStyle, textAlign: "right", fontWeight: 700 }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", display: "block", marginBottom: 5 }}>{t("kasa.nove.kategorie")}</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                {INVENTURA_KATEGORIE.map((k) => {
                  const active = kategorie === k.id;
                  return (
                    <button key={k.id} onClick={() => setKategorie(k.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 12, fontSize: 13, fontWeight: active ? 700 : 500,
                        textAlign: "left", background: active ? "var(--green-light)" : "white",
                        border: `1.5px solid ${active ? "var(--green-primary)" : "var(--border)"}`,
                        color: active ? "var(--green-dark)" : "var(--text-primary)",
                      }}>
                      <span>{k.emoji}</span> {k.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <button onClick={ulozit} disabled={!nazev.trim()} className="btn-primary" style={{ opacity: nazev.trim() ? 1 : 0.5, marginTop: 4 }}>
              <Check size={17} /> {t("kasa.nove.ulozit")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const addPolozka = useProvozStore((s) => s.addPolozka);
  const jeObchod = useBusinessStore((s) => s.typProvozu) === "obchod";
  // Zaměstnanec (skrytí správy nabídky/cen) = lokální PIN-zámek NEBO cloud role.
  const zamestnanec = useJeZamestnanec();
  // Lokální PIN-zámek zvlášť — jen u něj má smysl tlačítko „Odemknout" (PIN).
  const lokalniZamek = useEmployeeStore((s) => s.enabled && s.locked);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [volne, setVolne] = useState<{ id: string; nazev: string; cena: number; mnozstvi: number }[]>([]);
  const [showSprava, setShowSprava] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showNumpad, setShowNumpad] = useState(false);
  // Rychlé založení nového zboží (kód/PLU/název, který není ve skladu).
  // Předvyplní se název (z katalogu) a EAN, obsluha doplní cenu + počet.
  const [novaPolozka, setNovaPolozka] = useState<{ nazev: string; ean?: string } | null>(null);
  const [showObsluha, setShowObsluha] = useState(false); // modál přihlášení obsluhy na směnu
  const aktivniObsluha = useAktivniJmeno(); // jméno přihlášené obsluhy (odpovědnost)
  const [showRozdelit, setShowRozdelit] = useState(false); // modál dělení účtu (platba / na osoby)
  const odeslatTickety = useTicketStore((s) => s.odeslat); // odeslání objednávky na bar/kuchyni
  const [odeslano, setOdeslano] = useState(false); // aktuální košík už poslán na přípravu?
  const [nasobic, setNasobic] = useState(1); // množství, které se přidá k dalšímu kliknutému zboží
  const [prijato, setPrijato] = useState(""); // kolik zákazník dal hotově (volitelné → počítá vrácení)
  const [toast, setToast] = useState<string | null>(null);
  // Tréninkový režim: obsluha si nacvičí prodej, ale NIC se nezapíše do tržby
  // ani neodečte ze skladu. Uloženo v localStorage, ať přežije reload.
  const [trenink, setTreninkState] = useState<boolean>(() => {
    try { return localStorage.getItem("kasa-trenink") === "1"; } catch { return false; }
  });
  const setTrenink = (v: boolean) => {
    setTreninkState(v);
    try { localStorage.setItem("kasa-trenink", v ? "1" : "0"); } catch {}
  };
  // Tisk účtenky (BETA, jen v appce) — po prodeji nabídneme vytisknout.
  const firma = useBusinessStore((s) => s.firma);
  const nazevFirmy = useBusinessStore((s) => s.name);
  const jeNativni = Capacitor.isNativePlatform();
  const [tiskProdejkaId, setTiskProdejkaId] = useState<string | null>(null);
  const [tiskStav, setTiskStav] = useState<"idle" | "hledam" | "tisknu">("idle");
  const [tiskarny, setTiskarny] = useState<{ name: string; address: string }[]>([]);
  // Typ tiskárny: bluetooth / wifi / pdf (uloží se pro příště).
  const [tiskTyp, setTiskTyp] = useState<TiskarnaTyp>(() => {
    try { return (localStorage.getItem("tisk-typ") as TiskarnaTyp) || "bluetooth"; } catch { return "bluetooth"; }
  });
  const [rucniIp, setRucniIp] = useState(() => { try { return localStorage.getItem("tisk-wifi-ip") || ""; } catch { return ""; } });

  const dnes = dnesISO();
  const trzba = getTrzbaDne(dnes);
  const pocet = getPocetProdejekDne(dnes);
  const prodejeDnes = prodejky.filter((p) => p.datum.slice(0, 10) === dnes);

  // ── Dlaždice ze DVOU zdrojů ───────────────────────────────────────────────
  // Klíč košíku i dlaždice: "sklad:<polozkaId>" nebo "menu:<menuId>".
  // Cena skladové dlaždice = prodejniCena, fallback nákupní cenaJednotka.
  //
  // Obchod: sklad = zboží k prodeji → na kase ukážeme VŠECHNO (kromě ručně skrytého).
  // Restaurace: sklad = SUROVINY (mouka, cibule, maso) — ty se neprodávají přímo,
  // slouží jen k odečtu přes recept. Na kase proto ukážeme jen skladové položky,
  // které mají nastavenou PRODEJNÍ cenu (typicky nápoje, které chce majitel
  // markovat kusově). Surovina bez prodejní ceny se do kasy necpe.
  const skladProdej = polozky.filter((p) =>
    !p.skrytoZKasy && (jeObchod || (p.prodejniCena != null && p.prodejniCena > 0))
  );
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
    if (p) { pridat(`sklad:${p.id}`); skenZvuk("ok"); setToast(t("kasa.skenPridano").replace("{n}", p.nazev)); setTimeout(() => setToast(null), 2000); return true; }
    const m = menu.find((x) => x.plu === k);
    if (m) { pridat(`menu:${m.id}`); skenZvuk("ok"); setToast(t("kasa.skenPridano").replace("{n}", m.nazev)); setTimeout(() => setToast(null), 2000); return true; }
    // Kód není ve skladu ani v nabídce → chybový tón + nabídni založit nové zboží.
    // Delší číselné kódy bývají EAN (předvyplníme), krátké spíš PLU (nepředvyplňujeme).
    skenZvuk("chyba");
    setNovaPolozka({ nazev: "", ean: k.length >= 8 ? k : undefined });
    return true;
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

  // „To samé znovu" — naplní košík poslední (nejnovější) běžnou účtenkou.
  // Fronta u pekárny/kavárny je z velké části stejné objednávky, tak ať to
  // obsluha nemusí naklikávat znovu. Vrácenky (záporné) ignorujeme.
  const posledniUctenka = prodejky.find((p) => !p.vraceno && p.radky.length > 0);
  const opakovatPosledni = () => {
    if (!posledniUctenka) return;
    const novyCart: Record<string, number> = {};
    const novaVolna: { id: string; nazev: string; cena: number; mnozstvi: number }[] = [];
    posledniUctenka.radky.forEach((r, i) => {
      if (r.polozkaId) novyCart[`sklad:${r.polozkaId}`] = (novyCart[`sklad:${r.polozkaId}`] ?? 0) + r.mnozstvi;
      else if (r.menuId) novyCart[`menu:${r.menuId}`] = (novyCart[`menu:${r.menuId}`] ?? 0) + r.mnozstvi;
      else novaVolna.push({ id: `op-${i}-${r.nazev}`, nazev: r.nazev, cena: r.cena, mnozstvi: r.mnozstvi });
    });
    setCart(novyCart);
    setVolne(novaVolna);
    setPrijato("");
    setToast(t("kasa.opakovanoToast"));
    setTimeout(() => setToast(null), 2000);
  };

  // Sken v kase: najdi skladovou položku podle EAN → přidej do košíku.
  // Když zboží ve skladu není, nabídneme ho rovnou založit (předvyplníme
  // název z katalogu, když ho známe, a EAN pro příští sken).
  const handleScanned = async (ean: string) => {
    setShowScanner(false);
    let p = polozky.find((x) => x.ean === ean);
    let katalogNazev: string | undefined;
    if (!p) {
      const prod = await lookupProductByEAN(ean).catch(() => null);
      katalogNazev = prod?.product_name;
      p = katalogNazev ? polozky.find((x) => x.nazev.toLowerCase().trim() === katalogNazev!.toLowerCase().trim()) : undefined;
    }
    if (p) {
      pridat(`sklad:${p.id}`);
      skenZvuk("ok");
      setToast(t("kasa.skenPridano").replace("{n}", p.nazev));
      setTimeout(() => setToast(null), 2500);
    } else {
      // Není ve skladu → chybový tón + otevři rychlé založení.
      skenZvuk("chyba");
      setNovaPolozka({ nazev: katalogNazev ?? "", ean });
    }
  };

  // Založí nové zboží do skladu a rovnou ho přidá na účtenku. Volá se z modálu
  // rychlého založení (sken/PLU neznámého kódu). Sklad a kasa jsou tak propojené
  // i směrem „přidání z kasy → sklad".
  const zalozitNove = (data: { nazev: string; cena: number; pocet: number; kategorie: string; ean?: string }) => {
    const nazev = data.nazev.trim();
    if (!nazev) return;
    // TRÉNINK: nezakládat do skladu. Přidej jen jako volnou položku do košíku,
    // ať si obsluha nácvik odbavení vyzkouší, ale sklad zůstane nedotčený.
    if (trenink) {
      setVolne((v) => [...v, { id: `trenink-${v.length}-${nazev}`, nazev, cena: data.cena > 0 ? data.cena : 0, mnozstvi: data.pocet > 0 ? data.pocet : 1 }]);
      setNovaPolozka(null);
      setToast(t("kasa.treninkZbozi").replace("{n}", nazev));
      setTimeout(() => setToast(null), 2500);
      return;
    }
    addPolozka({
      nazev,
      kategorie: data.kategorie as (typeof INVENTURA_KATEGORIE)[number]["id"],
      jednotka: "ks",
      aktualniStav: data.pocet,
      minZasoba: 0,
      prodejniCena: data.cena > 0 ? data.cena : undefined,
      ...(data.ean ? { ean: data.ean } : {}),
    });
    // Položka právě vznikla — najdi ji (unikátní podle EAN, jinak názvu) a přidej do košíku.
    const nova = useProvozStore.getState().polozky.find(
      (p) => (data.ean && p.ean === data.ean) || p.nazev.toLowerCase().trim() === nazev.toLowerCase(),
    );
    if (nova) pridat(`sklad:${nova.id}`);
    setNovaPolozka(null);
    setToast(t("kasa.nove.zalozeno").replace("{n}", nazev));
    setTimeout(() => setToast(null), 2500);
  };

  // Restaurace: odeslat objednávku na přípravu (bar/kuchyně) BEZ platby.
  // Roztřídí košík podle pracoviště menu položky (nebo hádá dle kategorie).
  const odeslatNaPripravu = () => {
    const radky: { nazev: string; mnozstvi: number; pracoviste: "kuchyne" | "bar" }[] = [];
    Object.entries(cart).forEach(([key, mnozstvi]) => {
      const [typ, id] = key.split(":");
      if (typ === "menu") {
        const m = menu.find((x) => x.id === id);
        if (m) radky.push({ nazev: m.nazev, mnozstvi, pracoviste: m.pracoviste ?? hadejPracoviste(m.kategorie, m.nazev) });
      } else {
        // skladová dlaždice (nápoj ze skladu) → hádej podle názvu, typicky bar
        const pol = polozky.find((x) => x.id === id);
        if (pol) radky.push({ nazev: pol.nazev, mnozstvi, pracoviste: hadejPracoviste(pol.kategorie, pol.nazev) });
      }
    });
    volne.forEach((v) => radky.push({ nazev: v.nazev, mnozstvi: v.mnozstvi, pracoviste: hadejPracoviste(undefined, v.nazev) }));
    if (radky.length === 0) return;
    odeslatTickety(radky);
    setOdeslano(true);
    setToast(t("kasa.ticket.odeslano"));
    setTimeout(() => setToast(null), 2500);
  };

  const zaplatit = (platba: ZpusobPlatby, rozpisPlatby?: { hotovost: number; karta: number }) => {
    const items: CartItem[] = Object.entries(cart).map(([key, mnozstvi]) => {
      const [typ, id] = key.split(":");
      return typ === "sklad" ? { polozkaId: id, mnozstvi } : { menuId: id, mnozstvi };
    });
    volne.forEach((v) => items.push({ volnaCena: v.cena, volnaNazev: v.nazev, mnozstvi: v.mnozstvi }));
    const castka = cartCelkem;

    // TRÉNINK: nic se nezapíše ani neodečte ze skladu — jen vyčisti košík a
    // potvrď, že to byl nácvik. prodat() se vůbec nezavolá.
    if (trenink) {
      if (castka <= 0 && items.length === 0) return;
      setCart({});
      setVolne([]);
      setNasobic(1);
      setPrijato("");
      setShowRozdelit(false);
      setOdeslano(false);
      setToast(t("kasa.treninkProdej").replace("{n}", castka.toLocaleString(dateLocale)));
      setTimeout(() => setToast(null), 2500);
      return;
    }

    const id = prodat(items, platba, rozpisPlatby);
    if (id) {
      setCart({});
      setVolne([]);
      setNasobic(1);
      setPrijato("");
      setShowRozdelit(false);
      setOdeslano(false);
      setToast(t("kasa.zaplaceno").replace("{n}", castka.toLocaleString(dateLocale)));
      setTimeout(() => setToast(null), 2500);
      // V appce nabídni tisk účtenky (BETA). Na webu tisk není.
      if (jeNativni) setTiskProdejkaId(id);
    }
  };

  // Ulož zvolený typ tiskárny pro příště.
  const zmenTyp = (typ: TiskarnaTyp) => {
    setTiskTyp(typ);
    setTiskarny([]);
    try { localStorage.setItem("tisk-typ", typ); } catch {}
  };

  // Hledání tiskáren podle typu: BT sken / síťový sken. PDF hledání nepotřebuje.
  const spustitHledaniTiskaren = async () => {
    setTiskStav("hledam");
    const found = tiskTyp === "wifi" ? await najdiSitoveTiskarny() : await najdiTiskarny();
    setTiskarny(found);
    setTiskStav("idle");
  };

  // Vytiskne účtenku daným typem. target = BT adresa / WiFi IP / (PDF nic).
  const vytisknout = async (target?: string) => {
    const prodejka = prodejky.find((p) => p.id === tiskProdejkaId);
    if (!prodejka) return;
    if (tiskTyp === "wifi" && target) { try { localStorage.setItem("tisk-wifi-ip", target); } catch {} }
    setTiskStav("tisknu");
    const res = await tiskUctenky(
      {
        nazevFirmy: nazevFirmy || "",
        firma: { ico: firma.ico, dic: firma.dic, adresa: firma.adresa, telefon: firma.telefon, patickaUctenky: firma.patickaUctenky },
        radky: prodejka.radky.map((r) => ({ nazev: r.nazev, mnozstvi: r.mnozstvi, cena: r.cena })),
        celkem: prodejka.celkem,
        platba: prodejka.platba,
        datum: prodejka.datum,
        cislo: formatCisloUctenky(prodejka.cislo),
        vraceno: prodejka.vraceno,
      },
      tiskTyp,
      target,
    );
    setTiskStav("idle");
    if (res.ok) {
      setToast(t("kasa.tiskHotovo"));
      setTiskProdejkaId(null);
    } else {
      setToast(t("kasa.tiskChyba"));
    }
    setTimeout(() => setToast(null), 2500);
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
    <div className="kasa-root">
      {/* Hlavní sloupec (produkty + historie). Na PC vlevo, košík vpravo. */}
      <div className="kasa-main">
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
            {/* Zaměstnanec: Správa nabídky (mění ceny) skrytá. U lokálního PIN-zámku
                nabídneme Odemknout (majitel zadá PIN); u cloud role se nezobrazí
                nic (zaměstnanec je zaměstnanec, neodemyká se). */}
            {zamestnanec ? (
              lokalniZamek ? <EmployeeUnlockButton /> : null
            ) : (
              <button onClick={() => setShowSprava(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 12, fontSize: 12, fontWeight: 600, color: "white", background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>
                <Settings2 size={14} /> {t("kasa.spravaMenu")}
              </button>
            )}
            {/* Přepínač tréninkového režimu — jen majitel (ne zaměstnanec). */}
            {!zamestnanec && (
              <button onClick={() => setTrenink(!trenink)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 12, fontSize: 12, fontWeight: 700, color: trenink ? "#8a5a00" : "white", background: trenink ? "#FFD98A" : "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>
                <GraduationCap size={14} /> {t("kasa.trenink")}
              </button>
            )}
            {/* Obsluha na směně — jméno se zapíše ke každé účtence i stornu. */}
            <button onClick={() => setShowObsluha(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 12, fontSize: 12, fontWeight: 600, color: "white", background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>
              <UserRound size={14} /> {aktivniObsluha || t("kasa.obsluha.prihlasit")}
            </button>
          </div>
        </div>
      </div>

      {/* Banner tréninkového režimu — jasně viditelný, ať se prodej neplete s ostrým */}
      {trenink && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: "#FFF3D6", border: "1.5px solid #F0C24B", marginBottom: 16 }}>
          <GraduationCap size={18} style={{ color: "#8a5a00", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#7a4f00", margin: 0 }}>{t("kasa.treninkBanner")}</p>
            <p style={{ fontSize: 11.5, color: "#9a6a1a", margin: "1px 0 0" }}>{t("kasa.treninkBannerDesc")}</p>
          </div>
          <button onClick={() => setTrenink(false)}
            style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 9, fontSize: 12, fontWeight: 700, background: "#8a5a00", color: "white", border: "none" }}>
            {t("kasa.treninkKonec")}
          </button>
        </div>
      )}

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
          {/* „To samé znovu" — jen když je košík prázdný a existuje poslední účet.
              Šetří klikání u opakujících se objednávek (pekárna, kavárna). */}
          {cartPocet === 0 && posledniUctenka && (
            <button onClick={opakovatPosledni}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "13px 16px", borderRadius: 14, marginBottom: 14, fontSize: 15, fontWeight: 700, color: "var(--green-dark)", background: "var(--green-light)", border: "1.5px solid var(--green-primary)" }}>
              <RotateCcw size={17} /> {t("kasa.opakovatPosledni")}
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--green-primary)", opacity: 0.85 }}>
                · {posledniUctenka.celkem.toLocaleString(dateLocale)} Kč
              </span>
            </button>
          )}

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
                        {p.cislo && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", marginLeft: 6, fontVariantNumeric: "tabular-nums" }}>#{formatCisloUctenky(p.cislo)}</span>}
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

      </div>{/* konec kasa-main */}

      {/* Košík. Na mobilu fixní panel dole, na PC pravý sloupec (viz CSS). */}
      {cartPocet > 0 && (
        <div className="kasa-cart" style={{
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

          {/* Rychlé bankovky — zákazník dal 200/500/1000… → jeden tap, kasa
              rovnou dopočítá vrácení. Nabídneme jen bankovky ≥ částka + „Přesně". */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            <button onClick={() => setPrijato(String(Math.ceil(cartCelkem)))}
              style={{ flex: "1 1 60px", padding: "8px 6px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: "var(--green-light)", color: "var(--green-dark)", border: "1.5px solid var(--green-primary)" }}>
              {t("kasa.presne")}
            </button>
            {[100, 200, 500, 1000, 2000].filter((b) => b >= cartCelkem).slice(0, 4).map((b) => (
              <button key={b} onClick={() => setPrijato(String(b))}
                style={{ flex: "1 1 60px", padding: "8px 6px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: "white", color: "var(--text-primary)", border: "1.5px solid var(--border)" }}>
                {b}
              </button>
            ))}
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

          {/* Odeslat na přípravu (bar/kuchyně) — jen restaurace. Pošle objednávku
              před platbou; jídlo jde do kuchyně, pití na bar. */}
          {!jeObchod && (
            <button onClick={odeslatNaPripravu} disabled={odeslano}
              style={{ width: "100%", height: 46, borderRadius: 14, marginBottom: 8, fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "1.5px solid var(--green-primary)",
                background: odeslano ? "var(--green-light)" : "white", color: "var(--green-dark)", opacity: odeslano ? 0.7 : 1 }}>
              <ChefHat size={17} /> {odeslano ? t("kasa.ticket.odeslanoBtn") : t("kasa.ticket.odeslat")}
            </button>
          )}

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => { setCart({}); setVolne([]); setNasobic(1); setOdeslano(false); }} style={{ width: 46, height: 50, borderRadius: 14, background: "var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Trash2 size={18} style={{ color: "var(--text-secondary)" }} />
            </button>
            {/* Rozdělit účet — jen restaurace (u obchodu se lidi nedělí o účet). */}
            {!jeObchod && (
              <button onClick={() => setShowRozdelit(true)} title={t("kasa.rozdelit.titul")}
                style={{ width: 46, height: 50, borderRadius: 14, background: "var(--green-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1.5px solid var(--green-primary)" }}>
                <SplitSquareHorizontal size={18} style={{ color: "var(--green-primary)" }} />
              </button>
            )}
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

      {/* Rychlé založení nového zboží (kód/PLU/sken mimo sklad) */}
      {novaPolozka && (
        <NovaSkladovaPolozka
          initNazev={novaPolozka.nazev}
          ean={novaPolozka.ean}
          onUlozit={zalozitNove}
          onClose={() => setNovaPolozka(null)}
          t={t}
        />
      )}

      {/* Přihlášení obsluhy na směnu + správa zaměstnanců */}
      {showObsluha && <ObsluhaModal onClose={() => setShowObsluha(false)} zamestnanec={zamestnanec} t={t} />}

      {/* Dělení účtu — platba hotovost+karta nebo rozpočet na N osob */}
      {showRozdelit && cartPocet > 0 && (
        <RozdelitModal
          celkem={cartCelkem}
          dateLocale={dateLocale}
          onZaplatitDeleno={(hotovost, karta) => zaplatit(karta >= hotovost ? "karta" : "hotovost", { hotovost, karta })}
          onClose={() => setShowRozdelit(false)}
          t={t}
        />
      )}

      {/* Tisk účtenky (BETA) — po zaplacení, jen v appce */}
      {tiskProdejkaId && (
        <div style={{ position: "fixed", inset: 0, zIndex: 320, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div onClick={() => setTiskProdejkaId(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />
          <div className="relative rounded-t-3xl px-5 pt-5 pb-10 animate-slide-up" style={{ background: "var(--bg-primary)", paddingBottom: "max(32px, env(safe-area-inset-bottom, 32px))" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{t("kasa.tiskTitul")}</h3>
              <span style={{ fontSize: 10, fontWeight: 800, color: "white", background: "#E8862E", padding: "2px 7px", borderRadius: 99, letterSpacing: "0.04em" }}>BETA</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 12px", lineHeight: 1.4 }}>{t("kasa.tiskBetaHint")}</p>

            {/* Přepínač typu tiskárny */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {([
                { id: "bluetooth" as const, label: t("kasa.tiskTypBt"), emoji: "🔵" },
                { id: "wifi" as const, label: t("kasa.tiskTypWifi"), emoji: "📶" },
                { id: "pdf" as const, label: t("kasa.tiskTypPdf"), emoji: "📄" },
              ]).map((o) => {
                const on = tiskTyp === o.id;
                return (
                  <button key={o.id} onClick={() => zmenTyp(o.id)}
                    style={{ flex: 1, padding: "8px 4px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                      background: on ? "var(--green-primary)" : "white", color: on ? "white" : "var(--text-secondary)",
                      border: `1.5px solid ${on ? "var(--green-primary)" : "var(--border)"}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <span style={{ fontSize: 16 }}>{o.emoji}</span>{o.label}
                  </button>
                );
              })}
            </div>

            {tiskStav === "hledam" && (
              <p style={{ fontSize: 14, color: "var(--text-secondary)", textAlign: "center", padding: "16px 0" }}>{t("kasa.tiskHledam")}</p>
            )}
            {tiskStav === "tisknu" && (
              <p style={{ fontSize: 14, color: "var(--text-secondary)", textAlign: "center", padding: "16px 0" }}>{t("kasa.tiskTisknu")}</p>
            )}

            {/* PDF: rovnou vytisknout (systémový dialog) */}
            {tiskStav === "idle" && tiskTyp === "pdf" && (
              <button onClick={() => vytisknout()} className="btn-primary" style={{ width: "100%" }}>
                {t("kasa.tiskPdfBtn")}
              </button>
            )}

            {/* WiFi: ruční IP + hledání */}
            {tiskStav === "idle" && tiskTyp === "wifi" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={rucniIp} onChange={(e) => setRucniIp(e.target.value)} placeholder="192.168.1.50"
                    inputMode="decimal"
                    style={{ flex: 1, padding: "10px 12px", borderRadius: 12, fontSize: 14, border: "1.5px solid var(--border)", background: "white", outline: "none", color: "var(--text-primary)" }} />
                  <button onClick={() => rucniIp.trim() && vytisknout(rucniIp.trim())} disabled={!rucniIp.trim()}
                    style={{ padding: "10px 16px", borderRadius: 12, background: "var(--green-primary)", color: "white", fontSize: 13, fontWeight: 700, opacity: rucniIp.trim() ? 1 : 0.5 }}>
                    {t("kasa.tiskVytisknout")}
                  </button>
                </div>
                {tiskarny.length > 0 && tiskarny.map((tp) => (
                  <button key={tp.address} onClick={() => vytisknout(tp.address)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 14, background: "white", border: "1.5px solid var(--border)", textAlign: "left" }}>
                    <span style={{ fontSize: 18 }}>🖨️</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{tp.name}</span>
                  </button>
                ))}
                <button onClick={spustitHledaniTiskaren} style={{ fontSize: 13, color: "var(--green-dark)", fontWeight: 600, padding: "8px 0" }}>
                  {t("kasa.tiskNajdiSit")}
                </button>
              </div>
            )}

            {/* Bluetooth: sken + seznam */}
            {tiskStav === "idle" && tiskTyp === "bluetooth" && tiskarny.length === 0 && (
              <button onClick={spustitHledaniTiskaren} className="btn-primary" style={{ width: "100%" }}>
                {t("kasa.tiskNajdi")}
              </button>
            )}
            {tiskStav === "idle" && tiskTyp === "bluetooth" && tiskarny.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {tiskarny.map((tp) => (
                  <button key={tp.address} onClick={() => vytisknout(tp.address)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 14, background: "white", border: "1.5px solid var(--border)", textAlign: "left" }}>
                    <span style={{ fontSize: 18 }}>🖨️</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{tp.name}</span>
                  </button>
                ))}
                <button onClick={spustitHledaniTiskaren} style={{ fontSize: 13, color: "var(--green-dark)", fontWeight: 600, padding: "8px 0" }}>
                  {t("kasa.tiskHledejZnovu")}
                </button>
              </div>
            )}

            <button onClick={() => setTiskProdejkaId(null)} className="btn-secondary" style={{ width: "100%", marginTop: 10 }}>
              {t("kasa.tiskZavrit")}
            </button>
          </div>
        </div>
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
