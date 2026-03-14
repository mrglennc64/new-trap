'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

interface Artist {
  id: number; name: string; stage: string; genre: string;
  recouped: boolean; earnings: number; expenses: number;
  isrc: string; email: string; phone: string;
}

const INIT_ARTISTS: Artist[] = [];

const TERRITORY_DATA = [
  { region: 'United States',  code: 'US',  amount: 142800, pct: 38, status: 'collecting' },
  { region: 'United Kingdom', code: 'UK',  amount: 58200,  pct: 15, status: 'gap' },
  { region: 'Germany',        code: 'DE',  amount: 34100,  pct: 9,  status: 'collecting' },
  { region: 'Canada',         code: 'CA',  amount: 22700,  pct: 6,  status: 'gap' },
  { region: 'Australia',      code: 'AU',  amount: 18400,  pct: 5,  status: 'collecting' },
  { region: 'France',         code: 'FR',  amount: 15900,  pct: 4,  status: 'gap' },
  { region: 'Brazil',         code: 'BR',  amount: 12300,  pct: 3,  status: 'unclaimed' },
  { region: 'Japan',          code: 'JP',  amount: 9800,   pct: 3,  status: 'unclaimed' },
  { region: 'Netherlands',    code: 'NL',  amount: 7200,   pct: 2,  status: 'gap' },
  { region: 'Sweden',         code: 'SE',  amount: 5600,   pct: 1,  status: 'unclaimed' },
  { region: 'Rest of World',  code: 'ROW', amount: 47900,  pct: 14, status: 'unclaimed' },
];

const METADATA_ISSUES = [
  { type: 'Black Box Gap',     severity: 'critical', count: 14, desc: '14 tracks have an ISRC but no ISWC. Publishing revenue is unroutable.', value: 4120, action: 'Auto-Link via MLC API', href: '/mlc-search',          color: 'red' },
  { type: 'Artist Name Drift', severity: 'warning',  count: 3,  desc: '3 variations of "Lil Baby" detected. 12% dip in algorithmic reach.',   value: 1840, action: 'Merge Artist Identity',  href: '/schema-parser',       color: 'orange' },
  { type: 'Duplicate ISRC',    severity: 'warning',  count: 2,  desc: 'ISRC US-QX9-26-001 assigned to two track titles. Payment locked.',       value: 2670, action: 'Assign New ISRC',       href: '/royalty-finder',      color: 'purple' },
  { type: 'Missing UPC',       severity: 'info',     count: 7,  desc: '7 releases missing UPC — distribution may fail on some DSPs.',           value: 890,  action: 'Generate UPC Batch',    href: '/dashboard',           color: 'blue' },
];

type View = 'dashboard' | 'artists' | 'territory' | 'metadata' | 'recoupment' | 'contracts' | 'payouts' | 'import';

const NAV: { id: View; label: string; icon: string }[] = [
  { id: 'dashboard',  label: 'Overview',        icon: '📊' },
  { id: 'artists',    label: 'Artists',          icon: '🎤' },
  { id: 'territory',  label: 'Revenue Map',      icon: '🌍' },
  { id: 'metadata',   label: 'Metadata Health',  icon: '🛡️' },
  { id: 'recoupment', label: 'Recoupment',       icon: '💰' },
  { id: 'contracts',  label: 'Contracts',        icon: '📄' },
  { id: 'payouts',    label: 'Payouts',          icon: '💸' },
  { id: 'import',     label: 'Import CSV/PDF',   icon: '📥' },
];

