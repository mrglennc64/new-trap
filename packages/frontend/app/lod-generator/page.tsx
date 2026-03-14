"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";

/* ─── Types ──────────────────────────────────────────────────── */
type LODType = "pro_performance" | "pro_mechanical" | "distribution" | "sync" | "master" | "blanket";
type RecipientType = "publisher" | "manager" | "attorney" | "label" | "admin" | "co_writer";

interface LODForm {
  // Sender (artist/writer)
  sender_name: string;
  sender_legal_name: string;
  sender_ipi: string;
  sender_pro: string;
  sender_address: string;
  sender_city_state_zip: string;
  sender_email: string;
  sender_phone: string;

  // Recipient (PRO / distributor / label)
  recipient_org: string;
  recipient_dept: string;
  recipient_address: string;
  recipient_city_state_zip: string;

  // Redirect target
  redirect_name: string;
  redirect_type: RecipientType;
  redirect_ipi: string;
  redirect_address: string;
  redirect_city_state_zip: string;
  redirect_email: string;

  // LOD details
  lod_type: LODType;
  effective_date: string;
  expiry_date: string;
  scope: "all_works" | "specific_works";
  works_list: string;
  royalty_pct: string;
  notes: string;

  // Signature
  sig_name: string;
  sig_title: string;
  sig_date: string;
  witness_name: string;
  notarized: boolean;
}

const LOD_TYPE_META: Record<LODType, { label: string; description: string; recipient_hint: string }> = {
  pro_performance:  { label: "PRO Performance Royalties",  description: "Directs ASCAP, BMI, SESAC, or SOCAN to pay performance royalties to a designated party.", recipient_hint: "ASCAP / BMI / SESAC / SOCAN" },
  pro_mechanical:   { label: "PRO Mechanical Royalties",   description: "Directs MLC, DistroKid, or a mechanical rights organization to route mechanical royalties.", recipient_hint: "The MLC / Harry Fox Agency" },
  distribution:     { label: "Distribution Royalties",     description: "Instructs a distributor (TuneCore, DistroKid, CD Baby) to redirect streaming/download revenue.", recipient_hint: "TuneCore / DistroKid / CD Baby" },
  sync:             { label: "Sync Licensing Revenue",     description: "Directs sync licensing income from film, TV, and ad placements to a named administrator.", recipient_hint: "Music Supervisor / Licensing Co." },
  master:           { label: "Master Recording Royalties", description: "Routes master recording income (SoundExchange, neighboring rights) to a specified label or administrator.", recipient_hint: "SoundExchange / Label" },
  blanket:          { label: "Blanket Direction (All Revenue)", description: "Comprehensive direction covering all royalty streams — performance, mechanical, master, and sync.", recipient_hint: "All sources / Admin company" },
};

const RECIPIENT_LABELS: Record<RecipientType, string> = {
  publisher:  "Music Publisher",
  manager:    "Personal Manager",
  attorney:   "Entertainment Attorney",
  label:      "Record Label",
  admin:      "Administrative Publisher",
  co_writer:  "Co-Writer / Split Partner",
};

const DEFAULT_FORM: LODForm = {
  sender_name: "Travis Scott",
  sender_legal_name: "Jacques Berman Webster II",
  sender_ipi: "00721084930",
  sender_pro: "ASCAP",
  sender_address: "c/o Cactus Jack Entertainment LLC, 1234 Rodeo Dr",
  sender_city_state_zip: "Houston, TX 77001",
  sender_email: "mgmt@cactusjack.com",
  sender_phone: "(713) 555-0100",
  recipient_org: "ASCAP",
  recipient_dept: "Writer/Publisher Relations",
  recipient_address: "250 West 57th Street",
  recipient_city_state_zip: "New York, NY 10107",
  redirect_name: "Cactus Jack Publishing LLC",
  redirect_type: "publisher",
  redirect_ipi: "00721084941",
  redirect_address: "1234 Rodeo Dr, Suite 500",
  redirect_city_state_zip: "Houston, TX 77001",
  redirect_email: "royalties@cactusjack.com",
  lod_type: "pro_performance",
  effective_date: new Date().toISOString().slice(0, 10),
  expiry_date: "",
  scope: "all_works",
  works_list: "",
  royalty_pct: "100",
  notes: "",
  sig_name: "Jacques Berman Webster II",
  sig_title: "Recording Artist / Sole Member",
  sig_date: new Date().toISOString().slice(0, 10),
  witness_name: "",
  notarized: false,
};

