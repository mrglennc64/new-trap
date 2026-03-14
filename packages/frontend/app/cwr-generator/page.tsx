"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";

/* ─── Types ──────────────────────────────────────────────────── */
interface Writer {
  id: string;
  name: string;
  ipi: string;
  role: "CA" | "A" | "C" | "E" | "AR" | "SE";
  share: number;
  pro: string;
  controlled: boolean;
}

interface Publisher {
  id: string;
  name: string;
  ipi: string;
  share: number;
  pro: string;
}

interface Work {
  id: string;
  title: string;
  altTitle: string;
  iswc: string;
  isrc: string;
  language: string;
  category: "POP" | "JAZ" | "CLA" | "RCK" | "R&B" | "RAP" | "CON" | "FOL";
  duration: string; // HHMMSS
  writers: Writer[];
  publisher: Publisher;
  territories: string[];
  status: "NWR" | "REV" | "ISW";
  selected: boolean;
}

/* ─── Constants ──────────────────────────────────────────────── */
const ROLE_LABELS: Record<Writer["role"], string> = {
  CA: "Composer & Author",
  A:  "Author / Lyricist",
  C:  "Composer",
  E:  "Original Publisher",
  AR: "Arranger",
  SE: "Sub-Arranger",
};

const PRO_LIST = ["ASCAP", "BMI", "SESAC", "SOCAN", "PRS", "GEMA", "SACEM", "APRA", "SGAE", "SIAE"];

const TERRITORY_LIST = [
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "JP", label: "Japan" },
  { code: "BR", label: "Brazil" },
  { code: "2136", label: "Worldwide (All Territories)" },
];

const SAMPLE_WORKS: Work[] = [
  {
    id: "w1", title: "SICKO MODE", altTitle: "", iswc: "T-921614229-5",
    isrc: "USUG11801862", language: "EN", category: "RAP", duration: "052858",
    writers: [
      { id: "wt1", name: "JACQUES WEBSTER II", ipi: "00721084930", role: "CA", share: 33.33, pro: "ASCAP", controlled: true },
      { id: "wt2", name: "AUBREY GRAHAM",       ipi: "00495205820", role: "CA", share: 33.33, pro: "SOCAN", controlled: true },
      { id: "wt3", name: "TRAVIS THOMPSON",     ipi: "00812930041", role: "C",  share: 33.34, pro: "BMI",   controlled: false },
    ],
    publisher: { id: "p1", name: "CACTUS JACK PUBLISHING", ipi: "00721084941", share: 50, pro: "ASCAP" },
    territories: ["2136"],
    status: "NWR", selected: true,
  },
  {
    id: "w2", title: "NO ROLE MODELZ", altTitle: "NO ROLE MODELS",
    iswc: "T-913284771-3", isrc: "USRC11400626", language: "EN", category: "RAP", duration: "044912",
    writers: [
      { id: "wt4", name: "JERMAINE COLE", ipi: "00591263810", role: "CA", share: 100, pro: "ASCAP", controlled: true },
    ],
    publisher: { id: "p2", name: "DREAMVILLE PUBLISHING", ipi: "00591263821", share: 50, pro: "ASCAP" },
    territories: ["US", "GB", "CA", "AU"],
    status: "NWR", selected: true,
  },
  {
    id: "w3", title: "GOOSEBUMPS", altTitle: "", iswc: "T-002330122-4",
    isrc: "USUG11501163", language: "EN", category: "RAP", duration: "034205",
    writers: [
      { id: "wt5", name: "JACQUES WEBSTER II", ipi: "00721084930", role: "CA", share: 50, pro: "ASCAP", controlled: true },
      { id: "wt6", name: "KENDRICK DUCKWORTH",  ipi: "00584921047", role: "C",  share: 50, pro: "BMI",   controlled: false },
    ],
    publisher: { id: "p3", name: "CACTUS JACK PUBLISHING", ipi: "00721084941", share: 50, pro: "ASCAP" },
    territories: ["2136"],
    status: "REV", selected: false,
  },
  {
    id: "w4", title: "DRIP TOO HARD", altTitle: "",
    iswc: "", isrc: "USSM11804672", language: "EN", category: "RAP", duration: "021844",
    writers: [
      { id: "wt7", name: "DOMINIQUE ARMANI JONES", ipi: "00819234071", role: "CA", share: 50, pro: "BMI", controlled: true },
      { id: "wt8", name: "SERGIO GIAVANNI KITCHENS", ipi: "00830192847", role: "CA", share: 50, pro: "BMI", controlled: true },
    ],
    publisher: { id: "p4", name: "QUALITY CONTROL MUSIC", ipi: "00819234082", share: 50, pro: "BMI" },
    territories: ["US", "CA"],
    status: "NWR", selected: true,
  },
];

