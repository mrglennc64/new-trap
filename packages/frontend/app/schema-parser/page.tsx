"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";

/* ─── Types ──────────────────────────────────────────────────── */
type Stage = "detect" | "clean" | "map" | "validate";
type StageStatus = "idle" | "running" | "done" | "error";

interface RawColumn {
  id: string;
  rawName: string;
  sample: string[];
  detectedType: string;
  confidence: number;
  mappedTo: string | null;
  locked: boolean;
}

interface CatalogField {
  id: string;
  label: string;
  required: boolean;
  description: string;
  accepts: string[];
  mapped: boolean;
}

interface CleaningRule {
  id: string;
  field: string;
  rule: string;
  before: string;
  after: string;
  applied: boolean;
}

interface ValidationResult {
  field: string;
  status: "pass" | "warn" | "fail";
  message: string;
  count?: number;
}

interface DetectedSchema {
  name: string;
  distributor: string;
  format: string;
  confidence: number;
  totalRows: number;
  totalCols: number;
}

/* ─── Mock schemas by source ─────────────────────────────────── */
const SCHEMA_PRESETS: Record<string, {
  schema: DetectedSchema;
  columns: RawColumn[];
  cleaning: CleaningRule[];
  validation: ValidationResult[];
}> = {
  tunecore: {
    schema: { name: "TuneCore Sales Report v2", distributor: "TuneCore", format: "CSV", confidence: 97, totalRows: 4821, totalCols: 14 },
    columns: [
      { id: "c1", rawName: "Song Title",          sample: ["Starboy","Blinding Lights","Save Your Tears"], detectedType: "Track Title",    confidence: 99, mappedTo: "title",       locked: false },
      { id: "c2", rawName: "Artist Name",          sample: ["The Weeknd","The Weeknd","The Weeknd"],       detectedType: "Artist Name",    confidence: 99, mappedTo: "artist",      locked: false },
      { id: "c3", rawName: "ISRC Code",            sample: ["USUG11600681","USUG11903920","USUG12003529"], detectedType: "ISRC",           confidence: 98, mappedTo: "isrc",        locked: false },
      { id: "c4", rawName: "Net Revenue (USD)",    sample: ["$1,204.33","$3,812.00","$892.17"],            detectedType: "Revenue",        confidence: 96, mappedTo: "revenue",     locked: false },
      { id: "c5", rawName: "Sale Date",            sample: ["2024-01-15","2024-01-22","2024-02-01"],       detectedType: "Date",           confidence: 99, mappedTo: "sale_date",   locked: false },
      { id: "c6", rawName: "Store",                sample: ["Spotify","Apple Music","Amazon"],             detectedType: "Platform",       confidence: 95, mappedTo: "platform",    locked: false },
      { id: "c7", rawName: "Territory",            sample: ["US","GB","DE"],                              detectedType: "Territory Code", confidence: 94, mappedTo: "territory",   locked: false },
      { id: "c8", rawName: "UPC",                  sample: ["00602557164176","00602557164176",""],         detectedType: "UPC",            confidence: 91, mappedTo: "upc",         locked: false },
      { id: "c9", rawName: "Label",                sample: ["Republic Records","XO","Republic Records"],  detectedType: "Label Name",     confidence: 88, mappedTo: null,          locked: false },
      { id: "c10",rawName: "Quantity",             sample: ["1","1","1"],                                 detectedType: "Stream Count",   confidence: 72, mappedTo: null,          locked: false },
      { id: "c11",rawName: "Catalog Number",       sample: ["B07K81LF4G","B08XZY92K3",""],               detectedType: "Unknown",        confidence: 42, mappedTo: null,          locked: false },
    ],
    cleaning: [
      { id: "cl1", field: "revenue",   rule: "Strip currency symbols",    before: "$1,204.33",    after: "1204.33",    applied: true },
      { id: "cl2", field: "revenue",   rule: "Remove thousand separators",before: "1,204.33",    after: "1204.33",     applied: true },
      { id: "cl3", field: "isrc",      rule: "Remove hyphens/spaces",     before: "USUG-116-006-81", after: "USUG11600681", applied: true },
      { id: "cl4", field: "upc",       rule: "Zero-pad to 13 digits",     before: "602557164176", after: "0602557164176", applied: true },
      { id: "cl5", field: "sale_date", rule: "Normalize to ISO 8601",     before: "01/15/2024",   after: "2024-01-15", applied: true },
      { id: "cl6", field: "territory", rule: "Uppercase country codes",   before: "us",           after: "US",         applied: true },
      { id: "cl7", field: "title",     rule: "Trim whitespace",           before: "Starboy  ",    after: "Starboy",    applied: true },
    ],
    validation: [
      { field: "isrc",      status: "pass", message: "All 4,821 ISRCs valid (ISO 3901 format)", count: 4821 },
      { field: "revenue",   status: "pass", message: "All revenue values numeric, non-negative" },
      { field: "upc",       status: "warn", message: "214 rows missing UPC — distribution may fail on some DSPs", count: 214 },
      { field: "territory", status: "pass", message: "All territory codes resolve to ISO 3166-1 alpha-2" },
      { field: "sale_date", status: "pass", message: "Date range: 2024-01-01 to 2024-03-31" },
      { field: "platform",  status: "warn", message: "3 unknown platform values: 'TikTok Music', 'Boomplay', 'Audiomack'", count: 3 },
      { field: "artist",    status: "pass", message: "1 unique artist detected — consistent across all rows" },
    ],
  },
  ascap: {
    schema: { name: "ASCAP Royalty Statement Q3", distributor: "ASCAP", format: "XLSX", confidence: 94, totalRows: 1247, totalCols: 11 },
    columns: [
      { id: "c1", rawName: "Work Title",        sample: ["Sicko Mode","Goosebumps","Antidote"],        detectedType: "Track Title",  confidence: 99, mappedTo: "title",      locked: false },
      { id: "c2", rawName: "ISWC",              sample: ["T-921.614.229-5","T-002.330.122-4",""],      detectedType: "ISWC",         confidence: 97, mappedTo: "iswc",       locked: false },
      { id: "c3", rawName: "Performing Writer", sample: ["Travis Scott","Travis Scott","Travis Scott"],detectedType: "Songwriter",   confidence: 95, mappedTo: "songwriter", locked: false },
      { id: "c4", rawName: "IPI",               sample: ["00721084930","00721084930",""],              detectedType: "IPI Number",   confidence: 98, mappedTo: "ipi",        locked: false },
      { id: "c5", rawName: "Royalty Amount",    sample: ["$4,812.00","$2,100.50","$988.20"],           detectedType: "Revenue",      confidence: 96, mappedTo: "revenue",    locked: false },
      { id: "c6", rawName: "Usage Type",        sample: ["PERF","PERF","MECH"],                       detectedType: "Royalty Type", confidence: 88, mappedTo: "royalty_type",locked: false },
      { id: "c7", rawName: "Statement Period",  sample: ["Q3 2024","Q3 2024","Q3 2024"],              detectedType: "Period",       confidence: 92, mappedTo: "period",     locked: false },
      { id: "c8", rawName: "Share Pct",         sample: ["100.00","50.00","75.00"],                   detectedType: "Split %",      confidence: 90, mappedTo: "split_pct",  locked: false },
      { id: "c9", rawName: "ISRC",              sample: ["USUG11801862","USUG11501163",""],            detectedType: "ISRC",         confidence: 97, mappedTo: "isrc",       locked: false },
      { id: "c10",rawName: "Territory",         sample: ["United States","United States","Canada"],   detectedType: "Territory",    confidence: 85, mappedTo: "territory",  locked: false },
      { id: "c11",rawName: "Writer Share Code", sample: ["E","E","SE"],                               detectedType: "Unknown",      confidence: 31, mappedTo: null,         locked: false },
    ],
    cleaning: [
      { id: "cl1", field: "revenue",    rule: "Strip currency symbols",     before: "$4,812.00",         after: "4812.00",      applied: true },
      { id: "cl2", field: "iswc",       rule: "Normalize ISWC format",      before: "T9216142295",       after: "T-921.614.229-5", applied: true },
      { id: "cl3", field: "territory",  rule: "Map full name → ISO code",   before: "United States",     after: "US",           applied: true },
      { id: "cl4", field: "split_pct",  rule: "Divide by 100 if > 1",       before: "100.00",            after: "1.0",          applied: true },
      { id: "cl5", field: "royalty_type",rule: "Expand code to full label", before: "PERF",              after: "Performance",  applied: true },
      { id: "cl6", field: "period",     rule: "Parse Q-format to date range",before: "Q3 2024",          after: "2024-07-01/2024-09-30", applied: true },
    ],
    validation: [
      { field: "iswc",       status: "warn", message: "89 rows missing ISWC — publishing revenue may be unroutable", count: 89 },
      { field: "ipi",        status: "warn", message: "14 rows missing IPI number — writer cannot be paid", count: 14 },
      { field: "split_pct",  status: "fail", message: "3 works have total split > 100% — conflict detected", count: 3 },
      { field: "isrc",       status: "pass", message: "All present ISRCs validated" },
      { field: "revenue",    status: "pass", message: "All royalty amounts numeric" },
      { field: "territory",  status: "pass", message: "All territories resolved to ISO codes" },
    ],
  },
  distrokid: {
    schema: { name: "DistroKid Bank Report", distributor: "DistroKid", format: "CSV", confidence: 99, totalRows: 9312, totalCols: 12 },
    columns: [
      { id: "c1", rawName: "Title",          sample: ["No Role Modelz","Love Yourz","KOD"],         detectedType: "Track Title",  confidence: 99, mappedTo: "title",    locked: false },
      { id: "c2", rawName: "Artist",         sample: ["J. Cole","J. Cole","J. Cole"],               detectedType: "Artist Name",  confidence: 99, mappedTo: "artist",   locked: false },
      { id: "c3", rawName: "ISRC",           sample: ["USRC11400626","USRC11500812","USRC11800223"],detectedType: "ISRC",         confidence: 99, mappedTo: "isrc",     locked: false },
      { id: "c4", rawName: "Earnings (USD)", sample: ["0.00432","0.00891","0.00318"],               detectedType: "Revenue",      confidence: 96, mappedTo: "revenue",  locked: false },
      { id: "c5", rawName: "Reporting Date", sample: ["2024-03","2024-03","2024-03"],               detectedType: "Period",       confidence: 88, mappedTo: "period",   locked: false },
      { id: "c6", rawName: "Store",          sample: ["Spotify","Apple Music","YouTube Music"],     detectedType: "Platform",     confidence: 96, mappedTo: "platform", locked: false },
      { id: "c7", rawName: "Country",        sample: ["United States","United Kingdom","Germany"],  detectedType: "Territory",    confidence: 87, mappedTo: "territory",locked: false },
      { id: "c8", rawName: "Stream Type",    sample: ["Stream","Stream","Download"],               detectedType: "Usage Type",   confidence: 91, mappedTo: "royalty_type",locked: false },
      { id: "c9", rawName: "UPC",            sample: ["00888072061477","00888072061477",""],        detectedType: "UPC",          confidence: 93, mappedTo: "upc",      locked: false },
      { id: "c10",rawName: "Quantity",       sample: ["1","1","1"],                                 detectedType: "Stream Count", confidence: 75, mappedTo: null,       locked: false },
      { id: "c11",rawName: "Team Percentage",sample: ["80","80","80"],                             detectedType: "Split %",      confidence: 79, mappedTo: "split_pct",locked: false },
      { id: "c12",rawName: "Label",          sample: ["Dreamville","Dreamville","Dreamville"],     detectedType: "Label Name",   confidence: 88, mappedTo: null,       locked: false },
    ],
    cleaning: [
      { id: "cl1", field: "revenue",   rule: "Convert micro-cent to dollar", before: "0.00432",        after: "0.00432",    applied: true },
      { id: "cl2", field: "territory", rule: "Map full name → ISO code",     before: "United States",  after: "US",         applied: true },
      { id: "cl3", field: "period",    rule: "Expand month to date range",   before: "2024-03",        after: "2024-03-01/2024-03-31", applied: true },
      { id: "cl4", field: "split_pct", rule: "Divide by 100",                before: "80",             after: "0.80",       applied: true },
      { id: "cl5", field: "isrc",      rule: "Validate ISO 3901",            before: "USRC11400626",   after: "USRC11400626", applied: true },
    ],
    validation: [
      { field: "isrc",      status: "pass", message: "All 9,312 ISRCs valid" },
      { field: "revenue",   status: "warn", message: "1,204 rows with $0.00 earnings — verify streaming minimum threshold", count: 1204 },
      { field: "upc",       status: "warn", message: "88 rows missing UPC", count: 88 },
      { field: "split_pct", status: "pass", message: "All team percentages ≤ 100%" },
      { field: "territory", status: "pass", message: "All countries mapped to ISO codes" },
      { field: "platform",  status: "pass", message: "All store names recognized" },
    ],
  },
};

