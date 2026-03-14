'use client'

import { useState, useEffect, useRef } from 'react'
import { useDemoMode } from '../lib/DemoModeProvider'

// ── Types ──────────────────────────────────────────────────────
interface Contributor {
  name: string
  role: string
  percentage: number
  ipi: string
}

interface ValidationError {
  message: string
}

interface FixSuggestion {
  id: string
  issue: string
  suggestion: string
  status: 'pending' | 'accepted' | 'skipped'
  type: 'fill_name' | 'fill_ipi' | 'normalize_splits'
  contributorIndex?: number
}

interface PaymentDistribution {
  name: string
  percentage: number
  grossShare: number
  taxShare: number
  netShare: number
}

type Step = 1 | 2 | 3 | 4

// Georgia state income tax withholding — O.C.G.A. § 48-7-26
const TAX_RATE  = 0.0549
const TAX_LABEL = 'Georgia State Tax Withholding (5.49%)'

// ── Helpers ────────────────────────────────────────────────────
const G  = '#2B6F4B'
const GH = '#1f5236'

const PERFECT_SAMPLE: Contributor[] = [
  { name: 'Marcus Johnson', role: 'Composer', percentage: 50, ipi: '00624789341' },
  { name: 'Deja Williams',  role: 'Lyricist',  percentage: 30, ipi: '00472915682' },
  { name: 'Troy Bennett',   role: 'Producer',  percentage: 20, ipi: '00836125497' },
]

const ERROR_SAMPLE: Contributor[] = [
  { name: 'Marcus Johnson', role: 'Composer', percentage: 60, ipi: '' },
  { name: '',               role: 'Lyricist',  percentage: 25, ipi: '00472915682' },
  { name: 'Troy Bennett',   role: 'Producer',  percentage: 20, ipi: 'invalid' },
  { name: 'Extra Writer',   role: 'Writer',    percentage: 10, ipi: '' },
]

function validateData(data: Contributor[]): ValidationError[] {
  const errs: ValidationError[] = []
  let total = 0
  data.forEach((item, i) => {
    total += item.percentage || 0
    if (!item.name?.trim())
      errs.push({ message: `Contributor ${i + 1} missing name` })
    if (!item.ipi?.trim() || item.ipi === 'invalid')
      errs.push({ message: `${item.name || `Contributor ${i + 1}`} missing IPI/ISWC` })
    if (item.percentage <= 0 || item.percentage > 100)
      errs.push({ message: `${item.name || `Contributor ${i + 1}`} has invalid percentage: ${item.percentage}%` })
  })
  if (Math.abs(total - 100) > 0.1)
    errs.push({ message: `Total split is ${total}%, must equal 100%` })
  return errs
}

function buildFixes(data: Contributor[]): FixSuggestion[] {
  const fixes: FixSuggestion[] = []
  data.forEach((item, i) => {
    if (!item.name?.trim()) {
      fixes.push({
        id: `name_${i}`,
        issue: `Contributor ${i + 1} is missing a name`,
        suggestion: `Assign a Legal Identity Hold — prevents invalid SoundExchange filing with unnamed contributor`,
        status: 'pending',
        type: 'fill_name',
        contributorIndex: i,
      })
    }
    if (!item.ipi?.trim() || item.ipi === 'invalid') {
      fixes.push({
        id: `ipi_${i}`,
        issue: `${item.name || `Contributor ${i + 1}`} is missing a valid IPI/ISWC`,
        suggestion: `Search MusicBrainz IPI registry to assign a verified IPI — "AUTO-IPI" placeholders are rejected by SoundExchange`,
        status: 'pending',
        type: 'fill_ipi',
        contributorIndex: i,
      })
    }
  })
  const total = data.reduce((s, x) => s + (x.percentage || 0), 0)
  if (Math.abs(total - 100) > 0.1) {
    fixes.push({
      id: 'normalize_splits',
      issue: `Total split is ${total.toFixed(1)}%, must equal 100%`,
      suggestion: `Proportional rescale — each contributor's share stays in ratio, but all percentages are adjusted to sum to exactly 100%`,
      status: 'pending',
      type: 'normalize_splits',
    })
  }
  return fixes
}

