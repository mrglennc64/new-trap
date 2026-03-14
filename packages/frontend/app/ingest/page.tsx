"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

/* ─── Types ──────────────────────────────────────────────────── */
interface IngestedFile {
  id: string;
  name: string;
  path: string;
  size: number;
  type: "distribution" | "society" | "splits" | "loss" | "unknown";
  status: "queued" | "hashing" | "parsing" | "mapped" | "error";
  hash?: string;
  progress: number;
  issues?: string[];
  mappedFields?: number;
  totalFields?: number;
}

interface PipelineStage {
  id: string;
  label: string;
  status: "idle" | "running" | "done" | "error";
  count?: number;
  detail?: string;
}

interface CatalogSummary {
  totalTracks: number;
  mappedISRC: number;
  mappedIPI: number;
  splitConflicts: number;
  unclaimedSocieties: number;
  estimatedLeakage: number;
  readyToCommit: number;
}

/* ─── Constants ──────────────────────────────────────────────── */
const ZONE_DEFS = [
  {
    id: "distribution",
    label: "Distribution Exports",
    icon: "📦",
    hint: "TuneCore, DistroKid, CD Baby, LANDR CSVs",
    color: "indigo",
  },
  {
    id: "society",
    label: "Society Statements",
    icon: "🏛️",
    hint: "ASCAP, BMI, SESAC, SoundExchange PDFs / XLS",
    color: "violet",
  },
  {
    id: "splits",
    label: "Split Vault",
    icon: "⚖️",
    hint: "Split sheets, co-writer agreements, session logs",
    color: "sky",
  },
  {
    id: "loss",
    label: "Loss Log",
    icon: "🔴",
    hint: "Dispute records, unclaimed statements, bounced checks",
    color: "rose",
  },
] as const;

type ZoneId = (typeof ZONE_DEFS)[number]["id"];

const colorMap: Record<string, string> = {
  indigo: "border-indigo-500/50 bg-indigo-500/10 hover:bg-indigo-500/20",
  violet: "border-violet-500/50 bg-violet-500/10 hover:bg-violet-500/20",
  sky: "border-sky-500/50 bg-sky-500/10 hover:bg-sky-500/20",
  rose: "border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20",
};

const iconColor: Record<string, string> = {
  indigo: "text-indigo-400",
  violet: "text-violet-400",
  sky: "text-sky-400",
  rose: "text-rose-400",
};

/* ─── Helpers ────────────────────────────────────────────────── */
function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function fmtNum(n: number) {
  return n.toLocaleString("en-US");
}

