"use client";

import { useState } from 'react';
import Link from 'next/link';

const TODAY = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const PILLARS = [
  {
    icon: '💰',
    title: 'One-Time Onboarding',
    amount: '$5,000',
    color: 'from-indigo-500 to-purple-600',
    items: [
      'Full catalog migration & import',
      'Custom API integration setup',
      'Legal team onboarding (90-min session)',
      'White-label configuration',
      'Priority technical support (30 days)',
    ],
  },
  {
    icon: '📅',
    title: 'Monthly Platform Access',
    amount: '$500 / mo',
    color: 'from-purple-500 to-pink-600',
    items: [
      'Unlimited users & catalog size',
      'Full API access (unlimited requests)',
      'Attorney Portal + War Room',
      'Label Command Center',
      'DDEX distribution packages',
    ],
  },
  {
    icon: '⚡',
    title: 'Success Fee',
    amount: '5%',
    color: 'from-green-500 to-emerald-600',
    items: [
      'Applied only to recovered royalties',
      'Never on existing revenue streams',
      'Calculated on net new collections',
      'Transparent monthly statement',
      'Fully auditable by your team',
    ],
  },
];

const TIMELINE = [
  { day: 'Day 1',   icon: '📋', title: 'MSA Executed',         desc: 'Both parties sign the Master Services Agreement. Onboarding fee collected.' },
  { day: 'Day 2',   icon: '🔧', title: 'Integration Setup',    desc: 'API credentials issued. Catalog import begins. White-label domain configured.' },
  { day: 'Day 5',   icon: '📊', title: 'First Audit Report',   desc: 'Initial catalog audit delivered. Risk scores, missing revenue estimates, and priority action list.' },
  { day: 'Day 14',  icon: '⚖️', title: 'Attorney Onboarding',  desc: 'Legal team trained on War Room, contract analysis, and LOD generation.' },
  { day: 'Day 30',  icon: '💸', title: 'First Settlement',     desc: 'Settlement Rails active. First recovered royalties distributed to artists.' },
  { day: 'Day 90',  icon: '🚀', title: 'Full Deployment',      desc: 'All features live. Ongoing success fee billing begins on net new collections.' },
];

