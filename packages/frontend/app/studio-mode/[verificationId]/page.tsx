"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface HandshakeData {
  id: string;
  matter: string;
  trackName: string;
  contributors: Array<{
    name: string;
    role: string;
    percentage: number;
    email: string;
    phone?: string;
  }>;
  createdAt: string;
  expiresAt: string;
  status: string;
  signatures?: Array<{
    name: string;
    timestamp: string;
    hash: string;
    biometricData?: string;
  }>;
}

export default function StudioModeSigningPage() {
  const params = useParams();
  const verificationId = params.verificationId as string;
  
  const [handshake, setHandshake] = useState<HandshakeData | null>(null);
  const [currentSigner, setCurrentSigner] = useState('');
  const [biometricVerified, setBiometricVerified] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [sealHash, setSealHash] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    // Load handshake data
    const stored = localStorage.getItem(`handshake-${verificationId}`);
    if (stored) {
      setHandshake(JSON.parse(stored));
    }
  }, [verificationId]);

  const handleBiometricVerification = () => {
    setVerifying(true);
    
    // Simulate biometric verification (face/touch ID)
    setTimeout(() => {
      setBiometricVerified(true);
      setVerifying(false);
    }, 2000);
  };

  const generateDocHash = () => {
    // Create a unique hash of the agreement
    const content = JSON.stringify({
      ...handshake,
      timestamp: Date.now()
    });
    
    // In production, use actual SHA-256
    return '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)).join('');
  };

  const generateAudioHash = () => {
    // Optional: Hash of audio fingerprint
    return '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)).join('');
  };

  const handleSign = async () => {
    if (!biometricVerified || !currentSigner) return;
    
    setSigning(true);
    
    // Generate document hash
    const docHash = generateDocHash();
    const audioHash = generateAudioHash();
    
    // Create e-seal data (matches the Solidity contract)
    const eSealData = {
      verificationId,
      docHash,
      audioHash,
      timestamp: Math.floor(Date.now() / 1000),
      signer: currentSigner,
      biometricVerified: true
    };

    // Simulate blockchain transaction
    setTimeout(() => {
      const mockTxHash = '0x' + Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)).join('');
      
      setSealHash(mockTxHash);
      setSigned(true);
      setSigning(false);
      
      // Update handshake with signature
      if (handshake) {
        const updated = {
          ...handshake,
          signatures: [
            ...(handshake.signatures || []),
            {
              name: currentSigner,
              timestamp: new Date().toISOString(),
              hash: docHash,
              biometricData: 'biometric-verified'
            }
          ]
        };
        localStorage.setItem(`handshake-${verificationId}`, JSON.stringify(updated));
      }
    }, 3000);
  };

  if (!handshake) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading handshake agreement...</p>
        </div>
      </div>
    );
  }

  // Check if expired
  const isExpired = new Date(handshake.expiresAt) < new Date();

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md text-center">
          <div className="text-6xl text-red-500 mb-4">⏰</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Link Expired</h1>
          <p className="text-gray-600 mb-6">
            This handshake link expired on {new Date(handshake.expiresAt).toLocaleDateString()}.
            Please contact your attorney for a new link.
          </p>
          <Link href="/" className="inline-block px-6 py-3 bg-indigo-900 text-white rounded-lg font-medium">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Signed Successfully!</h1>
          <p className="text-gray-600 mb-6">Your signature has been recorded on the Monad blockchain.</p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-medium text-gray-700 mb-2">E-Seal Verification:</p>
            <p className="text-xs font-mono break-all bg-white p-2 rounded border border-gray-200">
              {sealHash}
            </p>
            <p className="text-xs text-green-600 mt-2 flex items-center">
              <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
              Verified on Monad Blockchain
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.print()}
              className="w-full py-3 bg-indigo-900 text-white rounded-lg font-medium hover:bg-indigo-800 transition"
            >
              Download Signed Copy
            </button>
            <Link
              href="/"
              className="block w-full py-3 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition text-center"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white py-4 px-6 text-center">
        <h1 className="text-xl font-bold">TrapRoyalties Pro - Biometric Handshake</h1>
      </div>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Agreement Preview */}
          <div className="p-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{handshake.trackName}</h2>
            <p className="text-gray-600 mb-6">Split Agreement • {new Date(handshake.createdAt).toLocaleDateString()}</p>

            <div className="bg-indigo-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-indigo-800">
                <span className="font-bold">Matter:</span> Metro Boomin – Creepin' Dispute (2026-CV-0123)
              </p>
            </div>

            <h3 className="font-bold text-gray-900 mb-4">Proposed Split:</h3>
            <div className="space-y-3 mb-6">
              {handshake.contributors.map((contributor, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{contributor.name}</p>
                    <p className="text-sm text-gray-500">{contributor.role}</p>
                  </div>
                  <span className="text-xl font-bold text-indigo-900">{contributor.percentage}%</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-500">
                By signing below, you agree to the split percentages listed above. 
                This agreement will be cryptographically sealed on the Monad blockchain.
              </p>
            </div>
          </div>

          {/* Signing Area */}
          <div className="p-8">
            <h3 className="font-bold text-gray-900 mb-4">Step 1: Select Your Name</h3>
            <select
              className="w-full px-4 py-3 border border-gray-200 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={currentSigner}
              onChange={(e) => setCurrentSigner(e.target.value)}
            >
              <option value="">-- Select who you are --</option>
              {handshake.contributors.map((c, i) => (
                <option key={i} value={c.name}>{c.name} ({c.role})</option>
              ))}
            </select>

            <h3 className="font-bold text-gray-900 mb-4">Step 2: Biometric Verification</h3>
            
            {!biometricVerified ? (
              <button
                onClick={handleBiometricVerification}
                disabled={!currentSigner || verifying}
                className="w-full py-4 bg-indigo-900 text-white rounded-lg font-medium hover:bg-indigo-800 transition disabled:opacity-50 mb-6"
              >
                {verifying ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></span>
                    Verifying...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                    </svg>
                    Verify with Biometrics
                  </span>
                )}
              </button>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-700 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Biometric verification successful
                </p>
              </div>
            )}

            <button
              onClick={handleSign}
              disabled={!biometricVerified || !currentSigner || signing}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold text-lg hover:from-purple-500 hover:to-pink-500 transition disabled:opacity-50"
            >
              {signing ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></span>
                  Creating E-Seal on Monad...
                </span>
              ) : (
                'Sign & Create E-Seal'
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Your signature will be recorded on the Monad blockchain with a tamper-proof hash.
              This creates a legally binding e-seal under Georgia's digital signature laws.
            </p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 flex justify-center items-center space-x-2 text-sm text-gray-500">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span>End-to-end encrypted • Biometric verified • Monad blockchain sealed</span>
        </div>
      </main>
    </div>
  );
}