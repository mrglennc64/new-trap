// app/free-audit/page.tsx
'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

// Sample catalog data
const SAMPLE_CATALOG = `ISRC,Title,Artist,Writers,Label
USRC12300001,Neon Dreams,King Slime,Drik Svensson (50%),Anna Deng (30%),Lars Johansson (20%),TrapRoyalties
USRC12300002,Trap Symphony,Young Thug,Drik Svensson (60%),Lars Johansson (40%),TrapRoyalties
USRC12300003,Royalty Flow,Lil Baby,Anna Deng (70%),Extra Writer (30%),TrapRoyalties
USRC12300004,Studio Session,Future,Drik Svensson (100%),TrapRoyalties
USRC12300005,Street Anthem,21 Savage,Drik Svensson (50%),Anna Deng (25%),Lars Johansson (25%),TrapRoyalties
USRC12300006,Platinum Mindset,Gunna,Anna Deng (80%),Lars Johansson (20%),TrapRoyalties
USRC12300007,Producer Check,Mike Will,Drik Svensson (33%),Anna Deng (33%),Lars Johansson (34%),TrapRoyalties
USRC12300008,Studio Time,Metro Boomin,Lars Johansson (100%),TrapRoyalties
USRC12300009,Feature Verse,Drake,Anna Deng (50%),Drik Svensson (50%),TrapRoyalties
USRC12300010,Final Track,King Slime feat. Drake,"Drik Svensson (40%), Anna Deng (30%), Lars Johansson (30%)",TrapRoyalties`