const SECTIONS = [
  {
    num: '1',
    title: 'Services',
    body: `TrapRoyaltiesPro ("Provider") agrees to provide the following services to the Partner Label ("Client") under this Master Services Agreement ("Agreement"):\n\n(a) Catalog Audit Engine — cross-referencing 15+ databases to identify metadata errors, missing registrations, and ownership discrepancies.\n\n(b) Attorney Portal — Mission Control dashboard with War Room overlay, contract intake, dispute triage, and automated Letter of Demand generation.\n\n(c) Label Command Center — enterprise dashboard with KPI reporting, conflict heatmap, settlement rails, and immutable royalty ledger.\n\n(d) Digital Handshake — legally-binding e-signature system for producer deals, feature agreements, and split contracts.\n\n(e) DDEX Distribution — ERN 3.8.2 and 4.1 compliant XML package generation and DSP metadata correction submissions.\n\n(f) Settlement Rails — T+0 payment infrastructure for artist royalty distribution, bypassing standard 60-90 day distributor timelines.`,
  },
  {
    num: '2',
    title: 'Fees & Payment Terms',
    body: `2.1 Onboarding Fee. Client agrees to pay a one-time, non-refundable onboarding fee of Five Thousand Dollars ($5,000.00) upon execution of this Agreement. This fee covers catalog migration, API integration, white-label configuration, and the initial 90-minute legal team training session.\n\n2.2 Monthly Platform Fee. Beginning on the first day of the calendar month following execution, Client agrees to pay Five Hundred Dollars ($500.00) per month for continued platform access. Monthly fees are billed on the first (1st) of each month and are due Net-15.\n\n2.3 Success Fee. Provider shall receive five percent (5%) of all royalties recovered through Provider's dispute resolution, metadata correction, or royalty finder services that would not have been collected absent Provider's intervention ("Recovered Royalties"). Success fees are calculated monthly and invoiced within five (5) business days of month close. Client has fifteen (15) days to dispute any success fee calculation.\n\n2.4 Late Payment. Unpaid invoices accrue interest at 1.5% per month after the due date. Provider reserves the right to suspend service after thirty (30) days of non-payment with ten (10) days written notice.`,
  },
  {
    num: '3',
    title: 'Term & Termination',
    body: `3.1 Initial Term. This Agreement commences on the Effective Date and continues for an initial term of twelve (12) months ("Initial Term").\n\n3.2 Renewal. Following the Initial Term, this Agreement automatically renews for successive twelve (12) month periods unless either party provides written notice of non-renewal at least sixty (60) days before the end of the current term.\n\n3.3 Termination for Cause. Either party may terminate this Agreement immediately upon written notice if the other party: (a) materially breaches this Agreement and fails to cure such breach within thirty (30) days of written notice; (b) becomes insolvent or files for bankruptcy; or (c) engages in fraud, willful misconduct, or illegal activity.\n\n3.4 Effect of Termination. Upon termination, Client retains all audit reports, signed contracts, and exported data generated during the term. Provider will provide a full data export within fifteen (15) business days of termination. Success fees accrued through the termination date remain payable.`,
  },
  {
    num: '4',
    title: 'Intellectual Property & Data Ownership',
    body: `4.1 Client IP. All music, contracts, metadata, and financial records uploaded by Client remain the sole property of Client. Provider acquires no intellectual property rights, ownership interests, or licenses beyond what is strictly necessary to deliver the services described in Section 1.\n\n4.2 Provider IP. The Provider's software, algorithms, audit methodology, database connections, and proprietary processes remain the exclusive property of Provider. Client receives a limited, non-exclusive, non-transferable license to use the platform for the duration of this Agreement.\n\n4.3 Data Use. Provider shall not use Client's catalog data, financial data, or contract data for any purpose other than delivering the services described herein. Provider shall not use Client's data to train machine learning models, sell to third parties, or for competitive analysis.\n\n4.4 Aggregated Data. Provider may use anonymized, aggregated, non-personally-identifiable data derived from platform usage for product improvement, industry benchmarking, and marketing purposes, provided that no individual artist, track, or financial figure is identifiable.`,
  },
  {
    num: '5',
    title: 'Confidentiality',
    body: `5.1 Confidential Information. Each party ("Receiving Party") agrees to hold in strict confidence all non-public information disclosed by the other party ("Disclosing Party") in connection with this Agreement ("Confidential Information"), including but not limited to: catalog valuations, royalty statements, contract terms, dispute strategies, artist financial data, and proprietary technology.\n\n5.2 Non-Disclosure. The Receiving Party shall not disclose Confidential Information to any third party without the prior written consent of the Disclosing Party, except to employees or contractors who have a need to know and are bound by confidentiality obligations no less protective than those in this Agreement.\n\n5.3 Term. Confidentiality obligations survive termination of this Agreement for a period of five (5) years.\n\n5.4 Exceptions. Confidentiality obligations do not apply to information that: (a) is or becomes publicly available through no fault of the Receiving Party; (b) was rightfully known before disclosure; (c) is independently developed; or (d) must be disclosed by law, regulation, or court order.`,
  },
  {
    num: '6',
    title: 'Representations & Warranties',
    body: `6.1 Provider Representations. Provider represents and warrants that: (a) it has the right and authority to enter into this Agreement; (b) the platform and services do not infringe any third-party intellectual property rights; (c) audit reports are generated using commercially reasonable, good-faith methodology; and (d) Provider maintains adequate cybersecurity measures consistent with industry standards.\n\n6.2 Client Representations. Client represents and warrants that: (a) it has the right and authority to enter into this Agreement; (b) all catalog data, contracts, and financial records uploaded to the platform are owned by or licensed to Client; and (c) Client will not use the platform for any unlawful purpose.\n\n6.3 Disclaimer. EXCEPT AS EXPRESSLY SET FORTH IN THIS SECTION, PROVIDER MAKES NO WARRANTIES, EXPRESS OR IMPLIED, INCLUDING ANY IMPLIED WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE. AUDIT REPORTS ARE ADVISORY IN NATURE AND DO NOT CONSTITUTE LEGAL ADVICE.`,
  },
  {
    num: '7',
    title: 'Limitation of Liability',
    body: `7.1 Cap on Liability. IN NO EVENT SHALL EITHER PARTY'S AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT EXCEED THE TOTAL FEES PAID BY CLIENT TO PROVIDER IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.\n\n7.2 Exclusion of Consequential Damages. NEITHER PARTY SHALL BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES, INCLUDING LOST PROFITS, LOSS OF DATA, OR LOSS OF BUSINESS, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.\n\n7.3 Exceptions. The limitations in Sections 7.1 and 7.2 do not apply to: (a) breaches of confidentiality obligations; (b) indemnification obligations; (c) fraud or willful misconduct; or (d) Client's obligation to pay fees.`,
  },
  {
    num: '8',
    title: 'Governing Law & Dispute Resolution',
    body: `8.1 Governing Law. This Agreement shall be governed by and construed in accordance with the laws of the State of Georgia, without regard to its conflict of law principles.\n\n8.2 Dispute Resolution. The parties agree to first attempt to resolve any dispute through good-faith negotiation between senior representatives. If negotiation fails within thirty (30) days, disputes shall be submitted to binding arbitration administered by the American Arbitration Association ("AAA") under its Commercial Arbitration Rules, with proceedings conducted in Atlanta, Georgia.\n\n8.3 Injunctive Relief. Notwithstanding Section 8.2, either party may seek emergency injunctive or equitable relief from a court of competent jurisdiction in Fulton County, Georgia to prevent irreparable harm.\n\n8.4 Prevailing Party. The prevailing party in any arbitration or litigation arising from this Agreement shall be entitled to recover reasonable attorneys' fees and costs.`,
  },
];

