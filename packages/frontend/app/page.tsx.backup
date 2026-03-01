"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen gradient-bg text-white">
      {/* Navigation - UPDATED with Labels & Managers link */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${
        scrolled ? 'bg-black/80 backdrop-blur-xl border-b border-purple-900/50' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold group">
            <span className="neon-purple">TrapRoyalties</span>
            <span className="text-purple-300 group-hover:text-pink-300 transition-colors">Pro</span>
          </Link>
          
          {/* Updated Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-300 hover:text-purple-400 transition relative group">
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
            
            {/* NEW: Labels & Managers Link */}
            <Link href="/label" className="text-gray-300 hover:text-blue-400 transition relative group">
              🏷️ Labels & Managers
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
            
            {/* EXISTING: For Attorneys Link */}
            <Link href="/for-attorneys" className="text-amber-400 font-bold hover:text-amber-300 transition relative group">
              ⚖️ For Attorneys
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-400 group-hover:w-full transition-all duration-300"></span>
            </Link>
            
            {/* EXISTING: Free Audit Button */}
            <Link href="/free-audit" className="bg-purple-600 hover:bg-purple-500 px-6 py-2 rounded-full font-semibold transition transform hover:scale-105 hover:shadow-lg hover:shadow-purple-600/50">
              Start Free Audit
            </Link>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" x2="20" y1="12" y2="12"/>
              <line x1="4" x2="20" y1="6" y2="6"/>
              <line x1="4" x2="20" y1="18" y2="18"/>
            </svg>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          {/* Floating badges */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <span className="bg-purple-900/50 backdrop-blur-sm px-4 py-2 rounded-full text-sm border border-purple-500/50 animate-pulse">
              🔥 50K+ tracks scanned
            </span>
            <span className="bg-cyan-900/50 backdrop-blur-sm px-4 py-2 rounded-full text-sm border border-cyan-500/50 animate-pulse" style={{ animationDelay: '0.2s' }}>
              ⚡ Monad-powered
            </span>
            <span className="bg-pink-900/50 backdrop-blur-sm px-4 py-2 rounded-full text-sm border border-pink-500/50 animate-pulse" style={{ animationDelay: '0.4s' }}>
              🎵 Hip-hop & R&B focused
            </span>
          </div>

          {/* Updated Hero Heading */}
          <h1 className="text-5xl md:text-7xl font-black mb-6">
            <span className="neon-cyan block">
              Get Your Bag
            </span>
            <span className="neon-purple block text-4xl md:text-5xl mt-4">
              From Every Stream,
            </span>
            <span className="neon-purple block text-4xl md:text-5xl">
              Sync, & Performance
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
            Stop leaving money on the table. TrapRoyalties Pro scans PROs, verifies splits with 
            <span className="text-purple-400 font-bold neon-purple"> crypto proofs</span>, and recovers your royalties — 
            built for hip hop & R&B creators who hustle.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/free-audit" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-5 px-10 rounded-full text-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-600/50">
              Start Free Catalog Audit
            </Link>
            <Link href="/founding-member" className="border-2 border-purple-500 text-purple-400 hover:bg-purple-900/30 font-bold py-5 px-10 rounded-full text-xl transition transform hover:scale-105">
              Join Royalty Accelerator
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto mt-16">
            <div className="text-center group">
              <div className="text-4xl font-bold neon-cyan group-hover:scale-110 transition">100M+</div>
              <div className="text-gray-400 text-sm">Tracks Monitored</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-bold neon-purple group-hover:scale-110 transition">$1.2M+</div>
              <div className="text-gray-400 text-sm">Royalties Found</div>
            </div>
            <div className="text-center group">
              <div className="text-4xl font-bold text-pink-400 group-hover:scale-110 transition">4 PROs</div>
              <div className="text-gray-400 text-sm">ASCAP, BMI, SOCAN, PRS</div>
            </div>
          </div>
        </div>
      </section>

      {/* Lawyer CTA Section */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-r from-amber-900/20 via-yellow-900/20 to-amber-900/20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="inline-block bg-amber-500 text-black font-bold px-4 py-2 rounded-full text-sm mb-6 animate-bounce">
            ⚖️ ATTORNEY-EXCLUSIVE ⚖️
          </span>
          
          <h2 className="text-5xl md:text-7xl font-black mb-6">
            <span className="neon-amber">
              STOP ROYALTY DISPUTES
            </span>
            <br />
            <span className="text-white">BEFORE THEY BECOME LAWSUITS</span>
          </h2>
          
          <p className="text-2xl text-gray-300 mb-12 max-w-4xl mx-auto">
            Built specifically for <span className="text-amber-400 font-bold neon-amber">entertainment attorneys</span>. 
            Verifiable ownership records, court-admissible audit reports, and tamper-proof blockchain evidence.
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="bg-black/60 backdrop-blur p-6 rounded-2xl border border-amber-500/30 hover:scale-105 transition-all duration-300 hover:border-amber-400 group">
              <div className="text-4xl font-bold text-amber-400 mb-2 group-hover:scale-110 transition">$1.2M+</div>
              <div className="text-gray-300">Black Box Royalties</div>
            </div>
            <div className="bg-black/60 backdrop-blur p-6 rounded-2xl border border-amber-500/30 hover:scale-105 transition-all duration-300 hover:border-amber-400 group">
              <div className="text-4xl font-bold text-amber-400 mb-2 group-hover:scale-110 transition">47%</div>
              <div className="text-gray-300">Split Error Rate</div>
            </div>
            <div className="bg-black/60 backdrop-blur p-6 rounded-2xl border border-amber-500/30 hover:scale-105 transition-all duration-300 hover:border-amber-400 group">
              <div className="text-4xl font-bold text-amber-400 mb-2 group-hover:scale-110 transition">30 Days</div>
              <div className="text-gray-300">Dispute Resolution</div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-center gap-6 max-w-3xl mx-auto">
            <Link href="/for-attorneys" className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold py-6 px-12 rounded-full text-2xl hover:scale-105 transition-all duration-300 shadow-2xl flex-1">
              ⚖️ Attorney Portal Access
            </Link>
            <Link href="/for-attorneys#sample" className="border-2 border-amber-500 text-amber-400 hover:bg-amber-500/10 font-bold py-6 px-12 rounded-full text-2xl transition flex-1 hover:scale-105">
              View Sample Report
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-16">
            <span className="neon-purple">Why TrapRoyalties Pro?</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🔍",
                title: "PRO Scanner + Gap Finder",
                desc: "Continuous monitoring of ASCAP, BMI, SOCAN, PRS. Uncover unclaimed royalties with verifiable records."
              },
              {
                icon: "⚡",
                title: "Crypto-Verified Splits",
                desc: "Enforce accurate splits with blockchain proofs. Generate court-admissible documentation."
              },
              {
                icon: "📋",
                title: "Attorney-Ready Reports",
                desc: "Every audit includes verification hash, chain of custody, and downloadable PDF for discovery."
              }
            ].map((feature, i) => (
              <div key={i} className="group bg-purple-950/50 p-8 rounded-2xl border border-purple-800 hover:border-purple-500 transition-all duration-500 hover:scale-105">
                <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300 animate-float" style={{ animationDelay: i * 0.2 + 's' }}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-purple-400 mb-4 group-hover:text-pink-400 transition">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dual-Path CTA - UPDATED to include Labels & Managers option */}
      <section className="py-20 px-6 bg-gradient-to-r from-purple-900/30 via-pink-900/30 to-purple-900/30">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Who Are You?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {/* Artists */}
            <Link href="/free-audit" className="group">
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-8 rounded-2xl hover:scale-105 transition-all duration-500 border-2 border-purple-400/50">
                <div className="text-7xl mb-4 group-hover:scale-110 transition-transform duration-300 animate-float">🎵</div>
                <h3 className="text-2xl font-bold mb-3 text-white">I'm an Artist</h3>
                <p className="text-purple-200 mb-6">Find missing royalties from streams, syncs, and performances.</p>
                <span className="inline-block bg-white text-purple-900 px-6 py-2 rounded-full font-bold group-hover:bg-purple-100 transition">
                  Free Audit →
                </span>
              </div>
            </Link>
            
            {/* Labels & Managers - NEW */}
            <Link href="/label" className="group">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-8 rounded-2xl hover:scale-105 transition-all duration-500 border-2 border-blue-400/50">
                <div className="text-7xl mb-4 group-hover:scale-110 transition-transform duration-300 animate-float" style={{ animationDelay: '0.1s' }}>🏷️</div>
                <h3 className="text-2xl font-bold mb-3 text-white">I'm a Label/Manager</h3>
                <p className="text-blue-200 mb-6">Manage catalogs, track royalties, and verify splits across your roster.</p>
                <span className="inline-block bg-white text-blue-900 px-6 py-2 rounded-full font-bold group-hover:bg-blue-100 transition">
                  Label Portal →
                </span>
              </div>
            </Link>
            
            {/* Attorneys */}
            <Link href="/for-attorneys" className="group">
              <div className="bg-gradient-to-br from-amber-600 to-amber-800 p-8 rounded-2xl hover:scale-105 transition-all duration-500 border-2 border-amber-400/50">
                <div className="text-7xl mb-4 group-hover:scale-110 transition-transform duration-300 animate-float" style={{ animationDelay: '0.2s' }}>⚖️</div>
                <h3 className="text-2xl font-bold mb-3 text-white">I'm an Attorney</h3>
                <p className="text-amber-200 mb-6">Access court‑ready reports and audit tools built for litigation.</p>
                <span className="inline-block bg-white text-amber-900 px-6 py-2 rounded-full font-bold group-hover:bg-amber-100 transition">
                  Attorney Portal →
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-black/80 border-t border-purple-900/30 text-center text-gray-500">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <Link href="/privacy" className="hover:text-purple-400 transition">Privacy</Link>
            <Link href="/terms" className="hover:text-purple-400 transition">Terms</Link>
            <Link href="/label" className="text-blue-400 hover:text-blue-300 font-bold transition">🏷️ Labels & Managers</Link>
            <Link href="/for-attorneys" className="text-amber-400 hover:text-amber-300 font-bold transition">⚖️ For Attorneys</Link>
            <Link href="/contact" className="hover:text-purple-400 transition">Contact</Link>
          </div>
          <p>© 2026 TrapRoyalties Pro. Built for the culture. All rights reserved.</p>
          <p className="text-xs text-gray-600 mt-4">ASCAP · BMI · SOCAN · PRS · Monad Blockchain</p>
        </div>
      </footer>
    </div>
  );
}