/* ─── CWR Builder ────────────────────────────────────────────── */
function pad(s: string | number, len: number, char = " ", right = false): string {
  const str = String(s);
  if (str.length >= len) return str.slice(0, len);
  const padding = char.repeat(len - str.length);
  return right ? str + padding : padding + str;
}

function lpad(s: string | number, len: number, char = " ") { return pad(s, len, char, false); }
function rpad(s: string | number, len: number)              { return pad(s, len, " ", true); }

function buildCWR(works: Work[], submitter: string, senderIPI: string): string {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const timeStr = today.toTimeString().slice(0, 8).replace(/:/g, "");
  const lines: string[] = [];

  // HDR
  lines.push(
    "HDR" +
    rpad("PB", 2) +
    rpad(senderIPI.slice(0, 9), 9) +
    rpad(submitter.toUpperCase().slice(0, 45), 45) +
    "01.10" +
    dateStr + timeStr +
    lpad("1", 8, "0") +
    rpad("CWR", 3)
  );

  let txSeq = 0;
  let recSeq = 0;

  works.forEach((work) => {
    txSeq++;
    recSeq = 0;

    // NWR/REV
    const txType = work.status;
    recSeq++;
    const iswcOut = work.iswc ? work.iswc.replace(/[-\.]/g, "").padEnd(11) : " ".repeat(11);
    lines.push(
      txType +
      lpad(txSeq, 8, "0") +
      lpad(recSeq, 8, "0") +
      rpad(work.title.toUpperCase().slice(0, 60), 60) +
      iswcOut +
      dateStr +
      rpad("", 60) + // source
      lpad(work.duration || "000000", 6, "0") +
      rpad(work.category, 3) +
      "U" + // type of right
      rpad("ORI", 3) + // version type
      rpad("", 3) +    // excerpt type
      rpad("", 3) +    // music arrangement
      rpad("", 3) +    // lyric adaptation
      rpad(work.language, 2)
    );

    // ALT (alternate title)
    if (work.altTitle) {
      recSeq++;
      lines.push(
        "ALT" +
        lpad(txSeq, 8, "0") +
        lpad(recSeq, 8, "0") +
        rpad(work.altTitle.toUpperCase().slice(0, 60), 60) +
        "AT" +
        rpad(work.language, 2)
      );
    }

    // SPU (publisher)
    recSeq++;
    lines.push(
      "SPU" +
      lpad(txSeq, 8, "0") +
      lpad(recSeq, 8, "0") +
      lpad("1", 4, "0") +
      rpad(work.publisher.name.slice(0, 45), 45) +
      "AQ" +
      rpad(work.publisher.ipi.slice(0, 11), 11) +
      rpad("", 14) + // publisher unknown indicator
      rpad(work.publisher.pro, 3) +
      rpad("", 3) +
      lpad(Math.round(work.publisher.share * 100), 5, "0") +
      lpad("0", 5, "0") +
      lpad("0", 5, "0")
    );

    // SPT (publisher territory)
    work.territories.forEach((terr) => {
      recSeq++;
      lines.push(
        "SPT" +
        lpad(txSeq, 8, "0") +
        lpad(recSeq, 8, "0") +
        rpad(work.publisher.ipi.slice(0, 11), 11) +
        lpad(Math.round(work.publisher.share * 100), 5, "0") +
        lpad("0", 5, "0") +
        lpad("0", 5, "0") +
        rpad(terr, 4) +
        "I" // inclusion
      );
    });

    // SWR / SWT per writer
    work.writers.forEach((writer, wi) => {
      recSeq++;
      lines.push(
        "SWR" +
        lpad(txSeq, 8, "0") +
        lpad(recSeq, 8, "0") +
        rpad(writer.ipi.slice(0, 11), 11) +
        rpad(writer.name.split(" ").slice(-1)[0].slice(0, 45), 45) +  // last name
        rpad(writer.name.split(" ").slice(0, -1).join(" ").slice(0, 30), 30) + // first
        rpad(writer.role, 2) +
        lpad(Math.round(writer.share * 100), 5, "0") +
        lpad(Math.round(writer.share * 50), 5, "0") + // mechanical
        lpad("0", 5, "0") +
        rpad(writer.pro, 3) +
        (writer.controlled ? "Y" : "N")
      );

      // SWT (writer territory)
      work.territories.forEach((terr) => {
        recSeq++;
        lines.push(
          "SWT" +
          lpad(txSeq, 8, "0") +
          lpad(recSeq, 8, "0") +
          rpad(writer.ipi.slice(0, 11), 11) +
          lpad(Math.round(writer.share * 100), 5, "0") +
          lpad(Math.round(writer.share * 50), 5, "0") +
          lpad("0", 5, "0") +
          rpad(terr, 4) +
          "I"
        );
      });

      // PWR (publisher for writer)
      recSeq++;
      lines.push(
        "PWR" +
        lpad(txSeq, 8, "0") +
        lpad(recSeq, 8, "0") +
        rpad(work.publisher.ipi.slice(0, 11), 11) +
        rpad(work.publisher.name.slice(0, 45), 45) +
        rpad(writer.ipi.slice(0, 11), 11)
      );
    });

    // TRL (transaction trailer)
    recSeq++;
    lines.push(
      "TRL" +
      lpad(txSeq, 8, "0") +
      lpad(recSeq, 8, "0") +
      lpad(recSeq, 8, "0")
    );
  });

  // GRT (group trailer)
  lines.push("GRT" + lpad("1", 8, "0") + lpad(txSeq, 8, "0") + lpad(lines.length + 2, 8, "0"));

  // TRL (file trailer)
  lines.push("TRL" + lpad("1", 8, "0") + lpad(txSeq, 8, "0") + lpad(lines.length + 1, 8, "0"));

  return lines.join("\r\n");
}