const CATALOG_FIELDS: CatalogField[] = [
  { id: "title",       label: "Track Title",    required: true,  description: "Primary track name",           accepts: ["Track Title","Song Name"],    mapped: false },
  { id: "artist",      label: "Artist",         required: true,  description: "Primary performing artist",    accepts: ["Artist Name","Performer"],    mapped: false },
  { id: "isrc",        label: "ISRC",           required: true,  description: "International Standard Recording Code", accepts: ["ISRC"],        mapped: false },
  { id: "iswc",        label: "ISWC",           required: false, description: "International Standard Musical Work Code", accepts: ["ISWC"],     mapped: false },
  { id: "ipi",         label: "IPI Number",     required: false, description: "Interested Parties Information", accepts: ["IPI Number"],       mapped: false },
  { id: "revenue",     label: "Revenue",        required: true,  description: "Earnings / royalty amount",    accepts: ["Revenue","Royalty Amount"],   mapped: false },
  { id: "platform",    label: "Platform",       required: false, description: "Streaming/download store",     accepts: ["Platform","Store"],           mapped: false },
  { id: "territory",   label: "Territory",      required: false, description: "ISO 3166-1 country code",      accepts: ["Territory Code","Territory"],  mapped: false },
  { id: "split_pct",   label: "Split %",        required: false, description: "Writer/artist share (0–1)",    accepts: ["Split %"],                    mapped: false },
  { id: "period",      label: "Period",         required: false, description: "Statement period (date range)", accepts: ["Period","Date"],              mapped: false },
  { id: "upc",         label: "UPC",            required: false, description: "Universal Product Code",       accepts: ["UPC"],                        mapped: false },
  { id: "songwriter",  label: "Songwriter",     required: false, description: "Writer/composer name",         accepts: ["Songwriter"],                 mapped: false },
  { id: "royalty_type",label: "Royalty Type",   required: false, description: "Mechanical / Performance / Sync", accepts: ["Royalty Type","Usage Type"], mapped: false },
  { id: "sale_date",   label: "Sale Date",      required: false, description: "Transaction date (ISO 8601)", accepts: ["Date"],                        mapped: false },
];