export default function FreeAuditPage() {
  const [selectedType, setSelectedType] = useState<'label' | 'artist'>('label')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [auditComplete, setAuditComplete] = useState(false)
  const [auditResults, setAuditResults] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (file: File) => {
    setUploadedFile(file)
    setIsProcessing(true)
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false)
      setAuditComplete(true)
      setAuditResults({
        tracksScanned: 10,
        missingRegistrations: 4,
        splitDiscrepancies: 2,
        estimatedRoyalties: 12500,
        issues: [
          { track: "Neon Dreams", issue: "Producer (Lars Johansson) missing from BMI", impact: "$2,400" },
          { track: "Trap Symphony", issue: "Split mismatch: Internal shows 60/40, PRO shows 100/0", impact: "$3,200" },
          { track: "Feature Verse", issue: "Drake not registered as writer", impact: "$4,100" },
          { track: "Final Track", issue: "Writers missing IPI numbers", impact: "$2,800" }
        ]
      })
    }, 2000)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file && file.type === 'text/csv') {
      handleFileUpload(file)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const loadSampleCatalog = () => {
    // Create a file from the sample CSV string
    const blob = new Blob([SAMPLE_CATALOG], { type: 'text/csv' })
    const file = new File([blob], 'sample-trap-catalog.csv', { type: 'text/csv' })
    
    // Trigger the upload flow
    handleFileUpload(file)
  }

  const downloadSampleCSV = () => {
    const blob = new Blob([SAMPLE_CATALOG], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample-trap-catalog.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen gradient-bg">
      <header className="bg-black/90 text-white py-4 border-b border-purple-900/50">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold neon-purple">
            TrapRoyalties Pro
          </Link>
          <nav className="space-x-6">
            <Link href="#features" className="hover:text-purple-400 transition">
              Features
            </Link>
            <Link 
              href="/free-audit" 
              className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-full text-sm font-semibold transition"
            >
              Start Free Audit
            </Link>
          </nav>
        </div>
      </header>

      <main className="pt-28 pb-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold neon-cyan mb-4">
            Free Catalog Audit
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
            Scan up to 10 tracks FREE — uncover missing royalties from streams, syncs, & performances. 
            Built for hip hop & R&B hustlers.
          </p>
          <p className="mt-4 text-lg text-purple-300 font-medium">
            Limited free scan • Basic report • Upgrade for unlimited + advanced splits
          </p>
        </div>

        <div className="bg-gray-900/60 backdrop-blur-md rounded-3xl shadow-2xl border border-purple-900/50 p-8 md:p-12">
          {/* User Type Selector */}
          <div className="flex space-x-4 mb-10">
            <button
              onClick={() => setSelectedType('label')}
              className={`flex-1 py-5 rounded-2xl font-semibold flex items-center justify-center space-x-3 transition-all ${
                selectedType === 'label'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/40 transform hover:scale-105'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>I'm a Label / Crew</span>
            </button>
            
            <button
              onClick={() => setSelectedType('artist')}
              className={`flex-1 py-5 rounded-2xl font-semibold flex items-center justify-center space-x-3 transition-all ${
                selectedType === 'artist'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/40 transform hover:scale-105'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>
              <span>I'm an Artist / Producer</span>
            </button>
          </div>

          {/* Upload Area */}
          {!auditComplete ? (
            <>
              <div
                className={`upload-zone rounded-2xl p-12 text-center mb-8 transition-all cursor-pointer border-2 border-dashed ${
                  isProcessing ? 'border-purple-400 bg-purple-900/20' : 'border-purple-600 bg-purple-900/5 hover:border-purple-400 hover:bg-purple-900/10'
                }`}
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {isProcessing ? (
                  <>
                    <div className="mx-auto mb-6 w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <h3 className="text-2xl font-bold neon-purple mb-3">Scanning Your Catalog...</h3>
                    <p className="text-gray-400">Checking PROs for missing registrations</p>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-6">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" x2="12" y1="3" y2="15"></line>
                    </svg>
                    <h3 className="text-2xl font-bold neon-purple mb-3">Drop Your Catalog Here</h3>
                    <p className="text-gray-400 mb-6">
                      CSV file with up to 10 tracks (ISRC, Title, Artist, Writers optional)
                    </p>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      id="file-upload"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold text-lg hover:from-purple-500 hover:to-pink-500 cursor-pointer shadow-lg shadow-purple-900/50 transition transform hover:scale-105"
                    >
                      Choose CSV File
                    </label>
                  </>
                )}
              </div>

              <p className="text-center text-gray-500 mb-10">
                Or{' '}
                <button
                  onClick={loadSampleCatalog}
                  className="text-purple-400 hover:text-purple-300 font-medium underline"
                >
                  try a sample trap catalog
                </button>{' '}
                to see results instantly
              </p>
            </>
          ) : (
            /* Audit Results */
            <div className="space-y-6">
              <div className="bg-green-900/20 border border-green-600/50 rounded-2xl p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <h3 className="text-2xl font-bold text-green-400 mb-2">Audit Complete!</h3>
                <p className="text-gray-300">We found potential unclaimed royalties in your catalog</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-purple-900/30 rounded-xl p-4 text-center border border-purple-700/50">
                  <div className="text-3xl font-bold text-cyan-400">{auditResults?.tracksScanned}</div>
                  <div className="text-sm text-gray-400">Tracks Scanned</div>
                </div>
                <div className="bg-purple-900/30 rounded-xl p-4 text-center border border-purple-700/50">
                  <div className="text-3xl font-bold text-cyan-400">{auditResults?.missingRegistrations}</div>
                  <div className="text-sm text-gray-400">Missing PRO Regs</div>
                </div>
                <div className="bg-purple-900/30 rounded-xl p-4 text-center border border-purple-700/50">
                  <div className="text-3xl font-bold text-cyan-400">{auditResults?.splitDiscrepancies}</div>
                  <div className="text-sm text-gray-400">Split Issues</div>
                </div>
                <div className="bg-purple-900/30 rounded-xl p-4 text-center border border-purple-700/50">
                  <div className="text-3xl font-bold text-cyan-400">${auditResults?.estimatedRoyalties.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">Est. Unclaimed</div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-6">
                <h4 className="font-bold text-lg mb-4">Issues Found:</h4>
                <div className="space-y-3">
                  {auditResults?.issues.map((issue: any, i: number) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-700">
                      <div>
                        <span className="font-medium text-cyan-400">{issue.track}</span>
                        <p className="text-sm text-gray-400">{issue.issue}</p>
                      </div>
                      <span className="text-red-400 font-bold">{issue.impact}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center pt-4">
                <button
                  onClick={() => {
                    setAuditComplete(false)
                    setUploadedFile(null)
                  }}
                  className="text-purple-400 hover:text-purple-300 font-medium underline"
                >
                  Run another audit
                </button>
              </div>
            </div>
          )}

          {/* CTA Section */}
          <div className="text-center bg-purple-900/30 rounded-2xl p-8 border border-purple-700/50 mt-8">
            <h3 className="text-2xl font-bold neon-cyan mb-4">
              Want Unlimited Scans + Crypto Split Verification?
            </h3>
            <p className="text-gray-300 mb-6">
              Upgrade to Pro for full catalog audits, ongoing monitoring, payment simulator, 
              and lifetime discount via Royalty Accelerator (spots limited).
            </p>
            <Link
              href="/founding-member"
              className="inline-block bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-4 px-10 rounded-full text-xl shadow-2xl shadow-pink-900/50 transition transform hover:scale-105"
            >
              Unlock Full Power – Join Accelerator
            </Link>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-20">
          <h2 className="text-4xl font-bold text-center neon-purple mb-12">
            How the Free Audit Works
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-purple-600/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" x2="12" y1="3" y2="15"></line>
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 neon-cyan">1. Upload (Max 10 Tracks)</h3>
              <p className="text-gray-300">Drop your CSV — keep it simple for the free scan.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-purple-600/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 neon-cyan">2. We Scan PROs</h3>
              <p className="text-gray-300">Checks ASCAP, BMI, SOCAN, PRS for missing registrations & gaps common in collabs/features.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-purple-600/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                  <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 neon-cyan">3. Get Basic Report</h3>
              <p className="text-gray-300">See unclaimed royalties estimates + next steps to get your bag.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-black/90 text-gray-400 py-12 border-t border-purple-900/50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold mb-4">TrapRoyalties Pro</h3>
              <p className="text-sm">The protocol that powers transparent music royalties.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/free-audit" className="hover:text-purple-400">Free Audit</Link></li>
                <li><Link href="/founding-member" className="hover:text-purple-400">Founding Member</Link></li>
                <li><Link href="/label" className="hover:text-purple-400">Label Portal</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-purple-400">About</Link></li>
                <li><Link href="/blog" className="hover:text-purple-400">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-purple-400">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms" className="hover:text-purple-400">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-purple-400">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            © 2026 TrapRoyalties Pro. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}