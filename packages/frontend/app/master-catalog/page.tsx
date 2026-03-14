"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";

/* ─── Types ──────────────────────────────────────────────────── */
type AuditFlag = "split_conflict" | "missing_iswc" | "missing_ipi" | "duplicate_isrc" | "unclaimed_territory" | "over_allocated" | "unregistered_pro";
type RightType = "mechanical" | "performance" | "sync" | "master" | "print";

interface RightsHolder {
  name: string;
  role: "writer" | "publisher" | "label" | "admin";
  ipi?: string;
  share: number;
  pro?: string;
  controlled: boolean;
  territories: string[];
}

interface CatalogTrack {
  id: string;
  title: string;
  artist: string;
  isrc: string;
  iswc?: string;
  upc?: string;
  language: string;
  duration: string;
  genre: string;
  release_date: string;
  distributor: string;
  rights_holders: RightsHolder[];
  rights_types: RightType[];
  territories_claimed: string[];
  territories_gap: string[];
  audit_flags: AuditFlag[];
  revenue_ytd: number;
  revenue_unclaimed: number;
  last_updated: string;
  source: string;
  status: "active" | "dispute" | "pending" | "archived";
}

/* ─── Mock Catalog ───────────────────────────────────────────── */
const CATALOG: CatalogTrack[] = [
  {
    id: "t001", title: "Sicko Mode", artist: "Travis Scott ft. Drake",
    isrc: "USUG11801862", iswc: "T-921.614.229-5", upc: "00602577073946",
    language: "EN", duration: "5:12", genre: "Hip-Hop/Trap",
    release_date: "2018-08-03", distributor: "Epic Records",
    rights_holders: [
      { name: "Jacques Webster II",  role: "writer",    ipi: "00721084930", share: 33.33, pro: "ASCAP", controlled: true,  territories: ["2136"] },
      { name: "Aubrey Graham",       role: "writer",    ipi: "00495205820", share: 33.33, pro: "SOCAN", controlled: true,  territories: ["2136"] },
      { name: "Travis Thompson",     role: "writer",    ipi: "00812930041", share: 33.34, pro: "BMI",   controlled: false, territories: ["2136"] },
      { name: "Cactus Jack Publishing", role: "publisher", ipi: "00721084941", share: 50, pro: "ASCAP", controlled: true, territories: ["2136"] },
    ],
    rights_types: ["mechanical", "performance", "sync"],
    territories_claimed: ["US", "CA", "GB", "DE", "FR", "AU", "JP"],
    territories_gap: ["BR", "MX", "IN"],
    audit_flags: ["unclaimed_territory"],
    revenue_ytd: 284100, revenue_unclaimed: 12400,
    last_updated: "2025-11-14", source: "ASCAP Statement Q3 + TuneCore",
    status: "active",
  },
  {
    id: "t002", title: "No Role Modelz", artist: "J. Cole",
    isrc: "USRC11400626", iswc: "T-913.284.771-3", upc: "00888072061477",
    language: "EN", duration: "4:52", genre: "Hip-Hop",
    release_date: "2014-12-09", distributor: "Dreamville / Interscope",
    rights_holders: [
      { name: "Jermaine Cole",       role: "writer",    ipi: "00591263810", share: 100,  pro: "ASCAP", controlled: true,  territories: ["US","CA","GB","AU"] },
      { name: "Dreamville Publishing",role: "publisher", ipi: "00591263821", share: 50,  pro: "ASCAP", controlled: true,  territories: ["US","CA","GB","AU"] },
    ],
    rights_types: ["mechanical", "performance"],
    territories_claimed: ["US", "CA", "GB", "AU"],
    territories_gap: ["DE", "FR", "JP", "BR"],
    audit_flags: ["unclaimed_territory", "missing_iswc"],
    revenue_ytd: 98700, revenue_unclaimed: 22100,
    last_updated: "2025-10-02", source: "DistroKid CSV",
    status: "active",
  },
  {
    id: "t003", title: "Goosebumps", artist: "Travis Scott ft. Kendrick Lamar",
    isrc: "USUG11501163", iswc: "T-002.330.122-4",
    language: "EN", duration: "3:42", genre: "Hip-Hop/Trap",
    release_date: "2016-09-16", distributor: "Epic Records",
    rights_holders: [
      { name: "Jacques Webster II",  role: "writer",    ipi: "00721084930", share: 60,   pro: "ASCAP", controlled: true,  territories: ["2136"] },
      { name: "Kendrick Duckworth",  role: "writer",    ipi: "00584921047", share: 40,   pro: "BMI",   controlled: false, territories: ["2136"] },
      { name: "Cactus Jack Publishing", role: "publisher", ipi: "00721084941", share: 50, pro: "ASCAP", controlled: true, territories: ["2136"] },
    ],
    rights_types: ["mechanical", "performance", "sync"],
    territories_claimed: ["2136"],
    territories_gap: [],
    audit_flags: ["split_conflict"],
    revenue_ytd: 156300, revenue_unclaimed: 0,
    last_updated: "2025-11-01", source: "BMI Statement + ASCAP",
    status: "dispute",
  },
  {
    id: "t004", title: "Drip Too Hard", artist: "Lil Baby & Gunna",
    isrc: "USSM11804672", upc: "00190758828428",
    language: "EN", duration: "2:18", genre: "Trap",
    release_date: "2018-09-28", distributor: "Quality Control / Capitol",
    rights_holders: [
      { name: "Dominique Armani Jones", role: "writer",  ipi: "00819234071", share: 50,  pro: "BMI",  controlled: true,  territories: ["US","CA"] },
      { name: "Sergio Kitchens",       role: "writer",   ipi: "00830192847", share: 50,  pro: "BMI",  controlled: true,  territories: ["US","CA"] },
      { name: "Quality Control Music", role: "publisher", ipi: "00819234082", share: 50, pro: "BMI",  controlled: true,  territories: ["US","CA"] },
    ],
    rights_types: ["mechanical", "performance"],
    territories_claimed: ["US", "CA"],
    territories_gap: ["GB", "DE", "FR", "AU", "JP", "BR"],
    audit_flags: ["missing_iswc", "unclaimed_territory"],
    revenue_ytd: 74200, revenue_unclaimed: 31800,
    last_updated: "2025-09-15", source: "SoundExchange Q4",
    status: "active",
  },
  {
    id: "t005", title: "Look Alive", artist: "BlocBoy JB ft. Drake",
    isrc: "USSM11801532",
    language: "EN", duration: "2:55", genre: "Trap",
    release_date: "2018-01-18", distributor: "FADER Label / Interscope",
    rights_holders: [
      { name: "James Fulton Jr.",    role: "writer",    ipi: "00841029384", share: 65,  pro: "BMI",   controlled: true,  territories: ["US"] },
      { name: "Aubrey Graham",       role: "writer",    ipi: "00495205820", share: 35,  pro: "SOCAN", controlled: false, territories: ["US"] },
    ],
    rights_types: ["mechanical", "performance"],
    territories_claimed: ["US"],
    territories_gap: ["CA", "GB", "DE", "AU"],
    audit_flags: ["missing_iswc", "missing_ipi", "unclaimed_territory"],
    revenue_ytd: 41800, revenue_unclaimed: 18200,
    last_updated: "2025-08-20", source: "BMI Statement",
    status: "pending",
  },
  {
    id: "t006", title: "Starboy", artist: "The Weeknd ft. Daft Punk",
    isrc: "USUG11600681", iswc: "T-921.614.229-9",
    language: "EN", duration: "3:50", genre: "R&B/Pop",
    release_date: "2016-09-22", distributor: "Republic Records",
    rights_holders: [
      { name: "Abel Tesfaye",        role: "writer",    ipi: "00495000001", share: 40,  pro: "SOCAN", controlled: true,  territories: ["2136"] },
      { name: "Thomas Bangalter",    role: "writer",    ipi: "00295810283", share: 30,  pro: "SACEM", controlled: false, territories: ["2136"] },
      { name: "Guy-Manuel de Homem", role: "writer",    ipi: "00295810294", share: 30,  pro: "SACEM", controlled: false, territories: ["2136"] },
      { name: "XO Publishing",       role: "publisher", ipi: "00495000012", share: 50,  pro: "SOCAN", controlled: true,  territories: ["2136"] },
    ],
    rights_types: ["mechanical", "performance", "sync", "master"],
    territories_claimed: ["2136"],
    territories_gap: [],
    audit_flags: [],
    revenue_ytd: 512400, revenue_unclaimed: 0,
    last_updated: "2025-11-20", source: "SOCAN + Republic Records",
    status: "active",
  },
  {
    id: "t007", title: "Antidote", artist: "Travis Scott",
    isrc: "USUG11501163",
    language: "EN", duration: "4:02", genre: "Trap",
    release_date: "2015-07-31", distributor: "Epic Records",
    rights_holders: [
      { name: "Jacques Webster II",  role: "writer",    ipi: "00721084930", share: 100, pro: "ASCAP", controlled: true,  territories: ["2136"] },
      { name: "Cactus Jack Publishing", role: "publisher", ipi: "00721084941", share: 50, pro: "ASCAP", controlled: true, territories: ["2136"] },
    ],
    rights_types: ["mechanical", "performance"],
    territories_claimed: ["US", "CA"],
    territories_gap: ["GB", "DE"],
    audit_flags: ["duplicate_isrc", "unclaimed_territory"],
    revenue_ytd: 88200, revenue_unclaimed: 9100,
    last_updated: "2025-07-05", source: "TuneCore Export",
    status: "dispute",
  },
  {
    id: "t008", title: "Love Yourz", artist: "J. Cole",
    isrc: "USRC11501008", iswc: "T-919.102.884-1",
    language: "EN", duration: "3:49", genre: "Hip-Hop",
    release_date: "2014-12-09", distributor: "Dreamville / Interscope",
    rights_holders: [
      { name: "Jermaine Cole",       role: "writer",    ipi: "00591263810", share: 100, pro: "ASCAP", controlled: true,  territories: ["2136"] },
      { name: "Dreamville Publishing",role: "publisher", ipi: "00591263821", share: 50, pro: "ASCAP", controlled: true,  territories: ["2136"] },
    ],
    rights_types: ["mechanical", "performance", "sync"],
    territories_claimed: ["2136"],
    territories_gap: [],
    audit_flags: [],
    revenue_ytd: 64100, revenue_unclaimed: 0,
    last_updated: "2025-10-18", source: "ASCAP + DistroKid",
    status: "active",
  },
];