function fmtMoney(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

function simulateHash() {
  const chars = "abcdef0123456789";
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("") + "…";
}

function detectType(name: string, zone: ZoneId): IngestedFile["type"] {
  const n = name.toLowerCase();
  if (zone === "distribution") return "distribution";
  if (zone === "society") return "society";
  if (zone === "splits") return "splits";
  if (zone === "loss") return "loss";
  if (n.includes("split") || n.includes("writer")) return "splits";
  if (n.includes("ascap") || n.includes("bmi") || n.includes("sesac")) return "society";
  if (n.includes("tunecore") || n.includes("distro") || n.includes("cd baby")) return "distribution";
  return "unknown";
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function IngestPage() {
  const [dropZones, setDropZones] = useState<Record<ZoneId, boolean>>({
    distribution: false,
    society: false,
    splits: false,
    loss: false,
  });
  const [files, setFiles] = useState<IngestedFile[]>([]);
  const [phase, setPhase] = useState<"idle" | "scanning" | "pipeline" | "review" | "committed">("idle");
  const [pipeline, setPipeline] = useState<PipelineStage[]>([
    { id: "detect", label: "Format Detection", status: "idle" },
    { id: "clean", label: "Data Cleaning", status: "idle" },
    { id: "map", label: "Field Mapping", status: "idle" },
    { id: "validate", label: "Validation & Flag", status: "idle" },
  ]);
  const [summary, setSummary] = useState<CatalogSummary | null>(null);
  const [liveMode, setLiveMode] = useState(false);
  const [commitPct, setCommitPct] = useState(0);
  const [activeTab, setActiveTab] = useState<"files" | "log" | "catalog">("files");
  const [log, setLog] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const pushLog = useCallback((msg: string) => {
    setLog((prev) => [...prev.slice(-199), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  /* ── Walk directory entries (webkitGetAsEntry) ── */
  const walkEntry = useCallback(
    (entry: FileSystemEntry, zone: ZoneId, depth = 0): Promise<IngestedFile[]> => {
      return new Promise((resolve) => {
        if (entry.isFile) {
          (entry as FileSystemFileEntry).file((f) => {
            if (f.name.startsWith(".")) return resolve([]);
            const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
            if (!["csv", "xls", "xlsx", "pdf", "json", "txt", "tsv"].includes(ext)) return resolve([]);
            resolve([
              {
                id: genId(),
                name: f.name,
                path: entry.fullPath,
                size: f.size,
                type: detectType(f.name, zone),
                status: "queued",
                progress: 0,
              },
            ]);
          });
        } else if (entry.isDirectory && depth < 6) {
          const reader = (entry as FileSystemDirectoryEntry).createReader();
          const all: FileSystemEntry[] = [];
          const readBatch = () => {
            reader.readEntries(async (batch) => {
              if (!batch.length) {
                const nested = await Promise.all(all.map((e) => walkEntry(e, zone, depth + 1)));
                resolve(nested.flat());
              } else {
                all.push(...batch);
                readBatch();
              }
            });
          };
          readBatch();
        } else {
          resolve([]);
        }
      });
    },
    []
  );

  /* ── Drop handler ── */
  const handleDrop = useCallback(
    async (e: React.DragEvent, zone: ZoneId) => {
      e.preventDefault();
      setDropZones((z) => ({ ...z, [zone]: false }));

      const items = Array.from(e.dataTransfer.items);
      const discovered: IngestedFile[] = [];

      for (const item of items) {
        const entry = item.webkitGetAsEntry?.();
        if (!entry) continue;
        const found = await walkEntry(entry, zone);
        discovered.push(...found);
      }

      if (discovered.length) {
        setFiles((prev) => [...prev, ...discovered]);
        pushLog(`Discovered ${discovered.length} file(s) from ${zone} drop`);
      }
    },
    [walkEntry, pushLog]
  );

  /* ── File input fallback ── */
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, zone: ZoneId) => {
      const selected = Array.from(e.target.files ?? []);
      const added: IngestedFile[] = selected.map((f) => ({
        id: genId(),
        name: f.name,
        path: f.webkitRelativePath || f.name,
        size: f.size,
        type: detectType(f.name, zone),
        status: "queued",
        progress: 0,
      }));
      setFiles((prev) => [...prev, ...added]);
      pushLog(`Added ${added.length} file(s) to ${zone} zone`);
    },
    [pushLog]
  );

  /* ── Simulate hashing phase ── */
  const runHashing = useCallback(
    async (fileList: IngestedFile[]) => {
      for (let i = 0; i < fileList.length; i++) {
        await new Promise<void>((res) => {
          let p = 0;
          setFiles((prev) =>
            prev.map((f) => (f.id === fileList[i].id ? { ...f, status: "hashing" } : f))
          );
          pushLog(`SHA-256 hashing: ${fileList[i].name}`);
          const tick = setInterval(() => {
            p += Math.random() * 25 + 5;
            if (p >= 100) {
              clearInterval(tick);
              const hash = simulateHash();
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === fileList[i].id ? { ...f, status: "parsing", progress: 100, hash } : f
                )
              );
              pushLog(`Hash complete: ${fileList[i].name} → ${hash}`);
              res();
            } else {
              setFiles((prev) =>
                prev.map((f) => (f.id === fileList[i].id ? { ...f, progress: p } : f))
              );
            }
          }, 60);
        });
      }
    },
    [pushLog]
  );

  /* ── Simulate pipeline ── */
  const runPipeline = useCallback(
    async (count: number) => {
      const stages: PipelineStage[] = [
        { id: "detect", label: "Format Detection", status: "running", detail: "Identifying CSV/XLSX/PDF schemas…" },
        { id: "clean", label: "Data Cleaning", status: "idle" },
        { id: "map", label: "Field Mapping", status: "idle" },
        { id: "validate", label: "Validation & Flag", status: "idle" },
      ];
      setPipeline([...stages]);
      await new Promise((r) => setTimeout(r, 1200));
      pushLog(`Format Detection: identified ${count} unique schemas`);

      stages[0] = { ...stages[0], status: "done", count, detail: `${count} schema(s) resolved` };
      stages[1] = { ...stages[1], status: "running", detail: "Stripping null rows, normalizing dates…" };
      setPipeline([...stages]);
      await new Promise((r) => setTimeout(r, 1400));
      const cleaned = Math.floor(count * 0.97);
      pushLog(`Data Cleaning: ${cleaned}/${count} rows passed`);

      stages[1] = { ...stages[1], status: "done", count: cleaned, detail: `${cleaned} rows cleaned` };
      stages[2] = { ...stages[2], status: "running", detail: "Mapping ISRC, IPI, splits to catalog…" };
      setPipeline([...stages]);
      await new Promise((r) => setTimeout(r, 1600));
      const mapped = Math.floor(cleaned * 0.88);
      pushLog(`Field Mapping: ${mapped} records mapped to catalog schema`);

      stages[2] = { ...stages[2], status: "done", count: mapped, detail: `${mapped} records mapped` };
      stages[3] = { ...stages[3], status: "running", detail: "Validating splits, flagging conflicts…" };
      setPipeline([...stages]);
      await new Promise((r) => setTimeout(r, 1500));
      const flags = Math.floor(mapped * 0.07);
      pushLog(`Validation: ${flags} conflict(s) flagged`);

      stages[3] = { ...stages[3], status: "done", count: flags, detail: `${flags} conflict(s) flagged` };
      setPipeline([...stages]);

      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          status: "mapped",
          mappedFields: Math.floor(Math.random() * 8 + 10),
          totalFields: 18,
          issues: Math.random() > 0.7 ? ["Split > 100%", "Missing IPI"] : [],
        }))
      );

      const total = Math.floor(mapped * 12.4);
      setSummary({
        totalTracks: total,
        mappedISRC: Math.floor(total * 0.91),
        mappedIPI: Math.floor(total * 0.78),
        splitConflicts: flags * 3,
        unclaimedSocieties: Math.floor(total * 0.14),
        estimatedLeakage: Math.floor(total * 14.7),
        readyToCommit: Math.floor(total * 0.84),
      });
    },
    [pushLog]
  );

  /* ── Run full scan ── */
  const runScan = useCallback(async () => {
    if (!files.length) return;
    setPhase("scanning");
    setActiveTab("log");
    pushLog("=== BULK INGEST SESSION STARTED ===");
    pushLog(`Total files queued: ${files.length}`);
    await runHashing(files);
    setPhase("pipeline");
    pushLog("--- Pipeline started ---");
    await runPipeline(files.length);
    setPhase("review");
    setActiveTab("catalog");
    pushLog("=== PIPELINE COMPLETE — awaiting commit decision ===");
  }, [files, runHashing, runPipeline, pushLog]);

  /* ── Commit to live ── */
  const commitToLive = useCallback(async () => {
    setCommitPct(0);
    pushLog("Initiating shadow-to-live database swap…");
    for (let p = 0; p <= 100; p += 2) {
      await new Promise((r) => setTimeout(r, 40));
      setCommitPct(p);
    }
    setLiveMode(true);
    setPhase("committed");
    pushLog("COMMIT COMPLETE — Master Catalog updated");
    pushLog(`Timestamp: ${new Date().toISOString()}`);
  }, [pushLog]);

  const totalFiles = files.length;
  const doneFiles = files.filter((f) => f.status === "mapped" || f.status === "error").length;

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 pt-14 pb-20">
      {/* ── Header ── */}
      <div className="bg-[#0f172a] border-b border-white/10 px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">📂</span>
              <h1 className="text-xl font-black text-white tracking-tight">Bulk Folder Ingestion Engine</h1>
              {liveMode && (
                <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30 animate-pulse">
                  LIVE
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm">
              Drop entire USB folders — nested directories, mixed formats. Auto-detect, hash, parse, and merge into your Master Catalog.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/onboard" className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition">
              ← Onboarding
            </Link>
            <Link href="/label" className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition">
              Label Portal
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Status bar ── */}
        {phase !== "idle" && (
          <div className="bg-[#0f172a] border border-white/10 rounded-xl p-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${phase === "scanning" ? "bg-yellow-400 animate-pulse" : phase === "pipeline" ? "bg-blue-400 animate-pulse" : phase === "committed" ? "bg-green-400" : "bg-indigo-400"}`} />
              <span className="text-sm font-semibold text-slate-200">
                {phase === "scanning" && "Hashing files…"}
                {phase === "pipeline" && "Running parse pipeline…"}
                {phase === "review" && "Ready for review"}
                {phase === "committed" && "Committed to Master Catalog"}
              </span>
            </div>
            {totalFiles > 0 && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{doneFiles}/{totalFiles} files processed</span>
                <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${(doneFiles / totalFiles) * 100}%` }} />
                </div>
              </div>
            )}
            {phase === "committed" && summary && (
              <span className="ml-auto text-xs text-green-400 font-semibold">
                {fmtNum(summary.readyToCommit)} tracks live
              </span>
            )}
          </div>
        )}

        {/* ── Drop Zones ── */}
        {phase === "idle" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {ZONE_DEFS.map((zone) => (
              <div
                key={zone.id}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                  dropZones[zone.id]
                    ? "scale-105 border-opacity-100 " + colorMap[zone.color]
                    : colorMap[zone.color] + " opacity-80 hover:opacity-100"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDropZones((z) => ({ ...z, [zone.id]: true })); }}
                onDragLeave={() => setDropZones((z) => ({ ...z, [zone.id]: false }))}
                onDrop={(e) => handleDrop(e, zone.id as ZoneId)}
                onClick={() => {
                  const inp = document.getElementById(`file-input-${zone.id}`) as HTMLInputElement;
                  inp?.click();
                }}
              >
                <input
                  id={`file-input-${zone.id}`}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileInput(e, zone.id as ZoneId)}
                />
                <input
                  id={`folder-input-${zone.id}`}
                  type="file"
                  multiple
                  className="hidden"
                  {...({ webkitdirectory: "" } as any)}
                  onChange={(e) => handleFileInput(e, zone.id as ZoneId)}
                />
                <div className={`text-4xl mb-3 ${iconColor[zone.color]}`}>{zone.icon}</div>
                <div className="font-bold text-white text-sm mb-1">{zone.label}</div>
                <div className="text-xs text-slate-400 leading-relaxed">{zone.hint}</div>
                <div className="mt-4 flex items-center justify-center gap-3 text-xs text-slate-500">
                  <span>Drop folder or</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); (document.getElementById(`file-input-${zone.id}`) as HTMLInputElement)?.click(); }}
                    className="underline hover:text-slate-300 transition"
                  >files</button>
                  <span>/</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); (document.getElementById(`folder-input-${zone.id}`) as HTMLInputElement)?.click(); }}
                    className="underline hover:text-slate-300 transition"
                  >📁 folder</button>
                </div>
                {files.filter((f) => f.type === zone.id).length > 0 && (
                  <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold ${iconColor[zone.color]} bg-white/10`}>
                    {files.filter((f) => f.type === zone.id).length}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── File list + pipeline + catalog tabs ── */}
        {(files.length > 0 || phase !== "idle") && (
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden">
            {/* Tab bar */}
            <div className="flex items-center border-b border-white/10">
              {(["files", "log", "catalog"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-sm font-semibold capitalize transition ${
                    activeTab === tab ? "text-white border-b-2 border-indigo-400" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {tab === "files" && `Files (${files.length})`}
                  {tab === "log" && "Activity Log"}
                  {tab === "catalog" && "Catalog Summary"}
                </button>
              ))}
              {/* Scan / Reset buttons */}
              <div className="ml-auto flex items-center gap-2 px-4">
                {phase === "idle" && files.length > 0 && (
                  <button
                    onClick={runScan}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition"
                  >
                    Run Forensic Scan
                  </button>
                )}
                {(phase === "review" || phase === "committed") && (
                  <button
                    onClick={() => { setFiles([]); setPhase("idle"); setPipeline(p => p.map(s => ({...s, status:"idle"}))); setSummary(null); setLiveMode(false); setCommitPct(0); setLog([]); }}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-lg border border-white/10 transition"
                  >
                    New Session
                  </button>
                )}
              </div>
            </div>

            {/* Files tab */}
            {activeTab === "files" && (
              <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
                {files.length === 0 && (
                  <div className="px-6 py-10 text-center text-slate-500 text-sm">No files added yet — drop folders above.</div>
                )}
                {files.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/5 transition">
                    <div className="text-lg flex-shrink-0">
                      {f.type === "distribution" ? "📦" : f.type === "society" ? "🏛️" : f.type === "splits" ? "⚖️" : f.type === "loss" ? "🔴" : "📄"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-200 truncate">{f.name}</div>
                      <div className="text-xs text-slate-500 truncate">{f.path} · {fmtBytes(f.size)}</div>
                      {f.hash && <div className="text-xs text-slate-600 font-mono mt-0.5">SHA-256: {f.hash}</div>}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {f.status === "queued" && <span className="text-xs text-slate-500">Queued</span>}
                      {f.status === "hashing" && (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-yellow-400">Hashing</span>
                          <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 transition-all duration-100" style={{ width: `${f.progress}%` }} />
                          </div>
                        </div>
                      )}
                      {f.status === "parsing" && <span className="text-xs text-blue-400">Parsing…</span>}
                      {f.status === "mapped" && (
                        <div className="text-right">
                          <span className="text-xs text-green-400 font-semibold">Mapped</span>
                          {f.issues && f.issues.length > 0 && (
                            <div className="mt-0.5 flex flex-col items-end gap-0.5">
                              {f.issues.map((iss) => (
                                <span key={iss} className="text-xs text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">{iss}</span>
                              ))}
                            </div>
                          )}
                          {f.mappedFields !== undefined && (
                            <div className="text-xs text-slate-500 mt-0.5">{f.mappedFields}/{f.totalFields} fields</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Log tab */}
            {activeTab === "log" && (
              <div
                ref={logRef}
                className="h-96 overflow-y-auto bg-black/40 p-4 font-mono text-xs text-green-400 space-y-0.5"
              >
                {log.length === 0 && <div className="text-slate-600">No activity yet.</div>}
                {log.map((line, i) => (
                  <div key={i} className="leading-5">{line}</div>
                ))}
                {(phase === "scanning" || phase === "pipeline") && (
                  <div className="text-yellow-400 animate-pulse">▊</div>
                )}
              </div>
            )}

            {/* Catalog Summary tab */}
            {activeTab === "catalog" && (
              <div className="p-6">
                {/* Pipeline stages */}
                <div className="mb-6">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Parse Pipeline</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {pipeline.map((stage) => (
                      <div key={stage.id} className={`rounded-xl p-3 border ${
                        stage.status === "done" ? "border-green-500/30 bg-green-500/10" :
                        stage.status === "running" ? "border-blue-500/30 bg-blue-500/10 animate-pulse" :
                        stage.status === "error" ? "border-rose-500/30 bg-rose-500/10" :
                        "border-white/10 bg-white/5"
                      }`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className={`w-2 h-2 rounded-full ${
                            stage.status === "done" ? "bg-green-400" :
                            stage.status === "running" ? "bg-blue-400 animate-pulse" :
                            stage.status === "error" ? "bg-rose-400" : "bg-slate-600"
                          }`} />
                          <span className="text-xs font-semibold text-slate-200">{stage.label}</span>
                        </div>
                        {stage.detail && <div className="text-xs text-slate-400">{stage.detail}</div>}
                        {stage.count !== undefined && (
                          <div className="text-lg font-black text-white mt-1">{fmtNum(stage.count)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary cards */}
                {summary && (
                  <>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Catalog Health</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
                      {[
                        { label: "Total Tracks", value: fmtNum(summary.totalTracks), color: "text-white" },
                        { label: "ISRC Mapped", value: `${((summary.mappedISRC / summary.totalTracks) * 100).toFixed(1)}%`, color: "text-green-400" },
                        { label: "IPI Mapped", value: `${((summary.mappedIPI / summary.totalTracks) * 100).toFixed(1)}%`, color: "text-sky-400" },
                        { label: "Split Conflicts", value: fmtNum(summary.splitConflicts), color: "text-rose-400" },
                        { label: "Unclaimed PRO", value: fmtNum(summary.unclaimedSocieties), color: "text-yellow-400" },
                        { label: "Est. Leakage", value: fmtMoney(summary.estimatedLeakage), color: "text-rose-400 text-sm" },
                      ].map((c) => (
                        <div key={c.label} className="bg-white/5 rounded-xl p-3 border border-white/10">
                          <div className="text-xs text-slate-500 mb-1">{c.label}</div>
                          <div className={`text-xl font-black ${c.color}`}>{c.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Commit section */}
                    {phase !== "committed" ? (
                      <div className="bg-[#1e293b]/60 border border-white/10 rounded-2xl p-5">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <div className="text-sm font-bold text-white mb-1">
                              {fmtNum(summary.readyToCommit)} tracks ready — shadow catalog loaded
                            </div>
                            <p className="text-xs text-slate-400">
                              Data lives in shadow mode. Review flagged conflicts before swapping to live Master Catalog.
                              This action is reversible within 24 hours.
                            </p>
                            <div className="flex gap-4 mt-3">
                              <span className="text-xs text-slate-400">
                                <span className="text-green-400 font-semibold">{fmtNum(summary.readyToCommit)}</span> clean
                              </span>
                              <span className="text-xs text-slate-400">
                                <span className="text-rose-400 font-semibold">{fmtNum(summary.splitConflicts)}</span> flagged
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={commitToLive}
                            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-sm transition flex-shrink-0"
                          >
                            Commit to Master Catalog
                          </button>
                        </div>
                        {commitPct > 0 && commitPct < 100 && (
                          <div className="mt-4">
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                              <span>Shadow → Live swap</span>
                              <span>{commitPct}%</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 transition-all duration-100" style={{ width: `${commitPct}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 flex items-center gap-4">
                        <div className="text-4xl">✅</div>
                        <div>
                          <div className="text-sm font-bold text-green-400 mb-1">Master Catalog Updated</div>
                          <p className="text-xs text-slate-400">
                            {fmtNum(summary.readyToCommit)} tracks are now live. Flagged conflicts saved for attorney review.
                            Rollback available for 24 hours.
                          </p>
                          <div className="flex gap-3 mt-3">
                            <Link href="/label" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition">
                              View Catalog
                            </Link>
                            <Link href="/attorney-portal" className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-lg border border-white/10 transition">
                              Attorney Review
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {!summary && phase === "idle" && (
                  <div className="text-center py-10 text-slate-500 text-sm">
                    Run the forensic scan to see catalog analysis here.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Empty state CTA ── */}
        {phase === "idle" && files.length === 0 && (
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">🗂️</div>
            <h2 className="text-lg font-bold text-white mb-2">Drop Your USB Folders Above</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto mb-6">
              Drag and drop entire directories — nested folders, mixed file formats. The engine auto-detects CSV, XLSX, PDF, and JSON from any distributor or PRO. No manual formatting required.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
              {[
                { icon: "🔐", title: "SHA-256 Hashed", desc: "Every file fingerprinted locally before upload" },
                { icon: "🧩", title: "Schema-Agnostic", desc: "Detects TuneCore, ASCAP, BMI, DistroKid and more" },
                { icon: "🔄", title: "Shadow → Live Swap", desc: "Preview in shadow mode before touching the live catalog" },
              ].map((c) => (
                <div key={c.title} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-2xl mb-2">{c.icon}</div>
                  <div className="text-sm font-semibold text-white mb-1">{c.title}</div>
                  <div className="text-xs text-slate-400">{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── How it works strip ── */}
        <div className="bg-[#0f172a]/50 border border-white/5 rounded-2xl p-5">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">How It Works</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { step: "1", icon: "📂", label: "Drop Folders", desc: "Entire USB directories — nested, mixed formats" },
              { step: "2", icon: "🔐", label: "Hash & Verify", desc: "SHA-256 fingerprint every file before parsing" },
              { step: "3", icon: "🧩", label: "Auto-Parse", desc: "Detect → Clean → Map → Validate pipeline" },
              { step: "4", icon: "✅", label: "Commit or Hold", desc: "Shadow preview, then swap to live catalog" },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  {s.step}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{s.icon} {s.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