/* ─── Helpers ────────────────────────────────────────────────── */
function confColor(c: number) {
  if (c >= 90) return "text-green-400";
  if (c >= 70) return "text-yellow-400";
  return "text-rose-400";
}
function confBg(c: number) {
  if (c >= 90) return "bg-green-500";
  if (c >= 70) return "bg-yellow-500";
  return "bg-rose-500";
}
function statusIcon(s: ValidationResult["status"]) {
  if (s === "pass") return { icon: "✓", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" };
  if (s === "warn") return { icon: "⚠", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" };
  return { icon: "✗", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" };
}

const STAGE_ORDER: Stage[] = ["detect", "clean", "map", "validate"];
const STAGE_LABELS: Record<Stage, string> = {
  detect:   "Format Detection",
  clean:    "Data Cleaning",
  map:      "Field Mapping",
  validate: "Validation",
};

/* ─── Main Component ─────────────────────────────────────────── */
export default function SchemaParserPage() {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [stageStatus, setStageStatus] = useState<Record<Stage, StageStatus>>({ detect: "idle", clean: "idle", map: "idle", validate: "idle" });
  const [activeStage, setActiveStage] = useState<Stage>("detect");
  const [columns, setColumns] = useState<RawColumn[]>([]);
  const [dragSource, setDragSource] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const preset = selectedPreset ? SCHEMA_PRESETS[selectedPreset] : null;

  const catalogFields: CatalogField[] = CATALOG_FIELDS.map((f) => ({
    ...f,
    mapped: columns.some((c) => c.mappedTo === f.id),
  }));

  /* ── Run detection pipeline ── */
  const runPipeline = useCallback(async (presetKey: string) => {
    setRunning(true);
    setDone(false);
    const p = SCHEMA_PRESETS[presetKey];

    // Reset
    setStageStatus({ detect: "running", clean: "idle", map: "idle", validate: "idle" });
    setActiveStage("detect");
    await new Promise((r) => setTimeout(r, 1200));

    setStageStatus({ detect: "done", clean: "running", map: "idle", validate: "idle" });
    setActiveStage("clean");
    await new Promise((r) => setTimeout(r, 1000));

    setStageStatus({ detect: "done", clean: "done", map: "running", validate: "idle" });
    setActiveStage("map");
    setColumns(p.columns);
    await new Promise((r) => setTimeout(r, 1000));

    setStageStatus({ detect: "done", clean: "done", map: "done", validate: "running" });
    setActiveStage("validate");
    await new Promise((r) => setTimeout(r, 1000));

    setStageStatus({ detect: "done", clean: "done", map: "done", validate: "done" });
    setRunning(false);
    setDone(true);
  }, []);

  const handlePreset = useCallback((key: string) => {
    setSelectedPreset(key);
    setColumns([]);
    setDone(false);
    runPipeline(key);
  }, [runPipeline]);

  /* ── Drag-to-remap ── */
  const handleDrop = useCallback((colId: string, fieldId: string) => {
    setColumns((prev) => prev.map((c) => {
      if (c.id === colId) return { ...c, mappedTo: fieldId };
      if (c.mappedTo === fieldId) return { ...c, mappedTo: null }; // unmap previous
      return c;
    }));
    setDragSource(null);
    setDragTarget(null);
  }, []);

  const unmapCol = useCallback((colId: string) => {
    setColumns((prev) => prev.map((c) => c.id === colId ? { ...c, mappedTo: null } : c));
  }, []);

  const mappedCount  = columns.filter((c) => c.mappedTo).length;
  const totalCols    = columns.length;
  const requiredMapped = catalogFields.filter((f) => f.required && f.mapped).length;
  const requiredTotal  = catalogFields.filter((f) => f.required).length;

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 pt-14 pb-20">
      {/* Header */}
      <div className="bg-[#0f172a] border-b border-white/10 px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🧩</span>
              <h1 className="text-xl font-black text-white tracking-tight">Schema-Agnostic Parser</h1>
            </div>
            <p className="text-slate-400 text-sm">
              Auto-detect any distributor or PRO format. Visualize how raw columns get cleaned, mapped, and validated before hitting your catalog.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/ingest" className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition">
              ← Bulk Ingest
            </Link>
            <Link href="/catalog-staging" className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition">
              Staging →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Source selector */}
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Choose a Source to Parse</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { key: "tunecore",  label: "TuneCore Sales Report",      icon: "📦", sub: "CSV · 4,821 rows · 14 cols" },
              { key: "ascap",     label: "ASCAP Royalty Statement Q3",  icon: "🏛️", sub: "XLSX · 1,247 rows · 11 cols" },
              { key: "distrokid", label: "DistroKid Bank Report",       icon: "💿", sub: "CSV · 9,312 rows · 12 cols" },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => handlePreset(s.key)}
                disabled={running}
                className={`text-left px-4 py-4 rounded-xl border transition-all ${
                  selectedPreset === s.key
                    ? "border-indigo-500/60 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                    : "border-white/10 bg-[#0f172a] hover:border-indigo-500/30 hover:bg-indigo-500/5"
                } disabled:opacity-40`}
              >
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="text-sm font-semibold text-white">{s.label}</div>
                <div className="text-xs text-slate-500 mt-1">{s.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Pipeline stages */}
        {selectedPreset && (
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-5">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Parse Pipeline</div>
            <div className="flex items-center gap-0">
              {STAGE_ORDER.map((stage, i) => {
                const st = stageStatus[stage];
                const isActive = activeStage === stage;
                return (
                  <div key={stage} className="flex items-center flex-1">
                    <button
                      onClick={() => done || st === "done" ? setActiveStage(stage) : null}
                      className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                        isActive ? "bg-indigo-500/15 border border-indigo-500/30" : "hover:bg-white/5"
                      } ${st === "idle" ? "opacity-40" : ""}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        st === "done"    ? "bg-green-500/20 text-green-400 border border-green-500/40" :
                        st === "running" ? "bg-blue-500/20 text-blue-400 border border-blue-500/40 animate-pulse" :
                        st === "error"   ? "bg-rose-500/20 text-rose-400 border border-rose-500/40" :
                        "bg-white/5 text-slate-600 border border-white/10"
                      }`}>
                        {st === "done" ? "✓" : st === "running" ? "…" : i + 1}
                      </div>
                      <div className="text-xs font-semibold text-slate-300 text-center whitespace-nowrap">{STAGE_LABELS[stage]}</div>
                    </button>
                    {i < STAGE_ORDER.length - 1 && (
                      <div className={`w-6 h-0.5 flex-shrink-0 ${stageStatus[STAGE_ORDER[i + 1]] !== "idle" ? "bg-indigo-500/50" : "bg-white/10"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stage panels */}
        {preset && (

          <div className="space-y-6">
            {/* ── DETECT ── */}
            {activeStage === "detect" && (
              <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Format Detection</div>
                {stageStatus.detect === "running" ? (
                  <div className="flex items-center gap-3 text-sm text-blue-400 animate-pulse">
                    <span>Analyzing file structure…</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      {[
                        { label: "Detected Schema",  value: preset.schema.name },
                        { label: "Source",           value: preset.schema.distributor },
                        { label: "File Format",      value: preset.schema.format },
                        { label: "Total Rows",       value: preset.schema.totalRows.toLocaleString("en-US") },
                        { label: "Total Columns",    value: preset.schema.totalCols.toString() },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/5">
                          <span className="text-xs text-slate-500">{row.label}</span>
                          <span className="text-sm font-semibold text-white">{row.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col items-center justify-center bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                      <div className="text-5xl font-black text-green-400 mb-1">{preset.schema.confidence}%</div>
                      <div className="text-xs text-slate-400">Schema Match Confidence</div>
                      <div className="mt-3 text-xs text-green-400 font-semibold">✓ Known schema — using optimized mapping</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── CLEAN ── */}
            {activeStage === "clean" && (
              <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Data Cleaning Rules Applied</div>
                    <div className="text-sm text-slate-400">{preset.cleaning.length} transformations applied across {preset.schema.totalRows.toLocaleString("en-US")} rows</div>
                  </div>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">
                    All passed
                  </span>
                </div>
                <div className="divide-y divide-white/5">
                  {preset.cleaning.map((rule) => (
                    <div key={rule.id} className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-6 py-3 items-center">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                        <span className="text-green-400 text-xs">✓</span>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">{rule.rule}</div>
                        <div className="text-xs text-slate-500">Field: <span className="text-slate-400">{rule.field}</span></div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-rose-400 font-mono bg-rose-500/10 px-2 py-0.5 rounded line-through">{rule.before}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-green-400 font-mono bg-green-500/10 px-2 py-0.5 rounded">{rule.after}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── MAP ── */}
            {activeStage === "map" && (
              <div className="space-y-4">
                <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-4 flex flex-wrap items-center gap-4">
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Field Mapping</div>
                    <p className="text-xs text-slate-400">Drag a raw column onto a catalog field to remap. Click a mapped field to unmap it.</p>
                  </div>
                  <div className="ml-auto flex items-center gap-4 text-xs">
                    <span className="text-slate-400">Mapped: <span className="text-white font-bold">{mappedCount}/{totalCols}</span></span>
                    <span className="text-slate-400">Required: <span className={requiredMapped === requiredTotal ? "text-green-400 font-bold" : "text-rose-400 font-bold"}>{requiredMapped}/{requiredTotal}</span></span>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Raw columns */}
                  <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/10 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Raw Columns ({preset.schema.distributor})
                    </div>
                    <div className="divide-y divide-white/5 max-h-[480px] overflow-y-auto">
                      {columns.map((col) => (
                        <div
                          key={col.id}
                          draggable
                          onDragStart={() => setDragSource(col.id)}
                          onDragEnd={() => { setDragSource(null); setDragTarget(null); }}
                          className={`px-4 py-3 cursor-grab active:cursor-grabbing transition-all ${
                            dragSource === col.id ? "opacity-50 bg-indigo-500/10" : "hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-white truncate">{col.rawName}</span>
                                {col.mappedTo && (
                                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs rounded-full border border-indigo-500/30 whitespace-nowrap">
                                    → {catalogFields.find((f) => f.id === col.mappedTo)?.label}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 font-mono truncate">{col.sample.join(" · ")}</div>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <div className={`text-xs font-semibold ${confColor(col.confidence)}`}>{col.confidence}%</div>
                              <div className="text-xs text-slate-500">{col.detectedType}</div>
                              {col.mappedTo && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); unmapCol(col.id); }}
                                  className="text-xs text-slate-600 hover:text-rose-400 mt-1 transition"
                                >
                                  unmap
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${confBg(col.confidence)}`} style={{ width: `${col.confidence}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Catalog fields */}
                  <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/10 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Master Catalog Fields
                    </div>
                    <div className="divide-y divide-white/5 max-h-[480px] overflow-y-auto">
                      {catalogFields.map((field) => {
                        const mappedCol = columns.find((c) => c.mappedTo === field.id);
                        const isTarget = dragTarget === field.id;
                        return (
                          <div
                            key={field.id}
                            onDragOver={(e) => { e.preventDefault(); setDragTarget(field.id); }}
                            onDragLeave={() => setDragTarget(null)}
                            onDrop={(e) => { e.preventDefault(); if (dragSource) handleDrop(dragSource, field.id); }}
                            className={`px-4 py-3 transition-all ${
                              isTarget ? "bg-indigo-500/20 border-l-2 border-indigo-400" :
                              field.mapped ? "bg-green-500/5" : "hover:bg-white/5"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-white">{field.label}</span>
                                  {field.required && <span className="text-xs text-rose-400 font-bold">required</span>}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">{field.description}</div>
                              </div>
                              {mappedCol ? (
                                <div className="text-right flex-shrink-0">
                                  <div className="text-xs font-semibold text-green-400">✓ {mappedCol.rawName}</div>
                                  <div className={`text-xs ${confColor(mappedCol.confidence)}`}>{mappedCol.confidence}% conf.</div>
                                </div>
                              ) : (
                                <div className="text-xs text-slate-600 italic flex-shrink-0">
                                  {isTarget ? "Drop here" : "unmapped"}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── VALIDATE ── */}
            {activeStage === "validate" && (
              <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Validation Results</div>
                    <div className="text-sm text-slate-400">
                      {preset.validation.filter((v) => v.status === "pass").length} passed ·{" "}
                      <span className="text-yellow-400">{preset.validation.filter((v) => v.status === "warn").length} warnings</span> ·{" "}
                      <span className="text-rose-400">{preset.validation.filter((v) => v.status === "fail").length} failed</span>
                    </div>
                  </div>
                  {done && (
                    <div className="flex gap-2">
                      <Link
                        href="/catalog-staging"
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg transition"
                      >
                        Send to Staging →
                      </Link>
                      <Link
                        href="/ingest"
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-lg border border-white/10 transition"
                      >
                        Back to Ingest
                      </Link>
                    </div>
                  )}
                </div>
                <div className="divide-y divide-white/5">
                  {preset.validation.map((v, i) => {
                    const m = statusIcon(v.status);
                    return (
                      <div key={i} className={`flex items-start gap-4 px-6 py-4 border-l-2 ${
                        v.status === "pass" ? "border-green-500/30" : v.status === "warn" ? "border-yellow-500/30" : "border-rose-500/30"
                      }`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 border ${m.bg} ${m.color}`}>
                          {m.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="text-sm font-semibold text-white">{v.field}</span>
                            <span className={`text-xs font-bold uppercase ${m.color}`}>{v.status}</span>
                            {v.count !== undefined && (
                              <span className="text-xs text-slate-500">{v.count.toLocaleString("en-US")} records affected</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">{v.message}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {done && (
                  <div className="px-6 py-4 bg-indigo-500/10 border-t border-indigo-500/20">
                    <div className="text-xs text-indigo-300 font-semibold mb-1">Ready for staging</div>
                    <p className="text-xs text-slate-400">
                      All mappings saved. Click "Send to Staging" to review this data against the live catalog before committing.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!selectedPreset && (
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-10 text-center">
            <div className="text-5xl mb-4">🧩</div>
            <h2 className="text-lg font-bold text-white mb-2">Select a Source to Begin</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              Pick a distributor or PRO statement above. The parser will auto-detect the schema, apply cleaning rules, map columns to catalog fields, and validate every record.
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="bg-[#0f172a]/40 border border-white/5 rounded-2xl p-5">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Pipeline Stages</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-400">
            {[
              { icon: "🔍", stage: "Format Detection",  desc: "Identify distributor schema, file format, row/column counts, and match confidence" },
              { icon: "🧹", stage: "Data Cleaning",     desc: "Strip symbols, normalize dates, pad codes, map territories, expand abbreviations" },
              { icon: "🔗", stage: "Field Mapping",     desc: "Auto-map raw column names to Master Catalog fields. Drag to correct mismatches." },
              { icon: "✅", stage: "Validation",        desc: "Check ISRC/ISWC/IPI format, split totals, missing required fields, value ranges" },
            ].map((s) => (
              <div key={s.stage}>
                <div className="font-semibold text-white mb-1">{s.icon} {s.stage}</div>
                <div className="leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