export default function PartnershipPage() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [showPrint, setShowPrint] = useState(false);

  const toggle = (num: string) => setOpenSection(prev => prev === num ? null : num);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.45s ease both; }
        .section-body {
          overflow: hidden;
          transition: max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease;
        }
        .section-body.open   { max-height: 1200px; opacity: 1; }
        .section-body.closed { max-height: 0;      opacity: 0; }
        @media print {
          .no-print { display: none !important; }
          .print-full { max-height: none !important; opacity: 1 !important; }
          body { background: white !important; }
          .page-break { page-break-before: always; }
        }
      `}</style>

      {/* Hero */}
      <div className="bg-[#0f172a] text-white py-16 no-print">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-block bg-indigo-600/20 border border-indigo-500/30 rounded-full px-4 py-1 text-indigo-300 text-sm font-medium mb-6">
            ENTERPRISE PARTNERSHIP AGREEMENT
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Master Services Agreement</h1>
          <p className="text-xl text-slate-300 mb-6">TrapRoyaltiesPro × Partner Label</p>
          <div className="flex flex-wrap gap-3 justify-center text-sm">
            <span className="bg-[#1e293b]/10 rounded-full px-4 py-2">$5,000 Onboarding</span>
            <span className="bg-[#1e293b]/10 rounded-full px-4 py-2">$500 / Month</span>
            <span className="bg-[#1e293b]/10 rounded-full px-4 py-2">5% Success Fee</span>
            <span className="bg-green-500/20 border border-green-500/30 text-green-300 rounded-full px-4 py-2">Effective {TODAY}</span>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="bg-[#1e293b] border-b border-white/10 sticky top-0 z-10 shadow-sm no-print">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-slate-300 mr-2">Partnership Agreement — 5 / 500 Model</span>
          <div className="ml-auto flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-[#0f172a] hover:bg-[#1e293b] text-slate-300 rounded-xl text-sm font-medium transition"
            >
              🖨️ Print / Save PDF
            </button>
            <Link href="/attorney-portal#digital-handshake"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition"
            >
              ✍️ Sign Agreement
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* 5/500 Pillars */}
        <div className="fade-up grid md:grid-cols-3 gap-6 mb-16">
          {PILLARS.map((p, i) => (
            <div key={i} className="bg-[#1e293b] rounded-2xl shadow-xl border border-white/5 overflow-hidden">
              <div className={`bg-gradient-to-r ${p.color} p-6 text-white text-center`}>
                <div className="text-4xl mb-2">{p.icon}</div>
                <div className="text-2xl font-black mb-1">{p.amount}</div>
                <div className="text-sm font-medium opacity-90">{p.title}</div>
              </div>
              <ul className="p-5 space-y-2">
                {p.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Value proposition banner */}
        <div className="fade-up mb-16 bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl p-8 text-white">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-black text-green-400 mb-1">$142,000+</div>
              <div className="text-sm text-indigo-300">Average recovered per label in Year 1</div>
            </div>
            <div>
              <div className="text-3xl font-black text-yellow-400 mb-1">48 hrs</div>
              <div className="text-sm text-indigo-300">Average time to first audit report</div>
            </div>
            <div>
              <div className="text-3xl font-black text-pink-400 mb-1">50%</div>
              <div className="text-sm text-indigo-300">Reduction in dispute resolution time</div>
            </div>
          </div>
        </div>

        {/* Onboarding Timeline */}
        <div className="fade-up mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Onboarding Timeline</h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-300 to-purple-300 hidden md:block" />
            <div className="space-y-4">
              {TIMELINE.map((t, i) => (
                <div key={i} className="relative flex gap-6 items-start">
                  <div className="flex-shrink-0 w-16 h-16 bg-[#1e293b] border-2 border-indigo-500/30 rounded-2xl flex flex-col items-center justify-center shadow-md z-10">
                    <span className="text-xl">{t.icon}</span>
                    <span className="text-xs font-bold text-indigo-600">{t.day}</span>
                  </div>
                  <div className="bg-[#1e293b] rounded-2xl border border-white/5 shadow-md p-5 flex-1">
                    <div className="font-bold text-white mb-1">{t.title}</div>
                    <div className="text-sm text-slate-400">{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Agreement sections */}
        <div className="fade-up mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Agreement Terms</h2>
            <button
              onClick={() => {
                const allNums = SECTIONS.map(s => s.num);
                const allOpen = allNums.every(n => n === openSection || openSection === 'all');
                if (openSection === 'all') {
                  setOpenSection(null);
                } else {
                  setOpenSection('all');
                }
              }}
              className="text-sm text-indigo-600 underline hover:text-indigo-800"
            >
              {openSection === 'all' ? 'Collapse all' : 'Expand all sections'}
            </button>
          </div>
          <div className="space-y-3">
            {SECTIONS.map(s => {
              const isOpen = openSection === s.num || openSection === 'all';
              return (
                <div key={s.num} className={`bg-[#1e293b] rounded-2xl shadow-md border overflow-hidden transition-all duration-200 ${isOpen ? 'border-indigo-500/30' : 'border-white/5'}`}>
                  <button
                    onClick={() => toggle(s.num)}
                    className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-[#0a0f1e] transition-colors"
                  >
                    <span className="flex-shrink-0 w-8 h-8 bg-indigo-900/30 text-indigo-700 rounded-lg flex items-center justify-center text-sm font-black">
                      {s.num}
                    </span>
                    <span className="font-semibold text-white flex-1">{s.title}</span>
                    <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${isOpen ? 'bg-indigo-600 text-white rotate-45' : 'bg-[#0f172a] text-slate-500'}`}>
                      +
                    </span>
                  </button>
                  <div className={`section-body ${isOpen ? 'open' : 'closed'} ${openSection === 'all' ? 'print-full' : ''}`}>
                    <div className="px-6 pb-6 border-t border-white/5 pt-4">
                      {s.body.split('\n\n').map((para, pi) => (
                        <p key={pi} className="text-slate-400 text-sm leading-relaxed mb-3 last:mb-0">{para}</p>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Signature block */}
        <div className="fade-up mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Signature Page</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Provider */}
            <div className="bg-[#1e293b] rounded-2xl shadow-xl border border-white/5 p-8">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Service Provider</div>
              <div className="text-xl font-black text-white mb-1">TrapRoyaltiesPro</div>
              <div className="text-sm text-slate-500 mb-8">support@traproyaltiespro.com</div>
              <div className="border-t-2 border-white/20 pt-4 mb-2">
                <div className="h-12 flex items-end">
                  <span className="text-slate-400 text-sm italic">Authorized Signature</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Printed Name</div>
                  <div className="border-b border-white/10 h-8" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Date</div>
                  <div className="border-b border-white/10 h-8" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-xs text-slate-500 mb-1">Title</div>
                <div className="border-b border-white/10 h-8" />
              </div>
            </div>

            {/* Client */}
            <div className="bg-[#1e293b] rounded-2xl shadow-xl border border-indigo-500/30 p-8">
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">Partner Label (Client)</div>
              <div className="text-xl font-black text-white mb-1">_________________________</div>
              <div className="text-sm text-slate-500 mb-8">Label Name / Company</div>
              <div className="border-t-2 border-indigo-300 pt-4 mb-2">
                <div className="h-12 flex items-end">
                  <span className="text-slate-400 text-sm italic">Authorized Signature</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Printed Name</div>
                  <div className="border-b border-white/10 h-8" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Date</div>
                  <div className="border-b border-white/10 h-8" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-xs text-slate-500 mb-1">Title / Position</div>
                <div className="border-b border-white/10 h-8" />
              </div>
            </div>
          </div>

          {/* Digital signature CTA */}
          <div className="mt-8 text-center">
            <Link
              href="/attorney-portal#digital-handshake"
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:scale-105 transition-transform duration-200 shadow-xl"
            >
              <span className="text-2xl">✍️</span>
              Execute Agreement Digitally
              <span className="text-sm font-normal bg-[#1e293b]/20 rounded-full px-3 py-1">SHA-256 verified</span>
            </Link>
            <p className="text-slate-500 text-sm mt-3">Blockchain timestamped · Court-admissible · E-SIGN Act compliant</p>
          </div>
        </div>

        {/* Footer quick facts */}
        <div className="fade-up grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '📍', label: 'Governing Law',   value: 'Georgia, USA' },
            { icon: '⏱️', label: 'Initial Term',    value: '12 Months' },
            { icon: '💼', label: 'Arbitration',     value: 'AAA — Atlanta' },
            { icon: '🔐', label: 'Data Standard',   value: 'SOC 2 Type II' },
          ].map(f => (
            <div key={f.label} className="bg-[#1e293b] rounded-xl p-4 shadow-md border border-white/5 text-center">
              <div className="text-2xl mb-1">{f.icon}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">{f.label}</div>
              <div className="font-bold text-white text-sm">{f.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

