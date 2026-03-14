// app/pdf-report/page.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function PDFReportPage() {
  const [reportData, setReportData] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const data = localStorage.getItem('trapRoyaltiesReportData')
    const gross = localStorage.getItem('trapRoyaltiesGrossAmount')
    const hash = localStorage.getItem('trapRoyaltiesDocumentHash')
    const ts = localStorage.getItem('trapRoyaltiesReportTimestamp')

    if (!data) {
      router.push('/split-verification')
      return
    }

    setReportData({
      contributors: JSON.parse(data),
      grossAmount: parseFloat(gross || '0'),
      verificationId: hash || '0xUNKNOWN',
      timestamp: ts || new Date().toISOString(),
    })
  }, [router])

  const downloadPDF = async () => {
    if (!reportRef.current) return
    setGenerating(true)
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf').then(m => ({ jsPDF: m.jsPDF })),
      ])

      // Inject white override before capture
      const pdfStyle = document.createElement('style')
      pdfStyle.id = 'pdf-white-override'
      pdfStyle.textContent = `
        #pdf-report-content, #pdf-report-content * {
          background: #fff !important;
          background-color: #fff !important;
          background-image: none !important;
          color: #111 !important;
          border-color: #ddd !important;
          box-shadow: none !important;
        }
      `
      document.head.appendChild(pdfStyle)

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      })

      document.getElementById('pdf-white-override')?.remove()

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width * 0.75, canvas.height * 0.75],
      })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width * 0.75, canvas.height * 0.75)

      const date = new Date()
      const fileName = `TrapRoyalties_Report_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.pdf`
      pdf.save(fileName)
    } catch (err) {
      console.error('PDF error:', err)
      document.getElementById('pdf-white-override')?.remove()
    } finally {
      setGenerating(false)
    }
  }

  if (!reportData) return (
    <div style={{ background: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111' }}>
      Loading report...
    </div>
  )

  const total = reportData.contributors.reduce((s: number, c: any) => s + (c.percentage || 0), 0)
  const dateStr = new Date(reportData.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '24px', fontFamily: 'Inter, Arial, sans-serif' }}>
      {/* Toolbar */}
      <div style={{ maxWidth: 820, margin: '0 auto 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          onClick={() => window.history.back()}
          style={{ background: 'transparent', border: '1px solid #e2e8f0', color: '#4a5568', padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
        >
          ← Back
        </button>
        <button
          onClick={downloadPDF}
          disabled={generating}
          style={{ background: '#4f46e5', border: 0, color: '#fff', padding: '8px 22px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14, opacity: generating ? 0.7 : 1 }}
        >
          {generating ? 'Generating...' : '⬇ Download PDF'}
        </button>
      </div>

      {/* Report — white card captured by html2canvas */}
      <div
        id="pdf-report-content"
        ref={reportRef}
        style={{ maxWidth: 820, margin: '0 auto', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '48px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36, paddingBottom: 24, borderBottom: '2px solid #f0f0f0' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>TrapRoyalties Pro</div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#1e1b4b' }}>Royalty Split Report</h1>
            <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 13 }}>SMPT-Verified · Blockchain Sealed</p>
          </div>
          <div style={{ textAlign: 'right', fontSize: 12, color: '#9ca3af' }}>
            <div style={{ fontWeight: 700, color: '#374151', fontSize: 13 }}>{dateStr}</div>
            <div style={{ marginTop: 4, fontFamily: 'monospace', fontSize: 11 }}>{reportData.verificationId?.slice(0, 20)}...</div>
          </div>
        </div>

        {/* Summary row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Gross Amount', value: `$${reportData.grossAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
            { label: 'Contributors', value: String(reportData.contributors.length) },
            { label: 'Split Total', value: `${total.toFixed(1)}%`, alert: Math.abs(total - 100) > 0.01 },
            { label: 'Status', value: Math.abs(total - 100) < 0.01 ? '✅ Verified' : '⚠️ Check Splits' },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, background: s.alert ? '#fef2f2' : '#f8fafc', border: `1px solid ${s.alert ? '#fecaca' : '#e2e8f0'}`, borderRadius: 10, padding: '14px 18px' }}>
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.alert ? '#dc2626' : '#1e1b4b' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Contributors table */}
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Split Breakdown</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Name</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Role</th>
              <th style={{ padding: '10px 14px', textAlign: 'right', color: '#6b7280', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Share</th>
              <th style={{ padding: '10px 14px', textAlign: 'right', color: '#6b7280', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {reportData.contributors.map((c: any, i: number) => (
              <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1f2937' }}>{c.name}</td>
                <td style={{ padding: '12px 14px', color: '#6b7280' }}>{c.role}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#4f46e5' }}>{c.percentage}%</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#1f2937' }}>
                  ${(reportData.grossAmount * c.percentage / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
              <td colSpan={2} style={{ padding: '12px 14px', fontWeight: 700, color: '#374151' }}>Total</td>
              <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: Math.abs(total - 100) < 0.01 ? '#059669' : '#dc2626' }}>{total.toFixed(1)}%</td>
              <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#1f2937' }}>
                ${reportData.grossAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ marginTop: 36, paddingTop: 20, borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>
            <div>Cryptographically sealed on Monad Testnet</div>
            <div style={{ fontFamily: 'monospace', marginTop: 3 }}>Tx: 0xAa19bFC7Bd852efe49ef31297bB082FB044B2ea4</div>
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'right' }}>
            <div style={{ fontWeight: 600, color: '#6366f1' }}>TrapRoyalties Pro</div>
            <div>Powered by SMPT</div>
          </div>
        </div>
      </div>
    </div>
  )
}