/* ─── Constants ──────────────────────────────────────────────── */
const FLAG_META: Record<AuditFlag, { label: string; color: string; bg: string; border: string }> = {
  split_conflict:      { label: "Split Conflict",      color: "text-rose-400",   bg: "bg-rose-500/15",   border: "border-rose-500/30" },
  missing_iswc:        { label: "Missing ISWC",        color: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/30" },
  missing_ipi:         { label: "Missing IPI",         color: "text-yellow-400", bg: "bg-yellow-500/15", border: "border-yellow-500/30" },
  duplicate_isrc:      { label: "Duplicate ISRC",      color: "text-rose-400",   bg: "bg-rose-500/15",   border: "border-rose-500/30" },
  unclaimed_territory: { label: "Unclaimed Territory", color: "text-amber-400",  bg: "bg-amber-500/15",  border: "border-amber-500/30" },
  over_allocated:      { label: "Over-Allocated",      color: "text-rose-400",   bg: "bg-rose-500/15",   border: "border-rose-500/30" },
  unregistered_pro:    { label: "Unregistered PRO",    color: "text-orange-400", bg: "bg-orange-500/15", border: "border-orange-500/30" },
};

const STATUS_META: Record<CatalogTrack["status"], { label: string; color: string; dot: string }> = {
  active:   { label: "Active",   color: "text-green-400",  dot: "bg-green-400" },
  dispute:  { label: "Dispute",  color: "text-rose-400",   dot: "bg-rose-400" },
  pending:  { label: "Pending",  color: "text-yellow-400", dot: "bg-yellow-400" },
  archived: { label: "Archived", color: "text-slate-500",  dot: "bg-slate-500" },
};

function fmtMoney(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

/* ─── JSON-style key-value component ────────────────────────── */
function JsonField({ k, v, indent = 0, color = "text-sky-300" }: { k: string; v: React.ReactNode; indent?: number; color?: string }) {
  return (
    <div className="flex gap-1 leading-5" style={{ paddingLeft: indent * 16 }}>
      <span className="text-slate-500 flex-shrink-0">"{k}":</span>
      <span className={color}>{v}</span>
    </div>
  );
}

/* ─── Track detail panel ─────────────────────────────────────── */
function TrackDetail({ track }: { track: CatalogTrack }) {
  const [tab, setTab] = useState<"json" | "rights" | "flags">("json");

  return (
    <div className="bg-[#0a0f1e] border border-white/10 rounded-2xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-white/10">
        {(["json", "rights", "flags"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-xs font-semibold capitalize transition ${tab === t ? "text-white border-b-2 border-indigo-400" : "text-slate-500 hover:text-slate-300"}`}
          >
            {t === "json" ? "JSON Schema" : t === "rights" ? "Rights Holders" : `Audit Flags (${track.audit_flags.length})`}
          </button>
        ))}
      </div>

      {/* JSON view */}
      {tab === "json" && (
        <div className="p-4 font-mono text-xs space-y-0.5 max-h-[520px] overflow-y-auto leading-5">
          <div className="text-slate-600">{"{"}</div>
          <JsonField k="id"              v={`"${track.id}"`}           indent={1} />
          <JsonField k="title"           v={`"${track.title}"`}        indent={1} color="text-green-300" />
          <JsonField k="artist"          v={`"${track.artist}"`}       indent={1} color="text-green-300" />
          <JsonField k="isrc"            v={`"${track.isrc}"`}         indent={1} color="text-yellow-300" />
          <JsonField k="iswc"            v={track.iswc ? `"${track.iswc}"` : <span className="text-rose-400">null</span>} indent={1} color="text-yellow-300" />
          <JsonField k="upc"             v={track.upc ? `"${track.upc}"` : <span className="text-slate-500">null</span>}  indent={1} color="text-yellow-300" />
          <JsonField k="language"        v={`"${track.language}"`}     indent={1} />
          <JsonField k="duration"        v={`"${track.duration}"`}     indent={1} />
          <JsonField k="genre"           v={`"${track.genre}"`}        indent={1} />
          <JsonField k="release_date"    v={`"${track.release_date}"`} indent={1} />
          <JsonField k="distributor"     v={`"${track.distributor}"`}  indent={1} />
          <JsonField k="status"          v={`"${track.status}"`}       indent={1} color={STATUS_META[track.status].color} />
          <JsonField k="source"          v={`"${track.source}"`}       indent={1} color="text-slate-400" />
          <JsonField k="last_updated"    v={`"${track.last_updated}"`} indent={1} color="text-slate-400" />
          <div className="flex gap-1 pl-4"><span className="text-slate-500">"rights_types":</span> <span className="text-violet-300">[{track.rights_types.map(r => `"${r}"`).join(", ")}]</span></div>
          <div className="flex gap-1 pl-4"><span className="text-slate-500">"territories_claimed":</span> <span className="text-sky-300">[{track.territories_claimed.map(t => `"${t}"`).join(", ")}]</span></div>
          <div className="flex gap-1 pl-4"><span className="text-slate-500">"territories_gap":</span> <span className="text-rose-300">[{track.territories_gap.map(t => `"${t}"`).join(", ")}]</span></div>
          <div className="flex gap-1 pl-4"><span className="text-slate-500">"audit_flags":</span> <span className="text-rose-300">[{track.audit_flags.map(f => `"${f}"`).join(", ")}]</span></div>
          <JsonField k="revenue_ytd"       v={track.revenue_ytd}                indent={1} color="text-green-400" />
          <JsonField k="revenue_unclaimed" v={<span className={track.revenue_unclaimed > 0 ? "text-rose-400" : "text-slate-500"}>{track.revenue_unclaimed}</span>} indent={1} />
          <div className="pl-4 text-slate-500">"rights_holders": [</div>
          {track.rights_holders.map((rh, i) => (
            <div key={i} className="pl-8 space-y-0.5">
              <div className="text-slate-600">{"{"}</div>
              <JsonField k="name"        v={`"${rh.name}"`}        indent={6} color="text-green-300" />
              <JsonField k="role"        v={`"${rh.role}"`}        indent={6} color="text-violet-300" />
              {rh.ipi && <JsonField k="ipi"  v={`"${rh.ipi}"`}    indent={6} color="text-yellow-300" />}
              <JsonField k="share"       v={`${rh.share}`}         indent={6} color="text-sky-300" />
              {rh.pro && <JsonField k="pro"  v={`"${rh.pro}"`}     indent={6} />}
              <JsonField k="controlled"  v={rh.controlled ? <span className="text-green-400">true</span> : <span className="text-slate-500">false</span>} indent={6} />
              <div className="text-slate-600 pl-[96px]">{i < track.rights_holders.length - 1 ? "}," : "}"}</div>
            </div>
          ))}
          <div className="pl-4 text-slate-500">]</div>
          <div className="text-slate-600">{"}"}</div>
        </div>
      )}

      {/* Rights holders table */}
      {tab === "rights" && (
        <div className="divide-y divide-white/5 max-h-[520px] overflow-y-auto">
          {track.rights_holders.map((rh, i) => (
            <div key={i} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-bold text-white">{rh.name}</span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded border capitalize ${
                      rh.role === "writer"    ? "text-sky-400 border-sky-500/30 bg-sky-500/10" :
                      rh.role === "publisher" ? "text-violet-400 border-violet-500/30 bg-violet-500/10" :
                      rh.role === "label"     ? "text-amber-400 border-amber-500/30 bg-amber-500/10" :
                      "text-slate-400 border-slate-500/30 bg-slate-500/10"
                    }`}>{rh.role}</span>
                    <span className={`text-xs font-semibold ${rh.controlled ? "text-green-400" : "text-slate-500"}`}>
                      {rh.controlled ? "● Controlled" : "○ Uncontrolled"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    {rh.ipi && <span>IPI: <span className="text-slate-400 font-mono">{rh.ipi}</span></span>}
                    {rh.pro && <span>PRO: <span className="text-slate-400">{rh.pro}</span></span>}
                    <span>
                      Territories: <span className="text-slate-400">
                        {rh.territories.includes("2136") ? "Worldwide" : rh.territories.join(", ")}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-black text-white">{rh.share}%</div>
                  <div className="text-xs text-slate-500">share</div>
                </div>
              </div>
              {/* Share bar */}
              <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${rh.share}%` }} />
              </div>
            </div>
          ))}
          {/* Split total */}
          <div className="px-5 py-3 flex items-center justify-between bg-white/5">
            <span className="text-xs text-slate-400">Total writer share</span>
            <span className={`text-sm font-black ${Math.abs(track.rights_holders.filter(r => r.role === "writer").reduce((s, r) => s + r.share, 0) - 100) < 0.1 ? "text-green-400" : "text-rose-400"}`}>
              {track.rights_holders.filter(r => r.role === "writer").reduce((s, r) => s + r.share, 0).toFixed(2)}%
            </span>
          </div>
        </div>
      )}

      {/* Audit flags */}
      {tab === "flags" && (
        <div className="p-5 space-y-3 max-h-[520px] overflow-y-auto">
          {track.audit_flags.length === 0 ? (
            <div className="text-center py-10 text-green-400 font-semibold">
              ✓ No audit flags — this track is clean
            </div>
          ) : (
            track.audit_flags.map((flag) => {
              const m = FLAG_META[flag];
              return (
                <div key={flag} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${m.bg} ${m.border}`}>
                  <span className={`text-lg flex-shrink-0 ${m.color}`}>⚑</span>
                  <div>
                    <div className={`text-sm font-bold ${m.color}`}>{m.label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {flag === "split_conflict"      && "Writer shares do not reconcile between sources. Manual resolution required."}
                      {flag === "missing_iswc"        && "No ISWC linked. Publishing revenue cannot be routed until registered with CISAC."}
                      {flag === "missing_ipi"         && "One or more writers missing IPI. PRO cannot identify them for payment."}
                      {flag === "duplicate_isrc"      && "This ISRC appears on more than one track title. One must be reassigned."}
                      {flag === "unclaimed_territory" && "Revenue detected from territories where rights are not registered. Funds in black box."}
                      {flag === "over_allocated"      && "Total writer shares exceed 100%. Revert to last known good split or resolve manually."}
                      {flag === "unregistered_pro"    && "Writer is not registered with their stated PRO. Performance royalties will not route."}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Link href={flag === "missing_iswc" || flag === "missing_ipi" ? "/cwr-generator" : "/catalog-staging"}
                        className="text-xs text-white bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 rounded-lg transition font-semibold">
                        Fix →
                      </Link>
                      <Link href="/attorney-portal"
                        className="text-xs text-slate-300 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 transition">
                        Attorney Review
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function MasterCatalogPage() {
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState<CatalogTrack["status"] | "all">("all");
  const [flagFilter, setFlagFilter]   = useState<AuditFlag | "all" | "clean">("all");
  const [sortBy, setSortBy]           = useState<"title" | "revenue_ytd" | "revenue_unclaimed" | "flags" | "last_updated">("revenue_ytd");
  const [sortDir, setSortDir]         = useState<"asc" | "desc">("desc");
  const [selected, setSelected]       = useState<string | null>(null);
  const [viewMode, setViewMode]       = useState<"table" | "grid">("table");
  const [copied, setCopied]           = useState(false);

  const sorted = useMemo(() => {
    let list = CATALOG.filter((t) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.isrc.toLowerCase().includes(q) ||
        (t.iswc ?? "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      const matchFlag   = flagFilter === "all" ? true
        : flagFilter === "clean" ? t.audit_flags.length === 0
        : t.audit_flags.includes(flagFilter as AuditFlag);
      return matchSearch && matchStatus && matchFlag;
    });

    list = [...list].sort((a, b) => {
      let av: number | string, bv: number | string;
      if (sortBy === "title")             { av = a.title;             bv = b.title; }
      else if (sortBy === "revenue_ytd")  { av = a.revenue_ytd;       bv = b.revenue_ytd; }
      else if (sortBy === "revenue_unclaimed") { av = a.revenue_unclaimed; bv = b.revenue_unclaimed; }
      else if (sortBy === "flags")        { av = a.audit_flags.length; bv = b.audit_flags.length; }
      else                               { av = a.last_updated;       bv = b.last_updated; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [search, statusFilter, flagFilter, sortBy, sortDir]);

  const toggleSort = useCallback((col: typeof sortBy) => {
    if (sortBy === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  }, [sortBy]);

  const copyJSON = useCallback(() => {
    const track = CATALOG.find((t) => t.id === selected);
    if (!track) return;
    navigator.clipboard.writeText(JSON.stringify(track, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [selected]);

  const totalRevenue   = CATALOG.reduce((s, t) => s + t.revenue_ytd, 0);
  const totalUnclaimed = CATALOG.reduce((s, t) => s + t.revenue_unclaimed, 0);
  const totalFlags     = CATALOG.reduce((s, t) => s + t.audit_flags.length, 0);
  const cleanCount     = CATALOG.filter((t) => t.audit_flags.length === 0).length;

  const selectedTrack = CATALOG.find((t) => t.id === selected) ?? null;

  const SortBtn = ({ col, label }: { col: typeof sortBy; label: string }) => (
    <button onClick={() => toggleSort(col)} className="flex items-center gap-1 hover:text-white transition">
      {label}
      <span className="text-slate-600">{sortBy === col ? (sortDir === "desc" ? "↓" : "↑") : "↕"}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 pt-14 pb-20">
      {/* Header */}
      <div className="bg-[#0f172a] border-b border-white/10 px-6 py-5">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">📂</span>
              <h1 className="text-xl font-black text-white tracking-tight">Master Catalog</h1>
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full border border-indigo-500/30">
                {CATALOG.length} tracks
              </span>
            </div>
            <p className="text-slate-400 text-sm">
              Full catalog JSON viewer. Every track — ISRC, ISWC, IPI, splits, rights holders, territory gaps, and audit flags.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/cwr-generator" className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition">
              ← CWR
            </Link>
            <Link href="/label" className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition">
              Label Portal
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Summary row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Tracks",       value: CATALOG.length,              color: "text-white" },
            { label: "Revenue YTD",        value: fmtMoney(totalRevenue),      color: "text-green-400" },
            { label: "Unclaimed Revenue",  value: fmtMoney(totalUnclaimed),    color: "text-rose-400" },
            { label: "Audit Flags",        value: `${totalFlags} flags · ${cleanCount} clean`, color: totalFlags > 0 ? "text-yellow-400" : "text-green-400" },
          ].map((c) => (
            <div key={c.label} className="bg-[#0f172a] border border-white/10 rounded-xl p-4">
              <div className="text-xs text-slate-500 mb-1">{c.label}</div>
              <div className={`text-lg font-black ${c.color}`}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search title, artist, ISRC, ISWC…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 bg-[#0f172a] border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 w-60"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 bg-[#0f172a] border border-white/10 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-indigo-500">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="dispute">Dispute</option>
            <option value="pending">Pending</option>
            <option value="archived">Archived</option>
          </select>
          <select value={flagFilter} onChange={(e) => setFlagFilter(e.target.value as typeof flagFilter)}
            className="px-3 py-2 bg-[#0f172a] border border-white/10 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-indigo-500">
            <option value="all">All Flags</option>
            <option value="clean">Clean (No Flags)</option>
            <option value="split_conflict">Split Conflict</option>
            <option value="missing_iswc">Missing ISWC</option>
            <option value="missing_ipi">Missing IPI</option>
            <option value="duplicate_isrc">Duplicate ISRC</option>
            <option value="unclaimed_territory">Unclaimed Territory</option>
            <option value="over_allocated">Over-Allocated</option>
          </select>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-500">{sorted.length} results</span>
            <button onClick={() => setViewMode("table")} className={`p-1.5 rounded ${viewMode === "table" ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:text-white"}`} title="Table view">
              ☰
            </button>
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded ${viewMode === "grid" ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-400 hover:text-white"}`} title="Grid view">
              ⊞
            </button>
          </div>
        </div>

        <div className={`${selectedTrack ? "grid grid-cols-1 xl:grid-cols-2 gap-5" : ""}`}>
          {/* Track list */}
          <div>
            {viewMode === "table" && (
              <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden">
                <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-3 px-5 py-3 border-b border-white/10 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  <SortBtn col="title" label="Track" />
                  <div className="w-32"><SortBtn col="last_updated" label="Updated" /></div>
                  <div className="w-28 text-right"><SortBtn col="revenue_ytd" label="YTD Rev" /></div>
                  <div className="w-24 text-right"><SortBtn col="revenue_unclaimed" label="Unclaimed" /></div>
                  <div className="w-16 text-center"><SortBtn col="flags" label="Flags" /></div>
                  <div className="w-20 text-center">Status</div>
                </div>

                {sorted.length === 0 && (
                  <div className="px-5 py-10 text-center text-slate-500 text-sm">No tracks match.</div>
                )}

                <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                  {sorted.map((track) => {
                    const sm = STATUS_META[track.status];
                    const isSelected = selected === track.id;
                    return (
                      <div
                        key={track.id}
                        onClick={() => setSelected(isSelected ? null : track.id)}
                        className={`cursor-pointer transition-colors ${isSelected ? "bg-indigo-500/10 border-l-2 border-indigo-400" : "hover:bg-white/5"}`}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto_auto_auto] gap-2 sm:gap-3 px-5 py-3 items-center">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-white truncate">{track.title}</div>
                            <div className="text-xs text-slate-400 truncate">{track.artist}</div>
                            <div className="text-xs text-slate-600 font-mono mt-0.5 truncate">
                              {track.isrc} {track.iswc ? `· ${track.iswc}` : <span className="text-orange-400/70">· no ISWC</span>}
                            </div>
                            {/* Flags inline on mobile */}
                            {track.audit_flags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5 sm:hidden">
                                {track.audit_flags.slice(0, 2).map((f) => (
                                  <span key={f} className={`px-1.5 py-0.5 rounded text-xs font-semibold ${FLAG_META[f].color} ${FLAG_META[f].bg} border ${FLAG_META[f].border}`}>
                                    {FLAG_META[f].label}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="w-32 hidden sm:block text-xs text-slate-500">{track.last_updated}</div>
                          <div className="w-28 hidden sm:block text-right text-sm font-semibold text-green-400">{fmtMoney(track.revenue_ytd)}</div>
                          <div className={`w-24 hidden sm:block text-right text-sm font-semibold ${track.revenue_unclaimed > 0 ? "text-rose-400" : "text-slate-600"}`}>
                            {track.revenue_unclaimed > 0 ? fmtMoney(track.revenue_unclaimed) : "—"}
                          </div>
                          <div className="w-16 hidden sm:flex flex-col items-center gap-1">
                            {track.audit_flags.length > 0 ? (
                              <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-xs font-bold rounded-full border border-rose-500/30">
                                {track.audit_flags.length}
                              </span>
                            ) : (
                              <span className="text-green-400 text-xs">✓</span>
                            )}
                          </div>
                          <div className="w-20 hidden sm:flex items-center justify-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                            <span className={`text-xs font-semibold ${sm.color}`}>{sm.label}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sorted.map((track) => {
                  const sm = STATUS_META[track.status];
                  return (
                    <div
                      key={track.id}
                      onClick={() => setSelected(selected === track.id ? null : track.id)}
                      className={`cursor-pointer bg-[#0f172a] border rounded-2xl p-4 transition-all hover:border-indigo-500/30 ${selected === track.id ? "border-indigo-500/60 bg-indigo-500/5" : "border-white/10"}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-white text-sm truncate">{track.title}</div>
                          <div className="text-xs text-slate-400">{track.artist}</div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <div className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                          <span className={`text-xs ${sm.color}`}>{sm.label}</span>
                        </div>
                      </div>
                      <div className="font-mono text-xs text-slate-600 mb-2">{track.isrc}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-green-400">{fmtMoney(track.revenue_ytd)}</span>
                        {track.audit_flags.length > 0 ? (
                          <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-xs font-bold rounded-full border border-rose-500/30">
                            {track.audit_flags.length} flag{track.audit_flags.length !== 1 ? "s" : ""}
                          </span>
                        ) : <span className="text-green-400 text-xs">✓ clean</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selectedTrack && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectedTrack.title}</div>
                <div className="flex items-center gap-2">
                  <button onClick={copyJSON} className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${copied ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"}`}>
                    {copied ? "✓ Copied!" : "Copy JSON"}
                  </button>
                  <Link href="/cwr-generator" className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition">
                    Register CWR
                  </Link>
                  <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-slate-300 text-lg px-1">×</button>
                </div>
              </div>
              <TrackDetail track={selectedTrack} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
