'use client';
import { useState } from 'react';
import Link from 'next/link';
import PDFContractViewer from '@/components/PDFContractViewer';

// Mock data for demonstration
const MOCK_SPLITS = [
  {
    id: 'split-001',
    track_title: 'God\'s Plan',
    track_artist: 'Drake',
    isrc: 'US-CAN-25-00001',
    upload_date: '2026-02-15',
    participants: [
      { name: 'Drake', role: 'Artist', email: 'drake@example.com', percentage: 50, ipi: '00624789341' },
      { name: 'Producer A', role: 'Producer', email: 'producer@example.com', percentage: 30, ipi: '00836125497' },
      { name: 'Writer B', role: 'Writer', email: 'writer@example.com', percentage: 20, ipi: '00472915682' }
    ]
  },
  {
    id: 'split-002',
    track_title: 'SICKO MODE',
    track_artist: 'Travis Scott',
    isrc: 'US-TST-25-00002',
    upload_date: '2026-02-20',
    participants: [
      { name: 'Travis Scott', role: 'Artist', email: 'travis@example.com', percentage: 60, ipi: '00987654321' },
      { name: 'Producer B', role: 'Producer', email: 'producer2@example.com', percentage: 40, ipi: '00543219876' }
    ]
  },
  {
    id: 'split-003',
    track_title: 'Bad Guy',
    track_artist: 'Billie Eilish',
    isrc: 'US-BIL-25-00003',
    upload_date: '2026-02-25',
    participants: [
      { name: 'Billie Eilish', role: 'Artist', email: 'billie@example.com', percentage: 55, ipi: '00765432109' },
      { name: 'Finneas', role: 'Producer', email: 'finneas@example.com', percentage: 45, ipi: '00321987654' }
    ]
  }
];

export default function ContractsPage() {
  const [selectedSplit, setSelectedSplit] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSplits = MOCK_SPLITS.filter(split => 
    split.track_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    split.track_artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
    split.id.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/attorney-portal" className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
            ← Back to Attorney Portal
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">📄 Split Agreement Contracts</h1>
          <p className="text-gray-600 mt-2">Generate and manage legally binding PDF contracts for verified splits</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Split List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Verified Splits</h2>
              
              {/* Search */}
              <input
                type="text"
                placeholder="Search by track, artist, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg mb-4"
              />
              
              {/* Split List */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredSplits.map((split) => (
                  <button
                    key={split.id}
                    onClick={() => setSelectedSplit(split)}
                    className={`w-full text-left p-4 rounded-lg border transition ${
                      selectedSplit?.id === split.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{split.track_title}</div>
                    <div className="text-sm text-gray-600">{split.track_artist}</div>
                    <div className="text-xs text-gray-500 mt-1">ID: {split.id}</div>
                    <div className="text-xs text-gray-500">Participants: {split.participants.length}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - PDF Generator */}
          <div className="lg:col-span-2">
            {selectedSplit ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Generate Contract for: {selectedSplit.track_title}
                </h2>
                
                {/* Split Summary */}
                <div className="bg-indigo-50 p-4 rounded-lg mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Artist</p>
                      <p className="font-medium">{selectedSplit.track_artist}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">ISRC</p>
                      <p className="font-medium">{selectedSplit.isrc}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Upload Date</p>
                      <p className="font-medium">{selectedSplit.upload_date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Split ID</p>
                      <p className="font-medium text-xs">{selectedSplit.id}</p>
                    </div>
                  </div>
                </div>

                {/* Participant List */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Split Participants</h3>
                  <div className="space-y-2">
                    {selectedSplit.participants.map((p: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-sm text-gray-600">{p.role} • IPI: {p.ipi}</p>
                        </div>
                        <span className="font-semibold text-indigo-900">{p.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PDF Contract Viewer Component */}
                <PDFContractViewer
                  agreementId={selectedSplit.id}
                  trackData={{
                    title: selectedSplit.track_title,
                    artist: selectedSplit.track_artist,
                    isrc: selectedSplit.isrc,
                    upload_date: selectedSplit.upload_date
                  }}
                  participants={selectedSplit.participants}
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Split Selected</h3>
                <p className="text-gray-600">Select a verified split from the left to generate a PDF contract</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
          <h3 className="font-semibold text-indigo-900 mb-2">📋 About Split Agreement Contracts</h3>
          <p className="text-gray-700 text-sm mb-4">
            These PDF contracts are legally binding documents that include:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Track metadata and ISRC codes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Participant split percentages</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Legal clauses and governing law</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Signature lines with IPI tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>SHA-256 hash for verification</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Secure 1-hour sharing links</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