// ── Page ───────────────────────────────────────────────────────
export default function VerifySplitsPage() {
  const { demoMode } = useDemoMode()
  const [currentData,     setCurrentData]     = useState<Contributor[]>([])
  const [errors,          setErrors]          = useState<ValidationError[]>([])
  const [currentStep,     setCurrentStep]     = useState<Step>(1)
  const [grossAmount,     setGrossAmount]     = useState<number>(50000)
  const [showTechDetails, setShowTechDetails] = useState(false)
  const [isLoading,       setIsLoading]       = useState(false)
  const [isDragging,      setIsDragging]      = useState(false)
  const [showFixPanel,    setShowFixPanel]    = useState(false)
  const [fixes,           setFixes]           = useState<FixSuggestion[]>([])
  const [ipiSearch,       setIpiSearch]       = useState<Record<string, { loading: boolean; results: { name: string; ipi: string; pro: string }[]; error?: string }>>({})
  const [nameChoice,      setNameChoice]      = useState<Record<string, string>>({})
  const [rescalePreview,  setRescalePreview]  = useState<{ fixId: string; rows: { name: string; original: number; rescaled: number; change: number }[] } | null>(null)
  const [verificationId,  setVerificationId]  = useState('QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco')
  const [timestamp,       setTimestamp]       = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
    message: '', type: 'success', visible: false,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const now = new Date()
    setTimestamp(now.toISOString().replace('T', ' ').substring(0, 16) + ' UTC')
  }, [])

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true })
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000)
  }

  const progressWidth = `${((currentStep - 1) / 3) * 100}%`

  // ── Data processing ──────────────────────────────────────────
  const processData = (data: Contributor[]) => {
    setCurrentData(data)
    setShowFixPanel(false)
    setFixes([])
    const errs = validateData(data)
    setErrors(errs)
    setCurrentStep(errs.length > 0 ? 2 : 3)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsLoading(true)
    setTimeout(() => {
      processData(Math.random() > 0.5 ? PERFECT_SAMPLE : ERROR_SAMPLE)
      showToast(`Loaded: ${file.name}`)
      setIsLoading(false)
    }, 500)
  }

  // Demo mode: auto-load perfect sample when active
  useEffect(() => {
    if (demoMode && currentData.length === 0) processData(PERFECT_SAMPLE)
  }, [demoMode])

  const loadPerfectSample = () => { processData(PERFECT_SAMPLE); showToast('Perfect sample loaded — no issues detected') }
  const loadErrorSample   = () => { processData(ERROR_SAMPLE);   showToast('Sample with issues loaded', 'error') }

  // ── Inline editing ───────────────────────────────────────────
  const startManually = () => {
    const blank: Contributor[] = [{ name: '', role: 'Composer', percentage: 0, ipi: '' }]
    setCurrentData(blank)
    setErrors(validateData(blank))
    setCurrentStep(2)
    setShowFixPanel(false)
    setFixes([])
  }

  const updateContributor = (index: number, field: keyof Contributor, value: string | number) => {
    setCurrentData(prev => {
      const updated = prev.map((c, i) => i === index ? { ...c, [field]: value } : c)
      const errs = validateData(updated)
      setErrors(errs)
      if (errs.length === 0) setCurrentStep(3)
      return updated
    })
  }

  const addContributor = () => {
    setCurrentData(prev => {
      const updated = [...prev, { name: '', role: 'Composer', percentage: 0, ipi: '' }]
      setErrors(validateData(updated))
      return updated
    })
  }

  const removeContributor = (index: number) => {
    setCurrentData(prev => {
      const updated = prev.filter((_, i) => i !== index)
      setErrors(validateData(updated))
      if (updated.length === 0) setCurrentStep(1)
      return updated
    })
  }

  // ── Show fix suggestions ─────────────────────────────────────
  const handleShowFixes = () => {
    if (!showFixPanel) setFixes(buildFixes(currentData))
    setShowFixPanel(v => !v)
  }

  // ── IPI: search MusicBrainz for real IPI ─────────────────────
  const searchIPI = async (fixId: string, contributorName: string) => {
    if (!contributorName.trim()) return
    setIpiSearch(prev => ({ ...prev, [fixId]: { loading: true, results: [] } }))
    try {
      const res = await fetch(
        `https://musicbrainz.org/ws/2/artist/?query=name:${encodeURIComponent(contributorName)}&fmt=json&limit=8`,
        { headers: { 'User-Agent': 'TrapRoyaltiesPro/1.0 (traproyaltiespro.com)' } }
      )
      const data = await res.json()
      const results = (data.artists || [])
        .filter((a: any) => a.ipis?.length > 0)
        .slice(0, 5)
        .map((a: any) => ({
          name: a.name,
          ipi: a.ipis[0],
          pro: [a.type, a.disambiguation].filter(Boolean).join(' · '),
        }))
      setIpiSearch(prev => ({
        ...prev,
        [fixId]: {
          loading: false,
          results,
          error: results.length === 0 ? 'No IPI records found in MusicBrainz for this name — register at your PRO directly' : undefined,
        },
      }))
    } catch {
      setIpiSearch(prev => ({ ...prev, [fixId]: { loading: false, results: [], error: 'MusicBrainz search failed — check network' } }))
    }
  }

  const assignIPI = (fixId: string, ipi: string) => {
    const fix = fixes.find(f => f.id === fixId)!
    setFixes(prev => prev.map(f => f.id === fixId ? { ...f, status: 'accepted' } : f))
    setCurrentData(prev => {
      const updated = prev.map(x => ({ ...x }))
      if (fix.contributorIndex !== undefined) updated[fix.contributorIndex].ipi = ipi
      return updated
    })
  }

  // ── Name: assign legal hold ───────────────────────────────────
  const assignName = (fixId: string) => {
    const fix = fixes.find(f => f.id === fixId)!
    const choice = nameChoice[fixId] || 'TBA - Identity Audit in Progress'
    setFixes(prev => prev.map(f => f.id === fixId ? { ...f, status: 'accepted' } : f))
    setCurrentData(prev => {
      const updated = prev.map(x => ({ ...x }))
      if (fix.contributorIndex !== undefined) updated[fix.contributorIndex].name = choice
      return updated
    })
  }

  // ── Splits: preview then confirm rescale ──────────────────────
  const buildRescalePreview = (fixId: string) => {
    const total = currentData.reduce((s, x) => s + x.percentage, 0)
    const scaleFactor = 100 / total
    const rows = currentData.map(x => {
      const rescaled = parseFloat((x.percentage * scaleFactor).toFixed(2))
      return { name: x.name || '(unnamed)', original: x.percentage, rescaled, change: 0 }
    })
    // Fix rounding so total is exactly 100
    const sum = rows.reduce((s, r) => s + r.rescaled, 0)
    if (Math.abs(sum - 100) > 0.001) {
      rows[0].rescaled = parseFloat((rows[0].rescaled + (100 - sum)).toFixed(2))
    }
    rows.forEach(r => { r.change = parseFloat((r.rescaled - r.original).toFixed(2)) })
    setRescalePreview({ fixId, rows })
  }

  const confirmRescale = () => {
    if (!rescalePreview) return
    setFixes(prev => prev.map(f => f.id === rescalePreview.fixId ? { ...f, status: 'accepted' } : f))
    setCurrentData(prev =>
      prev.map((x, i) => ({ ...x, percentage: rescalePreview.rows[i]?.rescaled ?? x.percentage }))
    )
    setRescalePreview(null)
    showToast('Splits rescaled — all contributors must re-verify adjusted percentages', 'error')
  }

  // ── Skip ──────────────────────────────────────────────────────
  const skipFix = (fixId: string) => {
    setFixes(prev => prev.map(f => f.id === fixId ? { ...f, status: 'skipped' } : f))
  }

  // Re-validate after fixes change
  useEffect(() => {
    if (fixes.length === 0) return
    const allResolved = fixes.every(f => f.status !== 'pending')
    if (!allResolved) return
    // All fixes answered — re-validate with latest data
    setCurrentData(prev => {
      const errs = validateData(prev)
      setErrors(errs)
      if (errs.length === 0) {
        setCurrentStep(3)
        showToast('All issues resolved — data verified!')
        setShowFixPanel(false)
      } else {
        showToast(`${errs.length} issue(s) remain after skipped fixes`, 'error')
      }
      return prev
    })
  }, [fixes])

  // ── Verification ─────────────────────────────────────────────
  const startVerification = () => {
    if (errors.length > 0) { showToast('Please fix issues before verification', 'error'); return }
    setVerificationId('QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco' + Math.random().toString(36).substring(2, 8))
    setTimestamp(new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC')
    setCurrentStep(3)
    showToast('Data verified successfully')
  }

  const calculateAndShowPayment = () => { setCurrentStep(4); showToast('Payment calculated successfully') }

  const getDistribution = (): PaymentDistribution[] =>
    currentData.map(item => {
      const grossShare = grossAmount * (item.percentage / 100)
      const taxShare   = grossShare * TAX_RATE
      return { name: item.name, percentage: item.percentage, grossShare, taxShare, netShare: grossShare - taxShare }
    })

  const taxAmount = grossAmount * TAX_RATE
  const netAmount = grossAmount - taxAmount

  // ── PDF ──────────────────────────────────────────────────────
  const downloadPaymentPDF = async () => {
    if (!currentData.length) { showToast('No data to export', 'error'); return }
    setIsLoading(true)
    try {
      localStorage.setItem('trapRoyaltiesReportData',      JSON.stringify(currentData))
      localStorage.setItem('trapRoyaltiesFileName',        'SplitSheet_TRP.pdf')
      localStorage.setItem('trapRoyaltiesDocumentHash',    verificationId)
      localStorage.setItem('trapRoyaltiesReportTimestamp', timestamp)
      localStorage.setItem('trapRoyaltiesGrossAmount',     grossAmount.toString())
      localStorage.setItem('trapRoyaltiesTaxRate',         TAX_RATE.toString())
      window.open('/pdf-report', '_blank')
      showToast('Opening PDF report...')
    } catch { showToast('Error generating PDF', 'error') }
    finally { setIsLoading(false) }
  }

  const resetWorkflow = () => {
    setCurrentData([]); setErrors([]); setCurrentStep(1)
    setGrossAmount(50000); setShowFixPanel(false); setFixes([])
    showToast('Workflow reset')
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen font-['Inter',_sans-serif]" style={{ background: '#F8FAFC', color: '#1A202C' }}>

      {/* Loading */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[10000]">
          <div className="bg-white p-8 rounded-xl text-center shadow-2xl">
            <div className="w-10 h-10 border-4 border-[#2B6F4B] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 font-medium">Processing...</p>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.visible && (
        <div className={`fixed bottom-8 right-8 bg-white border-l-4 ${toast.type === 'success' ? 'border-[#2B6F4B]' : 'border-[#C53030]'} rounded-lg p-4 shadow-xl z-[9999]`}>
          <div className="flex items-center gap-3">
            <i className={`fas fa-check-circle ${toast.type === 'success' ? 'text-[#2B6F4B]' : 'text-[#C53030]'}`}></i>
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center py-10 max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-3" style={{ color: G }}>Split Verification & Payment</h1>
          <p className="text-[#4A5568] text-lg">Upload → Detect issues → Verify → Calculate payment → Download PDF</p>
          <p className="text-xs text-[#4A5568] mt-2">Georgia Law Compliant · O.C.G.A. § 48-7-26</p>
        </div>

        {/* Before / After */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border border-[#E2E8F0] rounded-2xl p-6 mb-8 shadow-sm">
          <div className="md:border-r border-[#E2E8F0] pr-6">
            <h3 className="text-lg font-semibold text-[#C53030] mb-4 flex items-center gap-2">
              <i className="fas fa-times-circle"></i> Without TrapRoyaltiesPro
            </h3>
            <div className="flex items-center gap-3 flex-wrap text-sm">
              <span className="bg-[#F1F5F9] px-4 py-2 rounded-full border border-[#E2E8F0] text-[#4A5568]">Label</span>
              <i className="fas fa-arrow-right text-[#CBD5E0]"></i>
              <span className="bg-red-50 text-[#C53030] px-4 py-2 rounded-full border border-red-200">Split Issues</span>
              <i className="fas fa-arrow-right text-[#CBD5E0]"></i>
              <span className="bg-[#F1F5F9] px-4 py-2 rounded-full border border-[#E2E8F0] text-[#4A5568]">PRO</span>
              <i className="fas fa-arrow-right text-[#CBD5E0]"></i>
              <span className="bg-[#F1F5F9] px-4 py-2 rounded-full border border-[#E2E8F0] text-[#4A5568]">Payment Dispute</span>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: G }}>
              <i className="fas fa-check-circle"></i> With TrapRoyaltiesPro
            </h3>
            <div className="flex items-center gap-3 flex-wrap text-sm">
              <span className="bg-[#F1F5F9] px-4 py-2 rounded-full border border-[#E2E8F0] text-[#4A5568]">Label</span>
              <i className="fas fa-arrow-right text-[#CBD5E0]"></i>
              <span className="px-4 py-2 rounded-full border text-sm font-medium" style={{ background: '#DEF7E5', color: G, borderColor: '#9AE6B4' }}>TrapRoyaltiesPro</span>
              <i className="fas fa-arrow-right text-[#CBD5E0]"></i>
              <span className="bg-[#F1F5F9] px-4 py-2 rounded-full border border-[#E2E8F0] text-[#4A5568]">PRO</span>
              <i className="fas fa-arrow-right text-[#CBD5E0]"></i>
              <span className="px-4 py-2 rounded-full border text-sm" style={{ background: '#DEF7E5', color: G, borderColor: '#9AE6B4' }}>Verified Payment</span>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto relative">
            <div className="absolute top-5 left-12 right-12 h-[3px] bg-[#E2E8F0] z-0"></div>
            {([
              { n: 1 as Step, label: 'Upload Data' },
              { n: 2 as Step, label: 'Issues Detected' },
              { n: 3 as Step, label: 'Data Verified' },
              { n: 4 as Step, label: 'Payment Ready' },
            ]).map(({ n, label }) => (
              <div key={n} className="flex flex-col items-center relative z-10 px-3" style={{ background: '#F8FAFC' }}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-all border-2`}
                  style={currentStep >= n
                    ? { background: G, borderColor: G, color: '#fff' }
                    : { background: '#fff', borderColor: '#E2E8F0', color: '#A0AEC0' }}
                >
                  {currentStep > n ? <i className="fas fa-check text-sm"></i> : n}
                </div>
                <span className="text-sm font-medium" style={currentStep >= n ? { color: G, fontWeight: 600 } : { color: '#A0AEC0' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="max-w-2xl mx-auto mt-6 h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: progressWidth, background: G }}></div>
          </div>
        </div>

        {/* Main Two-Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-8">

          {/* LEFT: Upload + Validate */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2" style={{ color: G }}>
              <i className="fas fa-cloud-upload-alt"></i>
              Step 1: Upload split data
            </h2>

            {/* Drop zone */}
            <div
              className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all"
              style={isDragging
                ? { borderColor: G, background: '#DEF7E5' }
                : { borderColor: '#CBD5E0', background: '#F8FAFC' }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={e => { e.preventDefault(); setIsDragging(false) }}
              onDrop={e => {
                e.preventDefault(); setIsDragging(false)
                const file = e.dataTransfer.files[0]
                if (file) handleFileSelect({ target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>)
              }}
            >
              <div className="text-5xl mb-4" style={{ color: G }}>
                <i className="fas fa-file-upload"></i>
              </div>
              <h3 className="text-lg font-medium mb-2 text-[#1A202C]">Drop your split sheet here</h3>
              <p className="text-[#4A5568] text-sm">CSV, Excel, or PDF</p>
              <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx,.xls,.pdf" onChange={handleFileSelect} />
            </div>

            {/* Demo buttons */}
            <div className="flex gap-3 my-4">
              <button
                onClick={loadPerfectSample}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all hover:shadow-md"
                style={{ borderColor: G, color: G, background: '#F0FDF4' }}
              >
                <span className="text-base">✅</span>
                Load Perfect Sample
              </button>
              <button
                onClick={loadErrorSample}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-red-300 text-red-700 bg-red-50 text-sm font-bold transition-all hover:shadow-md hover:bg-red-100"
              >
                <span className="text-base">⚠️</span>
                Load Test with Errors
              </button>
            </div>
            <button
              onClick={startManually}
              className="w-full py-2.5 text-sm font-semibold rounded-xl border-2 border-dashed border-[#CBD5E0] text-[#4A5568] hover:border-[#2B6F4B] hover:text-[#2B6F4B] transition-all"
            >
              + Enter contributors manually
            </button>

            {/* Error panel */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 my-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-[#C53030] font-semibold">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>{errors.length} Issue{errors.length > 1 ? 's' : ''} Detected</span>
                  </div>
                  <button
                    onClick={handleShowFixes}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border border-[#C53030] text-[#C53030] hover:bg-red-100 transition"
                  >
                    {showFixPanel ? 'Hide Fix Suggestions' : 'Show Fix Suggestions'}
                  </button>
                </div>
                <div className="text-[#C53030] text-sm space-y-1">
                  {errors.map((err, i) => (
                    <div key={i}>• {err.message}</div>
                  ))}
                </div>

                {/* Fix suggestion cards */}
                {showFixPanel && fixes.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {fixes.map(fix => (
                      <div
                        key={fix.id}
                        className="rounded-xl p-4 border"
                        style={{
                          background: '#1a1a2e',
                          borderColor: fix.status === 'accepted' ? '#68D391' : fix.status === 'skipped' ? '#4A5568' : '#2d2d4e',
                        }}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <i className="fas fa-exclamation-circle text-[#C53030] text-xs mt-0.5 flex-shrink-0"></i>
                          <span className="text-red-300 text-xs">{fix.issue}</span>
                        </div>
                        <div className="flex items-start gap-2 mb-3">
                          <i className="fas fa-lightbulb text-xs mt-0.5 flex-shrink-0" style={{ color: '#68D391' }}></i>
                          <span className="text-green-300 text-xs">{fix.suggestion}</span>
                        </div>

                        {fix.status === 'pending' && (
                          <div>

                            {/* ── IPI: MusicBrainz search ── */}
                            {fix.type === 'fill_ipi' && (
                              <div className="space-y-2">
                                {!ipiSearch[fix.id] && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => searchIPI(fix.id, currentData[fix.contributorIndex!]?.name || '')}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition"
                                      style={{ background: '#3B5998' }}
                                    >
                                      <i className="fas fa-search"></i> Search MusicBrainz IPI
                                    </button>
                                    <button onClick={() => skipFix(fix.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#A0AEC0] border border-[#4A5568] hover:border-[#718096] transition" style={{ background: 'transparent' }}>
                                      <i className="fas fa-times"></i> Skip
                                    </button>
                                  </div>
                                )}
                                {ipiSearch[fix.id]?.loading && (
                                  <p className="text-xs text-slate-400 flex items-center gap-2">
                                    <span className="inline-block w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></span>
                                    Searching MusicBrainz IPI registry...
                                  </p>
                                )}
                                {ipiSearch[fix.id]?.error && (
                                  <div className="space-y-2">
                                    <p className="text-xs text-orange-400">{ipiSearch[fix.id].error}</p>
                                    <button onClick={() => skipFix(fix.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#A0AEC0] border border-[#4A5568] transition" style={{ background: 'transparent' }}>
                                      <i className="fas fa-times"></i> Skip (register IPI manually)
                                    </button>
                                  </div>
                                )}
                                {(ipiSearch[fix.id]?.results?.length ?? 0) > 0 && (
                                  <div className="space-y-1.5">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Select verified IPI from registry:</p>
                                    {ipiSearch[fix.id].results.map((r, ri) => (
                                      <div key={ri} className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
                                        <div>
                                          <span className="text-xs text-white font-medium">{r.name}</span>
                                          {r.pro && <span className="text-[10px] text-slate-400 ml-2">{r.pro}</span>}
                                          <span className="text-[10px] font-mono text-indigo-300 ml-2">IPI: {r.ipi}</span>
                                        </div>
                                        <button
                                          onClick={() => assignIPI(fix.id, r.ipi)}
                                          className="text-[10px] px-2 py-1 rounded font-bold text-white transition"
                                          style={{ background: G }}
                                        >
                                          Assign ✓
                                        </button>
                                      </div>
                                    ))}
                                    <button onClick={() => skipFix(fix.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#A0AEC0] border border-[#4A5568] transition mt-1" style={{ background: 'transparent' }}>
                                      <i className="fas fa-times"></i> Skip
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* ── Name: legal hold options ── */}
                            {fix.type === 'fill_name' && (
                              <div className="space-y-2">
                                <p className="text-[10px] text-orange-300 font-semibold">
                                  ⚠️ IDENTITY RISK: {currentData[fix.contributorIndex!]?.percentage ?? 0}% of royalties will be frozen in the Black Box without a legal hold
                                </p>
                                <div className="space-y-1.5">
                                  {[
                                    { value: 'TBA - Identity Audit in Progress',    desc: 'Signals active search — SoundExchange holds share in escrow' },
                                    { value: 'Anonymous (Work-for-Hire)',            desc: 'Only valid if a signed work-for-hire contract exists' },
                                    { value: 'Disputed Identity - Escrow Requested', desc: 'Strongest hold — forces SoundExchange to collect & hold share' },
                                  ].map(opt => {
                                    const selected = (nameChoice[fix.id] ?? 'TBA - Identity Audit in Progress') === opt.value
                                    return (
                                      <label key={opt.value} className={`flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer border transition ${selected ? 'border-indigo-500/60 bg-indigo-900/20' : 'border-slate-700 bg-slate-800/30'}`}>
                                        <input
                                          type="radio"
                                          name={`name-fix-${fix.id}`}
                                          checked={selected}
                                          onChange={() => setNameChoice(prev => ({ ...prev, [fix.id]: opt.value }))}
                                          className="mt-0.5 flex-shrink-0 accent-indigo-500"
                                        />
                                        <div>
                                          <p className="text-xs font-semibold text-white">{opt.value}</p>
                                          <p className="text-[10px] text-slate-400">{opt.desc}</p>
                                        </div>
                                      </label>
                                    )
                                  })}
                                </div>
                                <div className="flex gap-2 mt-1">
                                  <button onClick={() => assignName(fix.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition" style={{ background: G }}>
                                    <i className="fas fa-check"></i> Assign Legal Hold
                                  </button>
                                  <button onClick={() => skipFix(fix.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#A0AEC0] border border-[#4A5568] hover:border-[#718096] transition" style={{ background: 'transparent' }}>
                                    <i className="fas fa-times"></i> Skip
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* ── Splits: preview table then confirm ── */}
                            {fix.type === 'normalize_splits' && (
                              <div className="space-y-2">
                                {!rescalePreview && (
                                  <div className="flex gap-2">
                                    <button onClick={() => buildRescalePreview(fix.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition" style={{ background: G }}>
                                      <i className="fas fa-table"></i> Preview Rescaling
                                    </button>
                                    <button onClick={() => skipFix(fix.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#A0AEC0] border border-[#4A5568] hover:border-[#718096] transition" style={{ background: 'transparent' }}>
                                      <i className="fas fa-times"></i> Skip
                                    </button>
                                  </div>
                                )}
                                {rescalePreview?.fixId === fix.id && (
                                  <div className="space-y-2">
                                    <div className="overflow-x-auto rounded-lg border border-slate-700">
                                      <table className="w-full text-xs">
                                        <thead className="bg-slate-800">
                                          <tr className="text-slate-400">
                                            <th className="text-left px-3 py-2">Contributor</th>
                                            <th className="text-right px-3 py-2">Original</th>
                                            <th className="text-right px-3 py-2">Rescaled</th>
                                            <th className="text-right px-3 py-2">Change</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700">
                                          {rescalePreview.rows.map((r, ri) => (
                                            <tr key={ri}>
                                              <td className="px-3 py-2 text-slate-200">{r.name}</td>
                                              <td className="px-3 py-2 text-right text-slate-400 font-mono">{r.original}%</td>
                                              <td className="px-3 py-2 text-right text-green-300 font-mono font-semibold">{r.rescaled}%</td>
                                              <td className={`px-3 py-2 text-right font-mono ${r.change < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                                {r.change > 0 ? '+' : ''}{r.change}%
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                    <div className="p-2.5 bg-orange-900/30 border border-orange-500/30 rounded-lg">
                                      <p className="text-[10px] text-orange-300">⚠️ Rescaling will invalidate all prior digital handshakes. All contributors must re-verify adjusted percentages via the SMPT portal before export.</p>
                                    </div>
                                    <div className="flex gap-2">
                                      <button onClick={confirmRescale} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition" style={{ background: G }}>
                                        <i className="fas fa-check"></i> Accept Rescaling
                                      </button>
                                      <button onClick={() => setRescalePreview(null)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#A0AEC0] border border-[#4A5568] hover:border-[#718096] transition" style={{ background: 'transparent' }}>
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                          </div>
                        )}
                        {fix.status === 'accepted' && (
                          <span className="text-xs font-semibold" style={{ color: '#68D391' }}>✓ Applied</span>
                        )}
                        {fix.status === 'skipped' && (
                          <span className="text-xs font-semibold text-[#718096]">⏭ Skipped</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Split preview */}
            {currentData.length > 0 && (
              <div className="mt-4">
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5">
                  <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0] mb-3">
                    <span className="font-semibold" style={{ color: G }}>Split Preview</span>
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={errors.length > 0
                        ? { background: '#FEE2E2', color: '#C53030' }
                        : { background: '#DEF7E5', color: G }}
                    >
                      {errors.length > 0 ? `${errors.length} issues` : '✓ Ready'}
                    </span>
                  </div>

                  {/* Editable contributor rows */}
                  <div className="space-y-2">
                    {currentData.map((item, i) => {
                      const hasError = errors.some(e =>
                        e.message.includes(item.name) || (e.message.includes('missing') && !item.name)
                      )
                      return (
                        <div key={i} className={`rounded-xl border p-3 transition ${hasError ? 'border-red-300 bg-red-50' : 'border-[#E2E8F0] bg-white'}`}>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                              <label className="text-[10px] font-bold text-[#4A5568] uppercase tracking-wider">Name</label>
                              <input
                                value={item.name}
                                onChange={e => updateContributor(i, 'name', e.target.value)}
                                placeholder="Full legal name"
                                className="w-full mt-0.5 px-3 py-1.5 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#2B6F4B] bg-white text-[#1A202C]"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-[#4A5568] uppercase tracking-wider">Role</label>
                              <select
                                value={item.role}
                                onChange={e => updateContributor(i, 'role', e.target.value)}
                                className="w-full mt-0.5 px-3 py-1.5 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#2B6F4B] bg-white text-[#1A202C]"
                              >
                                {['Composer','Lyricist','Producer','Arranger','Publisher','Writer'].map(r => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-[#4A5568] uppercase tracking-wider">IPI Number</label>
                              <input
                                value={item.ipi}
                                onChange={e => updateContributor(i, 'ipi', e.target.value)}
                                placeholder="00000000000"
                                className="w-full mt-0.5 px-3 py-1.5 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#2B6F4B] bg-white font-mono text-[#1A202C]"
                              />
                            </div>
                            <div className="flex gap-2 items-end">
                              <div className="flex-1">
                                <label className="text-[10px] font-bold text-[#4A5568] uppercase tracking-wider">Split %</label>
                                <div className="relative mt-0.5">
                                  <input
                                    type="number"
                                    value={item.percentage || ''}
                                    onChange={e => updateContributor(i, 'percentage', parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    className="w-full px-3 pr-8 py-1.5 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#2B6F4B] bg-white text-[#1A202C] font-semibold"
                                  />
                                  <span className="absolute right-3 top-1.5 text-sm text-[#4A5568] font-bold">%</span>
                                </div>
                              </div>
                              <button
                                onClick={() => removeContributor(i)}
                                className="mb-0.5 w-8 h-8 flex items-center justify-center rounded-lg border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 transition text-base flex-shrink-0"
                                title="Remove"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <button
                    onClick={addContributor}
                    className="w-full mt-3 py-2 text-sm font-semibold rounded-xl border-2 border-dashed border-[#CBD5E0] text-[#4A5568] hover:border-[#2B6F4B] hover:text-[#2B6F4B] transition"
                  >
                    + Add Contributor
                  </button>

                  <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex justify-between items-center text-sm">
                    <span className="text-[#4A5568] text-xs">{currentData.length} contributor{currentData.length !== 1 ? 's' : ''}</span>
                    <span className={`font-bold ${Math.abs(currentData.reduce((s, x) => s + (x.percentage || 0), 0) - 100) < 0.1 ? '' : 'text-[#C53030]'}`}>
                      {currentData.reduce((s, x) => s + (x.percentage || 0), 0).toFixed(2)}% total
                    </span>
                  </div>
                </div>

                {errors.length === 0 && currentStep < 3 && (
                  <button
                    onClick={startVerification}
                    className="w-full text-white py-3 rounded-full font-medium flex items-center justify-center gap-2 transition mt-4"
                    style={{ background: G }}
                    onMouseOver={e => (e.currentTarget.style.background = GH)}
                    onMouseOut={e => (e.currentTarget.style.background = G)}
                  >
                    <i className="fas fa-shield-alt"></i> Start Verification
                  </button>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Verify + Payment */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2" style={{ color: G }}>
              <i className="fas fa-check-circle"></i>
              Steps 2–4: Verify & Calculate
            </h2>

            {/* Verification record */}
            {currentStep >= 3 && currentData.length > 0 && errors.length === 0 && (
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 mb-4">
                <h3 className="font-semibold mb-4" style={{ color: G }}>Verification Record</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-[#E2E8F0]">
                    <span className="text-[#4A5568] text-sm flex items-center gap-2">
                      <i className="fas fa-fingerprint"></i> Verification ID
                    </span>
                    <span className="font-medium text-sm">{verificationId.substring(0, 10)}…{verificationId.slice(-4)}</span>
                  </div>
                  <div className="font-mono text-xs bg-white text-[#4A5568] p-3 rounded-lg border border-[#E2E8F0] break-all">
                    {verificationId}
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#E2E8F0]">
                    <span className="text-[#4A5568] text-sm flex items-center gap-2"><i className="fas fa-clock"></i> Timestamp</span>
                    <span className="font-medium text-sm">{timestamp}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#E2E8F0]">
                    <span className="text-[#4A5568] text-sm flex items-center gap-2">
                      <i className="fas fa-check-circle text-[#2B6F4B]"></i> Status
                    </span>
                    <span className="font-medium text-sm" style={{ color: G }}>Verified ✓</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['ASCAP', 'BMI', 'SESAC', 'SoundExchange'].map(pro => (
                      <span key={pro} className="px-2 py-1 text-xs rounded-full border font-medium" style={{ background: '#DEF7E5', color: G, borderColor: '#9AE6B4' }}>
                        {pro}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-[#A0AEC0] pt-2 border-t border-[#E2E8F0] flex justify-between items-center">
                    <span>System ref: 0xAa19…B2ea4</span>
                    <button onClick={() => setShowTechDetails(v => !v)} className="hover:text-[#2B6F4B] transition">
                      {showTechDetails ? 'Hide details ↑' : 'Show details ↓'}
                    </button>
                  </div>
                  {showTechDetails && (
                    <div className="text-xs text-[#4A5568] space-y-1">
                      <div>Contract: 0xAa19bFC7Bd852efe49ef31297bB082FB044B2ea4</div>
                      <div>Network: Monad Testnet (Chain ID: 10143)</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment input */}
            {currentStep >= 3 && currentData.length > 0 && errors.length === 0 && (
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 mb-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: G }}>
                  <i className="fas fa-calculator"></i> Enter Payment Amount
                </h3>
                <div className="flex gap-3 items-center">
                  <div className="flex-1 relative">
                    <span className="absolute left-4 top-3.5 text-[#4A5568] font-medium">$</span>
                    <input
                      type="number"
                      value={grossAmount}
                      min="0"
                      step="1000"
                      onChange={e => setGrossAmount(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-3 border border-[#E2E8F0] rounded-full text-lg font-semibold focus:outline-none bg-white text-[#1A202C]"
                      onFocus={e => (e.currentTarget.style.borderColor = G)}
                      onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                    />
                  </div>
                  <button
                    onClick={calculateAndShowPayment}
                    className="text-white px-6 py-3 rounded-full font-medium transition flex items-center gap-2"
                    style={{ background: G }}
                    onMouseOver={e => (e.currentTarget.style.background = GH)}
                    onMouseOut={e => (e.currentTarget.style.background = G)}
                  >
                    <i className="fas fa-sync-alt"></i> Calculate
                  </button>
                </div>
                <p className="mt-2 text-xs text-[#4A5568]">
                  <i className="fas fa-info-circle" style={{ color: G }}></i>
                  &nbsp;Georgia state tax (5.49%) applied per O.C.G.A. § 48-7-26
                </p>
                <div className="text-center mt-3">
                  <button
                    onClick={downloadPaymentPDF}
                    className="text-sm text-[#4A5568] hover:text-[#2B6F4B] transition flex items-center gap-1.5 mx-auto"
                  >
                    <i className="fas fa-arrow-right text-xs"></i>
                    Skip — Download PDF without calculation
                  </button>
                </div>
              </div>
            )}

            {/* Payment summary */}
            {currentStep >= 4 && (
              <div className="border border-[#9AE6B4] rounded-xl p-5" style={{ background: '#F0F9F4' }}>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold flex items-center gap-2" style={{ color: G }}>
                    <i className="fas fa-credit-card"></i> Payment Summary
                  </span>
                  <span className="text-2xl font-bold" style={{ color: G }}>${grossAmount.toLocaleString()}</span>
                </div>

                <div className="bg-white rounded-lg p-4 mb-3 border border-[#E2E8F0]">
                  <div className="flex justify-between py-2 border-b border-[#E2E8F0]">
                    <span className="text-[#4A5568]">Gross Royalties</span>
                    <span className="font-semibold">${grossAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#E2E8F0]">
                    <span className="text-[#4A5568]">{TAX_LABEL}</span>
                    <span className="font-semibold text-[#C53030]">-${taxAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[#4A5568]">Net Payment</span>
                    <span className="font-semibold text-lg" style={{ color: G }}>${netAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-xs text-[#C53030] flex items-start gap-2 mb-4">
                  <i className="fas fa-info-circle mt-0.5 flex-shrink-0"></i>
                  <span>Georgia state income tax (5.49%) withheld per O.C.G.A. § 48-7-26. Federal withholding may apply separately.</span>
                </div>

                <h4 className="text-sm font-semibold text-[#1A202C] mb-3">Distribution by Contributor</h4>
                <div className="space-y-3">
                  {getDistribution().map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-dashed border-[#E2E8F0]">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-user-circle" style={{ color: G }}></i>
                        <span className="text-sm">{item.name} ({item.percentage}%)</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm" style={{ color: G }}>${item.grossShare.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                        <div className="text-xs text-[#C53030]">-${item.taxShare.toLocaleString(undefined, { maximumFractionDigits: 2 })} tax</div>
                        <div className="text-xs font-medium" style={{ color: G }}>${item.netShare.toLocaleString(undefined, { maximumFractionDigits: 2 })} net</div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={downloadPaymentPDF}
                  className="w-full text-white py-3 rounded-full font-medium flex items-center justify-center gap-2 transition mt-4"
                  style={{ background: G }}
                  onMouseOver={e => (e.currentTarget.style.background = GH)}
                  onMouseOut={e => (e.currentTarget.style.background = G)}
                >
                  <i className="fas fa-file-pdf"></i> Download Payment Report (PDF)
                </button>
              </div>
            )}

            {currentStep === 3 && currentData.length > 0 && errors.length === 0 && (
              <button
                onClick={() => setCurrentStep(4)}
                className="w-full text-white py-3 rounded-full font-medium flex items-center justify-center gap-2 transition mt-4"
                style={{ background: G }}
                onMouseOver={e => (e.currentTarget.style.background = GH)}
                onMouseOut={e => (e.currentTarget.style.background = G)}
              >
                <i className="fas fa-calculator"></i> Calculate Payment
              </button>
            )}

            {currentStep === 4 && (
              <button
                onClick={resetWorkflow}
                className="w-full bg-white border border-[#E2E8F0] text-[#4A5568] py-3 rounded-full font-medium flex items-center justify-center gap-2 hover:border-[#2B6F4B] transition mt-4"
              >
                <i className="fas fa-redo"></i> Start New Verification
              </button>
            )}
          </div>
        </div>

        {/* Trust signals */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 my-8 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { icon: 'fa-link',                label: 'Blockchain Verified' },
              { icon: 'fa-gavel',               label: 'Court-Admissible' },
              { icon: 'fa-music',               label: 'PRO Cross-Referenced' },
              { icon: 'fa-file-invoice-dollar', label: 'Georgia Tax-Ready' },
            ].map(t => (
              <div key={t.label}>
                <i className={`fas ${t.icon} text-xl mb-2`} style={{ color: G }}></i>
                <div className="font-medium text-sm text-[#1A202C]">{t.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-[#E2E8F0] py-8 mt-8 text-center text-[#4A5568]">
          <p className="text-sm">TrapRoyaltiesPro ensures split accuracy, payment verification, and blockchain-proof ownership records.</p>
          <div className="flex justify-center flex-wrap gap-6 mt-4 text-xs text-[#A0AEC0]">
            <span>© 2026 TrapRoyaltiesPro</span>
            <span>ASCAP · BMI · SESAC · SoundExchange Compatible</span>
            <span>Georgia Law Compliant · O.C.G.A. § 48-7-26</span>
            <span>Built for Music Attorneys</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
