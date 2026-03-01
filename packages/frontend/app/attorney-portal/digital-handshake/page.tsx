'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DigitalHandshakePage() {
  const [formData, setFormData] = useState({
    email: '',
    isrc: '',
    track: '',
    artist: '',
    rightsType: 'master',
    revenueBasis: 'net',
    jurisdiction: 'us',
    role: 'publisher',
    percentage: '',
    startDate: '',
    endDate: '',
    territories: [] as string[],
    notes: ''
  });

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTerritoryToggle = (territory: string) => {
    setFormData(prev => ({
      ...prev,
      territories: prev.territories.includes(territory)
        ? prev.territories.filter(t => t !== territory)
        : [...prev.territories, territory]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    
    try {
      // Send to backend
      const response = await fetch('http://127.0.0.1:8000/handshake/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          territories: formData.territories.join(','),
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      console.log('Handshake created:', data);
      
      setSent(true);
      setTimeout(() => setSent(false), 5000);
      
      // Clear form
      setFormData({
        email: '',
        isrc: '',
        track: '',
        artist: '',
        rightsType: 'master',
        revenueBasis: 'net',
        jurisdiction: 'us',
        role: 'publisher',
        percentage: '',
        startDate: '',
        endDate: '',
        territories: [],
        notes: ''
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send handshake');
      console.error('Error sending handshake:', err);
    } finally {
      setSending(false);
    }
  };

  const territories = [
    'US', 'UK', 'Canada', 'Australia', 'Germany', 'France', 
    'Japan', 'Brazil', 'Mexico', 'South Africa', 'Global'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white py-4 px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/attorney-portal" className="text-indigo-200 hover:text-white mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Digital Handshake</h1>
          <p className="text-indigo-200">Secure royalty split verification and agreement</p>
        </div>
      </div>

      {/* Main Form */}
      <div className="max-w-5xl mx-auto py-8 px-6">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            Error: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rights Holder Section */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-black mb-6">Rights Holder Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="publisher">Publisher</option>
                  <option value="label">Record Label</option>
                  <option value="artist">Artist</option>
                  <option value="administrator">Administrator</option>
                  <option value="producer">Producer</option>
                  <option value="songwriter">Songwriter</option>
                </select>
              </div>
            </div>
          </div>

          {/* Track Information */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-black mb-6">Track Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">ISRC</label>
                <input
                  type="text"
                  name="isrc"
                  value={formData.isrc}
                  onChange={handleChange}
                  placeholder="US-ABC-23-00123"
                  className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-indigo-500 font-mono"
                  required
                />
                <p className="text-xs text-black mt-1">Format: US-ABC-23-00123</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Track Title</label>
                <input
                  type="text"
                  name="track"
                  value={formData.track}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">Artist Name</label>
                <input
                  type="text"
                  name="artist"
                  value={formData.artist}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Royalty Configuration */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-black mb-6">Royalty Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Rights Type</label>
                <select
                  name="rightsType"
                  value={formData.rightsType}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="master">Master Recording</option>
                  <option value="publishing">Publishing</option>
                  <option value="both">Both Master & Publishing</option>
                  <option value="sync">Sync Rights</option>
                  <option value="mechanical">Mechanical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Revenue Basis</label>
                <select
                  name="revenueBasis"
                  value={formData.revenueBasis}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="net">Net Revenue</option>
                  <option value="gross">Gross Revenue</option>
                  <option value="adjusted">Adjusted Revenue</option>
                  <option value="pro-rata">Pro-rata</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Jurisdiction</label>
                <select
                  name="jurisdiction"
                  value={formData.jurisdiction}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="us">United States</option>
                  <option value="uk">United Kingdom</option>
                  <option value="eu">European Union</option>
                  <option value="global">Global</option>
                  <option value="ca">Canada</option>
                  <option value="au">Australia</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Split Percentage</label>
                <div className="relative">
                  <input
                    type="number"
                    name="percentage"
                    value={formData.percentage}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-indigo-500 pr-12"
                    min="1"
                    max="100"
                    step="0.1"
                    required
                  />
                  <span className="absolute right-3 top-3 text-black">%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">End Date (Optional)</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Territories */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-black mb-6">Territories</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {territories.map((territory) => (
                <label key={territory} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.territories.includes(territory)}
                    onChange={() => handleTerritoryToggle(territory)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-black">{territory}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-black mb-6">Additional Notes</h2>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter any special conditions or notes..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="px-8 py-4 bg-gradient-to-r from-indigo-900 to-purple-900 text-white rounded-lg font-medium hover:from-indigo-800 hover:to-purple-800 transition disabled:opacity-50 text-lg"
            >
              {sending ? 'Sending...' : 'Send Digital Handshake'}
            </button>
          </div>

          {/* Success Message */}
          {sent && (
            <div className="fixed bottom-4 right-4 p-4 bg-green-100 text-green-800 rounded-lg shadow-lg animate-pulse">
              ✓ Digital handshake sent successfully! Email has been sent to the rights holder.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
