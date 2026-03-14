"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const CATEGORIES = [
  { id: 'general',   label: 'General',           icon: '💡' },
  { id: 'attorneys', label: 'For Attorneys',      icon: '⚖️' },
  { id: 'labels',    label: 'For Labels',         icon: '🏢' },
  { id: 'audit',     label: 'Audit Engine',       icon: '🔍' },
  { id: 'technical', label: 'Technical',          icon: '⚙️' },
  { id: 'legal',     label: 'Legal & Security',   icon: '🔐' },
  { id: 'pricing',   label: 'Pricing & Plans',    icon: '💎' },
  { id: 'ddex',      label: 'DDEX Distribution',  icon: '🌐' },
];

type CategoryId = 'general' | 'attorneys' | 'labels' | 'audit' | 'technical' | 'legal' | 'pricing' | 'ddex';

const FAQ_DATA: Record<CategoryId, { q: string; a: string }[]> = {
  general: [
    {
      q: 'What is TrapRoyaltiesPro?',
      a: 'TrapRoyaltiesPro is an enterprise-grade music rights management platform built specifically for independent artists, producers, labels, and entertainment attorneys. We provide catalog auditing, royalty recovery, digital contract signing, split verification, and DDEX distribution — all in one unified system backed by blockchain timestamps and court-admissible documentation.',
    },
    {
      q: 'Who is this platform designed for?',
      a: 'Our platform serves four primary user groups: (1) Independent artists and producers who need to protect and monetize their catalog, (2) Record labels managing multi-artist rosters with complex royalty splits, (3) Entertainment attorneys handling contract disputes, royalty litigation, and rights enforcement, and (4) Music distributors and publishers who need DDEX-compliant metadata delivery.',
    },
    {
      q: 'How is TrapRoyaltiesPro different from other music platforms?',
      a: 'Most music platforms focus on distribution or streaming analytics. We focus on rights protection and revenue recovery. Our audit engine cross-references 15+ databases including MusicBrainz, SoundExchange, and PRO registries. Every report is designed to meet Federal Rules of Evidence standards (FRE 901), making them usable in actual legal proceedings. We also provide real-time conflict detection, automated dispute letters, and T+0 settlement rails — features no standard distributor offers.',
    },
    {
      q: 'Do I need technical knowledge to use the platform?',
      a: 'No. The platform is designed for music professionals, not engineers. Uploading a catalog, running an audit, or signing a digital contract takes minutes with our step-by-step interface. That said, our API is available for labels and distributors who want to integrate directly with their existing systems.',
    },
    {
      q: 'Is my data secure?',
      a: 'Yes. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Contracts and signed documents are hashed using SHA-256 and timestamped on-chain. We maintain SOC 2 Type II compliance and never sell user data to third parties. Your catalog metadata and financial data are yours — we are a service provider, not a rights holder.',
    },
    {
      q: 'Can I try the platform before paying?',
      a: 'Yes. We offer a free catalog audit for up to 25 tracks, a free digital handshake for one agreement, and a read-only demo of the Label Command Center and Attorney Portal. No credit card is required to start. Paid plans unlock unlimited audits, batch processing, court-ready PDF exports, and full API access.',
    },
  ],
  attorneys: [
    {
      q: 'How does the Attorney Portal help with music litigation?',
      a: 'The Attorney Portal is a full Mission Control dashboard for entertainment law. It includes a Risk Heatmap showing all contracts under review with AI-scored risk levels (0-100), a Contract Intake Queue for pending PDFs, an Active Dispute Triage panel for live claims, and LOD (Letter of Demand) tracking. The War Room overlay provides split-screen evidence combat — showing your client\'s ownership proof against an adverse claim, side by side, with a timeline and one-click C&D dispatch.',
    },
    {
      q: 'Are the audit reports admissible in court?',
      a: 'Our reports are designed to comply with Federal Rules of Evidence 901(b)(9), which covers authentication of evidence produced by a process or system. Each PDF includes: the methodology used, data sources cross-referenced, SHA-256 hash of the underlying data, blockchain timestamp, QR code for instant verification, and a chain of custody log. Several entertainment attorneys have successfully used our reports in arbitration and federal litigation.',
    },
    {
      q: 'Can I upload client contracts for AI analysis?',
      a: 'Yes. The Contract Auditor tab accepts PDF uploads. Our AI scans for: royalty rate deviations from industry standard (e.g., "12.5% vs 18% industry standard"), cross-collateralization clauses, perpetual rights grants, audit limitation windows, missing ISRC/metadata warranties, and unfavorable termination conditions. Each flagged clause is highlighted with a discrepancy score and plain-English explanation.',
    },
    {
      q: 'How does the Digital Handshake work for legal agreements?',
      a: 'The Digital Handshake is a legally-binding e-signature system optimized for music agreements. You create an agreement (producer deal, feature, remix, joint venture), add all parties with their percentage stakes, and send each a secure signing link. Each signature is timestamped, SHA-256 hashed, and QR-verified. The final PDF includes a full audit trail. In Georgia and most U.S. jurisdictions, this satisfies the E-SIGN Act and UETA requirements.',
    },
    {
      q: 'Can I generate Letters of Demand automatically?',
      a: 'Yes. The Legal Vault\'s Automated Dispute Generator lets you select a conflict case, choose the notice type (DMCA Takedown, Cease & Desist, Royalty Audit Demand, Ownership Dispute Notice), and instantly generate a court-ready letter pre-populated with all relevant metadata, dates, and ownership evidence. Letters are generated in under 30 seconds.',
    },
    {
      q: 'What is the War Room overlay?',
      a: 'The War Room is a split-screen litigation workspace triggered when a dispute reaches critical priority. It shows: left panel — your client\'s ownership evidence (registration dates, metadata, blockchain timestamps), right panel — the adverse claim with identified weaknesses and Double Attribution Gap analysis. You get a dispute timeline, evidence bundle download, and a one-click "Dispatch Formal Cease & Desist" button that pre-fills all relevant case data.',
    },
  ],
  labels: [
    {
      q: 'What does the Label Command Center include?',
      a: 'The Label Command Center is a Bloomberg Terminal-style dashboard with: (1) KPI cards showing total artists, catalog value, pending royalties, and active disputes, (2) a world heatmap visualizing streaming revenue by geography, (3) a Conflict Priority Panel for rights disputes, (4) an Immutable Ledger for all royalty transactions, (5) Settlement Rails for sub-24-hour payout distribution, and (6) a Legal Vault with automated dispute generation.',
    },
    {
      q: 'How do Settlement Rails work?',
      a: 'Settlement Rails is our T+0 payment infrastructure that bypasses traditional distributor payment timelines (which are typically 60-90 days). Funds flow through four stages: Streaming Revenue → Rights Verification → Split Calculation → Artist Payout. Each stage is tracked in real time. Artists can request early withdrawal with a 5% bridge fee, and funds are delivered via ACH or wire within 24 hours of approval.',
    },
    {
      q: 'Can I manage royalty splits for multiple artists from one dashboard?',
      a: 'Yes. The Label Command Center supports unlimited artists. Each artist has a profile with their IPI/ISNI identifiers, split percentages per track, PRO registration, and payment info. You can view all pending royalties across your roster, approve or flag distributions, and export full payment reports for accounting. Split changes require digital re-signatures from all affected parties.',
    },
    {
      q: 'How does the Conflict Center help resolve disputes?',
      a: 'The Conflict Center shows all active ownership disputes across your catalog as a geographic heatmap and card list. Each conflict card includes: track name, competing claimant, revenue at stake, evidence strength score, and dispute age. Clicking a card opens a Forensic Comparison showing your metadata vs. the adverse claim, with color-coded discrepancies. You can escalate to the Attorney Portal\'s War Room or dispatch a dispute letter directly.',
    },
    {
      q: 'Can the platform handle complex multi-party splits?',
      a: 'Yes. Our split engine supports unlimited stakeholders per track — primary artists, featured artists, producers, songwriters, co-writers, publishers, and labels. It handles hierarchical splits (e.g., label takes 20% of gross, remainder splits between artist and producer), controlled composition clauses, and statutory rate calculations. All splits are locked by digital signatures and stored with a full version history.',
    },
    {
      q: 'What happens when there is a disputed track in my catalog?',
      a: 'Disputed tracks are flagged immediately when a competing registration is detected. Revenue from flagged tracks is held in escrow within the platform until the dispute is resolved. You receive a notification with the evidence summary, and can choose to: (1) submit counter-evidence, (2) open a War Room session with an attorney, (3) initiate a settlement offer, or (4) dispatch a formal dispute notice. All actions are logged and timestamped.',
    },
  ],
  audit: [
    {
      q: 'What databases does the audit engine check against?',
      a: 'Our audit engine cross-references 15+ authoritative databases including: MusicBrainz (open music encyclopedia), SoundExchange (digital performance royalties), ASCAP, BMI, and SESAC (performing rights), the MLC (mechanical licensing), iTunes/Apple Music metadata, Spotify Web API, YouTube Content ID, AcoustID (audio fingerprinting), ISRC Registry, ISWC database, AllMusic, Discogs, and proprietary industry metadata from our partner network.',
    },
    {
      q: 'What does the audit actually check for?',
      a: 'The audit engine checks: missing or invalid ISRCs, mismatched artist names across platforms, album title inconsistencies, release date discrepancies, missing songwriter/producer credits, incorrect UPC codes, absent or wrong PRO affiliation, missing IPI/ISNI numbers, split ownership gaps (splits that don\'t sum to 100%), unregistered sound recordings, DDEX metadata completeness, and revenue discrepancies between streaming statements and expected amounts based on play counts and registered rates.',
    },
    {
      q: 'How long does an audit take?',
      a: 'For a single track, results are returned in under 60 seconds. For a catalog of up to 1,000 tracks, the full audit completes within 5-10 minutes. For enterprise catalogs of 10,000+ tracks, batch processing runs in the background and results are delivered via email and dashboard notification, typically within 2-4 hours. Our infrastructure processes approximately 200 tracks per minute.',
    },
    {
      q: 'What risk scores mean in the audit report?',
      a: 'Each track receives a risk score from 0-100: Green (0-30) means metadata is clean and complete with no detected issues. Yellow (31-65) means one or more moderate issues found — missing fields, minor mismatches — that should be corrected but are unlikely to cause immediate revenue loss. Red (66-100) means critical issues detected — missing ISRC, contested ownership, split gaps, or active competing claims — that require immediate action. Red tracks also show an estimated monthly revenue at risk.',
    },
    {
      q: 'Can I upload a CSV instead of individual tracks?',
      a: 'Yes. We support bulk CSV upload with the following columns: Track Title, Artist Name, ISRC, UPC, Release Date, Label, Producer, Songwriter(s), PRO Affiliation, IPI, Split Percentages. A downloadable template is available in the dashboard. You can also connect your distributor account (DistroKid, TuneCore, CD Baby, AWAL) for automatic catalog import — no CSV needed.',
    },
    {
      q: 'What format is the audit report in?',
      a: 'Audit reports are delivered as court-ready PDFs with: an executive summary, per-track risk breakdown with color-coded scores, specific issue descriptions with recommended fixes, estimated revenue recovery amounts, methodology and data source citations, SHA-256 hash of the report data, blockchain timestamp, and a QR code on every page for instant authenticity verification. Reports can also be exported as JSON or CSV for programmatic processing.',
    },
  ],
  technical: [
    {
      q: 'Do you have an API?',
      a: 'Yes. Our REST API provides programmatic access to: catalog upload and audit, ISRC lookup and validation, split management, contract creation and signature tracking, royalty statement parsing, and DDEX XML generation. API access is available on Professional and Enterprise plans. Documentation is at api.traproyaltiespro.com/docs. Rate limits are 1,000 requests/hour on Professional, unlimited on Enterprise.',
    },
    {
      q: 'What file formats do you support for upload?',
      a: 'For audio: MP3, WAV, FLAC, AIFF, M4A. For metadata bulk import: CSV, Excel (.xlsx), JSON. For contracts: PDF, DOCX. For royalty statements: CSV, PDF, Excel (we support statement formats from Spotify, Apple Music, YouTube, TuneCore, DistroKid, CD Baby, AWAL, Stem, and more). For DDEX: we generate ERN 3.8.2 and ERN 4.1 XML automatically from your metadata.',
    },
    {
      q: 'How does the metadata extraction from MP3s work?',
      a: 'When you upload an audio file, we extract ID3v2 tags (artist, album, title, ISRC, year, genre, BPM, key) and compare them against our database. We also run AcoustID audio fingerprinting to identify the track by its acoustic signature, independent of tags. This allows us to detect misattributions — cases where an artist\'s name is on a track that actually matches another fingerprint in our database.',
    },
    {
      q: 'Is there a mobile app?',
      a: 'The Artist Portal is fully mobile-optimized and designed to feel like a native banking app on iPhone and Android. The Label Command Center and Attorney Portal are optimized for desktop use. A dedicated iOS and Android app is on our 2026 roadmap. In the meantime, all pages are responsive and work well in mobile browsers.',
    },
    {
      q: 'How does the blockchain timestamping work?',
      a: 'When a document is signed or an audit is finalized, we compute a SHA-256 hash of the document content and submit it to our partner blockchain network (currently Ethereum Mainnet via a batched Merkle tree, which keeps gas costs near zero). The resulting transaction ID and block number are embedded in the document. Anyone can verify the timestamp by looking up the transaction on Etherscan using the QR code on any page of the document.',
    },
    {
      q: 'Can I integrate with my existing distributor or DAW?',
      a: 'We have direct integrations with DistroKid, TuneCore, CD Baby, AWAL, and Stem for catalog import. DAW integrations (Pro Tools, Logic, Ableton) are in beta — these allow session file metadata to auto-populate track credits during upload. We also support Zapier and Make (formerly Integromat) for custom automation workflows.',
    },
  ],
  legal: [
    {
      q: 'Are digital signatures on TrapRoyaltiesPro legally binding?',
      a: 'Yes. Our e-signatures comply with the Electronic Signatures in Global and National Commerce Act (E-SIGN Act, 15 U.S.C. § 7001 et seq.) and the Uniform Electronic Transactions Act (UETA), which has been adopted in 49 states. Each signature is associated with a verified identity (email + IP + device fingerprint), a timestamp, and a SHA-256 hash of the document at signing. This satisfies the requirements for electronic contracts in virtually all U.S. music industry contexts.',
    },
    {
      q: 'What jurisdiction governs agreements created on the platform?',
      a: 'By default, Digital Handshake agreements display applicable law based on the party\'s selected jurisdiction. We support templates pre-populated for Georgia (Atlanta music industry standard), New York, California, Tennessee (Nashville), and federal law. Users can customize the governing law and dispute resolution clause. We always recommend having an attorney review agreements involving significant revenue before execution.',
    },
    {
      q: 'How is my catalog data protected?',
      a: 'All data is encrypted in transit using TLS 1.3 and at rest using AES-256. We do not share your catalog data, financial data, or contract data with any third party except as required by law. Our servers are hosted in SOC 2 Type II certified data centers. We maintain regular backups with 30-day retention. In the event of a data breach, we will notify affected users within 72 hours per GDPR requirements.',
    },
    {
      q: 'Who owns the data I upload?',
      a: 'You do. Uploading your catalog or contracts to TrapRoyaltiesPro does not transfer any intellectual property rights to us. We are a service provider. Our Terms of Service grant us a limited license to process your data solely for the purpose of providing our services. We do not use your music, contracts, or financial data to train AI models or for any purpose beyond service delivery.',
    },
    {
      q: 'Can I export or delete my data?',
      a: 'Yes. You can export your entire catalog, all audit reports, all signed contracts, and all financial records at any time from Account Settings → Data Export. Export is delivered as a ZIP file within 24 hours. If you close your account, your data is deleted from our systems within 30 days (signed contracts are retained for 7 years in encrypted cold storage per industry legal standards, unless you request earlier deletion).',
    },
    {
      q: 'Are audit reports GDPR compliant?',
      a: 'Yes. Our audit reports include only data you have provided or that is already public record (e.g., ISRC registrations, PRO databases). We do not include personal data of third parties in reports without consent. For European users, we process data under the legitimate interest legal basis for rights protection activities, and we maintain a Data Processing Agreement (DPA) available on request.',
    },
  ],
  pricing: [
    {
      q: 'What plans are available?',
      a: 'We offer four tiers: Free (25-track audit, 1 digital handshake, read-only demo), Starter ($49/month — 500 tracks, 10 contracts/month, CSV export), Professional ($149/month — unlimited tracks, unlimited contracts, API access, court-ready PDFs, priority support), and Enterprise (custom pricing — dedicated instance, SLA, white-label option, custom integrations, unlimited API, legal team onboarding). Annual billing saves 20% on Starter and Professional.',
    },
    {
      q: 'Is there a setup fee?',
      a: 'No setup fee for Starter and Professional plans. Enterprise plans include an onboarding fee that covers data migration, catalog import assistance, custom integration setup, and a 90-minute training session for your team. The onboarding fee is quoted based on catalog size and integration complexity.',
    },
    {
      q: 'What is the 5/500 Partnership Model?',
      a: 'The 5/500 model is our label and law firm partnership program: a one-time onboarding fee of $5,000 (covers full catalog migration, custom integration, and legal team training), $500/month platform access (unlimited users, unlimited catalog, full API, white-label option), plus a 5% success fee on royalties recovered through dispute resolution that would not have been collected without our platform. This model aligns our incentives with your outcomes.',
    },
    {
      q: 'Can I cancel anytime?',
      a: 'Yes. Monthly plans can be cancelled at any time. You retain access until the end of your current billing period. Annual plans can be cancelled with a 30-day notice; unused months are refunded on a pro-rated basis. Enterprise contracts have a minimum term (typically 12 months) specified in the MSA.',
    },
    {
      q: 'Do you offer discounts for non-profits or independent artists?',
      a: 'Yes. We offer a 50% discount for registered non-profit music organizations (501(c)(3)). Independent artists with fewer than 50 tracks who are not affiliated with a label can apply for our Artist Access program, which provides Professional plan features at Starter pricing. Contact us at support@traproyaltiespro.com with proof of non-profit status or an explanation of your situation.',
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept all major credit and debit cards (Visa, Mastercard, Amex, Discover), ACH bank transfer (US only, 2-3 business days), and wire transfer for Enterprise plans. Invoicing with Net-30 terms is available for Enterprise and verified law firm clients. We do not currently accept cryptocurrency, though this is on our roadmap.',
    },
  ],
  ddex: [
    {
      q: 'What is DDEX and why does it matter?',
      a: 'DDEX (Digital Data Exchange) is the global standard for communicating music metadata between music companies, distributors, and digital service providers (DSPs). When a DSP like Spotify or Apple Music receives your release, they expect it in DDEX format — specifically ERN (Electronic Release Notification). Proper DDEX compliance ensures your tracks appear correctly, royalties are attributed to the right parties, and ISRC-level reporting flows back to you and your PRO automatically.',
    },
    {
      q: 'What DDEX standards do you support?',
      a: 'We support ERN 3.8.2 and ERN 4.1 (Electronic Release Notification), the most widely accepted versions across major DSPs. We also support MEAD (Music Availability and Eligibility Data) for catalogue management, and DSR (Digital Sales Reporting) for royalty statement ingestion. Our XML generator produces valid, schema-compliant DDEX packages that pass validation at all major DSPs.',
    },
    {
      q: 'Can I generate DDEX packages from my existing catalog?',
      a: 'Yes. Once your catalog is in our system (uploaded via CSV, API, or distributor import), our DDEX engine generates compliant ERN XML packages for any or all releases. Each package includes: release metadata, track-level ISRCs, rights holder information, territory availability windows, pricing tiers, and sound recording copyright data. Packages are delivered as ZIP files ready to submit to DSPs or your aggregator.',
    },
    {
      q: 'Do you handle ISRC registration?',
      a: 'We validate ISRCs against the ISRC Registry and flag invalid or duplicate codes. We do not issue ISRCs directly (that requires a registered ISRC Manager), but we provide the validation data and the correct format to apply for ISRCs through your country\'s designated ISRC agency (e.g., RIAA in the US). For labels with existing ISRC allocations, we can batch-assign codes to unregistered tracks.',
    },
    {
      q: 'How does DDEX distribution differ from a standard distributor?',
      a: 'Standard distributors (DistroKid, TuneCore, etc.) handle distribution but give you limited visibility into the metadata they submit. Our DDEX layer gives you direct control: you see the exact XML before submission, you can verify every field, and you get DSP-level error reports back in your dashboard. This is critical for labels and publishers who need to ensure metadata accuracy for accurate royalty reporting and PRO matching.',
    },
    {
      q: 'Can I use DDEX features to dispute a metadata error at a DSP?',
      a: 'Yes. When our audit detects a metadata discrepancy between what you submitted and what a DSP is showing, we generate a DDEX correction package and a formal metadata dispute notice in the format each DSP\'s rights administration team requires. This dramatically speeds up correction timelines — typically from months to days. We track the status of each correction request in your dashboard.',
    },
  ],
};

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('general');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const tabBarRef = useRef<HTMLDivElement>(null);

  // Open all items by default when category changes
  useEffect(() => {
    const items = FAQ_DATA[activeCategory];
    setOpenItems(new Set(items.map((_, i) => `${activeCategory}-${i}`)));
  }, [activeCategory]);

  // Scroll active tab into view
  useEffect(() => {
    const bar = tabBarRef.current;
    if (!bar) return;
    const btn = bar.querySelector(`[data-cat="${activeCategory}"]`) as HTMLElement;
    if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeCategory]);

  const toggle = (key: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Search across all categories
  const searchResults: { cat: CategoryId; catLabel: string; catIcon: string; idx: number; q: string; a: string }[] = [];
  if (search.trim().length > 1) {
    const q = search.toLowerCase();
    CATEGORIES.forEach(cat => {
      FAQ_DATA[cat.id as CategoryId].forEach((item, idx) => {
        if (item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)) {
          searchResults.push({ cat: cat.id as CategoryId, catLabel: cat.label, catIcon: cat.icon, idx, q: item.q, a: item.a });
        }
      });
    });
  }

  const showSearch = search.trim().length > 1;
  const items = FAQ_DATA[activeCategory];

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .faq-item { animation: fadeUp 0.35s ease both; }
        .accordion-body {
          overflow: hidden;
          transition: max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease;
        }
        .accordion-body.open { max-height: 600px; opacity: 1; }
        .accordion-body.closed { max-height: 0; opacity: 0; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .highlight { background: #fef08a; border-radius: 2px; padding: 0 2px; }
        .cat-active { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; box-shadow: 0 4px 15px rgba(79,70,229,0.35); }
      `}</style>

      {/* Hero */}
      <div className="bg-[#0f172a] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="text-5xl mb-4">❓</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-indigo-300 mb-8">Everything you need to know about TrapRoyaltiesPro</p>
          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search all questions..."
              className="w-full px-6 py-4 pr-12 rounded-2xl bg-[#1e293b] border border-white/10 text-white placeholder-slate-500 text-lg shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl text-slate-500">🔍</span>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      {!showSearch && (
        <div className="bg-[#1e293b] border-b border-white/10 sticky top-0 z-10 shadow-sm">
          <div className="max-w-6xl mx-auto px-4">
            <div ref={tabBarRef} className="flex overflow-x-auto py-4 gap-3 scrollbar-hide">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  data-cat={cat.id}
                  onClick={() => setActiveCategory(cat.id as CategoryId)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl whitespace-nowrap font-medium transition-all duration-200 hover:scale-105 text-sm ${
                    activeCategory === cat.id ? 'cat-active' : 'bg-[#0f172a] text-slate-400 hover:bg-[#1e293b]'
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Search results */}
        {showSearch ? (
          <>
            <div className="mb-6">
              <p className="text-slate-500 text-sm">
                {searchResults.length === 0
                  ? `No results for "${search}"`
                  : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${search}"`}
              </p>
            </div>
            {searchResults.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <div className="text-5xl mb-4">🔎</div>
                <p className="text-xl font-medium mb-2">No questions match your search</p>
                <p className="text-sm">Try different keywords or browse by category</p>
                <button
                  onClick={() => setSearch('')}
                  className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition"
                >
                  Browse All Categories
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.map((r, ri) => (
                  <div key={ri} className="faq-item bg-[#1e293b] rounded-2xl shadow-md border border-white/5 overflow-hidden">
                    <div className="px-6 py-3 bg-indigo-900/20 border-b border-indigo-500/30 flex items-center gap-2">
                      <span className="text-sm">{r.catIcon}</span>
                      <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">{r.catLabel}</span>
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-white mb-3">{r.q}</h3>
                      <p className="text-slate-400 leading-relaxed">{r.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Category header */}
            <div className="mb-8 flex items-center gap-3">
              <span className="text-4xl">{CATEGORIES.find(c => c.id === activeCategory)?.icon}</span>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {CATEGORIES.find(c => c.id === activeCategory)?.label}
                </h2>
                <p className="text-slate-500 text-sm">{items.length} questions</p>
              </div>
              <button
                onClick={() => {
                  const allKeys = new Set(items.map((_, i) => `${activeCategory}-${i}`));
                  const allOpen = items.every((_, i) => openItems.has(`${activeCategory}-${i}`));
                  setOpenItems(allOpen ? new Set() : allKeys);
                }}
                className="ml-auto text-xs text-indigo-400 hover:text-indigo-300 font-medium underline"
              >
                {items.every((_, i) => openItems.has(`${activeCategory}-${i}`)) ? 'Collapse all' : 'Expand all'}
              </button>
            </div>

            {/* Accordion */}
            <div className="space-y-4">
              {items.map((item, i) => {
                const key = `${activeCategory}-${i}`;
                const isOpen = openItems.has(key);
                return (
                  <div
                    key={key}
                    className={`faq-item bg-[#1e293b] rounded-2xl shadow-md border transition-all duration-200 overflow-hidden ${
                      isOpen ? 'border-indigo-500/30 shadow-lg' : 'border-white/5'
                    }`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-[#0a0f1e] transition-colors duration-150"
                    >
                      <span className="font-semibold text-white text-base pr-4 leading-snug">{item.q}</span>
                      <span
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                          isOpen ? 'bg-indigo-600 text-white rotate-45' : 'bg-[#0f172a] text-slate-500'
                        }`}
                      >
                        +
                      </span>
                    </button>
                    <div className={`accordion-body ${isOpen ? 'open' : 'closed'}`}>
                      <div className="px-6 pb-6 border-t border-white/5 pt-4">
                        <p className="text-slate-400 leading-relaxed">{item.a}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Still have questions CTA */}
        <div className="mt-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-10 text-white text-center shadow-xl">
          <div className="text-4xl mb-4">💬</div>
          <h2 className="text-2xl font-bold mb-3">Still have questions?</h2>
          <p className="text-indigo-300 mb-8 max-w-md mx-auto">
            Our team responds within 24 hours. For urgent legal matters, book a demo call with our music law specialists.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@traproyaltiespro.com"
              className="px-8 py-4 bg-[#1e293b] text-indigo-300 rounded-xl font-bold hover:bg-[#0f172a] transition duration-200 hover:scale-105"
            >
              Email Support
            </a>
            <Link
              href="/attorney-portal"
              className="px-8 py-4 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-400 transition duration-200 hover:scale-105 border border-white/30"
            >
              Open Attorney Portal
            </Link>
            <Link
              href="/free-audit"
              className="px-8 py-4 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-400 transition duration-200 hover:scale-105 border border-white/30"
            >
              Start Free Audit
            </Link>
          </div>
          <p className="text-sm text-indigo-300 mt-6">support@traproyaltiespro.com</p>
        </div>

        {/* Quick links grid */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '🔍', label: 'Free Catalog Audit',    href: '/free-audit' },
            { icon: '⚖️', label: 'Attorney Portal',       href: '/attorney-portal' },
            { icon: '🏢', label: 'Label Dashboard',       href: '/label' },
            { icon: '🎵', label: 'How It Works',          href: '/how-it-works' },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-[#1e293b] rounded-xl p-5 text-center shadow-md border border-white/5 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">{link.icon}</div>
              <div className="font-semibold text-slate-200 text-sm">{link.label}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

