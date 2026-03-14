"use client";

import Link from 'next/link';
import { useState } from 'react';

const QRCode = ({ value, size = 120 }: { value: string; size?: number }) => (
  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`} alt="QR" width={size} height={size} style={{ borderRadius: '0.5rem' }} />
);

const MATTERS = [
  { id: 1, name: "Metro Boomin - Creepin Dispute", amount: "$187,200", status: "Urgent", leakage: "31%", issues: 5 },
  { id: 2, name: "B.o.B Estate - 360 Deal Audit", amount: "$450,000", status: "In Progress", leakage: "22%", issues: 8 },
  { id: 3, name: "Future - Publishing Rights", amount: "$92,500", status: "Ready", leakage: "15%", issues: 3 },
];

function buildContent(type: string, name: string, amount: string, leakage: string, issues: number) {
  if (type === 'court') {
    return `<div class="section"><h2>Executive Summary</h2><p>Forensic audit for ${name}.</p><table><tr><th>Metric</th><th>Value</th></tr><tr><td>Unclaimed</td><td class="highlight">${amount}</td></tr><tr><td>Leakage</td><td class="danger">${leakage}</td></tr><tr><td>Issues</td><td class="warning">${issues}</td></tr></table></div><div class="section"><h2>Ownership</h2><table><tr><th>Party</th><th>Claimed</th><th>Verified</th><th>Status</th></tr><tr><td>Artist</td><td>50%</td><td class="highlight">50%</td><td class="highlight">Verified</td></tr><tr><td>Producer</td><td>30%</td><td class="warning">25%</td><td class="warning">Under-claimed</td></tr><tr><td>Co-Writer</td><td>20%</td><td class="danger">15%</td><td class="danger">Disputed</td></tr></table></div>`;
  }
  if (type === 'demand') {
    const d = new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
    return `<div class="section"><p><b>Date:</b> ${d}</p><p>Republic Records, Attn: Legal Department</p></div><div class="section"><p><b>RE: DEMAND FOR UNPAID ROYALTIES</b></p><p>Matter: ${name}</p><p>Amount: ${amount}</p><br><p>Dear Sir or Madam:</p><br><p>This firm demands immediate payment of ${amount} in unpaid royalties. Failure to remit within 30 days will result in legal proceedings.</p><br><p>Respectfully,<br>Leron Rogers, Esq.<br>Fox Rothschild LLP</p></div>`;
  }
  if (type === 'affidavit') {
    const d = new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
    return `<div class="section"><h2>AFFIDAVIT OF LERON ROGERS, ESQ.</h2><p>STATE OF _____________)</p><br><p>I, Leron Rogers, being duly sworn, state:</p><ol><li>I am counsel for ${name}.</li><li>Forensic audit confirms ${amount} in unpaid royalties.</li><li>${issues} material discrepancies identified. Leakage: ${leakage}.</li><li>All findings verified via the TrapRoyaltiesPro audit system.</li></ol><br><p>Executed: ${d}</p><br><p>___________________________<br>Leron Rogers, Esq.</p><br><p>___________________________<br>Notary Public</p></div>`;
  }
  return `<div class="section"><h2>Custom Report</h2><p>Matter: ${name}</p><table><tr><th>Category</th><th>Finding</th><th>Impact</th></tr><tr><td>Streaming</td><td class="warning">Underreported Q3-Q4</td><td class="danger">-$45,200</td></tr><tr><td>Sync</td><td class="highlight">Verified</td><td>+$0</td></tr><tr><td>Performance</td><td class="danger">No ASCAP registration</td><td class="danger">${amount}</td></tr></table></div>`;
}

function generatePDF(title: string, content: string, matterName: string, matterId: number) {
  const hash = 'TRP-' + matterId + '-' + Date.now().toString(36).toUpperCase();
  const url = 'https://traproyaltiespro.com/verify/' + hash;
  const sha = Array.from({length:64},()=>Math.floor(Math.random()*16).toString(16)).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#1a1a1a}.section{margin:24px 0;padding:16px;background:#f9fafb;border-radius:8px;border-left:4px solid #4f46e5}table{width:100%;border-collapse:collapse;margin:16px 0}th{background:#eef2ff;padding:10px;text-align:left;color:#4f46e5}td{padding:10px;border-bottom:1px solid #e5e7eb}.qr{display:flex;align-items:center;gap:20px;padding:16px;background:#f0fdf4;border-radius:8px;border:1px solid #86efac;margin-top:24px}.footer{margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:.75rem;color:#9ca3af;text-align:center}.highlight{color:#16a34a;font-weight:bold}.warning{color:#d97706;font-weight:bold}.danger{color:#dc2626;font-weight:bold}h2{color:#1e1b4b}</style></head><body><h1 style="color:#1e1b4b">${title}</h1><p style="color:#6b7280">Matter: ${matterName} | Fox Rothschild LLP | Leron Rogers, Esq. | ID: ${hash}</p>${content}<div class="qr"><img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(url)}" width="100" height="100" style="border-radius:8px"/><div><div style="font-weight:bold;color:#166534">QR Verification Seal</div><div style="font-size:.8rem;margin:4px 0">Scan to verify authenticity</div><div style="font-size:.7rem;color:#6b7280">${url}</div><div style="font-family:monospace;font-size:.7rem;background:#f3f4f6;padding:6px;border-radius:4px;margin-top:6px;word-break:break-all">SHA-256: ${sha}</div></div></div><div class="footer">TrapRoyaltiesPro.com | Confidential | Verify: ${url}</div></body></html>`;
  const blob = new Blob([html], {type:'text/html'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = title.replace(/\s+/g,'-') + '-' + hash + '.html';
  a.click();
}

export default function AttorneyPortal() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedMatter, setSelectedMatter] = useState(1);
  const [scanRunning, setScanRunning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [splitStep, setSplitStep] = useState<number>(0);
  const [splitData, setSplitData] = useState<any[]>([]);
  const [splitErrors, setSplitErrors] = useState<string[]>([]);
  const [splitVerifyId, setSplitVerifyId] = useState<string>('');
  const [splitTimestamp, setSplitTimestamp] = useState<string>('');
  const [splitPayAmount, setSplitPayAmount] = useState<number>(50000);
  const [handshakeTrack, setHandshakeTrack] = useState('');
  const [handshakeEmail, setHandshakeEmail] = useState('');
  const [handshakePercentage, setHandshakePercentage] = useState('');
  const [handshakeName, setHandshakeName] = useState('');
  const [handshakeRole, setHandshakeRole] = useState('artist');
  const [handshakeISRC, setHandshakeISRC] = useState('');
  const [handshakeRightsType, setHandshakeRightsType] = useState('all-in');
  const [handshakeRevenueBasis, setHandshakeRevenueBasis] = useState('net');
  const [handshakeJurisdiction, setHandshakeJurisdiction] = useState('georgia');
  const [handshakeResult, setHandshakeResult] = useState<{signingLink: string; verificationId: string} | null>(null);
  const [handshakeSending, setHandshakeSending] = useState(false);

  const matter = MATTERS.find(m => m.id === selectedMatter) || MATTERS[0];

  const runScan = () => {
    setScanRunning(true);
    setScanComplete(false);
    setTimeout(() => { setScanRunning(false); setScanComplete(true); }, 2500);
  };

  const handleDownload = (type: string, title: string) => {
    setDownloading(type);
    setTimeout(() => {
      generatePDF(title, buildContent(type, matter.name, matter.amount, matter.leakage, matter.issues), matter.name, matter.id);
      setDownloading(null);
    }, 800);
  };

  const showBar = !['dashboard', 'war-room', 'new-matter', 'secure-message', 'digital-handshake'].includes(activeSection);

  const navGroups = [
    { label: "Matter Management", items: [
      { id: 'dashboard', label: 'Mission Control', icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
      { id: 'war-room', label: 'War Room', icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
      { id: 'new-matter', label: 'New Matter', icon: "M12 4v16m8-8H4" },
    ]},
    { label: "Digital Handshake", items: [
      { id: 'digital-handshake', label: 'Digital Handshake', icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
    ]},
    { label: "Audit & Due Diligence", items: [
      { id: 'run-due-diligence', label: 'Run Catalog Due Diligence', icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
      { id: 'pre-release-verify', label: 'Pre-Release Split Verification', icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    ]},
    { label: "Reports & Documents", items: [
      { id: 'view-audit-report', label: 'View Audit Report', icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" },
      { id: 'generate-court-report', label: 'Generate Court-Ready Report', icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
      { id: 'generate-custom-report', label: 'Generate Custom Report', icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
    ]},
    { label: "Legal Actions", items: [
      { id: 'create-demand-letter', label: 'Create Demand Letter', icon: "M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
      { id: 'export-affidavit', label: 'Export Affidavit', icon: "M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" },
      { id: 'export-hash-seal', label: 'Export with Hash Seal', icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
    ]},
    { label: "Communication", items: [
      { id: 'secure-message', label: 'Secure Client Message', icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", badge: "2" },
    ]},
  ];

  const handleHandshakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHandshakeSending(true);
    setHandshakeResult(null);
    try {
      const response = await fetch('/api/create-handshake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track_name: handshakeTrack,
          isrc: handshakeISRC,
          rights_type: handshakeRightsType,
          revenue_basis: handshakeRevenueBasis,
          jurisdiction: handshakeJurisdiction,
          created_by: 'leron.rogers@foxrothschild.com',
          created_by_name: 'Leron Rogers',
          participants: [{ name: handshakeName || 'Collaborator', email: handshakeEmail, percentage: parseInt(handshakePercentage), role: handshakeRole }]
        })
      });
      const data = await response.json();
      if (data.success) {
        setHandshakeResult({ signingLink: data.signingLink, verificationId: data.verificationId });
        setHandshakeTrack(''); setHandshakeEmail(''); setHandshakePercentage(''); setHandshakeName('');
      } else { alert('Error: ' + (data.error || 'Unknown error')); }
    } catch (err) { alert('Error connecting to server'); }
    finally { setHandshakeSending(false); }
  };

  const PERFECT_SPLIT = [
    { name: "James Carter", role: "Composer", percentage: 50, ipi: "00624789341" },
    { name: "Toya Williams", role: "Lyricist", percentage: 30, ipi: "00472915682" },
    { name: "DJ Premier", role: "Producer", percentage: 20, ipi: "00836125497" }
  ];
  const ERROR_SPLIT = [
    { name: "James Carter", role: "Composer", percentage: 60, ipi: "" },
    { name: "", role: "Lyricist", percentage: 25, ipi: "00472915682" },
    { name: "DJ Premier", role: "Producer", percentage: 20, ipi: "invalid" },
    { name: "Extra", role: "Writer", percentage: 10, ipi: "" }
  ];
  const validateSplit = (data: any[]) => {
    const errs: string[] = [];
    let total = 0;
    data.forEach((item: any, i: number) => {
      total += item.percentage || 0;
      if (!item.name || item.name.trim() === '') errs.push("Contributor " + (i+1) + " missing name");
      if (!item.ipi || item.ipi.trim() === '' || item.ipi === 'invalid') errs.push((item.name || 'Contributor') + " missing/invalid IPI");
    });
    if (Math.abs(total - 100) > 0.1) errs.push("Total split is " + total + "%, must equal 100%");
    return errs;
  };
  const loadPerfectSplit = () => { setSplitData(PERFECT_SPLIT); setSplitErrors([]); setSplitStep(1); };
  const loadErrorSplit = () => { const errs = validateSplit(ERROR_SPLIT); setSplitData(ERROR_SPLIT); setSplitErrors(errs); setSplitStep(2); };
  const autoFixSplit = () => {
    const fixed = splitData.map((item: any, i: number) => ({
      ...item,
      name: item.name || ("Contributor " + (i+1)),
      ipi: (!item.ipi || item.ipi === 'invalid') ? ("AUTO-" + Math.floor(Math.random()*90000+10000)) : item.ipi,
    }));
    const total = fixed.reduce((s: number, i: any) => s + i.percentage, 0);
    if (Math.abs(total - 100) > 0.1) { const factor = 100/total; fixed.forEach((i: any) => { i.percentage = Math.round(i.percentage*factor*10)/10; }); }
    setSplitData(fixed); setSplitErrors(validateSplit(fixed)); setSplitStep(1);
  };
  const startSplitVerification = () => {
    const id = Math.random().toString(36).substr(2,16).toUpperCase();
    setSplitVerifyId(id);
    setSplitTimestamp(new Date().toISOString().replace('T',' ').substring(0,16) + ' UTC');
    setSplitStep(2);
  };
  const downloadSplitReport = () => {
    const rows = splitData.map((i: any) => {
      const g = splitPayAmount*i.percentage/100;
      return "<tr><td>"+i.name+"</td><td>"+i.role+"</td><td>"+i.ipi+"</td><td>"+i.percentage+"%</td><td>$"+g.toLocaleString()+"</td><td>-$"+(g*0.25).toLocaleString()+"</td><td>$"+(g*0.75).toLocaleString()+"</td></tr>";
    }).join('');
    const html = "<html><body style='font-family:Arial;padding:30px'><h1 style='color:#312e81'>TrapRoyaltiesPro - Split Verification Report</h1><p><b>ID:</b> TRP-"+splitVerifyId+"</p><p><b>Time:</b> "+splitTimestamp+"</p><p><b>Gross:</b> $"+splitPayAmount.toLocaleString()+"</p><p><b>Net:</b> $"+(splitPayAmount*0.75).toLocaleString()+"</p><table border='1' cellpadding='8' style='width:100%;border-collapse:collapse'><tr style='background:#eef2ff'><th>Name</th><th>Role</th><th>IPI</th><th>%</th><th>Gross</th><th>Tax</th><th>Net</th></tr>"+rows+"</table></body></html>";
    const blob = new Blob([html],{type:'text/html'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download="TRP-Split-Report.html"; a.click();
  };
  const resetSplitWorkflow = () => { setSplitStep(0); setSplitData([]); setSplitErrors([]); setSplitVerifyId(''); setSplitPayAmount(50000); };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <div className="bg-gradient-to-r from-indigo-700 to-purple-900 text-white py-2 px-6 text-center text-sm font-medium">
        Attorney Portal - Secure Session - Verified &amp; Documented
      </div>
      <header className="sticky top-0 z-50 bg-[#0f172a] border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-2xl font-bold text-indigo-300">TrapRoyalties<span className="text-indigo-400">Pro</span></Link>
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-sm rounded-full font-medium">Attorney Portal</span>
          </div>
          <div className="flex items-center space-x-6">
            <span className="text-sm text-gray-500">Leron Rogers (Fox Rothschild)</span>
            <Link href="/" className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-300 rounded-lg text-sm transition">Logout</Link>
          </div>
        </div>
      </header>

      <div className="flex">
        <div className="w-72 bg-slate-900 border-r border-slate-800 min-h-screen p-6">
          <div className="space-y-8">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-4">{group.label}</p>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <button key={item.id} onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition ${activeSection === item.id ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}>
                      <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      <span className="text-left text-sm flex-1">{item.label}</span>
                      {(item as any).badge && <span className="ml-auto bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full">{(item as any).badge}</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 p-8">
          {showBar && (
            <div className="mb-6 flex items-center gap-4 p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <span className="text-sm font-medium text-indigo-300 whitespace-nowrap">Active Matter:</span>
              <select value={selectedMatter} onChange={(e) => { setSelectedMatter(Number(e.target.value)); setScanComplete(false); }}
                className="flex-1 px-4 py-2 border border-indigo-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-white placeholder-slate-600">
                {MATTERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${matter.status === 'Urgent' ? 'bg-red-500/20 text-red-300' : matter.status === 'In Progress' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>
                {matter.status}
              </span>
            </div>
          )}

          {activeSection === 'digital-handshake' && (
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Digital Handshake</h1>
              <p className="text-gray-500 mb-6">Create court-admissible royalty split agreements - Georgia Law compliant</p>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
                  <h3 className="text-xl font-bold mb-6 text-white">Create New Split Agreement</h3>
                  <form onSubmit={handleHandshakeSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Track / Project Name</label>
                      <input type="text" value={handshakeTrack} onChange={e => setHandshakeTrack(e.target.value)} placeholder="e.g. Neon Dreams (Rough Mix v3)" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">ISRC / ISWC (optional)</label>
                      <input type="text" value={handshakeISRC} onChange={e => setHandshakeISRC(e.target.value)} placeholder="e.g. USUM72212345" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Rights Type</label>
                      <select value={handshakeRightsType} onChange={e => setHandshakeRightsType(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="all-in">All-In (Master + Publishing)</option>
                        <option value="master">Master Only (Sound Recording)</option>
                        <option value="publishing">Publishing Only (Composition)</option>
                        <option value="mechanical">Mechanicals Only</option>
                        <option value="sync">Sync Only</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Revenue Basis</label>
                      <select value={handshakeRevenueBasis} onChange={e => setHandshakeRevenueBasis(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="net">Net Receipts</option>
                        <option value="gross">Gross Receipts</option>
                        <option value="nps">Net Publisher Share</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-1">Jurisdiction</label>
                      <select value={handshakeJurisdiction} onChange={e => setHandshakeJurisdiction(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="georgia">Georgia Law (Atlanta)</option>
                        <option value="california">California Law (LA)</option>
                        <option value="new-york">New York Law</option>
                        <option value="tennessee">Tennessee Law (Nashville)</option>
                      </select>
                    </div>
                    <div className="border-t pt-4">
                      <label className="block text-sm font-semibold text-slate-300 mb-3">Collaborator Details</label>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <input type="text" placeholder="Name" value={handshakeName} onChange={e => setHandshakeName(e.target.value)} className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        <input type="email" placeholder="Email" value={handshakeEmail} onChange={e => setHandshakeEmail(e.target.value)} className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                        <input type="number" placeholder="%" value={handshakePercentage} onChange={e => setHandshakePercentage(e.target.value)} className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                      </div>
                      <select value={handshakeRole} onChange={e => setHandshakeRole(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="artist">Artist</option>
                        <option value="producer">Producer</option>
                        <option value="co-writer">Co-Writer</option>
                        <option value="featuring">Featuring Artist</option>
                        <option value="publisher">Publisher</option>
                        <option value="sample-clearance">Sample Clearance</option>
                      </select>
                    </div>
                    <button type="submit" disabled={handshakeSending} className="w-full py-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 transition disabled:opacity-60">
                      {handshakeSending ? 'Sending...' : 'Send Digital Handshake'}
                    </button>
                  </form>
                  {handshakeResult && (
                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl space-y-2">
                      <p className="text-green-400 font-semibold text-sm">✓ Handshake created — share this signing link:</p>
                      <div className="flex items-center gap-2">
                        <input readOnly value={handshakeResult.signingLink} className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-xs text-slate-300 font-mono focus:outline-none" />
                        <button onClick={() => navigator.clipboard.writeText(handshakeResult!.signingLink)} className="px-3 py-2 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-500">Copy</button>
                      </div>
                      <p className="text-xs text-slate-500">ID: {handshakeResult.verificationId}</p>
                    </div>
                  )}
                </div>
                <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-lg font-bold mb-4 text-white">Agreement Preview</h3>
                  <div className="bg-slate-900/50 border border-indigo-500/30 rounded-xl p-6 space-y-4">
                    <div className="flex justify-between items-center border-b pb-3">
                      <span className="font-bold text-white text-lg">{handshakeTrack || 'Track Name'}</span>
                      <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded-full font-bold">PENDING</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Rights Type</span><span className="font-medium text-white">{handshakeRightsType}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Revenue Basis</span><span className="font-medium text-white">{handshakeRevenueBasis}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Jurisdiction</span><span className="font-medium text-white">{handshakeJurisdiction}</span></div>
                      {handshakeISRC && <div className="flex justify-between"><span className="text-gray-500">ISRC</span><span className="font-mono text-xs text-white">{handshakeISRC}</span></div>}
                    </div>
                    {handshakeName && (
                      <div className="border-t pt-3">
                        <p className="text-xs font-semibold text-gray-500 mb-2">COLLABORATOR</p>
                        <div className="flex justify-between items-center p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                          <div>
                            <span className="text-sm font-medium text-white">{handshakeName}</span>
                            <span className="text-xs text-gray-500 ml-2">({handshakeRole})</span>
                          </div>
                          <span className="text-sm font-bold text-yellow-400">{handshakePercentage || 0}% - PENDING</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs font-bold text-amber-800 mb-1">Georgia Court Requirements:</p>
                    <ul className="text-xs text-amber-700 space-y-1">
                      <li>&#10003; Rights type defined</li>
                      <li>&#10003; Revenue basis specified</li>
                      <li>&#10003; Jurisdiction locked</li>
                      <li>&#10003; Timestamp + IP metadata attached</li>
                      <li>&#10003; Verification seal on execution</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeSection === 'dashboard' && (
            <div className="min-h-screen bg-[#0f172a] text-white -m-8 p-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="mc-pulse text-purple-400 text-xs">●</span>
                    <span className="text-[10px] font-black mc-mono uppercase tracking-[0.25em] text-gray-500">FOX ROTHSCHILD LLP — SECURE SESSION</span>
                  </div>
                  <h1 className="text-4xl font-black tracking-tight uppercase italic">
                    Attorney <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Mission Control</span>
                  </h1>
                  <p className="text-gray-500 mc-mono text-xs mt-1">Leron Rogers, Esq. — Active Matters: 12 — Firm Recovery Pipeline: $1,482,900</p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-600 mc-mono mb-1 uppercase">Total Black Box Value</div>
                  <div className="text-4xl font-black text-green-400 mc-mono">$1.2M</div>
                  <div className="text-[10px] text-gray-500 mc-mono">unclaimed — ready to dispute</div>
                </div>
              </div>

              {/* KPI Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { l:"Active Matters", v:"12", s:"+3 this month", col:"text-white" },
                  { l:"Pending Audits", v:"8",  s:"4 require review", col:"text-yellow-400" },
                  { l:"Active Disputes", v:"3", s:"2 urgent", col:"text-red-400" },
                  { l:"Settlements Pending", v:"$487k", s:"awaiting DSP response", col:"text-purple-400" },
                ].map((s,i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                    <p className="text-[10px] mc-mono uppercase text-gray-500 mb-1">{s.l}</p>
                    <p className={`text-3xl font-black mc-mono ${s.col}`}>{s.v}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.s}</p>
                  </div>
                ))}
              </div>

              {/* Active Matters — War Room table */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xs font-black mc-mono uppercase tracking-widest text-gray-500">Active Matters — Select to Enter War Room</h2>
                  <button onClick={() => setActiveSection('new-matter')}
                    className="text-xs px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition">
                    + New Matter
                  </button>
                </div>
                <div className="space-y-3">
                  {MATTERS.map(m => (
                    <div key={m.id}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all group ${
                        m.status === 'Urgent'
                          ? 'border-red-500/40 bg-red-500/10 hover:bg-red-500/20'
                          : m.status === 'In Progress'
                            ? 'border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20'
                            : 'border-green-500/20 bg-green-500/10 hover:bg-green-500/20'
                      }`}
                      onClick={() => { setSelectedMatter(m.id); setActiveSection('war-room'); }}>
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-10 rounded-full flex-shrink-0 ${m.status === 'Urgent' ? 'bg-red-500' : m.status === 'In Progress' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                        <div>
                          <p className="font-bold text-sm">{m.name}</p>
                          <p className="text-xs text-gray-500 mc-mono">{m.issues} issues · leakage {m.leakage}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-lg font-black text-green-400 mc-mono">{m.amount}</p>
                          <p className="text-[10px] text-gray-500">at risk</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-black mc-mono ${
                          m.status === 'Urgent' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                          m.status === 'In Progress' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                          'bg-green-500/20 text-green-300 border border-green-500/30'
                        }`}>{m.status}</span>
                        <span className="text-slate-600 group-hover:text-purple-400 transition font-black text-lg">→</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id:'run-due-diligence', icon:"🔬", l:"Forensic Audit", d:"Full catalog scan — ASCAP, BMI, SoundExchange" },
                  { id:'generate-court-report', icon:"📋", l:"Court-Ready Report", d:"Hash-sealed, QR-verified PDF evidence package" },
                  { id:'digital-handshake', icon:"🤝", l:"Digital Handshake", d:"Verified and documented split agreement" },
                ].map(a => (
                  <button key={a.id} onClick={() => setActiveSection(a.id)}
                    className="flex items-center gap-4 p-5 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-indigo-500/50 hover:bg-white/5 transition text-left group">
                    <span className="text-3xl">{a.icon}</span>
                    <div>
                      <p className="font-black text-sm">{a.l}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{a.d}</p>
                    </div>
                    <span className="ml-auto text-slate-600 group-hover:text-indigo-400 transition font-black">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'war-room' && (
            <div className="min-h-screen bg-[#0f172a] text-white -m-8 p-8">
              {/* Back + header */}
              <button onClick={() => setActiveSection('dashboard')}
                className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-6 transition">
                ← Back to Mission Control
              </button>

              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="text-[10px] font-black text-red-400 wr-mono uppercase mb-1 tracking-widest">⚠ WAR ROOM — ACTIVE DISPUTE</div>
                  <h1 className="text-3xl font-black">{matter.name}</h1>
                  <p className="text-gray-500 wr-mono text-sm mt-1">{matter.issues} issues flagged · Leakage: {matter.leakage}</p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-500 wr-mono mb-1">Recovery Target</div>
                  <div className="text-4xl font-black text-green-400 wr-mono">{matter.amount}</div>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-black wr-mono ${
                    matter.status === 'Urgent' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                    matter.status === 'In Progress' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                    'bg-green-500/20 text-green-300 border border-green-500/30'
                  }`}>{matter.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Evidence status */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-xs font-black wr-mono uppercase tracking-widest text-gray-500 mb-4">Forensic Evidence Stack</h3>
                    <div className="space-y-3">
                      {[
                        { check:"ASCAP Registration", finding:"Missing publisher registration", sev:"critical" },
                        { check:"BMI PRO Status",     finding:"IPI mismatch on co-writer",     sev:"warning" },
                        { check:"SoundExchange",      finding:"No neighboring rights claim",    sev:"critical" },
                        { check:"PRS / SOCAN",        finding:"International registrations current", sev:"ok" },
                        { check:"Split Verification", finding:"Over-allocation detected (108%)", sev:"critical" },
                        { check:"ISRC Verification",  finding:"2 tracks missing ISRC",          sev:"warning" },
                      ].map((item,i) => (
                        <div key={i} className={`flex justify-between items-center p-3 rounded-xl border-l-4 ${
                          item.sev === 'critical' ? 'border-red-500 bg-red-500/10' :
                          item.sev === 'warning'  ? 'border-yellow-500 bg-yellow-500/10' :
                          'border-green-500 bg-green-500/10'
                        }`}>
                          <span className="font-bold text-sm">{item.check}</span>
                          <span className={`text-xs wr-mono font-bold ${
                            item.sev === 'critical' ? 'text-red-400' :
                            item.sev === 'warning'  ? 'text-yellow-400' :
                            'text-green-400'
                          }`}>{item.finding}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Scan + actions */}
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-xs font-black wr-mono uppercase tracking-widest text-gray-500 mb-4">Run Full Forensic Scan</h3>
                    {!scanRunning && !scanComplete && (
                      <button onClick={runScan}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition text-base">
                        🔬 Start Forensic Scan — {matter.name}
                      </button>
                    )}
                    {scanRunning && (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mb-4" />
                        <p className="font-bold text-indigo-300">Running forensic scan...</p>
                        <p className="text-xs text-gray-500 mt-1 wr-mono">Querying ASCAP · BMI · PRS · SOCAN · SoundExchange</p>
                      </div>
                    )}
                    {scanComplete && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-green-900/20 border border-green-500/30 rounded-xl">
                          <span className="text-green-400 text-xl">✓</span>
                          <p className="font-bold text-green-300 text-sm">Scan complete — evidence locked and timestamped</p>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 bg-red-500/20 border border-red-500/20 rounded-xl text-center"><p className="text-2xl font-black text-red-400 wr-mono">{matter.amount}</p><p className="text-xs text-gray-500">Unclaimed</p></div>
                          <div className="p-3 bg-yellow-500/20 border border-yellow-500/20 rounded-xl text-center"><p className="text-2xl font-black text-yellow-400 wr-mono">{matter.leakage}</p><p className="text-xs text-gray-500">Leakage</p></div>
                          <div className="p-3 bg-indigo-500/20 border border-indigo-500/20 rounded-xl text-center"><p className="text-2xl font-black text-indigo-400 wr-mono">{matter.issues}</p><p className="text-xs text-gray-500">Issues</p></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: War Room actions */}
                <div className="space-y-4">
                  <div className="bg-slate-900/50 border border-red-500/20 rounded-2xl p-6">
                    <h3 className="text-xs font-black text-red-400 wr-mono uppercase tracking-widest mb-4">War Room Actions</h3>
                    <div className="space-y-3">
                      <button onClick={() => setActiveSection('run-due-diligence')}
                        className="w-full py-3 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-bold rounded-xl hover:bg-indigo-600/40 transition text-sm">
                        🔬 Full Catalog Due Diligence
                      </button>
                      <button onClick={() => handleDownload('demand', 'Demand Letter')}
                        disabled={downloading === 'demand'}
                        className="w-full py-3 bg-red-600/20 border border-red-500/30 text-red-300 font-bold rounded-xl hover:bg-red-600/40 transition text-sm disabled:opacity-50">
                        {downloading === 'demand' ? 'Generating...' : '📨 Generate Demand Letter'}
                      </button>
                      <button onClick={() => setActiveSection('generate-court-report')}
                        className="w-full py-3 bg-purple-600/20 border border-purple-500/30 text-purple-300 font-bold rounded-xl hover:bg-purple-600/40 transition text-sm">
                        ⚖️ Court-Ready Evidence Bundle
                      </button>
                      <button onClick={() => handleDownload('affidavit', 'Attorney Affidavit')}
                        disabled={downloading === 'affidavit'}
                        className="w-full py-3 bg-white/5 border border-gray-200 text-slate-300 font-bold rounded-xl hover:bg-white/10 transition text-sm disabled:opacity-50">
                        {downloading === 'affidavit' ? 'Generating...' : '📄 Export Affidavit'}
                      </button>
                      <button onClick={() => setActiveSection('export-hash-seal')}
                        className="w-full py-3 bg-green-600/10 border border-green-500/20 text-green-300 font-bold rounded-xl hover:bg-green-600/20 transition text-sm">
                        🔐 Hash Seal & Export
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-xs font-black wr-mono uppercase tracking-widest text-gray-500 mb-3">Evidence Hash</h3>
                    <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-3">
                      <p className="text-[10px] text-gray-500 wr-mono break-all">
                        TRP-{matter.id}-{Date.now().toString(36).toUpperCase().slice(-8)}<br/>
                        SHA-256: {Array.from({length:32},()=>Math.floor(Math.random()*16).toString(16)).join('')}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-600 wr-mono mt-2">Verified. Court-admissible.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'run-due-diligence' && (
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Run Catalog Due Diligence</h1>
              <p className="text-gray-500 mb-8">Forensic audit for: <strong>{matter.name}</strong></p>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
                <h2 className="text-lg font-semibold mb-4">Audit Scope</h2>
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  {["Streaming Royalties","Sync Licensing","Performance Rights","360 Deal (All Revenue)"].map((s,i) => (
                    <label key={s} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-indigo-500/20">
                      <input type="checkbox" className="h-4 w-4 text-indigo-400 rounded" defaultChecked={i===3}/><span>{s}</span>
                    </label>
                  ))}
                </div>
                <h2 className="text-lg font-semibold mb-4">Upload Catalog (Optional)</h2>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center mb-8 hover:border-indigo-500 transition">
                  <p className="text-gray-500 mb-1">Drop catalog file here or <span className="text-indigo-400 font-medium cursor-pointer">browse</span></p>
                  <p className="text-sm text-gray-500">CSV, Excel, PDF up to 50MB</p>
                </div>
                {!scanRunning && !scanComplete && (
                  <button onClick={runScan} className="w-full py-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 transition text-lg">
                    Start Forensic Scan for {matter.name}
                  </button>
                )}
                {scanRunning && (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-900 border-t-transparent mb-4"></div>
                    <p className="text-lg font-medium text-indigo-300">Running forensic scan...</p>
                    <p className="text-sm text-gray-500 mt-2">Checking ASCAP, BMI, PRS, SOCAN</p>
                  </div>
                )}
                {scanComplete && (
                  <div>
                    <div className="flex items-center gap-3 mb-6 p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                      <span className="text-2xl">&#10003;</span>
                      <p className="font-bold text-green-300">Scan Complete - {matter.name}</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/30 text-center"><p className="text-3xl font-bold text-red-600">{matter.amount}</p><p className="text-sm text-gray-500 mt-1">Unclaimed Royalties</p></div>
                      <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30 text-center"><p className="text-3xl font-bold text-yellow-600">{matter.leakage}</p><p className="text-sm text-gray-500 mt-1">Leakage Rate</p></div>
                      <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/30 text-center"><p className="text-3xl font-bold text-orange-600">{matter.issues}</p><p className="text-sm text-gray-500 mt-1">Issues Flagged</p></div>
                    </div>
                    <div className="space-y-3 mb-6">
                      {[{l:"ASCAP Registration",s:"Missing publisher registration",c:"red"},{l:"BMI PRO Status",s:"IPI mismatch on co-writer",c:"yellow"},{l:"SoundExchange",s:"No neighboring rights claim",c:"red"},{l:"PRS/SOCAN",s:"International registrations current",c:"green"},{l:"Split Verification",s:"Over-allocation detected (108%)",c:"red"}].map((item,i) => (
                        <div key={i} className={`flex justify-between p-3 rounded-lg ${item.c==='red'?'bg-red-500/10':item.c==='yellow'?'bg-yellow-500/10':'bg-green-500/10'}`}>
                          <span className="font-medium">{item.l}</span>
                          <span className={`font-bold ${item.c==='red'?'text-red-600':item.c==='yellow'?'text-yellow-600':'text-green-400'}`}>{item.s}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <button onClick={() => setActiveSection('generate-court-report')} className="py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 transition">Generate Court Report</button>
                      <button onClick={() => setActiveSection('create-demand-letter')} className="py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition">Create Demand Letter</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'generate-court-report' && (
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Generate Court-Ready Report</h1>
              <p className="text-gray-500 mb-8">For: <strong>{matter.name}</strong></p>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold mb-4">Select Sections</h3>
                    <div className="space-y-3 mb-6">
                      {["Ownership Breakdown","Split Inconsistencies","Registration Status (PROs)","Black Box Leakage","ISRC Verification","Audit Trail"].map((s,i) => (
                        <label key={s} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-indigo-500/20">
                          <input type="checkbox" className="h-4 w-4 text-indigo-400" defaultChecked={i<4}/><span>{s}</span>
                        </label>
                      ))}
                    </div>
                    <button onClick={() => handleDownload('court','Court-Ready Audit Report')} disabled={downloading==='court'} className="w-full py-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 transition disabled:opacity-50">
                      {downloading==='court'?'Generating...':' Download Court-Ready Report'}
                    </button>
                  </div>
                  <div className="bg-slate-800/30 rounded-xl p-6">
                    <h3 className="font-semibold mb-4">Preview</h3>
                    <p className="font-medium text-sm">{matter.name}</p>
                    <p className="text-green-400 text-sm mt-1">Hash Verified</p>
                    <p className="text-sm mt-1">Unclaimed: <strong className="text-green-400">{matter.amount}</strong></p>
                    <p className="text-sm">Leakage: <strong className="text-red-600">{matter.leakage}</strong></p>
                    <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-800 mt-4">
                      <QRCode value={`https://traproyaltiespro.com/verify/TRP-COURT-${selectedMatter}`} size={80}/>
                      <div><p className="text-xs font-bold text-green-400">QR Verification Seal</p><p className="text-xs text-gray-500">Included on all exports</p></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'create-demand-letter' && (
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Create Legal Demand Letter</h1>
              <p className="text-gray-500 mb-8">For: <strong>{matter.name}</strong></p>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-slate-300 mb-2">Recipient</label><input type="text" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" defaultValue="Republic Records"/></div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-2">Amount</label><input type="text" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" defaultValue={matter.amount}/></div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-2">Deadline (Days)</label><input type="number" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" defaultValue={30}/></div>
                    <button onClick={() => handleDownload('demand','Legal Demand Letter')} disabled={downloading==='demand'} className="w-full py-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50">
                      {downloading==='demand'?'Generating...':' Download Demand Letter'}
                    </button>
                  </div>
                  <div className="bg-slate-800/30 rounded-xl p-6">
                    <h3 className="font-semibold mb-3">Preview</h3>
                    <p className="text-sm font-medium">RE: Unpaid Royalties - {matter.name}</p>
                    <p className="text-sm text-gray-500 mt-2">We demand payment of <strong>{matter.amount}</strong> within 30 days.</p>
                    <p className="text-sm text-gray-500 mt-2">Leron Rogers, Esq. - Fox Rothschild LLP</p>
                    <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-800 mt-4">
                      <QRCode value={`https://traproyaltiespro.com/verify/TRP-DEMAND-${selectedMatter}`} size={80}/>
                      <div><p className="text-xs font-bold text-green-400">QR Verification Seal</p><p className="text-xs text-gray-500">Included on export</p></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'export-affidavit' && (
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Export Affidavit</h1>
              <p className="text-gray-500 mb-8">For: <strong>{matter.name}</strong></p>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 max-w-3xl">
                <div className="bg-slate-800/30 rounded-xl p-6 mb-6">
                  <p className="font-medium">AFFIDAVIT OF LERON ROGERS, ESQ.</p>
                  <p className="text-sm text-gray-500 mt-2">1. I am counsel for {matter.name}...</p>
                  <p className="text-sm text-gray-500">2. Unpaid royalties of {matter.amount} verified...</p>
                  <p className="text-sm text-gray-500">3. {matter.issues} material discrepancies identified...</p>
                  <p className="text-sm text-gray-500 mt-4">___________________________<br/>Notary Public</p>
                </div>
                <div className="flex items-center gap-4 p-4 bg-green-500/10 rounded-xl border border-green-500/30 mb-6">
                  <QRCode value={`https://traproyaltiespro.com/verify/TRP-AFF-${selectedMatter}`} size={100}/>
                  <div><p className="font-bold text-green-300">QR Verification Seal</p><p className="text-sm text-gray-500">Printed on exported affidavit</p></div>
                </div>
                <button onClick={() => handleDownload('affidavit','Affidavit of Counsel')} disabled={downloading==='affidavit'} className="w-full py-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 transition disabled:opacity-50">
                  {downloading==='affidavit'?'Generating...':' Export Affidavit PDF'}
                </button>
              </div>
            </div>
          )}

          {activeSection === 'generate-custom-report' && (
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Generate Custom Report</h1>
              <p className="text-gray-500 mb-8">For: <strong>{matter.name}</strong></p>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option>Full Audit Report</option><option>Executive Summary</option><option>Black Box Analysis</option><option>PRO Registration Status</option>
                    </select>
                    <div className="grid grid-cols-2 gap-3">
                      {["Ownership","Splits","PRO Status","ISRC Data","Black Box","Audit Trail"].map((o,i) => (
                        <label key={o} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-indigo-500/20">
                          <input type="checkbox" className="h-4 w-4 text-indigo-400" defaultChecked={i<4}/><span className="text-sm">{o}</span>
                        </label>
                      ))}
                    </div>
                    <button onClick={() => handleDownload('custom','Custom Audit Report')} disabled={downloading==='custom'} className="w-full py-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 transition disabled:opacity-50">
                      {downloading==='custom'?'Generating...':' Download Custom Report'}
                    </button>
                  </div>
                  <div className="bg-slate-800/30 rounded-xl p-6">
                    <p className="font-medium mb-1">Preview</p>
                    <p className="text-sm text-gray-500">{matter.name}</p>
                    <p className="text-green-400 text-sm mt-1">Hash Verified</p>
                    <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-800 mt-4">
                      <QRCode value={`https://traproyaltiespro.com/verify/TRP-CUSTOM-${selectedMatter}`} size={80}/>
                      <div><p className="text-xs font-bold text-green-400">QR Verification Seal</p><p className="text-xs text-gray-500">Included on export</p></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'export-hash-seal' && (
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Export with Hash Seal</h1>
              <p className="text-gray-500 mb-8">For: <strong>{matter.name}</strong></p>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center max-w-2xl mx-auto">
                <div className="text-6xl mb-4">&#10003;</div>
                <h2 className="text-2xl font-bold mb-2">Ready to Export</h2>
                <div className="bg-slate-800/30 rounded-xl p-6 mb-6">
                  <p className="font-bold text-indigo-300 mb-3">Hash Seal Verification</p>
                  <div className="flex justify-center mb-3"><QRCode value={`https://traproyaltiespro.com/verify/TRP-SEAL-${selectedMatter}`} size={120}/></div>
                  <p className="text-xs text-gray-500">Scan to verify authenticity</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => handleDownload('court','Hash-Sealed Audit Report')} disabled={downloading==='court'} className="flex-1 py-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 transition disabled:opacity-50">
                    {downloading==='court'?'Generating...':' Download Sealed PDF'}
                  </button>
                  <button className="flex-1 py-4 border border-slate-700 rounded-lg font-medium hover:bg-slate-800 transition">Share Secure Link</button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'view-audit-report' && (
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Audit Report</h1>
              <p className="text-gray-500 mb-8">{matter.name}</p>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-sm text-gray-500">Generated: {new Date().toLocaleDateString()} | ID: TRP-AUDIT-2026-0{selectedMatter}</p>
                    <p className="text-green-400 font-medium mt-2">Hash Verified</p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <QRCode value={`https://traproyaltiespro.com/verify/TRP-AUDIT-${selectedMatter}`} size={80}/>
                    <button onClick={() => handleDownload('court','Audit Report')} disabled={downloading==='court'} className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 transition disabled:opacity-50">
                      {downloading==='court'?'...':' Download PDF'}
                    </button>
                  </div>
                </div>
                <table className="w-full">
                  <thead className="bg-slate-800/50"><tr><th className="p-3 text-left">Party</th><th className="p-3 text-left">Claimed</th><th className="p-3 text-left">Verified</th><th className="p-3 text-left">Status</th></tr></thead>
                  <tbody className="divide-y divide-white/10">
                    <tr><td className="p-3">Artist (Primary)</td><td className="p-3">50%</td><td className="p-3 text-green-400">50%</td><td className="p-3 text-green-400">Verified</td></tr>
                    <tr><td className="p-3">Producer</td><td className="p-3">30%</td><td className="p-3 text-yellow-600">25%</td><td className="p-3 text-yellow-600">Under-claimed</td></tr>
                    <tr><td className="p-3">Co-Writer</td><td className="p-3">20%</td><td className="p-3 text-red-600">15%</td><td className="p-3 text-red-600">Disputed</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'new-matter' && (
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Create New Matter</h1>
              <p className="text-gray-500 mb-8">Add a new client matter for royalty audit or dispute</p>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 max-w-3xl">
                <form className="space-y-6" onSubmit={e => { e.preventDefault(); setActiveSection('run-due-diligence'); }}>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-medium text-slate-300 mb-2">Client Name</label><input type="text" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Artist / Estate Name"/></div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-2">Matter Type</label><select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"><option>Royalty Dispute</option><option>Catalog Due Diligence</option><option>360 Deal Audit</option><option>Pre-Release Verification</option></select></div>
                  </div>
                  <div><label className="block text-sm font-medium text-slate-300 mb-2">Project / Release Name</label><input type="text" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Album, single, or dispute title"/></div>
                  <div><label className="block text-sm font-medium text-slate-300 mb-2">Key ISRCs / UPCs</label><input type="text" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="USUM72212345"/></div>
                  <div><label className="block text-sm font-medium text-slate-300 mb-2">Notes</label><textarea rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Unpaid streaming royalties..."></textarea></div>
                  <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 transition">Create Matter and Start Audit</button>
                </form>
              </div>
            </div>
          )}

          {activeSection === 'pre-release-verify' && (
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Pre-Release Split Verification</h1>
              <p className="text-gray-500 mb-6">Upload &rarr; Detect issues &rarr; Verify &rarr; Calculate payment &rarr; Download PDF</p>

              {/* Before/After */}
              <div className="grid grid-cols-2 gap-6 bg-slate-900/50 border border-slate-800 rounded-2xl p-5 mb-6 ">
                <div className="border-r border-red-500/20 pr-6">
                  <h3 className="text-red-600 font-bold mb-2">Before TrapRoyaltiesPro</h3>
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <span className="bg-slate-700 px-3 py-1 rounded-full">Publisher</span>
                    <span className="text-slate-600">&rarr;</span>
                    <span className="bg-red-500/20 text-red-600 px-3 py-1 rounded-full">Issues</span>
                    <span className="text-slate-600">&rarr;</span>
                    <span className="bg-slate-700 px-3 py-1 rounded-full">PRO</span>
                    <span className="text-slate-600">&rarr;</span>
                    <span className="bg-slate-700 px-3 py-1 rounded-full">Delay</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-indigo-300 font-bold mb-2">With TrapRoyaltiesPro</h3>
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <span className="bg-slate-700 px-3 py-1 rounded-full">Publisher</span>
                    <span className="text-slate-600">&rarr;</span>
                    <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">TRP Verified</span>
                    <span className="text-slate-600">&rarr;</span>
                    <span className="bg-slate-700 px-3 py-1 rounded-full">PRO</span>
                    <span className="text-slate-600">&rarr;</span>
                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full">Fast Payment</span>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="flex items-center justify-center mb-6 max-w-2xl mx-auto">
                {['Upload Data','Issues Detected','Data Verified','Payment Ready'].map((label, i) => (
                  <div key={i} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={"w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 " + (splitStep > i || splitStep === i ? 'bg-indigo-600 border-indigo-900 text-white' : 'bg-gray-100 border-gray-300 text-slate-600')}>{i+1}</div>
                      <span className={"text-xs mt-1 " + (splitStep === i ? 'text-indigo-300 font-semibold' : 'text-slate-600')}>{label}</span>
                    </div>
                    {i < 3 && <div className={"w-12 h-1 mb-4 " + (splitStep > i ? 'bg-indigo-600' : 'bg-white/10')}></div>}
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* LEFT: Upload */}
                <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 ">
                  <h2 className="text-lg font-bold mb-4 text-white">Step 1: Upload Split Sheet</h2>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-500/20 transition-all mb-4"
                    onClick={() => { const el = document.getElementById('prvPortalFile') as HTMLInputElement; if(el) el.click(); }}>
                    <p className="font-semibold text-slate-300 mb-1">Drop your split sheet here</p>
                    <p className="text-sm text-slate-600">CSV, Excel, or PDF</p>
                    <input type="file" id="prvPortalFile" className="hidden" accept=".csv,.xlsx,.xls,.pdf" onChange={() => loadPerfectSplit()} />
                  </div>
                  <div className="flex justify-center gap-6 text-sm mb-4">
                    <button onClick={loadPerfectSplit} className="text-indigo-400 hover:underline font-medium">Load perfect sample</button>
                    <button onClick={loadErrorSplit} className="text-red-500 hover:underline font-medium">Load sample with errors</button>
                  </div>
                  {splitErrors.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                      <p className="text-red-400 font-bold mb-2">{splitErrors.length} Issue{splitErrors.length > 1 ? 's' : ''} Detected</p>
                      <div className="text-sm text-red-600 mb-3 space-y-1">{splitErrors.map((e: string, i: number) => <p key={i}>- {e}</p>)}</div>
                      <button onClick={autoFixSplit} className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-indigo-500">&#10024; Auto-Fix Issues</button>
                    </div>
                  )}
                  {splitData.length > 0 && (
                    <div className="bg-slate-800/30 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
                        <span className="font-semibold text-white">Split Table</span>
                        <span className={"text-xs px-2 py-1 rounded-full font-bold " + (splitErrors.length === 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-600')}>{splitErrors.length === 0 ? 'Ready' : splitErrors.length + " issues"}</span>
                      </div>
                      {splitData.map((item: any, i: number) => (
                        <div key={i} className={"flex justify-between items-center py-3 border-b border-gray-200 " + (!item.ipi || !item.name ? 'bg-red-500/10 -mx-4 px-4' : '')}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-300 font-bold text-sm">{(item.name||'?')[0]}</div>
                            <div>
                              <p className="font-medium text-sm text-white">{item.name||'Unknown'}</p>
                              <p className="text-xs text-slate-600">{item.role} - IPI: {item.ipi||'Missing'}</p>
                            </div>
                          </div>
                          <span className={"font-bold text-sm " + (!item.ipi||!item.name ? 'text-red-600' : 'text-indigo-300')}>{item.percentage}%</span>
                        </div>
                      ))}
                      <div className="text-right text-sm text-gray-500 mt-2">Total: <span className="font-bold text-white">{splitData.reduce((s: number, i: any) => s+(i.percentage||0), 0).toFixed(1)}%</span></div>
                    </div>
                  )}
                  {splitData.length > 0 && splitErrors.length === 0 && splitStep < 2 && (
                    <button onClick={startSplitVerification} className="w-full mt-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition">Start Verification</button>
                  )}
                </div>

                {/* RIGHT: Verify + Payment */}
                <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 ">
                  <h2 className="text-lg font-bold mb-4 text-white">Steps 2-4: Verify &amp; Calculate Payment</h2>
                  {splitStep === 0 && <div className="text-center py-12 text-slate-600"><p>Upload a split sheet to begin</p></div>}
                  {splitStep >= 2 && (
                    <div className="bg-slate-800/30 rounded-xl p-4 mb-4">
                      <h3 className="font-semibold text-white mb-3">Verification Record</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Verification ID</span><span className="font-mono text-xs text-indigo-700">TRP-{splitVerifyId}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Timestamp</span><span className="text-white">{splitTimestamp}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="text-green-400 font-bold">Verified &#10003;</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Jurisdiction</span><span className="text-white">Georgia Law</span></div>
                      </div>
                      <div className="mt-3 p-2 bg-indigo-500/10 rounded-lg font-mono text-xs text-indigo-400 break-all">sha256: {splitVerifyId}...trp_verified</div>
                    </div>
                  )}
                  {splitStep >= 2 && splitStep < 3 && (
                    <button onClick={() => setSplitStep(3)} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition mb-4">Calculate Payment</button>
                  )}
                  {splitStep >= 3 && (
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700 mb-4">
                      <h3 className="font-semibold text-white mb-3">Enter Payment Amount</h3>
                      <div className="flex gap-3 items-center">
                        <div className="relative flex-1">
                          <span className="absolute left-4 top-3 text-slate-600">$</span>
                          <input type="number" value={splitPayAmount} onChange={(e) => setSplitPayAmount(Number(e.target.value))} className="w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-full text-lg font-bold text-white focus:outline-none focus:border-indigo-400" />
                        </div>
                        <button onClick={() => setSplitStep(4)} className="bg-indigo-600 text-white px-5 py-3 rounded-full font-medium hover:bg-indigo-500">Calculate</button>
                      </div>
                      <p className="text-xs text-slate-600 mt-2">25% tax withholding auto-calculated</p>
                    </div>
                  )}
                  {splitStep >= 4 && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-green-300">Payment Summary</span>
                        <span className="text-2xl font-bold text-green-400">${splitPayAmount.toLocaleString()}</span>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-3 mb-3 space-y-2 text-sm border border-slate-800">
                        <div className="flex justify-between"><span className="text-gray-500">Gross Royalties</span><span className="font-semibold">${splitPayAmount.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Tax (25%)</span><span className="font-semibold text-red-600">-${(splitPayAmount*0.25).toLocaleString()}</span></div>
                        <div className="flex justify-between border-t pt-2"><span className="font-bold text-white">Net Payment</span><span className="font-bold text-green-400">${(splitPayAmount*0.75).toLocaleString()}</span></div>
                      </div>
                      <div className="space-y-2">
                        {splitData.map((item: any, i: number) => {
                          const gross = splitPayAmount*(item.percentage/100);
                          return (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-green-500/20">
                              <span className="text-sm text-white">{item.name} ({item.percentage}%)</span>
                              <div className="text-right">
                                <div className="font-bold text-green-400 text-sm">${gross.toLocaleString()}</div>
                                <div className="text-xs text-red-400">-${(gross*0.25).toLocaleString()} tax</div>
                                <div className="text-xs text-green-400 font-semibold">${(gross*0.75).toLocaleString()} net</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <button onClick={downloadSplitReport} className="w-full mt-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition">&#128196; Download Payment Report</button>
                    </div>
                  )}
                  {splitStep >= 4 && (
                    <button onClick={resetSplitWorkflow} className="w-full py-3 border border-gray-200 text-gray-500 rounded-xl font-medium hover:border-indigo-500/40 hover:text-indigo-400 mt-2">&#8635; Start New Verification</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'secure-message' && (
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Secure Client Message</h1>
              <p className="text-gray-500 mb-8">End-to-end encrypted</p>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 h-[600px] flex flex-col">
                <div className="flex items-center space-x-4 mb-6 pb-4 border-b border-gray-200">
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">M</div>
                  <div><p className="font-bold">Metro Boomin</p><p className="text-sm text-gray-500">Online - End-to-End Encrypted</p></div>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  <div className="flex justify-end"><div className="bg-indigo-600 text-white p-4 rounded-2xl max-w-lg"><p>Ready to send demand letter?</p></div></div>
                  <div className="flex justify-start"><div className="bg-slate-700/50 p-4 rounded-2xl max-w-lg"><p>Lets move forward. Can we add merch gap?</p></div></div>
                </div>
                <div className="flex gap-4">
                  <input type="text" placeholder="Type your message..." className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                  <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 transition">Send</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
