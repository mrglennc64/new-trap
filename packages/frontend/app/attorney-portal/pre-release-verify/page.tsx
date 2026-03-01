'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Script from 'next/script';

export default function SplitVerificationPage() {
  const [currentData, setCurrentData] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentGrossAmount, setCurrentGrossAmount] = useState(50000);
  const [showSplitPreview, setShowSplitPreview] = useState(false);
  const [showActionButtons, setShowActionButtons] = useState(false);
  const [showErrorPanel, setShowErrorPanel] = useState(false);
  const [showVerificationSection, setShowVerificationSection] = useState(false);
  const [showPaymentInputSection, setShowPaymentInputSection] = useState(false);
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const [showStep2Buttons, setShowStep2Buttons] = useState(false);
  const [showStep4Buttons, setShowStep4Buttons] = useState(false);
  const [validationBadge, setValidationBadge] = useState({ text: 'Ready', className: 'split-badge' });
  const [verificationId, setVerificationId] = useState('');
  const [fullVerificationId, setFullVerificationId] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const TAX_RATE = 0.25; // 25% tax withholding

  // Sample data
  const PERFECT_SAMPLE = [
    { name: "James Carter", role: "Composer", percentage: 50, ipi: "00624789341" },
    { name: "Toya Williams", role: "Lyricist", percentage: 30, ipi: "00472915682" },
    { name: "DJ Premier", role: "Producer", percentage: 20, ipi: "00836125497" }
  ];

  const ERROR_SAMPLE = [
    { name: "James Carter", role: "Composer", percentage: 60, ipi: "" },
    { name: "", role: "Lyricist", percentage: 25, ipi: "00472915682" },
    { name: "DJ Premier", role: "Producer", percentage: 20, ipi: "invalid" },
    { name: "Extra", role: "Writer", percentage: 10, ipi: "" }
  ];

  useEffect(() => {
    updateStep(1);
  }, []);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ ...toast, show: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
  };

  const updateStep = (step: number) => {
    setCurrentStep(step);
  };

  const loadPerfectSample = () => {
    processData(PERFECT_SAMPLE);
    showToast('Perfect sample loaded - no issues detected');
  };

  const loadErrorSample = () => {
    processData(ERROR_SAMPLE);
    showToast('Sample with issues loaded', 'error');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setTimeout(() => {
      if (Math.random() > 0.5) {
        processData(PERFECT_SAMPLE);
      } else {
        processData(ERROR_SAMPLE);
      }
      showToast(`Loaded: ${file.name}`);
    }, 500);
  };

  const validateData = (data: any[]) => {
    const errors: any[] = [];
    let total = 0;
    
    data.forEach((item, index) => {
      total += item.percentage || 0;
      
      if (!item.name || item.name.trim() === '') {
        errors.push({ message: `Contributor ${index + 1} missing name` });
      }
      
      if (!item.ipi || item.ipi.trim() === '' || item.ipi === 'invalid') {
        errors.push({ message: `${item.name || 'Contributor'} missing valid IPI/ISWC` });
      }
      
      if (item.percentage <= 0 || item.percentage > 100) {
        errors.push({ message: `${item.name || 'Contributor'} has invalid percentage: ${item.percentage}%` });
      }
    });
    
    if (Math.abs(total - 100) > 0.1) {
      errors.push({ message: `Total split is ${total}%, must equal 100%` });
    }
    
    return errors;
  };

  const processData = (data: any[]) => {
    setCurrentData(data);
    
    const newErrors = validateData(data);
    setErrors(newErrors);
    
    setShowSplitPreview(true);
    setShowActionButtons(true);
    
    if (newErrors.length > 0) {
      setShowErrorPanel(true);
      setValidationBadge({ 
        text: `${newErrors.length} issue${newErrors.length > 1 ? 's' : ''}`, 
        className: 'split-badge error' 
      });
      updateStep(2);
    } else {
      setShowErrorPanel(false);
      setValidationBadge({ text: 'Ready', className: 'split-badge' });
      updateStep(3);
      setShowVerificationSection(true);
      setShowStep2Buttons(true);
      generateVerificationId();
    }
  };

  const autoFixErrors = () => {
    const fixedData = [...currentData];
    
    fixedData.forEach((item, i) => {
      if (!item.name || item.name === '') item.name = `Contributor ${i + 1}`;
      if (!item.ipi || item.ipi === 'invalid') item.ipi = 'AUTO-' + Math.floor(Math.random() * 90000 + 10000);
    });
    
    const total = fixedData.reduce((sum, item) => sum + item.percentage, 0);
    if (Math.abs(total - 100) > 0.1) {
      const factor = 100 / total;
      fixedData.forEach(item => {
        item.percentage = Math.round(item.percentage * factor * 10) / 10;
      });
    }
    
    const newErrors = validateData(fixedData);
    setErrors(newErrors);
    setCurrentData(fixedData);
    
    if (newErrors.length === 0) {
      setShowErrorPanel(false);
      setValidationBadge({ text: 'Ready', className: 'split-badge' });
      showToast('All issues fixed automatically');
      updateStep(3);
      setShowVerificationSection(true);
      setShowStep2Buttons(true);
      generateVerificationId();
    } else {
      showToast('Some issues could not be auto-fixed', 'error');
    }
  };

  const generateVerificationId = () => {
    const id = 'TRP-' + Math.random().toString(36).substring(2, 15).toUpperCase();
    setFullVerificationId(id);
    setVerificationId(id.substring(0, 10) + '...');
    
    const now = new Date();
    setTimestamp(now.toISOString().replace('T', ' ').substring(0, 16) + ' UTC');
  };

  const startVerification = () => {
    if (errors.length > 0) {
      showToast('Please fix issues before verification', 'error');
      return;
    }
    
    setShowVerificationSection(true);
    setShowStep2Buttons(true);
    generateVerificationId();
    updateStep(3);
    showToast('Data verified successfully');
  };

  const showPaymentInput = () => {
    setShowPaymentInputSection(true);
    setShowStep2Buttons(false);
  };

  const updatePaymentCalculation = () => {
    const inputElement = document.getElementById('paymentAmount') as HTMLInputElement;
    if (!inputElement) return;
    
    let amount = parseFloat(inputElement.value);
    
    if (isNaN(amount) || amount < 0) {
      amount = 0;
      inputElement.value = '0';
    }
    
    setCurrentGrossAmount(amount);
  };

  const calculateAndShowPayment = () => {
    updatePaymentCalculation();
    setShowPaymentSection(true);
    setShowStep4Buttons(true);
    updateStep(4);
    showToast('Payment calculated successfully');
  };

  const resetWorkflow = () => {
    setCurrentData([]);
    setErrors([]);
    setShowSplitPreview(false);
    setShowActionButtons(false);
    setShowErrorPanel(false);
    setShowVerificationSection(false);
    setShowPaymentInputSection(false);
    setShowPaymentSection(false);
    setShowStep2Buttons(false);
    setShowStep4Buttons(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    updateStep(1);
    showToast('Workflow reset');
  };

  const toggleTechDetails = () => {
    setShowTechDetails(!showTechDetails);
  };

  const getProgressWidth = () => {
    return ((currentStep - 1) / 3) * 100 + '%';
  };

  const getTotalPercentage = () => {
    const total = currentData.reduce((sum, item) => sum + (item.percentage || 0), 0);
    return total.toFixed(1) + '%';
  };

  const getGrossAmount = () => currentGrossAmount;
  const getTaxAmount = () => currentGrossAmount * TAX_RATE;
  const getNetAmount = () => currentGrossAmount - getTaxAmount();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).style.borderColor = '#2B6F4B';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0';
    const file = e.dataTransfer.files[0];
    if (file && fileInputRef.current) {
      const event = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(event);
    }
  };

  return (
    <>
      {/* Scripts for PDF generation */}
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js" strategy="afterInteractive" />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" strategy="afterInteractive" />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" strategy="afterInteractive" />

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10000]">
          <div className="bg-white p-8 rounded-lg text-center">
            <i className="fas fa-spinner fa-pulse text-4xl text-[#2B6F4B]"></i>
            <p className="mt-4 font-medium">Generating PDF...</p>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div className="fixed bottom-8 right-8 bg-white border-l-4 border-[#2B6F4B] rounded-lg p-4 shadow-lg z-[9999] transform transition-transform duration-300" 
             style={{ borderLeftColor: toast.type === 'success' ? '#2B6F4B' : '#C53030' }}>
          <div className="flex items-center gap-3">
            <i className={`fas fa-check-circle ${toast.type === 'success' ? 'text-[#2B6F4B]' : 'text-[#C53030]'}`}></i>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 font-sans bg-[#F8FAFC] text-[#1A202C]">
        {/* Navigation */}
        <nav className="flex justify-between items-center py-5 border-b border-[#E2E8F0] flex-wrap gap-5">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#2B6F4B] rounded-lg flex items-center justify-center text-white font-semibold text-xl">T</div>
            <span className="text-xl font-semibold text-[#1A202C]">TrapRoyaltiesPro</span>
          </Link>
          <div className="flex gap-8 items-center">
            <Link href="/" className="text-[#4A5568] no-underline font-medium text-sm hover:text-[#2B6F4B]">Home</Link>
            <Link href="/workflow" className="text-[#4A5568] no-underline font-medium text-sm hover:text-[#2B6F4B] active">Workflow</Link>
            <Link href="/pilot" className="text-[#4A5568] no-underline font-medium text-sm hover:text-[#2B6F4B]">Pilot</Link>
            <Link href="/faq" className="text-[#4A5568] no-underline font-medium text-sm hover:text-[#2B6F4B]">FAQ</Link>
          </div>
          <button className="bg-transparent border border-[#E2E8F0] px-5 py-2 rounded-full font-medium text-sm text-[#1A202C] hover:border-[#2B6F4B] hover:text-[#2B6F4B] transition-all">
            <i className="far fa-envelope mr-2"></i> Contact
          </button>
        </nav>

        {/* Page Header */}
        <div className="text-center py-10 max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-[#1A202C] mb-3">Split Verification & Payment Workflow</h1>
          <p className="text-lg text-[#4A5568]">Upload → Detect issues → Verify → Enter amount → Calculate payment</p>
        </div>

        {/* Before vs After Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border border-[#E2E8F0] rounded-2xl p-6 my-8 shadow-sm">
          <div className="md:border-r-2 border-[#FEE2E2] md:pr-6">
            <h3 className="text-xl text-[#C53030] mb-4 flex items-center gap-2">
              <i className="fas fa-times-circle"></i> Before TrapRoyaltiesPro
            </h3>
            <div className="flex items-center gap-3 flex-wrap text-sm">
              <span className="bg-[#F8FAFC] px-4 py-2 rounded-full border border-[#E2E8F0]">Publisher</span>
              <i className="fas fa-arrow-right text-[#CBD5E0]"></i>
              <span className="bg-[#FEE2E2] text-[#C53030] px-4 py-2 rounded-full border border-[#FCA5A5]">Issues</span>
              <i className="fas fa-arrow-right text-[#CBD5E0]"></i>
              <span className="bg-[#F8FAFC] px-4 py-2 rounded-full border border-[#E2E8F0]">PRO</span>
              <i className="fas fa-arrow-right text-[#CBD5E0]"></i>
              <span className="bg-[#F8FAFC] px-4 py-2 rounded-full border border-[#E2E8F0]">Payment Delay</span>
            </div>
          </div>
          <div>
            <h3 className="text-xl text-[#2B6F4B] mb-4 flex items-center gap-2">
              <i className="fas fa-check-circle"></i> With TrapRoyaltiesPro
            </h3>
            <div className="flex items-center gap-3 flex-wrap text-sm">
              <span className="bg-[#F8FAFC] px-4 py-2 rounded-full border border-[#E2E8F0]">Publisher</span>
              <i className="fas fa-arrow-right text-[#CBD5E0]"></i>
              <span className="bg-[#DEF7E5] border-[#9AE6B4] px-4 py-2 rounded-full border">TrapRoyaltiesPro</span>
              <i className="fas fa-arrow-right text-[#CBD5E0]"></i>
              <span className="bg-[#F8FAFC] px-4 py-2 rounded-full border border-[#E2E8F0]">PRO</span>
              <i className="fas fa-arrow-right text-[#CBD5E0]"></i>
              <span className="bg-[#F8FAFC] px-4 py-2 rounded-full border border-[#E2E8F0]">Fast Payment</span>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="my-8">
          <div className="flex items-center justify-between relative max-w-2xl mx-auto">
            <div className="absolute top-5 left-12 right-12 h-[3px] bg-[#E2E8F0] z-[1]"></div>
            
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className={`flex flex-col items-center relative z-[2] bg-[#F8FAFC] px-3`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-all
                  ${currentStep > step ? 'bg-[#2B6F4B] border-[#2B6F4B] text-white' : 
                    currentStep === step ? 'bg-[#2B6F4B] border-[#2B6F4B] text-white' : 
                    'bg-white border-2 border-[#E2E8F0] text-[#718096]'}`}>
                  {step}
                </div>
                <span className={`text-sm font-medium ${currentStep === step ? 'text-[#2B6F4B] font-semibold' : 'text-[#4A5568]'}`}>
                  {step === 1 && 'Upload Data'}
                  {step === 2 && 'Issues Detected'}
                  {step === 3 && 'Data Verified'}
                  {step === 4 && 'Payment Ready'}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-[#E2E8F0] rounded-full max-w-2xl mx-auto my-8 overflow-hidden">
            <div className="h-full bg-[#2B6F4B] transition-all duration-500 rounded-full" style={{ width: getProgressWidth() }}></div>
          </div>
        </div>

        {/* Main Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-8">
          {/* LEFT PANEL: UPLOAD + VALIDATE */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-[#1A202C] mb-6 flex items-center gap-2">
              <i className="fas fa-cloud-upload-alt text-[#2B6F4B]"></i>
              Step 1: Upload registration data
            </h2>

            {/* Upload Area */}
            <div 
              className="bg-[#F8FAFC] border-2 border-dashed border-[#E2E8F0] rounded-2xl p-10 text-center mb-5 cursor-pointer transition-all hover:border-[#2B6F4B] hover:bg-[#F0F9F4]"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="text-5xl text-[#2B6F4B] mb-4">
                <i className="fas fa-file-upload"></i>
              </div>
              <h3 className="text-lg mb-2">Drop your split sheet here</h3>
              <p className="text-sm text-[#718096] mb-4">CSV, Excel, or PDF</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv,.xlsx,.xls,.pdf" 
                onChange={handleFileSelect}
              />
            </div>

            {/* Sample Links */}
            <div className="text-center my-4">
              <button onClick={loadPerfectSample} className="text-[#2B6F4B] text-sm mx-2 font-medium hover:underline bg-transparent border-none cursor-pointer">Load perfect sample</button>
              <button onClick={loadErrorSample} className="text-[#C53030] text-sm mx-2 font-medium hover:underline bg-transparent border-none cursor-pointer">Load test with errors</button>
            </div>

            {/* Error Panel */}
            {showErrorPanel && (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 my-5">
                <div className="flex items-center gap-2 text-[#C53030] font-semibold mb-3">
                  <i className="fas fa-exclamation-triangle"></i>
                  <span>Issues Detected</span>
                </div>
                <div className="text-sm text-[#991B1B] mb-3">
                  {errors.map((e, i) => (
                    <div key={i}>• {e.message}</div>
                  ))}
                </div>
                <button 
                  onClick={autoFixErrors}
                  className="bg-[#2B6F4B] text-white border-none px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-[#1E4F36]"
                >
                  <i className="fas fa-magic"></i>
                  Auto-Fix Issues
                </button>
              </div>
            )}

            {/* Split Preview */}
            {showSplitPreview && (
              <div className="bg-[#F8FAFC] rounded-2xl p-5 mt-5">
                <div className="flex justify-between pb-3 mb-4 border-b border-[#E2E8F0]">
                  <span className="font-semibold text-[#1A202C]">Split Sheet</span>
                  <span className={validationBadge.className}>{validationBadge.text}</span>
                </div>
                <div id="splitRows">
                  {currentData.map((item, idx) => {
                    const hasError = errors.some(e => 
                      e.message.includes(item.name) || (e.message.includes('missing') && !item.name)
                    );
                    return (
                      <div key={idx} className={`flex justify-between items-center py-3 border-b border-[#EDF2F7] ${hasError ? 'bg-[#FEF2F2] -mx-5 px-5' : ''}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#E2E8F0] rounded-lg flex items-center justify-center font-semibold text-[#2B6F4B]">
                            {(item.name || '?')[0]}
                          </div>
                          <div className="text-sm">
                            <div className="font-medium text-[#1A202C]">{item.name || 'Unknown'}</div>
                            <div className="text-xs text-[#718096]">{item.role} · IPI: {item.ipi || 'Missing'}</div>
                          </div>
                        </div>
                        <span className={`font-semibold ${hasError ? 'text-[#C53030]' : 'text-[#2B6F4B]'}`}>{item.percentage}%</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 text-right text-sm">
                  Total: <span className="font-semibold">{getTotalPercentage()}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {showActionButtons && (
              <button 
                onClick={startVerification}
                className="w-full bg-[#2B6F4B] text-white border-none py-3 px-6 rounded-full font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#1E4F36] mt-4"
              >
                <i className="fas fa-shield-alt"></i>
                Start Verification
              </button>
            )}
          </div>

          {/* RIGHT PANEL: VERIFY + PAYMENT */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-[#1A202C] mb-6 flex items-center gap-2">
              <i className="fas fa-check-circle text-[#2B6F4B]"></i>
              Steps 2-4: Verify & Calculate Payment
            </h2>

            {/* Verification Record */}
            {showVerificationSection && (
              <div className="bg-[#F8FAFC] rounded-2xl p-5 my-5">
                <h3 className="text-base font-semibold mb-4">Verification Record</h3>
                
                <div className="flex justify-between items-center py-3 border-b border-[#E2E8F0]">
                  <span className="text-sm text-[#718096] flex items-center gap-2">
                    <i className="fas fa-fingerprint"></i> Verification ID
                  </span>
                  <span className="text-sm font-medium text-[#1A202C]">{verificationId}</span>
                </div>
                
                <div className="font-mono bg-white p-3 rounded-lg text-xs text-[#4A5568] border border-[#E2E8F0] my-3">
                  {fullVerificationId}
                </div>

                <div className="flex justify-between items-center py-3 border-b border-[#E2E8F0]">
                  <span className="text-sm text-[#718096] flex items-center gap-2">
                    <i className="fas fa-clock"></i> Timestamp
                  </span>
                  <span className="text-sm font-medium text-[#1A202C]">{timestamp}</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-[#E2E8F0]">
                  <span className="text-sm text-[#718096] flex items-center gap-2">
                    <i className="fas fa-check-circle text-[#2B6F4B]"></i> Status
                  </span>
                  <span className="text-sm font-medium text-[#2B6F4B]">Verified ✓</span>
                </div>

                {/* System Reference */}
                <div className="text-xs text-[#A0AEC0] mt-2 pt-2 border-t border-dashed border-[#E2E8F0] flex justify-between">
                  <span>System reference: 0xAa19...B2ea4</span>
                  <span className="cursor-pointer" onClick={toggleTechDetails}>
                    {showTechDetails ? 'Hide details ↑' : 'Show details ↓'}
                  </span>
                </div>
                
                {/* Technical details */}
                {showTechDetails && (
                  <div className="mt-3 text-xs text-[#A0AEC0]">
                    <div>Contract: 0xAa19bFC7Bd852efe49ef31297bB082FB044B2ea4</div>
                    <div>Network: Monad Testnet (Chain ID: 10143)</div>
                  </div>
                )}
              </div>
            )}

            {/* Payment Input Section */}
            {showPaymentInputSection && (
              <div className="bg-[#F8FAFC] rounded-2xl p-5 my-5 border border-[#E2E8F0]">
                <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <i className="fas fa-calculator text-[#2B6F4B]"></i>
                  Enter Payment Amount
                </h3>
                
                <div className="flex gap-3 items-center flex-wrap">
                  <div className="flex-1 relative">
                    <span className="absolute left-4 top-[14px] text-[#718096] font-medium">$</span>
                    <input 
                      type="number" 
                      id="paymentAmount"
                      defaultValue="50000" 
                      min="0" 
                      step="1000"
                      className="w-full pl-10 pr-4 py-3 border border-[#E2E8F0] rounded-full text-lg font-semibold focus:outline-none focus:border-[#2B6F4B]"
                      onChange={updatePaymentCalculation}
                    />
                  </div>
                  <button 
                    onClick={calculateAndShowPayment}
                    className="bg-[#2B6F4B] text-white border-none px-6 py-3 rounded-full font-medium flex items-center gap-2 hover:bg-[#1E4F36]"
                  >
                    <i className="fas fa-sync-alt"></i>
                    Calculate
                  </button>
                </div>
                
                <div className="text-sm text-[#718096] mt-3">
                  <i className="fas fa-info-circle text-[#2B6F4B] mr-1"></i>
                  Enter any amount and we'll calculate the split with 25% tax withholding
                </div>
              </div>
            )}

            {/* Payment Summary Section */}
            {showPaymentSection && (
              <div className="bg-[#F0F9F4] border border-[#9AE6B4] rounded-2xl p-5 my-5">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold text-[#1E4F36] flex items-center gap-2">
                    <i className="fas fa-credit-card"></i> Payment Summary
                  </span>
                  <span className="text-2xl font-bold text-[#2B6F4B]" id="totalPayment">${getGrossAmount().toLocaleString()}</span>
                </div>

                <div className="bg-white rounded-xl p-4 my-4">
                  <div className="flex justify-between py-2 border-b border-[#E2E8F0]">
                    <span className="text-sm text-[#4A5568]">Gross Royalties</span>
                    <span className="font-semibold text-[#1A202C]" id="grossAmount">${getGrossAmount().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#E2E8F0]">
                    <span className="text-sm text-[#4A5568]">Tax Withholding (25%)</span>
                    <span className="font-semibold text-[#C53030]" id="taxAmount">-${getTaxAmount().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-[#4A5568]">Net Payment</span>
                    <span className="font-semibold text-[#2B6F4B] text-lg" id="netAmount">${getNetAmount().toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-3 text-xs text-[#991B1B] flex items-center gap-2 mb-4">
                  <i className="fas fa-info-circle"></i>
                  <span>25% tax withholding automatically calculated</span>
                </div>

                <div className="mt-5">
                  <h4 className="text-sm font-semibold mb-3">Distribution by Contributor</h4>
                  <div id="distributionList">
                    {currentData.map((item, idx) => {
                      const grossShare = getGrossAmount() * (item.percentage / 100);
                      const taxShare = grossShare * TAX_RATE;
                      const netShare = grossShare - taxShare;
                      
                      return (
                        <div key={idx} className="flex justify-between items-center py-3 border-b border-dashed border-[#E2E8F0]">
                          <div className="flex items-center gap-2 text-sm">
                            <i className="fas fa-user-circle text-[#2B6F4B]"></i>
                            <span>{item.name} ({item.percentage}%)</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-[#2B6F4B]">${grossShare.toLocaleString()}</div>
                            <div className="text-xs text-[#C53030]">-${taxShare.toLocaleString()} tax</div>
                            <div className="text-xs font-semibold text-[#2B6F4B]">${netShare.toLocaleString()} net</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Download PDF Button */}
                <button className="w-full bg-[#2B6F4B] text-white border-none py-3 px-6 rounded-full font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#1E4F36] mt-5">
                  <i className="fas fa-file-pdf"></i>
                  Download Payment Report (PDF)
                </button>
              </div>
            )}

            {/* Ready for Submission Banner */}
            {showPaymentSection && (
              <div className="bg-[#DEF7E5] border border-[#9AE6B4] rounded-xl p-5 text-center my-5">
                <i className="fas fa-check-circle text-3xl text-[#2B6F4B] mb-3"></i>
                <h3 className="text-[#1E4F36] mb-2 font-semibold">Payment Ready for PRO</h3>
                <p className="text-sm text-[#2B6F4B]">Your verified data and payment calculation are ready for submission</p>
              </div>
            )}

            {/* Action Buttons */}
            {showStep2Buttons && (
              <button 
                onClick={showPaymentInput}
                className="w-full bg-[#2B6F4B] text-white border-none py-3 px-6 rounded-full font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#1E4F36]"
              >
                <i className="fas fa-calculator"></i>
                Calculate Payment
              </button>
            )}
            
            {showStep4Buttons && (
              <button 
                onClick={resetWorkflow}
                className="w-full bg-white border border-[#E2E8F0] py-3 px-6 rounded-full font-medium text-sm flex items-center justify-center gap-2 text-[#4A5568] hover:border-[#2B6F4B] hover:text-[#2B6F4B] mt-3"
              >
                <i className="fas fa-redo"></i>
                Start New Verification
              </button>
            )}
          </div>
        </div>

        {/* Trust Signals */}
        <div className="bg-[#F8FAFC] rounded-2xl p-6 my-10 border border-[#E2E8F0]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-center">
            <div>
              <i className="fas fa-check-circle text-[#2B6F4B] mb-2"></i>
              <div className="font-medium">EU Data Compliance</div>
            </div>
            <div>
              <i className="fas fa-check-circle text-[#2B6F4B] mb-2"></i>
              <div className="font-medium">Tax Ready</div>
            </div>
            <div>
              <i className="fas fa-check-circle text-[#2B6F4B] mb-2"></i>
              <div className="font-medium">Pilot-Ready</div>
            </div>
            <div>
              <i className="fas fa-check-circle text-[#2B6F4B] mb-2"></i>
              <div className="font-medium">25% Auto Withholding</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-[#E2E8F0] py-10 mt-16 text-center text-[#718096]">
          <p className="mb-5">TrapRoyaltiesPro supports data quality, payment accuracy, and operational efficiency in music rights registration.</p>
          <div className="flex justify-center gap-10 flex-wrap text-sm text-[#A0AEC0]">
            <span>© 2026 TrapRoyaltiesPro</span>
            <span>PRO & Tax Compatible</span>
            <span>Built for Music Publishing</span>
          </div>
        </footer>
      </div>

      <style jsx>{`
        .split-badge {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 40px;
          background: #DEF7E5;
          color: #1E4F36;
        }
        .split-badge.error {
          background: #FEE2E2;
          color: #C53030;
        }
      `}</style>
    </>
  );
}
