"use client";

import React from "react";
import Link from "next/link";
import { useState } from "react";

const QRCode = ({ value, size = 120 }: { value: string; size?: number }) => (
  <img
    src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`}
    alt="QR Code"
    width={size}
    height={size}
    style={{ borderRadius: "0.5rem" }}
  />
);

export default function AttorneyPortal() {
  const [activeSection, setActiveSection] = useState("dashboard");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white py-4 px-6 text-center font-medium">
        Attorney Portal – Secure Session | Encrypted & Hash-Verified
      </div>

      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-indigo-900">
            TrapRoyalties<span className="text-indigo-600">Pro</span>
          </Link>
          <div className="flex items-center space-x-6">
            <span className="text-sm text-gray-600">Leron Rogers (Fox Rothschild)</span>
            <Link
              href="/"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition"
            >
              Logout
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Attorney Portal</h1>
        <p className="text-lg text-gray-600 mb-8">
          Select a section to begin forensic audits, generate reports, or manage matters.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <button
            onClick={() => setActiveSection("run-due-diligence")}
            className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition text-left"
          >
            <h3 className="text-xl font-semibold text-indigo-900 mb-2">
              Run Catalog Due Diligence
            </h3>
            <p className="text-gray-600">Start forensic scan on client catalog</p>
          </button>

          <button
            onClick={() => setActiveSection("generate-court-report")}
            className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition text-left"
          >
            <h3 className="text-xl font-semibold text-indigo-900 mb-2">
              Generate Court-Ready Report
            </h3>
            <p className="text-gray-600">Create Bates-stamped audit reports</p>
          </button>

          <button
            onClick={() => setActiveSection("create-demand-letter")}
            className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition text-left"
          >
            <h3 className="text-xl font-semibold text-indigo-900 mb-2">
              Create Demand Letter
            </h3>
            <p className="text-gray-600">Draft formal royalty demand</p>
          </button>
        </div>

        <div className="mt-12 text-center text-gray-500 text-sm">
          Active section: <strong>{activeSection}</strong>
        </div>
      </main>
    </div>
  );
}