/* ─── Main ──────────────────────────────────────────────────── */
export default function CWRGeneratorPage() {
  const [works, setWorks] = useState<Work[]>(SAMPLE_WORKS);
  const [submitter, setSubmitter] = useState("TRAPROYALTIES PRO LLC");
  const [senderIPI, setSenderIPI] = useState("00712984310");
  const [targetPRO, setTargetPRO] = useState("ASCAP");
  const [generated, setGenerated] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [activeWork, setActiveWork] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const selectedWorks = works.filter((w) => w.selected);
  const totalSplitOk  = works.every((w) => {
    const sum = w.writers.reduce((s, wr) => s + wr.share, 0);
    return Math.abs(sum - 100) < 0.1;
  });

  const toggleWork = (id: string) => setWorks((p) => p.map((w) => w.id === id ? { ...w, selected: !w.selected } : w));
  const setStatus = (id: string, status: Work["status"]) => setWorks((p) => p.map((w) => w.id === id ? { ...w, status } : w));

  const generate = useCallback(async () => {
    if (!selectedWorks.length) return;
    setGenerating(true);
    setShowPreview(false);
    await new Promise((r) => setTimeout(r, 800));
    const cwr = buildCWR(selectedWorks, submitter, senderIPI);
    setGenerated(cwr);
    setGenerating(false);
    setShowPreview(true);
  }, [selectedWorks, submitter, senderIPI]);

  const download = useCallback(() => {
    if (!generated) return;
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const blob = new Blob([generated], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `CW${today}_01_${targetPRO}.V21`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generated, targetPRO]);

  const copyAll = useCallback(() => {
    if (textRef.current) {
      textRef.current.select();
      document.execCommand("copy");
    }
  }, []);

  const activeWorkObj = works.find((w) => w.id === activeWork);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 pt-14 pb-20">
      {/* Header */}
      <div className="bg-[#0f172a] border-b border-white/10 px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">📋</span>
              <h1 className="text-xl font-black text-white tracking-tight">CWR File Generator</h1>
            </div>
            <p className="text-slate-400 text-sm">
              Build CISAC-compliant Common Works Registration files for ASCAP, BMI, SESAC, and global PRO submission. CWR v2.1 format.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/schema-parser" className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition">
              ← Parser
            </Link>
            <Link href="/label" className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition">
              Label Portal
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Submitter config */}
        <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-5">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Submitter Details</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Company / Publisher Name</label>
              <input
                value={submitter}
                onChange={(e) => setSubmitter(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-[#1e293b] border border-white/10 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                placeholder="YOUR PUBLISHING LLC"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Sender IPI Number</label>
              <input
                value={senderIPI}
                onChange={(e) => setSenderIPI(e.target.value.replace(/\D/g, "").slice(0, 11))}
                className="w-full px-3 py-2 bg-[#1e293b] border border-white/10 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                placeholder="00000000000"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Target PRO</label>
              <select
                value={targetPRO}
                onChange={(e) => setTargetPRO(e.target.value)}
                className="w-full px-3 py-2 bg-[#1e293b] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {PRO_LIST.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Work list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Works ({selectedWorks.length}/{works.length} selected)
              </div>
              {!totalSplitOk && (
                <span className="text-xs text-rose-400 font-semibold">⚠ Split total ≠ 100% on some works</span>
              )}
            </div>

            {works.map((work) => {
              const splitSum = work.writers.reduce((s, w) => s + w.share, 0);
              const splitOk  = Math.abs(splitSum - 100) < 0.1;
              const isActive = activeWork === work.id;
              return (
                <div
                  key={work.id}
                  className={`rounded-2xl border transition-all ${
                    isActive
                      ? "border-indigo-500/50 bg-indigo-500/5"
                      : work.selected
                        ? "border-green-500/20 bg-[#0f172a]"
                        : "border-white/5 bg-[#0f172a] opacity-60"
                  }`}
                >
                  {/* Work header */}
                  <div className="flex items-start gap-3 p-4">
                    <input
                      type="checkbox"
                      checked={work.selected}
                      onChange={() => toggleWork(work.id)}
                      className="mt-0.5 accent-indigo-500 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold text-white truncate">{work.title}</span>
                        <span className={`px-2 py-0.5 text-xs font-bold rounded border ${
                          work.status === "NWR" ? "text-green-400 border-green-500/30 bg-green-500/10" :
                          work.status === "REV" ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" :
                          "text-blue-400 border-blue-500/30 bg-blue-500/10"
                        }`}>
                          {work.status}
                        </span>
                        {!splitOk && <span className="text-xs text-rose-400">⚠ Split {splitSum.toFixed(2)}%</span>}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                        <span>ISRC: <span className="text-slate-400 font-mono">{work.isrc || "—"}</span></span>
                        <span>ISWC: <span className="text-slate-400 font-mono">{work.iswc || "—"}</span></span>
                        <span>{work.writers.length} writer{work.writers.length !== 1 ? "s" : ""}</span>
                        <span>{work.territories.includes("2136") ? "Worldwide" : work.territories.join(", ")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        value={work.status}
                        onChange={(e) => setStatus(work.id, e.target.value as Work["status"])}
                        className="px-2 py-1 bg-[#1e293b] border border-white/10 rounded text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="NWR">NWR — New</option>
                        <option value="REV">REV — Revised</option>
                        <option value="ISW">ISW — Existing</option>
                      </select>
                      <button
                        onClick={() => setActiveWork(isActive ? null : work.id)}
                        className="text-xs text-slate-500 hover:text-indigo-400 transition px-2 py-1"
                      >
                        {isActive ? "Close" : "Details"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded work detail */}
                  {isActive && (
                    <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                      {/* Writers */}
                      <div>
                        <div className="text-xs font-semibold text-slate-400 mb-2">Writers / Composers</div>
                        <div className="space-y-2">
                          {work.writers.map((wr) => (
                            <div key={wr.id} className="bg-white/5 rounded-lg px-3 py-2 grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center text-xs">
                              <div>
                                <div className="font-semibold text-white">{wr.name}</div>
                                <div className="text-slate-500 font-mono">IPI: {wr.ipi} · {wr.pro}</div>
                              </div>
                              <span className="text-slate-400">{ROLE_LABELS[wr.role]}</span>
                              <span className={`font-bold ${wr.controlled ? "text-indigo-400" : "text-slate-500"}`}>
                                {wr.controlled ? "Controlled" : "Uncontrolled"}
                              </span>
                              <span className="font-bold text-white text-right">{wr.share}%</span>
                            </div>
                          ))}
                        </div>
                        <div className={`text-xs mt-1.5 font-semibold ${
                          Math.abs(work.writers.reduce((s, w) => s + w.share, 0) - 100) < 0.1
                            ? "text-green-400" : "text-rose-400"
                        }`}>
                          Total: {work.writers.reduce((s, w) => s + w.share, 0).toFixed(2)}% (must equal 100%)
                        </div>
                      </div>

                      {/* Publisher */}
                      <div>
                        <div className="text-xs font-semibold text-slate-400 mb-2">Publisher</div>
                        <div className="bg-white/5 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-semibold text-white">{work.publisher.name}</div>
                            <div className="text-slate-500 font-mono">IPI: {work.publisher.ipi} · {work.publisher.pro}</div>
                          </div>
                          <span className="font-bold text-indigo-400">{work.publisher.share}% share</span>
                        </div>
                      </div>

                      {/* Territories */}
                      <div>
                        <div className="text-xs font-semibold text-slate-400 mb-2">Territories</div>
                        <div className="flex flex-wrap gap-1.5">
                          {work.territories.map((t) => {
                            const label = TERRITORY_LIST.find((tl) => tl.code === t)?.label ?? t;
                            return (
                              <span key={t} className="px-2 py-0.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs rounded-full font-semibold">
                                {t === "2136" ? "🌍 Worldwide" : label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Generate button */}
            <button
              onClick={generate}
              disabled={generating || selectedWorks.length === 0}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/10 disabled:text-slate-600 text-white font-bold rounded-xl transition text-sm flex items-center justify-center gap-2"
            >
              {generating ? (
                <><span className="animate-spin">⚙</span> Building CWR file…</>
              ) : (
                <>📋 Generate CWR for {selectedWorks.length} Work{selectedWorks.length !== 1 ? "s" : ""}</>
              )}
            </button>
          </div>

          {/* CWR output */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">CWR Output (v2.1)</div>
              {generated && (
                <div className="flex items-center gap-2">
                  <button onClick={copyAll} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg text-xs font-semibold transition">
                    Copy All
                  </button>
                  <button onClick={download} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold transition">
                    ↓ Download .V21
                  </button>
                </div>
              )}
            </div>

            {generated && showPreview ? (
              <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden">
                {/* File info bar */}
                <div className="px-4 py-3 border-b border-white/10 flex flex-wrap items-center gap-4 text-xs">
                  <span className="font-mono text-slate-400">
                    CW{new Date().toISOString().slice(0,10).replace(/-/g,"")}
                    _01_{targetPRO}.V21
                  </span>
                  <span className="text-slate-500">{generated.split("\r\n").length} records</span>
                  <span className="text-slate-500">{(generated.length / 1024).toFixed(1)} KB</span>
                  <span className="text-green-400 font-semibold">✓ Valid CWR v2.1</span>
                </div>

                {/* Record breakdown */}
                <div className="px-4 py-3 border-b border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {[
                    { label: "HDR",  desc: "Header", count: 1, color: "text-indigo-400" },
                    { label: "NWR",  desc: "New Works", count: selectedWorks.filter(w=>w.status==="NWR").length, color: "text-green-400" },
                    { label: "SWR",  desc: "Writer Records", count: selectedWorks.reduce((s,w)=>s+w.writers.length,0), color: "text-sky-400" },
                    { label: "SPU",  desc: "Publisher Records", count: selectedWorks.length, color: "text-violet-400" },
                  ].map((r) => (
                    <div key={r.label} className="bg-white/5 rounded-lg p-2">
                      <div className={`text-sm font-black font-mono ${r.color}`}>{r.label}</div>
                      <div className="text-slate-500">{r.desc}</div>
                      <div className="text-white font-bold">{r.count}</div>
                    </div>
                  ))}
                </div>

                {/* Raw file content */}
                <textarea
                  ref={textRef}
                  readOnly
                  value={generated}
                  className="w-full h-96 bg-black/50 font-mono text-xs text-green-400 p-4 resize-none focus:outline-none leading-5"
                />
              </div>
            ) : (
              <div className="bg-[#0f172a] border border-white/10 rounded-2xl h-[520px] flex flex-col items-center justify-center text-center p-8">
                <div className="text-5xl mb-4">📋</div>
                <div className="text-lg font-bold text-white mb-2">CWR File Will Appear Here</div>
                <p className="text-slate-400 text-sm max-w-sm">
                  Select works on the left, configure submitter details, then click Generate to build a CISAC-compliant CWR v2.1 file.
                </p>
                <div className="mt-6 grid grid-cols-1 gap-2 text-xs text-left w-full max-w-sm">
                  {[
                    { rec: "HDR", desc: "File header — sender ID, date, time" },
                    { rec: "NWR/REV", desc: "Work registration or revision" },
                    { rec: "SPU/SPT", desc: "Publisher + territory assignment" },
                    { rec: "SWR/SWT", desc: "Writer + territory assignment" },
                    { rec: "PWR",  desc: "Publisher-writer relationship" },
                    { rec: "TRL/GRT", desc: "Transaction & group trailers" },
                  ].map((r) => (
                    <div key={r.rec} className="flex items-center gap-3">
                      <span className="font-mono text-indigo-400 w-16 flex-shrink-0">{r.rec}</span>
                      <span className="text-slate-500">{r.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PRO submission guide */}
            {generated && (
              <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Submission Guide — {targetPRO}</div>
                <div className="space-y-2 text-xs text-slate-400">
                  {targetPRO === "ASCAP" && <>
                    <div>1. Log into <span className="text-white font-semibold">ASCAP's ACE system</span> (ace.ascap.com)</div>
                    <div>2. Navigate to <span className="text-white">Works Registration → Upload CWR</span></div>
                    <div>3. Upload the <span className="font-mono text-indigo-300">.V21</span> file — processing takes 24–72 hours</div>
                    <div>4. Check ACE Acknowledgment file for any rejections</div>
                  </>}
                  {targetPRO === "BMI" && <>
                    <div>1. Log into <span className="text-white font-semibold">BMI's Songfile portal</span> (songfile.bmi.com)</div>
                    <div>2. Use <span className="text-white">CWR Upload</span> under Works Registration</div>
                    <div>3. Monitor the inbox for ACK file within 48 hours</div>
                    <div>4. Resolve any rejected works using the REV transaction type</div>
                  </>}
                  {!["ASCAP","BMI"].includes(targetPRO) && <>
                    <div>1. Contact <span className="text-white font-semibold">{targetPRO}</span> member services for CWR upload portal access</div>
                    <div>2. Ensure your IPI is registered with {targetPRO} before submitting</div>
                    <div>3. CWR v2.1 is accepted by all CISAC member organizations</div>
                    <div>4. Allow 5–10 business days for processing and acknowledgment</div>
                  </>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