/* ─── Helpers ────────────────────────────────────────────────── */
function fmtDate(iso: string) {
  if (!iso) return "____________________";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function Input({ label, value, onChange, placeholder = "", type = "text", mono = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; mono?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 bg-[#1e293b] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600 ${mono ? "font-mono" : ""}`}
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-[#1e293b] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

/* ─── LOD Document renderer ──────────────────────────────────── */
function LODDocument({ f }: { f: LODForm }) {
  const meta = LOD_TYPE_META[f.lod_type];
  const refNum = `LOD-${f.sender_ipi.slice(-4)}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

  return (
    <div className="bg-white text-gray-900 p-8 rounded-2xl font-serif text-sm leading-relaxed min-h-[900px] shadow-2xl">
      {/* Letterhead */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-gray-200">
        <div>
          <div className="text-2xl font-black text-gray-900 tracking-tight mb-1">LETTER OF DIRECTION</div>
          <div className="text-xs text-gray-500 font-sans uppercase tracking-widest">{meta.label}</div>
        </div>
        <div className="text-right text-xs text-gray-500 font-sans">
          <div className="font-semibold text-gray-700">Ref: {refNum}</div>
          <div>Date: {fmtDate(f.sig_date)}</div>
          {f.notarized && <div className="text-blue-600 font-semibold mt-1">⊕ Notarized Document</div>}
        </div>
      </div>

      {/* TO block */}
      <div className="mb-6">
        <div className="text-xs font-sans font-bold text-gray-500 uppercase tracking-widest mb-2">To:</div>
        <div className="font-bold text-gray-900">{f.recipient_org || "_______________"}</div>
        {f.recipient_dept && <div className="text-gray-700">{f.recipient_dept}</div>}
        <div className="text-gray-700">{f.recipient_address || "_______________"}</div>
        <div className="text-gray-700">{f.recipient_city_state_zip || "_______________"}</div>
      </div>

      {/* RE block */}
      <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-xs font-sans font-bold text-gray-500 uppercase tracking-widest mb-1">RE: Direction of Royalty Payments</div>
        <div className="font-semibold">
          {f.lod_type === "blanket" ? "All Royalty Streams" : meta.label} —{" "}
          {f.scope === "all_works" ? "All Works in Catalog" : "Specified Works Listed Herein"}
        </div>
        <div className="text-xs text-gray-500 mt-1">IPI: {f.sender_ipi || "___________"} · PRO: {f.sender_pro}</div>
      </div>

      {/* Body */}
      <div className="space-y-4 text-gray-800">
        <p>
          I, <strong>{f.sender_legal_name || "_______________"}</strong>, professionally known as{" "}
          <strong>"{f.sender_name || "_______________"}"</strong>, IPI Number{" "}
          <span className="font-mono font-semibold">{f.sender_ipi || "___________"}</span>, a member of{" "}
          <strong>{f.sender_pro}</strong>, hereby irrevocably direct and authorize you to pay,
          remit, and direct{" "}
          {f.royalty_pct !== "100" ? <span><strong>{f.royalty_pct}%</strong> of </span> : ""}
          all {meta.label.toLowerCase()} accruing to my account
          {f.scope === "specific_works" ? " for the works specified herein" : " for all works registered in my name or jointly"}
          , directly to the following designated party:
        </p>

        {/* Redirect block */}
        <div className="border-l-4 border-indigo-500 pl-4 py-1 my-4">
          <div className="font-bold text-gray-900 text-base">{f.redirect_name || "_______________"}</div>
          <div className="text-xs text-gray-500 font-sans uppercase tracking-wide">{RECIPIENT_LABELS[f.redirect_type]}</div>
          {f.redirect_ipi && <div className="text-sm text-gray-700 font-mono mt-1">IPI: {f.redirect_ipi}</div>}
          {f.redirect_address && <div className="text-sm text-gray-700">{f.redirect_address}</div>}
          {f.redirect_city_state_zip && <div className="text-sm text-gray-700">{f.redirect_city_state_zip}</div>}
          {f.redirect_email && <div className="text-sm text-gray-700">{f.redirect_email}</div>}
        </div>

        {/* Effective / expiry */}
        <p>
          This direction is effective as of <strong>{fmtDate(f.effective_date)}</strong>
          {f.expiry_date
            ? <> and shall remain in effect until <strong>{fmtDate(f.expiry_date)}</strong>, unless sooner revoked in writing.</>
            : <> and shall remain in effect until revoked by written notice delivered to you with no less than thirty (30) days advance notice.</>
          }
        </p>

        {/* Scope */}
        {f.scope === "specific_works" && f.works_list && (
          <div>
            <p className="font-semibold">This direction applies to the following works only:</p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2">
              {f.works_list.split("\n").filter(Boolean).map((w, i) => (
                <div key={i} className="text-sm text-gray-700 py-0.5 border-b border-gray-100 last:border-0">{w}</div>
              ))}
            </div>
          </div>
        )}

        <p>
          This Letter of Direction supersedes any prior direction letters issued by the undersigned
          to you regarding {f.scope === "all_works" ? "the above-referenced royalty stream" : "the works specified herein"}.
          You are hereby authorized and instructed to update your records accordingly and to confirm
          receipt of this direction in writing.
        </p>

        {f.notes && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-xs font-sans font-bold text-gray-500 uppercase tracking-widest mb-1">Additional Instructions</div>
            <p className="text-gray-700">{f.notes}</p>
          </div>
        )}

        <p>
          Please send all future payments, statements, and correspondence regarding the above royalties
          to the designated party at the address provided.
          Questions regarding this direction may be directed to <strong>{f.sender_email || "the undersigned"}</strong>.
        </p>
      </div>

      {/* Signature block */}
      <div className="mt-10 pt-6 border-t border-gray-200">
        <p className="mb-8 text-gray-800">
          By signing below, I confirm that I am the sole or authorized representative with the
          legal right to execute this Letter of Direction and that all information provided herein
          is true, accurate, and complete.
        </p>

        <div className="grid grid-cols-2 gap-12">
          {/* Signer */}
          <div>
            <div className="border-b-2 border-gray-900 mb-2 h-12" />
            <div className="font-bold text-gray-900">{f.sig_name || "_______________"}</div>
            <div className="text-sm text-gray-600">{f.sig_title || "Recording Artist"}</div>
            <div className="text-sm text-gray-500 mt-1">Date: {fmtDate(f.sig_date)}</div>
            <div className="text-xs text-gray-400 font-mono mt-1">{f.sender_address}</div>
          </div>

          {/* Witness / Notary */}
          <div>
            <div className="border-b-2 border-gray-400 mb-2 h-12" />
            {f.witness_name ? (
              <>
                <div className="font-semibold text-gray-700">{f.witness_name}</div>
                <div className="text-sm text-gray-500">Witness</div>
              </>
            ) : (
              <div className="text-sm text-gray-400 italic">Witness signature (if required)</div>
            )}
            {f.notarized && (
              <div className="mt-3 border border-blue-300 rounded-lg p-3 bg-blue-50 text-xs text-blue-700">
                <div className="font-bold mb-1">NOTARY PUBLIC</div>
                <div className="h-6 border-b border-blue-300 mb-1" />
                <div>Commission expires: ___________</div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-400 font-sans">
          <div>Generated by TrapRoyaltiesPro · traproyaltiespro.com</div>
          <div>Ref: {refNum}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function LODGeneratorPage() {
  const [form, setForm] = useState<LODForm>(DEFAULT_FORM);
  const [preview, setPreview] = useState(false);
  const [tab, setTab] = useState<"sender" | "recipient" | "redirect" | "details" | "signature">("sender");
  const docRef = useRef<HTMLDivElement>(null);

  const set = useCallback(<K extends keyof LODForm>(key: K, value: LODForm[K]) => {
    setForm(p => ({ ...p, [key]: value }));
  }, []);

  const printDoc = useCallback(() => {
    window.print();
  }, []);

  const TABS = [
    { id: "sender",    label: "1. Artist / Sender" },
    { id: "recipient", label: "2. PRO / Recipient" },
    { id: "redirect",  label: "3. Redirect Target" },
    { id: "details",   label: "4. LOD Details" },
    { id: "signature", label: "5. Signature" },
  ] as const;

  const isComplete = form.sender_legal_name && form.sender_ipi && form.recipient_org && form.redirect_name && form.sig_name;

  return (
    <>
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-doc { page-break-inside: avoid; }
          nav, header { display: none !important; }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="min-h-screen bg-[#0a0f1e] text-slate-100 pt-14 pb-20">
        {/* Header */}
        <div className="bg-[#0f172a] border-b border-white/10 px-6 py-5 no-print">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">📜</span>
                <h1 className="text-xl font-black text-white tracking-tight">LOD Generator</h1>
                <span className="px-2 py-0.5 text-xs font-bold text-violet-300 bg-violet-500/20 border border-violet-500/30 rounded-full">Letter of Direction</span>
              </div>
              <p className="text-slate-400 text-sm">
                Generate court-ready Letters of Direction to redirect royalty payments from any PRO, distributor, or label to a publisher, manager, or attorney.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 no-print">
              <Link href="/forensic-audit" className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition">
                ← Audit PDF
              </Link>
              <Link href="/attorney-portal" className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition">
                Attorney Portal
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* ── Left: Form ── */}
            <div className="space-y-5 no-print">
              {/* LOD type selector */}
              <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-5">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">LOD Type</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.entries(LOD_TYPE_META) as [LODType, typeof LOD_TYPE_META[LODType]][]).map(([key, m]) => (
                    <button
                      key={key}
                      onClick={() => set("lod_type", key)}
                      className={`text-left px-4 py-3 rounded-xl border transition-all ${
                        form.lod_type === key
                          ? "border-indigo-500/60 bg-indigo-500/10 shadow shadow-indigo-500/10"
                          : "border-white/10 bg-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5"
                      }`}
                    >
                      <div className="text-sm font-semibold text-white mb-0.5">{m.label}</div>
                      <div className="text-xs text-slate-500 leading-relaxed">{m.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab form */}
              <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden">
                {/* Tab bar */}
                <div className="flex overflow-x-auto scrollbar-hide border-b border-white/10">
                  {TABS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition flex-shrink-0 ${
                        tab === t.id ? "text-white border-b-2 border-indigo-400" : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="p-5 space-y-4">
                  {/* ── Sender ── */}
                  {tab === "sender" && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Stage Name / Artist Name" value={form.sender_name} onChange={v => set("sender_name", v)} />
                        <Input label="Legal Name" value={form.sender_legal_name} onChange={v => set("sender_legal_name", v)} />
                        <Input label="IPI Number" value={form.sender_ipi} onChange={v => set("sender_ipi", v)} mono placeholder="00000000000" />
                        <Select label="PRO Affiliation" value={form.sender_pro} onChange={v => set("sender_pro", v)}
                          options={["ASCAP","BMI","SESAC","SOCAN","PRS","GEMA","SACEM","APRA"].map(p => ({ value: p, label: p }))} />
                        <Input label="Address / c/o" value={form.sender_address} onChange={v => set("sender_address", v)} />
                        <Input label="City, State, ZIP" value={form.sender_city_state_zip} onChange={v => set("sender_city_state_zip", v)} />
                        <Input label="Email" value={form.sender_email} onChange={v => set("sender_email", v)} type="email" />
                        <Input label="Phone" value={form.sender_phone} onChange={v => set("sender_phone", v)} type="tel" />
                      </div>
                    </>
                  )}

                  {/* ── Recipient ── */}
                  {tab === "recipient" && (
                    <>
                      <div className="text-xs text-slate-400 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2 mb-2">
                        Hint for <span className="text-indigo-300 font-semibold">{LOD_TYPE_META[form.lod_type].label}</span>:{" "}
                        {LOD_TYPE_META[form.lod_type].recipient_hint}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Organization Name" value={form.recipient_org} onChange={v => set("recipient_org", v)} />
                        <Input label="Department / Attn" value={form.recipient_dept} onChange={v => set("recipient_dept", v)} placeholder="Writer/Publisher Relations" />
                        <Input label="Street Address" value={form.recipient_address} onChange={v => set("recipient_address", v)} />
                        <Input label="City, State, ZIP" value={form.recipient_city_state_zip} onChange={v => set("recipient_city_state_zip", v)} />
                      </div>
                    </>
                  )}

                  {/* ── Redirect target ── */}
                  {tab === "redirect" && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Redirect Recipient Name / Entity" value={form.redirect_name} onChange={v => set("redirect_name", v)} />
                        <Select label="Recipient Type" value={form.redirect_type} onChange={v => set("redirect_type", v as RecipientType)}
                          options={Object.entries(RECIPIENT_LABELS).map(([k,l]) => ({ value: k, label: l }))} />
                        <Input label="IPI Number (if applicable)" value={form.redirect_ipi} onChange={v => set("redirect_ipi", v)} mono placeholder="00000000000" />
                        <Input label="Email" value={form.redirect_email} onChange={v => set("redirect_email", v)} type="email" />
                        <Input label="Street Address" value={form.redirect_address} onChange={v => set("redirect_address", v)} />
                        <Input label="City, State, ZIP" value={form.redirect_city_state_zip} onChange={v => set("redirect_city_state_zip", v)} />
                      </div>
                    </>
                  )}

                  {/* ── LOD Details ── */}
                  {tab === "details" && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Effective Date" value={form.effective_date} onChange={v => set("effective_date", v)} type="date" />
                        <Input label="Expiry Date (leave blank = until revoked)" value={form.expiry_date} onChange={v => set("expiry_date", v)} type="date" />
                        <div>
                          <label className="block text-xs text-slate-400 mb-1.5">Royalty Percentage Redirected</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="range" min={1} max={100} value={parseInt(form.royalty_pct)||100}
                              onChange={e => set("royalty_pct", e.target.value)}
                              className="flex-1 accent-indigo-500"
                            />
                            <span className="text-white font-bold w-12 text-right">{form.royalty_pct}%</span>
                          </div>
                        </div>
                        <Select label="Scope" value={form.scope} onChange={v => set("scope", v as LODForm["scope"])}
                          options={[
                            { value: "all_works", label: "All Works in Catalog" },
                            { value: "specific_works", label: "Specific Works Only" },
                          ]} />
                      </div>
                      {form.scope === "specific_works" && (
                        <div>
                          <label className="block text-xs text-slate-400 mb-1.5">Works List (one per line — Title · ISRC)</label>
                          <textarea
                            rows={5}
                            value={form.works_list}
                            onChange={e => set("works_list", e.target.value)}
                            placeholder={"Sicko Mode · USUG11801862\nGoosebumps · USUG11501163"}
                            className="w-full px-3 py-2 bg-[#1e293b] border border-white/10 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-indigo-500 placeholder-slate-600 resize-none"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs text-slate-400 mb-1.5">Additional Instructions / Notes (optional)</label>
                        <textarea
                          rows={3}
                          value={form.notes}
                          onChange={e => set("notes", e.target.value)}
                          placeholder="e.g. Please confirm receipt within 5 business days. Contact mgmt@cactusjack.com with any questions."
                          className="w-full px-3 py-2 bg-[#1e293b] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600 resize-none"
                        />
                      </div>
                    </>
                  )}

                  {/* ── Signature ── */}
                  {tab === "signature" && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Signatory Full Legal Name" value={form.sig_name} onChange={v => set("sig_name", v)} />
                        <Input label="Title / Capacity" value={form.sig_title} onChange={v => set("sig_title", v)} placeholder="Recording Artist / Member" />
                        <Input label="Signature Date" value={form.sig_date} onChange={v => set("sig_date", v)} type="date" />
                        <Input label="Witness Name (optional)" value={form.witness_name} onChange={v => set("witness_name", v)} placeholder="Leave blank if not required" />
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer mt-2">
                        <input
                          type="checkbox"
                          checked={form.notarized}
                          onChange={e => set("notarized", e.target.checked)}
                          className="accent-indigo-500 w-4 h-4"
                        />
                        <div>
                          <div className="text-sm font-semibold text-white">Include Notary Block</div>
                          <div className="text-xs text-slate-400">Required by some PROs and distributors for LODs over $10,000</div>
                        </div>
                      </label>
                    </>
                  )}
                </div>

                {/* Tab nav footer */}
                <div className="px-5 pb-4 flex items-center justify-between border-t border-white/10 pt-4">
                  <button
                    onClick={() => {
                      const idx = TABS.findIndex(t => t.id === tab);
                      if (idx > 0) setTab(TABS[idx-1].id);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition disabled:opacity-30"
                    disabled={tab === "sender"}
                  >
                    ← Previous
                  </button>
                  {tab !== "signature" ? (
                    <button
                      onClick={() => {
                        const idx = TABS.findIndex(t => t.id === tab);
                        setTab(TABS[idx+1].id);
                      }}
                      className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      onClick={() => setPreview(true)}
                      disabled={!isComplete}
                      className="px-5 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-500 disabled:bg-white/10 disabled:text-slate-600 rounded-xl transition"
                    >
                      Generate LOD →
                    </button>
                  )}
                </div>
              </div>

              {/* Completion checklist */}
              <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Required Fields</div>
                <div className="space-y-1.5 text-xs">
                  {[
                    { label: "Legal name", ok: !!form.sender_legal_name },
                    { label: "IPI number", ok: !!form.sender_ipi },
                    { label: "PRO / recipient organization", ok: !!form.recipient_org },
                    { label: "Redirect recipient", ok: !!form.redirect_name },
                    { label: "Effective date", ok: !!form.effective_date },
                    { label: "Signatory name", ok: !!form.sig_name },
                    { label: "Works list (if specific scope)", ok: form.scope === "all_works" || !!form.works_list },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className={item.ok ? "text-green-400" : "text-slate-600"}>
                        {item.ok ? "✓" : "○"}
                      </span>
                      <span className={item.ok ? "text-slate-300" : "text-slate-600"}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right: Preview ── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between no-print">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Document Preview</div>
                {preview && (
                  <div className="flex items-center gap-2">
                    <button onClick={printDoc} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg transition">
                      ↓ Download / Print PDF
                    </button>
                    <Link href="/attorney-portal" className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-lg border border-white/10 transition">
                      Send to Attorney
                    </Link>
                  </div>
                )}
              </div>

              {preview ? (
                <div ref={docRef} className="print-doc">
                  <LODDocument f={form} />
                </div>
              ) : (
                <div className="bg-[#0f172a] border border-white/10 rounded-2xl min-h-[600px] flex flex-col items-center justify-center text-center p-8">
                  <div className="text-5xl mb-4">📜</div>
                  <div className="text-lg font-bold text-white mb-2">Document Preview</div>
                  <p className="text-slate-400 text-sm max-w-sm mb-6">
                    Fill in all sections on the left, then click <span className="text-white font-semibold">Generate LOD</span> on the Signature tab to render the final document.
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-left w-full max-w-xs text-xs text-slate-400">
                    {[
                      { icon: "✍️", text: "Artist / legal name + IPI" },
                      { icon: "🏛️", text: "PRO / recipient details" },
                      { icon: "→",  text: "Redirect target + type" },
                      { icon: "📅", text: "Effective date + scope" },
                      { icon: "✒️", text: "Signature + optional notary" },
                      { icon: "↓",  text: "Download or print as PDF" },
                    ].map(s => (
                      <div key={s.text} className="flex items-start gap-2">
                        <span className="flex-shrink-0">{s.icon}</span>
                        <span>{s.text}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setPreview(true)}
                    className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition"
                  >
                    Preview Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
