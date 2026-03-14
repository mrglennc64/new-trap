"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Footer from './components/Footer';
import { useDemoMode } from './lib/DemoModeProvider';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { setDemoMode } = useDemoMode();

  const enterDemo = () => { setDemoMode(true); router.push('/gap-finder'); };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/royalty-finder?q=${encodeURIComponent(q)}`);
    } else {
      router.push('/royalty-finder');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-200">

      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-[#0a0f1e]/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xs font-bold tracking-widest text-slate-300 uppercase">
            TrapRoyaltiesPro
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <Link href="/royalty-finder" className="text-slate-400 hover:text-slate-200 transition">Royalty Finder</Link>
            <Link href="/cwr-generator" className="text-slate-400 hover:text-slate-200 transition">CWR Generator</Link>
            <Link href="/label" className="text-slate-400 hover:text-slate-200 transition">Label Portal</Link>
            <Link href="/for-attorneys" className="text-amber-400 hover:text-amber-300 transition">For Attorneys</Link>
            <Link href="/free-audit" className="text-indigo-400 hover:text-indigo-300 transition font-medium">Run Audit →</Link>
          </div>
          <button className="md:hidden p-2 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold tracking-widest text-indigo-400 uppercase mb-4">
            Music Rights Forensic Platform
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-5 leading-tight">
            Identify, Document, and Recover<br className="hidden md:block" />
            Unclaimed Music Royalties
          </h1>
          <p className="text-sm text-slate-400 mb-8 max-w-2xl leading-relaxed">
            ISRC-level forensic analysis via MusicBrainz and ListenBrainz — confirmed data only.
            Generates verifiable reports accepted as evidence in royalty dispute proceedings.
          </p>

          {/* ISRC Search */}
          <form onSubmit={handleScan} className="flex gap-2 max-w-xl mb-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ISRC (e.g. USUM71703861) or artist name"
              className="flex-1 px-4 py-2.5 bg-[#0f172a] border border-slate-700 text-slate-200 placeholder-slate-600 text-sm rounded focus:outline-none focus:border-indigo-500 transition"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded transition whitespace-nowrap"
            >
              Run Scan →
            </button>
          </form>
          <p className="text-xs text-slate-600 mb-8">
            No account required — queries SMPT global registry
          </p>

          {/* Two text links — no giant buttons */}
          <div className="flex flex-wrap gap-6 text-sm border-t border-slate-800 pt-6">
            <Link href="/free-audit" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 transition">
              Run full catalog audit
            </Link>
            <Link href="/for-attorneys" className="text-amber-400 hover:text-amber-300 underline underline-offset-4 transition">
              Attorney access and documentation
            </Link>
            <Link href="/label" className="text-slate-400 hover:text-slate-300 underline underline-offset-4 transition">
              Label and roster management
            </Link>
            <button
              onClick={enterDemo}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-sm rounded-xl transition"
            >
              🎬 Try Demo Mode
            </button>
          </div>
        </div>
      </section>

      {/* System Capabilities — clean divided columns, no boxes */}
      <section className="py-12 px-6 border-t border-slate-800/60">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-6">System Capabilities</p>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800">
            <div className="py-4 md:pr-8">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Registry Sources</p>
              <p className="text-sm text-slate-200 font-medium">MusicBrainz · ListenBrainz</p>
              <p className="text-xs text-slate-500 mt-1">Open registries — confirmed data only. PRO verification is manual.</p>
            </div>
            <div className="py-4 md:px-8">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Processing Capacity</p>
              <p className="text-sm text-slate-200 font-medium">10,000+ metadata records per session</p>
              <p className="text-xs text-slate-500 mt-1">CWR v2.1 compliant output · CISAC standard</p>
            </div>
            <div className="py-4 md:pl-8">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Evidence Standard</p>
              <p className="text-sm text-slate-200 font-medium">SHA-256 verification hash per report</p>
              <p className="text-xs text-slate-500 mt-1">Chain-of-custody documentation included</p>
            </div>
          </div>
        </div>
      </section>

      {/* Attorney Section — secure document aesthetic */}
      <section className="py-16 px-6 border-t border-slate-700/40 bg-[#080d1a]">
        <div className="max-w-5xl mx-auto">

          {/* Header + secure button */}
          <div className="flex flex-col md:flex-row md:items-start gap-8 mb-10">
            <div className="flex-1">
              <p className="text-xs font-bold tracking-widest text-amber-500 uppercase mb-2">
                For Entertainment Attorneys
              </p>
              <h2 className="text-xl font-bold text-white mb-3">
                Forensic Documentation &amp; Chain of Custody
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
                Every diagnostic generates a hash-verified evidence package with immutable ownership
                chains, split discrepancy analysis, and multi-node registry verification —
                engineered for pre-dispute resolution and civil litigation.
              </p>
            </div>

            {/* Secure Document Button */}
            <div className="flex-shrink-0 self-start">
              <Link
                href="/for-attorneys"
                className="group flex flex-col items-center gap-1 px-5 py-4 rounded bg-[#0f1623] border border-slate-600 hover:border-violet-500/60 transition-all duration-300 shadow-lg hover:shadow-violet-900/30 text-center min-w-[220px]"
              >
                <div className="flex items-center gap-2 text-slate-200 text-sm font-semibold group-hover:text-white transition">
                  {/* PDF + shield icon */}
                  <svg className="w-4 h-4 text-slate-400 group-hover:text-violet-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  View Sample Evidence Package
                </div>
                <span className="text-[10px] text-slate-500 group-hover:text-violet-400/70 font-mono tracking-wide transition">
                  SHA-256 · Hash Verified · PDF
                </span>
              </Link>
              <p className="text-[10px] text-slate-700 text-center mt-2 font-mono">
                Audit ID: TRP-SAMPLE-001
              </p>
            </div>
          </div>

          {/* Data table */}
          <div className="border border-slate-800 rounded overflow-hidden text-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0f1623] border-b border-slate-800">
                  <th className="text-left px-4 py-3 text-xs font-bold tracking-wider text-slate-500 uppercase">Forensic Service</th>
                  <th className="text-left px-4 py-3 text-xs font-bold tracking-wider text-slate-500 uppercase hidden md:table-cell">Data Source</th>
                  <th className="text-left px-4 py-3 text-xs font-bold tracking-wider text-slate-500 uppercase">Deliverable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {[
                  ['Ownership Verification', 'MusicBrainz SMPT probe', 'Signed PDF, hash-verified'],
                  ['Split Discrepancy Analysis', 'Ledger vs. market consumption data', '15–40% avg. gap documented'],
                  ['Forensic Discovery', 'Automated schema parsing engine', 'Minutes vs. months manually'],
                  ['Black Box Royalties', 'ISRC + ListenBrainz gap analysis', 'Claim documentation package'],
                  ['ISRC Gap Detection', 'Registry existence check', 'Missing registration report'],
                  ['Automated CWR Registration', 'Multi-Node Registry Verification', 'Audit-Ready Registration File'],
                ].map(([service, source, deliverable], i) => (
                  <tr key={i} className="hover:bg-slate-800/20 transition">
                    <td className="px-4 py-3 text-slate-200">{service}</td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{source}</td>
                    <td className="px-4 py-3 text-slate-400">{deliverable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-700 mt-3">
            * Audit results vary based on catalog registration status and PRO data availability.
          </p>
        </div>
      </section>

      {/* Access by Role — left-border text links, no big boxes */}
      <section className="py-16 px-6 border-t border-slate-800">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-8">Access by Role</p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="border-l-2 border-indigo-600 pl-4">
              <p className="text-sm font-semibold text-slate-200 mb-1">Artists &amp; Songwriters</p>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                ISRC lookup, PRO gap analysis, and missing royalty identification across your catalog.
              </p>
              <Link href="/free-audit" className="text-xs text-indigo-400 hover:text-indigo-300 transition">
                Run free audit →
              </Link>
            </div>
            <div className="border-l-2 border-blue-600 pl-4">
              <p className="text-sm font-semibold text-slate-200 mb-1">Labels &amp; Managers</p>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                Roster catalog management, bulk audit processing, and split verification across artists.
              </p>
              <Link href="/label" className="text-xs text-blue-400 hover:text-blue-300 transition">
                Label portal →
              </Link>
            </div>
            <div className="border-l-2 border-amber-500 pl-4">
              <p className="text-sm font-semibold text-slate-200 mb-1">Entertainment Attorneys</p>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                Court-admissible audit packages, evidence documentation, and dispute support tools.
              </p>
              <Link href="/for-attorneys" className="text-xs text-amber-400 hover:text-amber-300 transition">
                Attorney access →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />

    </div>
  );
}