export default function LabelPortal() {
  const [view, setView]               = useState<View>('dashboard');
  const [artists, setArtists]         = useState<Artist[]>(INIT_ARTISTS);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [showAddArtist, setShowAddArtist]   = useState(false);
  const [newArtist, setNewArtist]     = useState({ name: '', stage: '', genre: 'Hip-Hop', email: '', phone: '', isrc: '' });
  const [importStatus, setImportStatus]     = useState<string | null>(null);
  const [importRows, setImportRows]   = useState<string[][]>([]);
  const [csvFixed, setCsvFixed]       = useState(false);
  const [mp3Artist, setMp3Artist]     = useState('');
  const [mp3Title, setMp3Title]       = useState('');
  const [mp3Isrc, setMp3Isrc]         = useState('');
  const [mp3File, setMp3File]         = useState<File | null>(null);
  const [uploading, setUploading]     = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileRef   = useRef<HTMLInputElement>(null);
  const mp3Ref    = useRef<HTMLInputElement>(null);

  const totalEarnings  = artists.reduce((s, a) => s + a.earnings, 0);
  const unrecouped     = artists.filter(a => !a.recouped).reduce((s, a) => s + (a.expenses - a.earnings), 0);
  const readyToPay     = artists.filter(a => a.recouped).reduce((s, a) => s + (a.earnings - a.expenses), 0);
  const healthScore    = 68;
  const totalLeak      = METADATA_ISSUES.reduce((s, i) => s + i.value, 0);
  const totalUnclaimed = TERRITORY_DATA.filter(t => t.status !== 'collecting').reduce((s, t) => s + t.amount, 0);

  function addArtist() {
    if (!newArtist.name) return;
    setArtists(prev => [...prev, {
      id: Date.now(), name: newArtist.name, stage: newArtist.stage || newArtist.name,
      genre: newArtist.genre, recouped: false, earnings: 0, expenses: 0,
      isrc: newArtist.isrc, email: newArtist.email, phone: newArtist.phone,
    }]);
    setNewArtist({ name: '', stage: '', genre: 'Hip-Hop', email: '', phone: '', isrc: '' });
    setShowAddArtist(false);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus('Reading file...'); setCsvFixed(false); setImportRows([]);
    if (file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const rows = text.split('\n').filter(r => r.trim()).map(r => r.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
        setImportRows(rows.slice(0, 8));
        const issues: string[] = [];
        if (rows.some(r => r.some(c => c === ''))) issues.push('empty cells');
        if (rows[0]?.some(h => !h)) issues.push('missing headers');
        setImportStatus(issues.length ? `Found ${issues.length} issue(s): ${issues.join(', ')}` : `Loaded ${rows.length - 1} records — preview shown below`);
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.pdf')) {
      setImportStatus(`PDF loaded: "${file.name}" — ${Math.round(file.size / 1024)}KB. Manual review required — automated PDF parsing is not available. Use the CSV templates below for structured import.`);
    } else {
      setImportStatus(`Unsupported file type. Upload CSV for data import or MP3 for audio upload.`);
    }
  }

  async function handleMp3Upload() {
    if (!mp3File || !mp3Artist.trim() || !mp3Title.trim()) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const form = new FormData();
      form.append('file', mp3File);
      form.append('artist', mp3Artist.trim());
      form.append('title', mp3Title.trim());
      if (mp3Isrc.trim()) form.append('isrc', mp3Isrc.trim());
      const res = await fetch('/api/catalog/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
      setUploadResult(data);
      setMp3File(null); setMp3Artist(''); setMp3Title(''); setMp3Isrc('');
      if (mp3Ref.current) mp3Ref.current.value = '';
    } catch (err: any) {
      setUploadResult({ error: err.message });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] flex">

      {/* ── Sidebar ── */}
      <div className="w-56 bg-slate-900 border-r border-slate-800 min-h-screen flex flex-col p-4 flex-shrink-0">
        <div className="mb-6">
          <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-1">Label OS</p>
          <h2 className="text-sm font-black text-white">Operations Portal</h2>
        </div>
        <nav className="space-y-1">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setView(n.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                view === n.id
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}>
              <span>{n.icon}</span>{n.label}
            </button>
          ))}
          <Link href="/label-workspace"
            className="mt-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-indigo-300 bg-indigo-600/15 border border-indigo-500/30 hover:bg-indigo-600/25 transition">
            🎵 Label Workspace
          </Link>
          <Link href="/ingest"
            className="mt-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-sky-300 bg-sky-600/15 border border-sky-500/30 hover:bg-sky-600/25 transition">
            📂 Bulk Ingest
          </Link>
          <Link href="/catalog-staging"
            className="mt-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-violet-300 bg-violet-600/15 border border-violet-500/30 hover:bg-violet-600/25 transition">
            🔄 Staging
          </Link>
          <Link href="/schema-parser"
            className="mt-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-emerald-300 bg-emerald-600/15 border border-emerald-500/30 hover:bg-emerald-600/25 transition">
            🧩 Parser
          </Link>
          <Link href="/cwr-generator"
            className="mt-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-amber-300 bg-amber-600/15 border border-amber-500/30 hover:bg-amber-600/25 transition">
            📋 CWR Generator
          </Link>
          <Link href="/master-catalog"
            className="mt-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-cyan-300 bg-cyan-600/15 border border-cyan-500/30 hover:bg-cyan-600/25 transition">
            📂 Master Catalog
          </Link>
          <Link href="/forensic-audit"
            className="mt-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-pink-300 bg-pink-600/15 border border-pink-500/30 hover:bg-pink-600/25 transition">
            🔬 Audit PDF
          </Link>
          <Link href="/lod-generator"
            className="mt-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-orange-300 bg-orange-600/15 border border-orange-500/30 hover:bg-orange-600/25 transition">
            📜 LOD Generator
          </Link>
          <Link href="/mlc-search"
            className="mt-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-teal-300 bg-teal-600/15 border border-teal-500/30 hover:bg-teal-600/25 transition">
            🔎 MLC Search
          </Link>
          <Link href="/split-verification"
            className="mt-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-green-300 bg-green-600/15 border border-green-500/30 hover:bg-green-600/25 transition">
            ✅ Split Verification
          </Link>
        </nav>
        <div className="flex-1" />
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
          <Link href="/attorney-portal" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-slate-300 hover:bg-white/5 transition">
            ⚖️ Attorney Portal
          </Link>
          <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-slate-300 hover:bg-white/5 transition">
            ← Main Site
          </Link>
        </div>
      </div>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top header */}
        <div className="flex items-center justify-between px-8 py-3 border-b border-gray-200 bg-slate-900/80 flex-shrink-0">
          <p className="text-xs text-gray-500 font-mono">Label Operations Portal</p>
          <div className="flex items-center gap-3">
            <Link href="/label-workspace" className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold rounded-lg hover:bg-indigo-600/40 transition">
              🎵 Catalog Audit
            </Link>
            <Link href="/attorney-portal" className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-gray-200 text-gray-500 text-xs font-bold rounded-lg hover:text-white hover:bg-white/10 transition">
              ⚖️ Attorney Portal
            </Link>
          </div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto">

          {/* ── OVERVIEW ── */}
          {view === 'dashboard' && (
            <div>
              <div className="mb-8">
                <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-widest mb-1">Label Operations Portal</p>
                <h1 className="text-3xl font-black">Overview</h1>
                <p className="text-gray-500 text-sm mt-1">Automate your catalog. Track recoupment. Pay artists instantly.</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total Artists',     value: artists.length.toString(),                color: 'indigo',  sub: `${artists.filter(a=>a.recouped).length} recouped` },
                  { label: 'Total Earnings',    value: '$'+totalEarnings.toLocaleString('en-US', {useGrouping:true,maximumFractionDigits:0}),        color: 'green',   sub: 'across all artists' },
                  { label: 'Unrecouped Balance',value: '$'+unrecouped.toLocaleString('en-US', {useGrouping:true,maximumFractionDigits:0}),           color: 'yellow',  sub: `${artists.filter(a=>!a.recouped).length} artists` },
                  { label: 'Ready to Pay',      value: '$'+readyToPay.toLocaleString('en-US', {useGrouping:true,maximumFractionDigits:0}),           color: 'emerald', sub: `${artists.filter(a=>a.recouped).length} artists` },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                    <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-bold">{kpi.label}</p>
                    <p className={`text-2xl font-black text-${kpi.color}-400`}>{kpi.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{kpi.sub}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-4">Metadata Health Score</p>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="text-5xl font-black text-red-400">{healthScore}%</div>
                    <div>
                      <p className="text-sm text-slate-300 font-bold">Needs Attention</p>
                      <p className="text-xs text-gray-500">1,242 assets scanned</p>
                    </div>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 mb-4">
                    <div className="bg-red-500 h-2 rounded-full" style={{width:`${healthScore}%`}} />
                  </div>
                  <button onClick={() => setView('metadata')}
                    className="w-full py-2 bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold rounded-xl hover:bg-red-500/20 transition">
                    View Metadata Health →
                  </button>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-4">Global Leakage</p>
                  <p className="text-3xl font-black text-green-400">${totalUnclaimed.toLocaleString('en-US', {useGrouping:true,maximumFractionDigits:0})}</p>
                  <p className="text-xs text-gray-500 mt-1 mb-4">uncollected across territories</p>
                  {TERRITORY_DATA.filter(t=>t.status!=='collecting').slice(0,3).map(t=>(
                    <div key={t.code} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0 last:pb-0">
                      <span className="text-xs text-gray-500">{t.region}</span>
                      <span className="text-xs font-bold text-indigo-400">${t.amount.toLocaleString('en-US', {useGrouping:true,maximumFractionDigits:0})}</span>
                    </div>
                  ))}
                  <button onClick={() => setView('territory')}
                    className="w-full mt-3 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold rounded-xl hover:bg-indigo-500/20 transition">
                    View Territory Map →
                  </button>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-4">Monthly Leak</p>
                  <p className="text-3xl font-black text-yellow-400">${totalLeak.toLocaleString('en-US', {useGrouping:true,maximumFractionDigits:0})}</p>
                  <p className="text-xs text-gray-500 mt-1 mb-4">estimated monthly loss</p>
                  {METADATA_ISSUES.slice(0,3).map(i=>(
                    <div key={i.type} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0 last:pb-0">
                      <span className="text-xs text-gray-500">{i.type}</span>
                      <span className="text-xs font-bold text-yellow-400">${i.value.toLocaleString('en-US', {useGrouping:true,maximumFractionDigits:0})}/mo</span>
                    </div>
                  ))}
                  <button onClick={() => setView('metadata')}
                    className="w-full mt-3 py-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs font-bold rounded-xl hover:bg-yellow-500/20 transition">
                    Fix Issues →
                  </button>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-sm uppercase tracking-wider text-gray-500">Artists</h3>
                  <button onClick={() => { setView('artists'); setShowAddArtist(true); }}
                    className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-500 transition">
                    + Add Artist
                  </button>
                </div>
                <div className="space-y-2">
                  {artists.map(a => (
                    <div key={a.id} onClick={() => { setSelectedArtist(a); setView('recoupment'); }}
                      className="flex justify-between items-center p-3 bg-white rounded-xl border border-white/5 hover:border-indigo-500/30 cursor-pointer transition">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-black text-indigo-300">
                          {a.stage[0]}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{a.stage}</p>
                          <p className="text-xs text-gray-500">{a.genre}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-black text-green-400">${a.earnings.toLocaleString('en-US', {useGrouping:true,maximumFractionDigits:0})}</p>
                          <p className="text-xs text-gray-500">earned</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${a.recouped?'bg-green-500/20 text-green-300':'bg-yellow-500/20 text-yellow-300'}`}>
                          {a.recouped?'RECOUPED':'UNRECOUPED'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ARTISTS ── */}
          {view === 'artists' && (
            <div>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-widest mb-1">Roster</p>
                  <h1 className="text-3xl font-black">Artist Explorer</h1>
                  <p className="text-gray-500 text-sm mt-1">{artists.length} artists in roster</p>
                </div>
                <button onClick={() => setShowAddArtist(true)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition text-sm">
                  + Add Artist
                </button>
              </div>

              {showAddArtist && (
                <div className="bg-gray-100/80 border border-indigo-500/30 rounded-2xl p-6 mb-6">
                  <h3 className="font-black mb-4 text-indigo-300">New Artist</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {[
                      { label: 'Legal Name', key: 'name',  ph: 'John Smith' },
                      { label: 'Stage Name', key: 'stage', ph: 'Lil John' },
                      { label: 'Email',      key: 'email', ph: 'artist@mgmt.com' },
                      { label: 'Phone',      key: 'phone', ph: '404-555-0000' },
                      { label: 'ISRC Prefix',key: 'isrc',  ph: 'USRC...' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-xs font-bold text-gray-500 mb-1">{f.label}</label>
                        <input type="text" placeholder={f.ph} value={(newArtist as any)[f.key]}
                          onChange={e => setNewArtist(p => ({...p, [f.key]: e.target.value}))}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Genre</label>
                      <select value={newArtist.genre} onChange={e => setNewArtist(p => ({...p, genre: e.target.value}))}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        {['Hip-Hop','Trap','R&B','Pop','Drill','Afrobeats','Gospel','Rock','Electronic'].map(g=><option key={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={addArtist} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition">Save Artist</button>
                    <button onClick={() => setShowAddArtist(false)} className="px-6 py-2 bg-white/5 border border-gray-200 text-gray-500 font-bold rounded-xl text-sm hover:text-white transition">Cancel</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {artists.map(a => (
                  <div key={a.id} onClick={() => setSelectedArtist(a)}
                    className={`bg-gray-50 border rounded-2xl p-5 cursor-pointer hover:border-indigo-500/40 transition ${selectedArtist?.id === a.id ? 'border-indigo-500/50' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-sm font-black text-indigo-300">
                        {a.stage[0]}
                      </div>
                      <div>
                        <p className="font-bold">{a.stage}</p>
                        <p className="text-xs text-gray-500">{a.genre}</p>
                      </div>
                      <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-black ${a.recouped?'bg-green-500/20 text-green-300':'bg-yellow-500/20 text-yellow-300'}`}>
                        {a.recouped?'RECOUPED':'UNRECOUPED'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white rounded-lg p-2">
                        <p className="text-gray-500 mb-0.5">Earnings</p>
                        <p className="font-bold text-green-400">${a.earnings.toLocaleString('en-US', {useGrouping:true,maximumFractionDigits:0})}</p>
                      </div>
                      <div className="bg-white rounded-lg p-2">
                        <p className="text-gray-500 mb-0.5">Expenses</p>
                        <p className="font-bold text-red-400">${a.expenses.toLocaleString('en-US', {useGrouping:true,maximumFractionDigits:0})}</p>
                      </div>
                    </div>
                    {a.email && <p className="text-xs text-gray-500 mt-3 truncate">{a.email}</p>}
                    {a.isrc  && <p className="text-xs text-indigo-400 font-mono mt-1">{a.isrc}</p>}
                  </div>
                ))}
                <button onClick={() => setShowAddArtist(true)}
                  className="bg-gray-100/30 border-2 border-dashed border-gray-200 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition cursor-pointer min-h-[160px]">
                  <span className="text-3xl">+</span>
                  <span className="text-sm text-gray-500 font-bold">Add Artist</span>
                </button>
              </div>
            </div>
          )}

          {/* ── TERRITORY MAP ── */}
          {view === 'territory' && (
            <div>
              <div className="mb-6">
                <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-widest mb-1">Global Royalty Coverage</p>
                <h1 className="text-3xl font-black">Revenue Map</h1>
              </div>
              <div className="flex gap-3 items-start p-3 mb-6 bg-amber-950/30 border border-amber-700/40 rounded-xl text-xs text-amber-200/70">
                <span className="text-base flex-shrink-0">⚠️</span>
                <span><strong className="text-amber-400">Illustrative data.</strong> Territory figures are sample data for layout purposes. Connect your DSP royalty statements via Import CSV to populate real numbers.</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
                {TERRITORY_DATA.map(t => (
                  <div key={t.code} className={`border rounded-xl p-4 ${t.status==='collecting'?'border-green-500/30 bg-green-500/5':t.status==='gap'?'border-yellow-500/30 bg-yellow-500/5':'border-red-500/30 bg-red-500/5'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-black text-gray-500 uppercase">{t.code}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${t.status==='collecting'?'bg-green-500/20 text-green-300':t.status==='gap'?'bg-yellow-500/20 text-yellow-300':'bg-red-500/20 text-red-300'}`}>
                        {t.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mb-2">{t.region}</p>
                    <p className={`text-lg font-black ${t.status==='collecting'?'text-green-400':t.status==='gap'?'text-yellow-400':'text-red-400'}`}>${t.amount.toLocaleString('en-US', {useGrouping:true,maximumFractionDigits:0})}</p>
                    <div className="mt-2 bg-white/10 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${t.status==='collecting'?'bg-green-500':t.status==='gap'?'bg-yellow-500':'bg-red-500'}`} style={{width:`${t.pct}%`}} />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">{t.pct}% of total</p>
                  </div>
                ))}
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-black text-sm uppercase tracking-wider text-gray-500">Territory Action List</h3>
                  <div className="flex gap-4 text-xs">
                    <span className="text-green-400">● Collecting</span>
                    <span className="text-yellow-400">● Gap</span>
                    <span className="text-red-400">● Unclaimed</span>
                  </div>
                </div>
                <table className="w-full text-xs">
                  <thead className="bg-white/50 text-gray-500 uppercase tracking-widest">
                    <tr>
                      <th className="p-4 text-left">Territory</th>
                      <th className="p-4 text-left">Status</th>
                      <th className="p-4 text-right">Value</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {TERRITORY_DATA.filter(t=>t.status!=='collecting').map(t=>(
                      <tr key={t.code} className="hover:bg-white/5 transition">
                        <td className="p-4 font-bold text-slate-300">{t.region}</td>
                        <td className="p-4">
                          <span className={`font-mono text-[10px] font-black ${t.status==='gap'?'text-yellow-400':'text-red-400'}`}>{t.status.toUpperCase()}</span>
                        </td>
                        <td className="p-4 text-right font-mono font-black text-green-400">${t.amount.toLocaleString('en-US', {useGrouping:true,maximumFractionDigits:0})}</td>
                        <td className="p-4 text-right">
                          <button className={`px-3 py-1 border text-[10px] font-black rounded-lg transition ${t.status==='gap'?'border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/20':'border-red-500/30 text-red-300 hover:bg-red-500/20'}`}>
                            {t.status==='gap'?'File Claim':'Register'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── METADATA HEALTH ── */}
          {view === 'metadata' && (
            <div>
              <div className="flex gap-3 items-start p-3 mb-6 bg-amber-950/30 border border-amber-700/40 rounded-xl text-xs text-amber-200/70">
                <span className="text-base flex-shrink-0">⚠️</span>
                <span><strong className="text-amber-400">Illustrative data.</strong> Metadata issues shown are sample patterns. Run the <Link href="/free-audit" className="text-indigo-400 underline">Free Audit</Link> on real ISRCs to surface actual gaps.</span>
              </div>
              <div>
              <div className="flex justify-between items-end mb-8">
                <div>
                  <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-widest mb-1">Command Center</p>
                  <h1 className="text-3xl font-black">Metadata Health Audit</h1>
                  <p className="text-gray-500 text-xs font-mono mt-1">Scan Complete: 1,242 Assets Analyzed</p>
                </div>
                <div className="flex gap-6">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Health Score</p>
                    <p className="text-3xl font-black text-red-400">{healthScore}%</p>
                  </div>
                  <div className="w-px bg-white/10" />
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Est. Monthly Leak</p>
                    <p className="text-3xl font-black text-green-400">${totalLeak.toLocaleString('en-US', {useGrouping:true,maximumFractionDigits:0})}.00</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {METADATA_ISSUES.map(issue => {
                  const isCritical = issue.severity === 'critical';
                  const styles: Record<string, { card: string; badge: string; btn: string }> = {
                    red:    { card: 'border-red-500/30 bg-red-500/5',       badge: 'bg-red-500/20 text-red-300',       btn: 'bg-white text-black hover:bg-red-500 hover:text-white border-transparent' },
                    orange: { card: 'border-orange-500/30 bg-orange-500/5', badge: 'bg-orange-500/20 text-orange-300', btn: 'border-orange-500/50 text-orange-400 hover:bg-orange-500 hover:text-white' },
                    purple: { card: 'border-purple-500/30 bg-purple-500/5', badge: 'bg-purple-500/20 text-purple-300', btn: 'border-purple-500/50 text-purple-400 hover:bg-purple-500 hover:text-white' },
                    blue:   { card: 'border-blue-500/30 bg-blue-500/5',     badge: 'bg-blue-500/20 text-blue-300',     btn: 'border-blue-500/50 text-blue-400 hover:bg-blue-500 hover:text-white' },
                  };
                  const s = styles[issue.color] ?? styles.blue;
                  return (
                    <div key={issue.type} className={`glass p-6 rounded-3xl border relative overflow-hidden ${s.card}`}>
                      {isCritical && <div className="absolute top-0 right-0 bg-red-500 text-[9px] font-black px-3 py-1 rounded-bl-lg">CRITICAL</div>}
                      <div className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-[10px] font-black mb-3 ${s.badge}`}>
                        {issue.count} issues
                      </div>
                      <h3 className="font-black text-sm mb-2">{issue.type}</h3>
                      <p className="text-xs text-gray-500 mb-4">{issue.desc}</p>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs text-gray-500">Recovery value</span>
                        <span className="text-sm font-black text-green-400">+${issue.value.toLocaleString('en-US', {useGrouping:true,maximumFractionDigits:0})}/mo</span>
                      </div>
                      <Link href={(issue as any).href} className={`block w-full py-3 text-[10px] font-black uppercase rounded-xl transition border text-center ${s.btn}`}>
                        {issue.action}
                      </Link>
                    </div>
                  );
                })}
              </div>

              <div className="glass rounded-3xl overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="font-black text-sm uppercase tracking-wider text-gray-500">Actionable Tracks — Leaking Revenue Now</h3>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/50 text-gray-500 font-black uppercase tracking-widest">
                    <tr>
                      <th className="p-4">Track Title</th>
                      <th className="p-4">Artist</th>
                      <th className="p-4">Issue</th>
                      <th className="p-4 text-right">Recovery Value</th>
                      <th className="p-4 text-right">Fix</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {([
                      { title: "Trappin' Hard",     artist: "Young Thug",   issue: "MISSING_ISWC",   value: 1240.50, issueClass: 'text-red-400',    btnClass: 'border-red-500/30 text-red-300 hover:bg-red-500/20',     href: '/mlc-search' },
                      { title: "Neon Drip",          artist: "21 Savage",    issue: "DUPLICATE_ISRC", value: 890.00,  issueClass: 'text-purple-400', btnClass: 'border-purple-500/30 text-purple-300 hover:bg-purple-500/20', href: '/royalty-finder' },
                      { title: "Street Ballad",      artist: "Metro Boomin", issue: "MISSING_UPC",    value: 450.25,  issueClass: 'text-blue-400',   btnClass: 'border-blue-500/30 text-blue-300 hover:bg-blue-500/20',     href: '/dashboard' },
                      { title: "Zone 6 Forever",     artist: "Drake",        issue: "NAME_DRIFT",     value: 1100.75, issueClass: 'text-orange-400', btnClass: 'border-orange-500/30 text-orange-300 hover:bg-orange-500/20', href: '/schema-parser' },
                      { title: "Midnight Frequency", artist: "Travis Scott", issue: "MISSING_ISWC",   value: 720.00,  issueClass: 'text-red-400',    btnClass: 'border-red-500/30 text-red-300 hover:bg-red-500/20',         href: '/mlc-search' },
                    ] as const).map((r, i) => (
                      <tr key={i} className="hover:bg-white/5 transition">
                        <td className="p-4 font-bold text-slate-300">{r.title}</td>
                        <td className="p-4 text-gray-500">{r.artist}</td>
                        <td className="p-4"><span className={`${r.issueClass} font-mono text-[10px]`}>{r.issue}</span></td>
                        <td className="p-4 text-right font-mono text-green-400 font-bold">+${r.value.toFixed(2)}</td>
                        <td className="p-4 text-right">
                          <Link href={(r as any).href} className={`px-3 py-1 border text-[10px] font-black rounded-lg transition ${r.btnClass}`}>Auto-Fix</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            </div>
          )}

          {/* ── RECOUPMENT ── */}
          {view === 'recoupment' && (
            <div>
              <div className="mb-6">
                <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-widest mb-1">Advance Tracking</p>
                <h1 className="text-2xl font-bold tracking-tight">Recoupment Ledger</h1>
                <p className="text-gray-500 text-xs mt-1">Advance balances and earnings status across all signed artists</p>
              </div>

              {/* Summary row */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Total Advances',  value: '$'+artists.reduce((s,a)=>s+a.expenses,0).toLocaleString('en-US', {useGrouping:true,maximumFractionDigits:0}), color: 'text-slate-300' },
                  { label: 'Total Earned',    value: '$'+artists.reduce((s,a)=>s+a.earnings,0).toLocaleString('en-US', {useGrouping:true,maximumFractionDigits:0}), color: 'text-green-400' },
                  { label: 'Net Unrecouped',  value: '$'+artists.filter(a=>!a.recouped).reduce((s,a)=>s+(a.expenses-a.earnings),0).toLocaleString('en-US', {useGrouping:true,maximumFractionDigits:0}), color: 'text-yellow-400' },
                ].map(s => (
                  <div key={s.label} className="bg-slate-900/50 border border-slate-800 rounded-xl px-5 py-4">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">{s.label}</p>
                    <p className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
                      <th className="px-5 py-3 text-left">Artist</th>
                      <th className="px-5 py-3 text-right">Advance</th>
                      <th className="px-5 py-3 text-right">Earned</th>
                      <th className="px-5 py-3 text-right">Balance</th>
                      <th className="px-5 py-3 text-left w-48">Recovery</th>
                      <th className="px-5 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {artists.map(a => {
                      const pct = Math.min(100, Math.round((a.earnings / Math.max(a.expenses, 1)) * 100));
                      const balance = a.earnings - a.expenses;
                      return (
                        <tr key={a.id} className="hover:bg-white/5 transition">
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-200">{a.stage}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{a.genre} · {a.isrc}</p>
                          </td>
                          <td className="px-5 py-4 text-right font-mono text-gray-500">${a.expenses.toLocaleString('en-US', {useGrouping:true,maximumFractionDigits:0})}</td>
                          <td className="px-5 py-4 text-right font-mono text-slate-300">${a.earnings.toLocaleString('en-US', {useGrouping:true,maximumFractionDigits:0})}</td>
                          <td className={`px-5 py-4 text-right font-mono font-semibold ${balance >= 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                            {balance >= 0 ? '+' : '-'}${Math.abs(balance).toLocaleString('en-US', {useGrouping:true,maximumFractionDigits:0})}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-white/10 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${a.recouped ? 'bg-green-500' : 'bg-yellow-500'}`} style={{width:`${pct}%`}} />
                              </div>
                              <span className="text-[10px] text-gray-500 font-mono w-8 text-right">{pct}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${a.recouped ? 'bg-green-500/15 text-green-400 border border-green-500/25' : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25'}`}>
                              {a.recouped ? 'RECOUPED' : 'PENDING'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── CONTRACTS ── */}
          {view === 'contracts' && (
            <div>
              <div className="mb-8">
                <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-widest mb-1">Legal</p>
                <h1 className="text-3xl font-black">Contracts</h1>
              </div>
              <div className="space-y-3">
                {[
                  { title: 'Drake — 360 Deal',          type: 'Recording',  date: '2019-03-01', status: 'Active',   risk: 'Low' },
                  { title: 'Travis Scott — Album Deal',  type: 'Recording',  date: '2020-06-15', status: 'Active',   risk: 'Medium' },
                  { title: '21 Savage — Co-Pub Deal',    type: 'Publishing', date: '2021-01-10', status: 'Active',   risk: 'Low' },
                  { title: 'Metro Boomin — Producer Agmt',type:'Production', date: '2018-09-22', status: 'Expiring', risk: 'High' },
                ].map((c, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <p className="font-bold">{c.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{c.type} · {c.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${c.status==='Active'?'bg-green-500/20 text-green-300':'bg-red-500/20 text-red-300'}`}>{c.status}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${c.risk==='Low'?'bg-green-500/20 text-green-300':c.risk==='Medium'?'bg-yellow-500/20 text-yellow-300':'bg-red-500/20 text-red-300'}`}>{c.risk} Risk</span>
                      <Link href="/attorney-portal" className="px-3 py-1 text-[10px] font-black border border-indigo-500/30 text-indigo-300 rounded-lg hover:bg-indigo-500/20 transition">Review</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PAYOUTS ── */}
          {view === 'payouts' && (
            <div>
              <div className="mb-8">
                <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-widest mb-1">Disbursements</p>
                <h1 className="text-3xl font-black">Payouts</h1>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-white/50 text-gray-500 uppercase tracking-widest">
                    <tr>
                      <th className="p-4 text-left">Artist</th>
                      <th className="p-4 text-right">Available</th>
                      <th className="p-4 text-right">Last Payout</th>
                      <th className="p-4 text-right">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {artists.filter(a=>a.recouped).map(a=>(
                      <tr key={a.id} className="hover:bg-white/5 transition">
                        <td className="p-4 font-bold text-slate-300">{a.stage}</td>
                        <td className="p-4 text-right font-mono font-black text-green-400">${(a.earnings-a.expenses).toLocaleString('en-US', {useGrouping:true,maximumFractionDigits:0})}</td>
                        <td className="p-4 text-right text-gray-500">Feb 2026</td>
                        <td className="p-4 text-right"><span className="text-green-400 font-black text-[10px]">READY</span></td>
                        <td className="p-4 text-right">
                          <button className="px-3 py-1 bg-green-600/20 border border-green-500/30 text-green-300 text-[10px] font-black rounded-lg hover:bg-green-600/40 transition">Pay Now</button>
                        </td>
                      </tr>
                    ))}
                    {artists.filter(a=>!a.recouped).map(a=>(
                      <tr key={a.id} className="hover:bg-white/5 transition opacity-50">
                        <td className="p-4 font-bold text-slate-300">{a.stage}</td>
                        <td className="p-4 text-right font-mono text-yellow-400">Unrecouped</td>
                        <td className="p-4 text-right text-gray-500">—</td>
                        <td className="p-4 text-right"><span className="text-yellow-400 font-black text-[10px]">PENDING</span></td>
                        <td className="p-4 text-right">
                          <button disabled className="px-3 py-1 border border-gray-200 text-slate-600 text-[10px] font-black rounded-lg cursor-not-allowed">Hold</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── IMPORT CSV/PDF ── */}
          {view === 'import' && (
            <div className="space-y-8">
              <div>
                <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-widest mb-1">Data Import</p>
                <h1 className="text-3xl font-black">Upload & Import</h1>
                <p className="text-gray-500 text-sm mt-1">Upload MP3 tracks to secure storage or preview CSV data locally</p>
              </div>

              {/* ── REAL: MP3 Upload ── */}
              <div className="bg-white border border-indigo-500/30 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 bg-indigo-950/30 border-b border-indigo-500/20 flex items-center gap-3">
                  <span className="text-xl">🎵</span>
                  <div>
                    <p className="text-sm font-bold text-white">MP3 Upload — Real Storage</p>
                    <p className="text-xs text-gray-500">Uploads to IDrive e2 with SHA-256 hash for chain of custody</p>
                  </div>
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 bg-green-900/40 text-green-400 border border-green-700/40 rounded">⚡ Live</span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 font-semibold mb-1">Artist Name *</label>
                      <input value={mp3Artist} onChange={e => setMp3Artist(e.target.value)}
                        placeholder="e.g. Young Metro"
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 font-semibold mb-1">Track Title *</label>
                      <input value={mp3Title} onChange={e => setMp3Title(e.target.value)}
                        placeholder="e.g. No Limit"
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 font-semibold mb-1">ISRC</label>
                      <input value={mp3Isrc} onChange={e => setMp3Isrc(e.target.value)}
                        placeholder="e.g. USRC11600001"
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500" />
                    </div>
                  </div>

                  <div
                    onClick={() => mp3Ref.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${mp3File ? 'border-green-500/50 bg-green-500/5' : 'border-gray-300 hover:border-indigo-500/50 hover:bg-indigo-500/5'}`}>
                    <div className="text-4xl mb-2">{mp3File ? '✅' : '🎵'}</div>
                    <p className="text-sm font-bold text-slate-300">
                      {mp3File ? mp3File.name : 'Click to select MP3 file'}
                    </p>
                    {mp3File && <p className="text-xs text-gray-500 mt-1">{Math.round(mp3File.size / 1024)}KB</p>}
                    <input ref={mp3Ref} type="file" accept=".mp3" className="hidden"
                      onChange={e => setMp3File(e.target.files?.[0] ?? null)} />
                  </div>

                  <button
                    onClick={handleMp3Upload}
                    disabled={uploading || !mp3File || !mp3Artist.trim() || !mp3Title.trim()}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/10 disabled:text-slate-600 text-white font-bold rounded-xl text-sm transition">
                    {uploading ? 'Uploading…' : 'Upload to Secure Storage →'}
                  </button>

                  {uploadResult && !uploadResult.error && (
                    <div className="p-4 bg-green-900/20 border border-green-700/40 rounded-xl space-y-2">
                      <p className="text-sm font-bold text-green-400">✓ Upload successful</p>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex gap-3"><span className="text-slate-600 w-24">Track ID</span><span className="font-mono text-slate-300">{uploadResult.track_id}</span></div>
                        <div className="flex gap-3"><span className="text-slate-600 w-24">SHA-256</span><span className="font-mono text-slate-300 break-all">{uploadResult.hash}</span></div>
                        {uploadResult.public_url && (
                          <div className="pt-1">
                            <a href={uploadResult.public_url} target="_blank" rel="noopener noreferrer"
                              className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold">
                              Stream preview ↗
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {uploadResult?.error && (
                    <div className="p-3 bg-red-900/20 border border-red-700/40 rounded-xl text-xs text-red-400 font-semibold">
                      Error: {uploadResult.error}
                    </div>
                  )}
                </div>
              </div>

              {/* ── CSV Preview (local only) ── */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                  <span className="text-xl">📋</span>
                  <div>
                    <p className="text-sm font-bold text-white">CSV Preview — Local</p>
                    <p className="text-xs text-gray-500">Validates structure client-side — no data is sent to the server</p>
                  </div>
                  <span className="ml-auto text-[10px] font-bold px-2 py-0.5 bg-slate-700 text-gray-500 rounded">Local Only</span>
                </div>
                <div className="p-6 space-y-4">
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition">
                    <div className="text-4xl mb-2">📥</div>
                    <p className="text-sm font-bold text-slate-300 mb-1">Drop CSV or PDF here</p>
                    <p className="text-xs text-gray-500">Royalty statements · Split sheets · Contracts · DSP reports</p>
                    <input ref={fileRef} type="file" accept=".csv,.pdf" className="hidden" onChange={handleFile} />
                  </div>

                  {importStatus && (
                    <div className={`p-4 rounded-xl border text-sm font-semibold ${importStatus.includes('issue') ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' : importStatus.includes('Error') || importStatus.includes('Unsupported') ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-slate-800/60 border-gray-200 text-slate-300'}`}>
                      {importStatus}
                      {importStatus.includes('issue') && !csvFixed && (
                        <button onClick={() => { setCsvFixed(true); setImportStatus('Issues noted — fix in your spreadsheet app then re-upload.'); }}
                          className="ml-4 px-3 py-1 bg-yellow-500/20 border border-yellow-500/40 text-yellow-200 text-xs rounded-lg hover:bg-yellow-500/30 transition">
                          Acknowledge
                        </button>
                      )}
                    </div>
                  )}

                  {importRows.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Preview (first 8 rows)</p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-white/50">
                            <tr>{importRows[0]?.map((h,i)=><th key={i} className="p-3 text-left text-gray-500 font-black uppercase tracking-wider">{h}</th>)}</tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {importRows.slice(1).map((row,i)=>(
                              <tr key={i} className="hover:bg-white/5">
                                {row.map((cell,j)=><td key={j} className={`p-3 ${cell===''?'bg-red-500/10 text-red-400':'text-slate-300'}`}>{cell||'⚠ empty'}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { name: 'Royalty Statement', icon: '💰', cols: 'Track,ISRC,DSP,Period,Streams,Amount,Currency,Paid' },
                      { name: 'Artist Catalog',    icon: '🎵', cols: 'Title,ISRC,UPC,ReleaseDate,Label,Genre,Producer,Songwriter' },
                      { name: 'Split Sheet',       icon: '✂️',  cols: 'Track,ISRC,Party,Role,IPI,SplitPct,ProAffiliation' },
                    ].map(t => (
                      <div key={t.name} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <div className="text-xl mb-2">{t.icon}</div>
                        <p className="font-bold text-sm mb-1">{t.name} Template</p>
                        <p className="text-[10px] text-gray-500 font-mono mb-3 break-all">{t.cols}</p>
                        <button onClick={() => {
                          const blob = new Blob([t.cols+'\n'], {type:'text/csv'});
                          const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                          a.download = t.name.replace(/\s+/g,'-')+'.csv'; a.click();
                        }} className="w-full py-2 text-xs font-bold bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 rounded-lg hover:bg-indigo-600/40 transition">
                          Download Template
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
