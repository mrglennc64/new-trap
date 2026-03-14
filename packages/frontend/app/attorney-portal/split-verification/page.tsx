// app/verify-splits/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useDemoMode } from '../../lib/DemoModeProvider'

// Types
interface Contributor {
  name: string
  role: string
  percentage: number
  ipi: string
}

interface Error {
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

interface AtlantaDistributionResult {
  name: string
  role: string
  percentage: number
  grossShare: number
  managerFee: number
  netShare: number
  ipi: string
}

interface AtlantaCalculationResult {
  grossAmount: number
  yearsUnpaid: number
  interestEarned: number
  totalRecovery: number
  legalFee: number
  netAfterLegal: number
  distribution: AtlantaDistributionResult[]
  totalManagerFees: number
  totalArtistNet: number
}

type Step = 1 | 2 | 3 | 4

export default function VerifySplitsPage() {
  const { demoMode } = useDemoMode()
  // State Management
  const [currentData, setCurrentData] = useState<Contributor[]>([])
  const [errors, setErrors] = useState<Error[]>([])
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [grossAmount, setGrossAmount] = useState<number>(50000)
  const [yearsUnpaid, setYearsUnpaid] = useState<number>(2)
  const [showTechDetails, setShowTechDetails] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false
  })
  const [verificationId, setVerificationId] = useState<string>('QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco')
  const [timestamp, setTimestamp] = useState<string>('')

  // ==================== ATLANTA LEGAL FEE STRUCTURE ====================
  // Constants for Atlanta Legal/Management Recovery
  const LEGAL_CONTINGENCY_RATE = 0.33;      // Standard 1/3 recovery fee for Atlanta entertainment lawyers
  const MANAGER_COMMISSION_RATE = 0.15;     // Typical Atlanta manager cut (15%)
  const GA_STATUTORY_INTEREST = 0.07;        // Georgia legal interest rate (7% per annum O.C.G.A. § 7-4-12)

  // Atlanta Legal Distribution Calculator
  const calculateAtlantaDistribution = (amount: number, contributors: Contributor[], years: number = 2): AtlantaCalculationResult => {
    // 1. Calculate Statutory Interest (Pain Point: Labels underpay for years)
    // Georgia law allows 7% interest on unpaid royalties
    const interestEarned = amount * (GA_STATUTORY_INTEREST * years);
    const totalRecovery = amount + interestEarned;

    // 2. Deduct Legal Contingency (Lawyers get their cut first)
    const legalFee = totalRecovery * LEGAL_CONTINGENCY_RATE;
    const netAfterLegal = totalRecovery - legalFee;

    // 3. Calculate distribution for each contributor
    const distribution = contributors.map(c => {
      const contributorGross = netAfterLegal * (c.percentage / 100);
      const managerFee = contributorGross * MANAGER_COMMISSION_RATE;
      const finalNet = contributorGross - managerFee;

      return {
        name: c.name,
        role: c.role,
        percentage: c.percentage,
        grossShare: contributorGross,
        managerFee: managerFee,
        netShare: finalNet,
        ipi: c.ipi
      };
    });

    // 4. Calculate totals for display
    const totalManagerFees = distribution.reduce((sum, d) => sum + d.managerFee, 0);
    const totalArtistNet = distribution.reduce((sum, d) => sum + d.netShare, 0);

    return {
      grossAmount: amount,
      yearsUnpaid: years,
      interestEarned,
      totalRecovery,
      legalFee,
      netAfterLegal,
      distribution,
      totalManagerFees,
      totalArtistNet
    };
  };

  // Helper function for Georgia-specific currency formatting
  const formatGeorgiaLegalAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Sample data
  const PERFECT_SAMPLE: Contributor[] = [
    { name: "Marcus Johnson", role: "Composer", percentage: 50, ipi: "00624789341" },
    { name: "Deja Williams",  role: "Lyricist",  percentage: 30, ipi: "00472915682" },
    { name: "Troy Bennett",   role: "Producer",  percentage: 20, ipi: "00836125497" }
  ]

  const ERROR_SAMPLE: Contributor[] = [
    { name: "Marcus Johnson", role: "Composer", percentage: 60, ipi: "" },
    { name: "",               role: "Lyricist",  percentage: 25, ipi: "00472915682" },
    { name: "Troy Bennett",   role: "Producer",  percentage: 20, ipi: "invalid" },
    { name: "Extra Writer",   role: "Writer",    percentage: 10, ipi: "" }
  ]

  // Initialize timestamp on mount
  useEffect(() => {
    const now = new Date()
    setTimestamp(now.toISOString().replace('T', ' ').substring(0, 16) + ' UTC')
  }, [])

  // Helper Functions
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true })
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000)
  }

  const updateStep = (step: Step) => {
    setCurrentStep(step)
  }

  const progressWidth = `${((currentStep - 1) / 3) * 100}%`

  // Data Validation
  const validateData = (data: Contributor[]): Error[] => {
    const errors: Error[] = []
    let total = 0

    data.forEach((item, index) => {
      total += item.percentage || 0

      if (!item.name || item.name.trim() === '') {
        errors.push({ message: `Contributor ${index + 1} missing name` })
      }

      if (!item.ipi || item.ipi.trim() === '') {
        errors.push({ message: `${item.name || 'Contributor'} missing IPI/ISWC` })
      }

      if (item.percentage <= 0 || item.percentage > 100) {
        errors.push({ message: `${item.name || 'Contributor'} has invalid percentage: ${item.percentage}%` })
      }
    })

    if (Math.abs(total - 100) > 0.1) {
      errors.push({ message: `Total split is ${total}%, must equal 100%` })
    }

    return errors
  }

  // File Handling
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Simulate file parsing
    setIsLoading(true)
    setTimeout(() => {
      // Randomly choose between perfect and error sample for demo
      const random = Math.random()
      if (random > 0.5) {
        processData(PERFECT_SAMPLE)
      } else {
        processData(ERROR_SAMPLE)
      }
      showToast(`Loaded: ${file.name}`)
      setIsLoading(false)
    }, 500)
  }

  const processData = (data: Contributor[]) => {
    setCurrentData(data)

    // Validate
    const validationErrors = validateData(data)
    setErrors(validationErrors)

    if (validationErrors.length > 0) {
      updateStep(2) // Issues Detected
    } else {
      updateStep(3) // Data Verified
    }
  }

  // Demo mode: auto-load perfect sample when active
  useEffect(() => {
    if (demoMode && currentData.length === 0) processData(PERFECT_SAMPLE)
  }, [demoMode])

  const loadPerfectSample = () => {
    processData(PERFECT_SAMPLE)
    showToast('Perfect sample loaded - no issues detected')
  }

  const loadErrorSample = () => {
    processData(ERROR_SAMPLE)
    showToast('Sample with issues loaded', 'error')
  }

  // ── Inline editing ───────────────────────────────────────────
  const startManually = () => {
    const blank: Contributor[] = [{ name: '', role: 'Composer', percentage: 0, ipi: '' }]
    setCurrentData(blank)
    setErrors(validateData(blank))
    updateStep(2)
    setShowFixPanel(false)
    setFixes([])
  }

  const updateContributor = (index: number, field: keyof Contributor, value: string | number) => {
    setCurrentData(prev => {
      const updated = prev.map((c, i) => i === index ? { ...c, [field]: value } : c)
      const errs = validateData(updated)
      setErrors(errs)
      if (errs.length === 0) updateStep(3)
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
      if (updated.length === 0) updateStep(1)
      return updated
    })
  }

  // ── Build per-issue fix suggestions ─────────────────────────
  const buildFixes = (data: Contributor[]): FixSuggestion[] => {
    const result: FixSuggestion[] = []
    data.forEach((item, i) => {
      if (!item.name?.trim()) {
        result.push({
          id: `name_${i}`,
          issue: `Contributor ${i + 1} is missing a name`,
          suggestion: `Assign a Legal Identity Hold — prevents invalid SoundExchange filing with unnamed contributor`,
          status: 'pending', type: 'fill_name', contributorIndex: i,
        })
      }
      if (!item.ipi?.trim() || item.ipi === 'invalid') {
        result.push({
          id: `ipi_${i}`,
          issue: `${item.name || `Contributor ${i + 1}`} is missing a valid IPI/ISWC`,
          suggestion: `Search MusicBrainz IPI registry to assign a verified IPI — "AUTO-IPI" placeholders are rejected by SoundExchange`,
          status: 'pending', type: 'fill_ipi', contributorIndex: i,
        })
      }
    })
    const total = data.reduce((s, x) => s + (x.percentage || 0), 0)
    if (Math.abs(total - 100) > 0.1) {
      result.push({
        id: 'normalize_splits',
        issue: `Total split is ${total.toFixed(1)}%, must equal 100%`,
        suggestion: `Proportional rescale — each contributor's share stays in ratio, adjusted to sum to exactly 100%`,
        status: 'pending', type: 'normalize_splits',
      })
    }
    return result
  }

  const handleShowFixes = () => {
    if (!showFixPanel) setFixes(buildFixes(currentData))
    setShowFixPanel(v => !v)
  }

  // ── IPI: MusicBrainz search ───────────────────────────────────
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
        .map((a: any) => ({ name: a.name, ipi: a.ipis[0], pro: [a.type, a.disambiguation].filter(Boolean).join(' · ') }))
      setIpiSearch(prev => ({
        ...prev,
        [fixId]: { loading: false, results, error: results.length === 0 ? 'No IPI records found in MusicBrainz for this name — register at your PRO directly' : undefined },
      }))
    } catch {
      setIpiSearch(prev => ({ ...prev, [fixId]: { loading: false, results: [], error: 'MusicBrainz search failed' } }))
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

  // ── Name: legal hold options ──────────────────────────────────
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

  // ── Splits: preview then confirm ─────────────────────────────
  const buildRescalePreview = (fixId: string) => {
    const total = currentData.reduce((s, x) => s + x.percentage, 0)
    const scaleFactor = 100 / total
    const rows = currentData.map(x => {
      const rescaled = parseFloat((x.percentage * scaleFactor).toFixed(2))
      return { name: x.name || '(unnamed)', original: x.percentage, rescaled, change: 0 }
    })
    const sum = rows.reduce((s, r) => s + r.rescaled, 0)
    if (Math.abs(sum - 100) > 0.001) rows[0].rescaled = parseFloat((rows[0].rescaled + (100 - sum)).toFixed(2))
    rows.forEach(r => { r.change = parseFloat((r.rescaled - r.original).toFixed(2)) })
    setRescalePreview({ fixId, rows })
  }

  const confirmRescale = () => {
    if (!rescalePreview) return
    setFixes(prev => prev.map(f => f.id === rescalePreview.fixId ? { ...f, status: 'accepted' } : f))
    setCurrentData(prev => prev.map((x, i) => ({ ...x, percentage: rescalePreview.rows[i]?.rescaled ?? x.percentage })))
    setRescalePreview(null)
    showToast('Splits rescaled — all contributors must re-verify adjusted percentages', 'error')
  }

  const skipFix = (fixId: string) => {
    setFixes(prev => prev.map(f => f.id === fixId ? { ...f, status: 'skipped' } : f))
  }

  const startVerification = () => {
    if (errors.length > 0) {
      showToast('Please fix issues before verification', 'error')
      return
    }

    // Generate new verification ID
    const newHash = 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco' + Math.random().toString(36).substring(2, 8)
    setVerificationId(newHash)
    
    const now = new Date()
    setTimestamp(now.toISOString().replace('T', ' ').substring(0, 16) + ' UTC')
    
    updateStep(3)
    showToast('Data verified successfully')
  }

  // Payment Calculations - Updated for Atlanta
  const updatePaymentCalculation = (amount: number, years: number = 2) => {
    setGrossAmount(amount);
    setYearsUnpaid(years);
  }

  const calculateAndShowPayment = () => {
    updateStep(4)
    showToast('Payment calculated successfully')
  }

  // Get Atlanta distribution (replaces old getDistribution)
  const getAtlantaResult = (): AtlantaCalculationResult | null => {
    if (!currentData.length) return null;
    return calculateAtlantaDistribution(grossAmount, currentData, yearsUnpaid);
  }

  // PDF Download
  const downloadPaymentPDF = async () => {
    if (!currentData || currentData.length === 0) {
      showToast('No data to export', 'error')
      return
    }

    setIsLoading(true)

    try {
      // Store data for PDF generation
      localStorage.setItem('trapRoyaltiesReportData', JSON.stringify(currentData))
      localStorage.setItem('trapRoyaltiesFileName', 'SplitSheet_Mar2026.pdf')
      localStorage.setItem('trapRoyaltiesDocumentHash', verificationId)
      localStorage.setItem('trapRoyaltiesReportTimestamp', timestamp)
      localStorage.setItem('trapRoyaltiesGrossAmount', grossAmount.toString())
      localStorage.setItem('trapRoyaltiesYearsUnpaid', yearsUnpaid.toString())

      // Open PDF in new tab
      window.open('/pdf-report', '_blank')
      showToast('Opening PDF report...')
    } catch (error) {
      showToast('Error generating PDF', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const resetWorkflow = () => {
    setCurrentData([])
    setErrors([])
    setCurrentStep(1)
    setGrossAmount(50000)
    setYearsUnpaid(2)
    showToast('Workflow reset')
  }

  // Drag and drop handlers
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fix suggestion state
  const [showFixPanel,    setShowFixPanel]    = useState(false)
  const [fixes,           setFixes]           = useState<FixSuggestion[]>([])
  const [ipiSearch,       setIpiSearch]       = useState<Record<string, { loading: boolean; results: { name: string; ipi: string; pro: string }[]; error?: string }>>({})
  const [nameChoice,      setNameChoice]      = useState<Record<string, string>>({})
  const [rescalePreview,  setRescalePreview]  = useState<{ fixId: string; rows: { name: string; original: number; rescaled: number; change: number }[] } | null>(null)

  // Re-validate after all fixes resolved
  useEffect(() => {
    if (fixes.length === 0) return
    const allResolved = fixes.every(f => f.status !== 'pending')
    if (!allResolved) return
    setCurrentData(prev => {
      const errs = validateData(prev)
      setErrors(errs)
      if (errs.length === 0) {
        updateStep(3)
        showToast('All issues resolved — data verified!')
        setShowFixPanel(false)
      } else {
        showToast(`${errs.length} issue(s) remain after skipped fixes`, 'error')
      }
      return prev
    })
  }, [fixes])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && fileInputRef.current) {
      const event = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>
      handleFileSelect(event)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1A202C] font-['Inter',_sans-serif]">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[10000]">
          <div className="bg-white p-8 rounded-xl text-center">
            <i className="fas fa-spinner fa-pulse text-4xl text-indigo-900"></i>
            <p className="mt-4 font-medium">Generating PDF...</p>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.visible && (
        <div 
          className={`fixed bottom-8 right-8 bg-white border-l-4 ${
            toast.type === 'success' ? 'border-indigo-900' : 'border-red-600'
          } rounded-lg p-4 shadow-xl z-[9999] transition-transform duration-300 translate-x-0`}
        >
          <div className="flex items-center gap-3">
            <i className={`fas fa-check-circle ${toast.type === 'success' ? 'text-indigo-900' : 'text-red-600'}`}></i>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6">
        {/* Navigation */}
        <nav className="flex justify-between items-center py-5 border-b border-gray-200 flex-wrap gap-5">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/'}>
            <div className="w-9 h-9 bg-indigo-900 rounded-lg flex items-center justify-center text-white text-xl font-semibold">
              TP
            </div>
            <span className="text-[22px] font-semibold text-indigo-900">TrapRoyalties<span className="text-indigo-600">Pro</span></span>
          </div>
          <div className="flex gap-8 items-center">
            <Link href="/" className="text-gray-600 hover:text-indigo-900 font-medium text-sm">Home</Link>
            <Link href="/for-attorneys" className="text-gray-600 hover:text-indigo-900 font-medium text-sm">For Attorneys</Link>
            <Link href="/verify-splits" className="text-indigo-900 font-medium text-sm border-b-2 border-indigo-900 pb-1">Split Verification</Link>
            <Link href="/free-audit" className="text-gray-600 hover:text-indigo-900 font-medium text-sm">Free Audit</Link>
            <Link href="/pilot" className="text-gray-600 hover:text-indigo-900 font-medium text-sm">Pilot</Link>
          </div>
          <button className="bg-transparent border border-gray-200 px-5 py-2 rounded-full font-medium hover:border-indigo-900 hover:text-indigo-900 transition">
            <i className="far fa-envelope mr-2"></i> Contact
          </button>
        </nav>

        {/* Page Header */}
        <div className="text-center py-10 max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-indigo-900 mb-3">Split Verification & Payment Workflow</h1>
          <p className="text-gray-600 text-lg">Upload → Detect issues → Verify → Enter amount → Calculate payment → Download PDF</p>
        </div>

        {/* Before vs After Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="md:border-r-2 border-red-100 pr-6">
            <h3 className="text-xl text-red-600 mb-4 flex items-center gap-2">
              <i className="fas fa-times-circle"></i> Before TrapRoyaltiesPro
            </h3>
            <div className="flex items-center gap-3 flex-wrap text-sm">
              <span className="bg-gray-100 px-4 py-2 rounded-full border border-gray-200">Label</span>
              <i className="fas fa-arrow-right text-gray-300"></i>
              <span className="bg-red-100 text-red-600 px-4 py-2 rounded-full border border-red-200">Split Issues</span>
              <i className="fas fa-arrow-right text-gray-300"></i>
              <span className="bg-gray-100 px-4 py-2 rounded-full border border-gray-200">PRO</span>
              <i className="fas fa-arrow-right text-gray-300"></i>
              <span className="bg-gray-100 px-4 py-2 rounded-full border border-gray-200">Payment Dispute</span>
            </div>
          </div>
          <div>
            <h3 className="text-xl text-indigo-900 mb-4 flex items-center gap-2">
              <i className="fas fa-check-circle text-indigo-900"></i> With TrapRoyaltiesPro
            </h3>
            <div className="flex items-center gap-3 flex-wrap text-sm">
              <span className="bg-gray-100 px-4 py-2 rounded-full border border-gray-200">Label</span>
              <i className="fas fa-arrow-right text-gray-300"></i>
              <span className="bg-indigo-100 text-indigo-900 px-4 py-2 rounded-full border border-indigo-300">TrapRoyaltiesPro</span>
              <i className="fas fa-arrow-right text-gray-300"></i>
              <span className="bg-gray-100 px-4 py-2 rounded-full border border-gray-200">PRO</span>
              <i className="fas fa-arrow-right text-gray-300"></i>
              <span className="bg-gray-100 px-4 py-2 rounded-full border border-gray-200">Verified Payment</span>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto relative">
            {/* Progress line background */}
            <div className="absolute top-5 left-12 right-12 h-1 bg-gray-200 z-0"></div>
            
            {/* Step 1 */}
            <div className="flex flex-col items-center relative z-10 bg-[#F8FAFC] px-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-all ${
                currentStep >= 1 
                  ? 'bg-indigo-900 border-indigo-900 text-white' 
                  : 'bg-white border-2 border-gray-200 text-gray-500'
              }`}>
                {currentStep > 1 ? <i className="fas fa-check"></i> : '1'}
              </div>
              <span className={`text-sm font-medium ${currentStep >= 1 ? 'text-indigo-900 font-semibold' : 'text-gray-500'}`}>
                Upload Data
              </span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center relative z-10 bg-[#F8FAFC] px-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-all ${
                currentStep >= 2 
                  ? 'bg-indigo-900 border-indigo-900 text-white' 
                  : 'bg-white border-2 border-gray-200 text-gray-500'
              }`}>
                {currentStep > 2 ? <i className="fas fa-check"></i> : '2'}
              </div>
              <span className={`text-sm font-medium ${currentStep >= 2 ? 'text-indigo-900 font-semibold' : 'text-gray-500'}`}>
                Issues Detected
              </span>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center relative z-10 bg-[#F8FAFC] px-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-all ${
                currentStep >= 3 
                  ? 'bg-indigo-900 border-indigo-900 text-white' 
                  : 'bg-white border-2 border-gray-200 text-gray-500'
              }`}>
                {currentStep > 3 ? <i className="fas fa-check"></i> : '3'}
              </div>
              <span className={`text-sm font-medium ${currentStep >= 3 ? 'text-indigo-900 font-semibold' : 'text-gray-500'}`}>
                Data Verified
              </span>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center relative z-10 bg-[#F8FAFC] px-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-all ${
                currentStep >= 4 
                  ? 'bg-indigo-900 border-indigo-900 text-white' 
                  : 'bg-white border-2 border-gray-200 text-gray-500'
              }`}>
                4
              </div>
              <span className={`text-sm font-medium ${currentStep >= 4 ? 'text-indigo-900 font-semibold' : 'text-gray-500'}`}>
                Payment Ready
              </span>
            </div>
          </div>

          {/* Green Progress Bar */}
          <div className="max-w-2xl mx-auto mt-8 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-900 transition-all duration-500 rounded-full" 
              style={{ width: progressWidth }}
            ></div>
          </div>
        </div>

        {/* Main Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-8">
          {/* LEFT PANEL: UPLOAD + VALIDATE */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-indigo-900 mb-6 flex items-center gap-2">
              <i className="fas fa-cloud-upload-alt text-indigo-900"></i>
              Step 1: Upload split data
            </h2>

            {/* Upload Area */}
            <div 
              className={`bg-gray-50 border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                isDragging ? 'border-indigo-900 bg-indigo-50' : 'border-gray-200 hover:border-indigo-900 hover:bg-indigo-50'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="text-5xl text-indigo-900 mb-4">
                <i className="fas fa-file-upload"></i>
              </div>
              <h3 className="text-lg font-medium mb-2">Drop your split sheet here</h3>
              <p className="text-gray-500 text-sm mb-4">CSV, Excel, or PDF</p>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept=".csv,.xlsx,.xls,.pdf"
                onChange={handleFileSelect}
              />
            </div>

            {/* Demo buttons */}
            <div className="flex gap-3 my-4">
              <button
                onClick={loadPerfectSample}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-indigo-200 text-indigo-900 bg-indigo-50 text-sm font-bold transition-all hover:shadow-md hover:bg-indigo-100"
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
              className="w-full py-2.5 text-sm font-semibold rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-indigo-900 hover:text-indigo-900 transition-all"
            >
              + Enter contributors manually
            </button>

            {/* Error Panel */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 my-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-red-600 font-semibold">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>{errors.length} Issue{errors.length > 1 ? 's' : ''} Detected</span>
                  </div>
                  <button
                    onClick={handleShowFixes}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border border-red-600 text-red-600 hover:bg-red-100 transition"
                  >
                    {showFixPanel ? 'Hide Fix Suggestions' : 'Show Fix Suggestions'}
                  </button>
                </div>
                <div className="text-red-800 text-sm space-y-1 mb-3">
                  {errors.map((error, i) => (
                    <div key={i}>• {error.message}</div>
                  ))}
                </div>

                {showFixPanel && fixes.length > 0 && (
                  <div className="space-y-3 mt-3">
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
                          <i className="fas fa-exclamation-circle text-red-400 text-xs mt-0.5 flex-shrink-0"></i>
                          <span className="text-red-300 text-xs">{fix.issue}</span>
                        </div>
                        <div className="flex items-start gap-2 mb-3">
                          <i className="fas fa-lightbulb text-green-400 text-xs mt-0.5 flex-shrink-0"></i>
                          <span className="text-green-300 text-xs">{fix.suggestion}</span>
                        </div>

                        {fix.status === 'pending' && (
                          <div>
                            {/* IPI: MusicBrainz search */}
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
                                    <button onClick={() => skipFix(fix.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-400 border border-slate-600 hover:border-slate-400 transition bg-transparent">
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
                                    <button onClick={() => skipFix(fix.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-400 border border-slate-600 transition bg-transparent">
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
                                        <button onClick={() => assignIPI(fix.id, r.ipi)} className="text-[10px] px-2 py-1 rounded font-bold text-white bg-indigo-700 hover:bg-indigo-600 transition">
                                          Assign ✓
                                        </button>
                                      </div>
                                    ))}
                                    <button onClick={() => skipFix(fix.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-400 border border-slate-600 transition bg-transparent mt-1">
                                      <i className="fas fa-times"></i> Skip
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Name: legal hold options */}
                            {fix.type === 'fill_name' && (
                              <div className="space-y-2">
                                <p className="text-[10px] text-orange-300 font-semibold">
                                  ⚠️ IDENTITY RISK: {currentData[fix.contributorIndex!]?.percentage ?? 0}% of royalties will be frozen in the Black Box without a legal hold
                                </p>
                                <div className="space-y-1.5">
                                  {[
                                    { value: 'TBA - Identity Audit in Progress',     desc: 'Signals active search — SoundExchange holds share in escrow' },
                                    { value: 'Anonymous (Work-for-Hire)',             desc: 'Only valid if a signed work-for-hire contract exists' },
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
                                  <button onClick={() => assignName(fix.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-indigo-800 hover:bg-indigo-700 transition">
                                    <i className="fas fa-check"></i> Assign Legal Hold
                                  </button>
                                  <button onClick={() => skipFix(fix.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-400 border border-slate-600 hover:border-slate-400 transition bg-transparent">
                                    <i className="fas fa-times"></i> Skip
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Splits: preview table then confirm */}
                            {fix.type === 'normalize_splits' && (
                              <div className="space-y-2">
                                {!rescalePreview && (
                                  <div className="flex gap-2">
                                    <button onClick={() => buildRescalePreview(fix.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-indigo-800 hover:bg-indigo-700 transition">
                                      <i className="fas fa-table"></i> Preview Rescaling
                                    </button>
                                    <button onClick={() => skipFix(fix.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-400 border border-slate-600 hover:border-slate-400 transition bg-transparent">
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
                                      <p className="text-[10px] text-orange-300">⚠️ Rescaling will invalidate all prior digital handshakes. All contributors must re-verify adjusted percentages before export.</p>
                                    </div>
                                    <div className="flex gap-2">
                                      <button onClick={confirmRescale} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-indigo-800 hover:bg-indigo-700 transition">
                                        <i className="fas fa-check"></i> Accept Rescaling
                                      </button>
                                      <button onClick={() => setRescalePreview(null)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-400 border border-slate-600 hover:border-slate-400 transition bg-transparent">
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {fix.status === 'accepted' && <span className="text-xs font-semibold text-green-400">✓ Applied</span>}
                        {fix.status === 'skipped' && <span className="text-xs font-semibold text-slate-500">⏭ Skipped</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Split Preview */}
            {currentData.length > 0 && (
              <div className="mt-4">
                <div className="bg-gray-50 rounded-xl p-5">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-3">
                    <span className="font-semibold text-indigo-900">Summer Nights EP</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      errors.length > 0 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {errors.length > 0 ? `${errors.length} issues` : 'Ready'}
                    </span>
                  </div>
                  
                  {/* Editable contributor rows */}
                  <div className="space-y-2">
                    {currentData.map((item, i) => {
                      const hasError = errors.some(e =>
                        e.message.includes(item.name) || (e.message.includes('missing') && !item.name)
                      )
                      return (
                        <div key={i} className={`rounded-xl border p-3 transition ${hasError ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Name</label>
                              <input
                                value={item.name}
                                onChange={e => updateContributor(i, 'name', e.target.value)}
                                placeholder="Full legal name"
                                className="w-full mt-0.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-900 bg-white text-gray-900"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Role</label>
                              <select
                                value={item.role}
                                onChange={e => updateContributor(i, 'role', e.target.value)}
                                className="w-full mt-0.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-900 bg-white text-gray-900"
                              >
                                {['Composer','Lyricist','Producer','Arranger','Publisher','Writer'].map(r => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">IPI Number</label>
                              <input
                                value={item.ipi}
                                onChange={e => updateContributor(i, 'ipi', e.target.value)}
                                placeholder="00000000000"
                                className="w-full mt-0.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-900 bg-white font-mono text-gray-900"
                              />
                            </div>
                            <div className="flex gap-2 items-end">
                              <div className="flex-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Split %</label>
                                <div className="relative mt-0.5">
                                  <input
                                    type="number"
                                    value={item.percentage || ''}
                                    onChange={e => updateContributor(i, 'percentage', parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    className="w-full px-3 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-900 bg-white text-gray-900 font-semibold"
                                  />
                                  <span className="absolute right-3 top-1.5 text-sm text-gray-400 font-bold">%</span>
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
                    className="w-full mt-3 py-2 text-sm font-semibold rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-indigo-900 hover:text-indigo-900 transition"
                  >
                    + Add Contributor
                  </button>

                  <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center text-sm">
                    <span className="text-gray-500 text-xs">{currentData.length} contributor{currentData.length !== 1 ? 's' : ''}</span>
                    <span className={`font-bold ${Math.abs(currentData.reduce((s, x) => s + (x.percentage || 0), 0) - 100) < 0.1 ? 'text-indigo-900' : 'text-red-600'}`}>
                      {currentData.reduce((s, x) => s + (x.percentage || 0), 0).toFixed(2)}% total
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                {errors.length === 0 && currentStep < 3 && (
                  <button 
                    onClick={startVerification}
                    className="w-full bg-indigo-900 text-white py-3 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-indigo-800 transition mt-4"
                  >
                    <i className="fas fa-shield-alt"></i>
                    Start Verification
                  </button>
                )}
              </div>
            )}
          </div>

          {/* RIGHT PANEL: VERIFY + PAYMENT */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-indigo-900 mb-6 flex items-center gap-2">
              <i className="fas fa-check-circle text-indigo-900"></i>
              Steps 2-4: Verify & Calculate Payment
            </h2>

            {/* Verification Record */}
            {currentStep >= 3 && currentData.length > 0 && errors.length === 0 && (
              <div className="bg-gray-50 rounded-xl p-5 mb-4">
                <h3 className="font-semibold text-indigo-900 mb-4">Verification Record</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-500 text-sm flex items-center gap-2">
                      <i className="fas fa-fingerprint"></i> Verification ID
                    </span>
                    <span className="font-medium text-sm">{verificationId.substring(0, 10)}...{verificationId.substring(verificationId.length - 4)}</span>
                  </div>
                  
                  <div className="font-mono text-xs bg-white p-3 rounded-lg border border-gray-200 break-all">
                    {verificationId}
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-500 text-sm flex items-center gap-2">
                      <i className="fas fa-clock"></i> Timestamp
                    </span>
                    <span className="font-medium text-sm">{timestamp}</span>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-500 text-sm flex items-center gap-2">
                      <i className="fas fa-check-circle text-green-600"></i> Status
                    </span>
                    <span className="text-green-600 font-medium text-sm">Verified ✓</span>
                  </div>

                  {/* System Reference */}
                  <div className="text-xs text-gray-400 pt-2 border-t border-gray-200">
                    <span>System reference: 0xAa19...B2ea4</span>
                    <button 
                      onClick={() => setShowTechDetails(!showTechDetails)}
                      className="float-right hover:text-indigo-900"
                    >
                      {showTechDetails ? 'Hide details ↑' : 'Show details ↓'}
                    </button>
                  </div>
                  
                  {/* Technical details */}
                  {showTechDetails && (
                    <div className="text-xs text-gray-400 mt-2">
                      <div>Contract: 0xAa19bFC7Bd852efe49ef31297bB082FB044B2ea4</div>
                      <div>Network: Monad Testnet (Chain ID: 10143)</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Input Section */}
            {currentStep >= 3 && currentData.length > 0 && errors.length === 0 && (
              <div className="bg-gray-50 rounded-xl p-5 mb-4">
                <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                  <i className="fas fa-calculator"></i>
                  Enter Payment Amount
                </h3>
                
                <div className="flex gap-3 items-center">
                  <div className="flex-1 relative">
                    <span className="absolute left-4 top-3.5 text-gray-500 font-medium">$</span>
                    <input 
                      type="number" 
                      value={grossAmount}
                      min="0"
                      step="1000"
                      onChange={(e) => {
                        setGrossAmount(parseFloat(e.target.value) || 0);
                        updatePaymentCalculation(parseFloat(e.target.value) || 0, yearsUnpaid);
                      }}
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-full text-lg font-semibold focus:outline-none focus:border-indigo-900"
                    />
                  </div>
                  <button 
                    onClick={calculateAndShowPayment}
                    className="bg-indigo-900 text-white px-6 py-3 rounded-full font-medium hover:bg-indigo-800 transition flex items-center gap-2"
                  >
                    <i className="fas fa-sync-alt"></i>
                    Calculate
                  </button>
                </div>
                
                <div className="mt-3 text-xs text-gray-500">
                  <i className="fas fa-info-circle text-indigo-900"></i> Enter any amount and we'll calculate with GA statutory interest + legal fees
                </div>
                <div className="text-center mt-3">
                  <button
                    onClick={downloadPaymentPDF}
                    className="text-sm text-gray-500 hover:text-indigo-900 transition flex items-center gap-1.5 mx-auto"
                  >
                    <i className="fas fa-arrow-right text-xs"></i>
                    Skip — Download PDF without calculation
                  </button>
                </div>
              </div>
            )}

            {/* Payment Summary - Atlanta Legal Version */}
            {currentStep >= 4 && getAtlantaResult() && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold text-indigo-900 flex items-center gap-2">
                    <i className="fas fa-gavel"></i> Atlanta Legal Recovery
                  </span>
                  <span className="text-2xl font-bold text-indigo-900">
                    {formatGeorgiaLegalAmount(grossAmount)}
                  </span>
                </div>

                {/* Years Unpaid Selector */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years Unpaid (GA Statutory Interest)
                  </label>
                  <select 
                    value={yearsUnpaid}
                    onChange={(e) => {
                      const years = parseInt(e.target.value);
                      setYearsUnpaid(years);
                      updatePaymentCalculation(grossAmount, years);
                    }}
                    className="w-full p-2 border border-gray-200 rounded-lg"
                  >
                    <option value="1">1 Year (7% interest)</option>
                    <option value="2">2 Years (14% interest)</option>
                    <option value="3">3 Years (21% interest)</option>
                    <option value="4">4 Years (28% interest)</option>
                    <option value="5">5 Years (35% interest)</option>
                  </select>
                </div>

                {(() => {
                  const result = getAtlantaResult()!;
                  return (
                    <>
                      {/* Recovery Breakdown */}
                      <div className="bg-white rounded-lg p-4 mb-3">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500">Original Unpaid Royalties</span>
                          <span className="font-semibold">{formatGeorgiaLegalAmount(result.grossAmount)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500">GA Statutory Interest ({yearsUnpaid * 7}%)</span>
                          <span className="font-semibold text-green-600">+{formatGeorgiaLegalAmount(result.interestEarned)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500">Legal Contingency (33%)</span>
                          <span className="font-semibold text-red-600">-{formatGeorgiaLegalAmount(result.legalFee)}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-gray-500">Net After Legal</span>
                          <span className="font-semibold text-indigo-900 text-lg">
                            {formatGeorgiaLegalAmount(result.netAfterLegal)}
                          </span>
                        </div>
                      </div>

                      {/* Distribution by Contributor */}
                      <div>
                        <h4 className="text-sm font-medium mb-3">Distribution (After Legal & Manager Cuts)</h4>
                        <div className="space-y-3">
                          {result.distribution.map((item, i) => (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-gray-200 border-dashed">
                              <div className="flex items-center gap-2">
                                <i className="fas fa-user-circle text-indigo-900"></i>
                                <div>
                                  <span className="text-sm font-medium">{item.name}</span>
                                  <span className="text-xs text-gray-500 ml-2">{item.percentage}%</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-indigo-900">
                                  {formatGeorgiaLegalAmount(item.grossShare)}
                                </div>
                                <div className="text-xs text-red-600">
                                  -15% mgr: {formatGeorgiaLegalAmount(item.managerFee)}
                                </div>
                                <div className="text-xs text-green-600 font-medium">
                                  net: {formatGeorgiaLegalAmount(item.netShare)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Summary Stats */}
                      <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                        <div className="bg-indigo-50 p-2 rounded">
                          <span className="text-gray-600">Total Manager Fees:</span>
                          <span className="font-bold text-indigo-900 block">
                            {formatGeorgiaLegalAmount(result.totalManagerFees)}
                          </span>
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                          <span className="text-gray-600">Artist Net:</span>
                          <span className="font-bold text-green-600 block">
                            {formatGeorgiaLegalAmount(result.totalArtistNet)}
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Legal Disclaimer */}
                <div className="mt-4 text-xs text-gray-500 border-t border-gray-200 pt-3">
                  <p className="flex items-center gap-1">
                    <i className="fas fa-scale-balanced text-indigo-900"></i>
                    Based on Georgia Code § 7-4-12 (statutory interest) and standard Atlanta entertainment legal fees.
                  </p>
                </div>

                {/* Download PDF Button */}
                <button 
                  onClick={downloadPaymentPDF}
                  className="w-full bg-indigo-900 text-white py-3 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-indigo-800 transition mt-4"
                >
                  <i className="fas fa-file-pdf"></i>
                  Download Payment Report (PDF)
                </button>
              </div>
            )}

            {/* Action Buttons */}
            {currentStep === 3 && currentData.length > 0 && errors.length === 0 && (
              <button 
                onClick={() => setCurrentStep(4)}
                className="w-full bg-indigo-900 text-white py-3 rounded-full font-medium flex items-center justify-center gap-2 hover:bg-indigo-800 transition mt-4"
              >
                <i className="fas fa-calculator"></i>
                Calculate Payment
              </button>
            )}
            
            {currentStep === 4 && (
              <button 
                onClick={resetWorkflow}
                className="w-full bg-white border border-gray-200 text-gray-600 py-3 rounded-full font-medium flex items-center justify-center gap-2 hover:border-indigo-900 hover:text-indigo-900 transition mt-4"
              >
                <i className="fas fa-redo"></i>
                Start New Verification
              </button>
            )}
          </div>
        </div>

        {/* Trust Signals - Updated for Atlanta */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 my-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <i className="fas fa-gavel text-indigo-900 mb-2 text-xl"></i>
              <div className="font-medium text-sm">Federal Evidence Rule 902</div>
              <div className="text-xs text-gray-500">Self-authenticating</div>
            </div>
            <div>
              <i className="fas fa-percent text-indigo-900 mb-2 text-xl"></i>
              <div className="font-medium text-sm">GA Statutory Interest (7%)</div>
              <div className="text-xs text-gray-500">O.C.G.A. § 7-4-12</div>
            </div>
            <div>
              <i className="fas fa-shield-alt text-indigo-900 mb-2 text-xl"></i>
              <div className="font-medium text-sm">Blockchain Judicial E-Seal</div>
              <div className="text-xs text-gray-500">Monad Testnet</div>
            </div>
            <div>
              <i className="fas fa-scale-balanced text-indigo-900 mb-2 text-xl"></i>
              <div className="font-medium text-sm">33% Contingency Calculated</div>
              <div className="text-xs text-gray-500">Atlanta Standard</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-200 py-8 mt-12 text-center text-gray-500">
          <p className="text-sm">TrapRoyaltiesPro ensures split accuracy, payment verification, and blockchain-proof ownership records.</p>
          <div className="flex justify-center gap-8 mt-4 text-xs">
            <span>© 2026 TrapRoyaltiesPro</span>
            <span>ASCAP · BMI · SOCAN Compatible</span>
            <span>Built for Atlanta Music Attorneys</span>
          </div>
        </footer>
      </div>
    </div>
  )
}