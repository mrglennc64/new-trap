"use client";

import { useState } from "react";
import Link from "next/link";

export default function FindMissingPage() {
  const [searchType, setSearchType] = useState<"artist" | "writer">("artist");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/catalog/royalty-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: query,
          artist: query,
          searchType,
        }),
      });
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="antialiased min-h-screen" style={{ background: "linear-gradient(135deg, #1e0033, #000033, #000)", color: "#e0e0e0", fontFamily: "'Inter', sans-serif" }}>

      {/* Navbar */}
      <nav style={{ position: "fixed", width: "100%", zIndex: 50, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(168,85,247,0.3)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "'Orbitron', sans-serif", textShadow: "0 0 10px #a855f7, 0 0 20px #a855f7", color: "#fff" }}>
              TrapRoyalties Pro
            </span>
          </Link>
          <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
            <Link href="/" style={{ color: "#d1d5db", textDecoration: "none" }}>Home</Link>
            <Link href="/free-audit" style={{ color: "#d1d5db", textDecoration: "none" }}>Free Audit</Link>
            <Link href="/split-verification" style={{ color: "#d1d5db", textDecoration: "none" }}>Split Verification</Link>
            <Link href="/find-missing" style={{ color: "#a855f7", fontWeight: 500, textDecoration: "none" }}>Find Missing Royalties</Link>
            <Link href="/accelerator" style={{ color: "#d1d5db", textDecoration: "none" }}>Accelerator</Link>
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <Link href="/signin" style={{ color: "#d1d5db", textDecoration: "none" }}>Sign In</Link>
            <Link href="/free-audit" style={{ background: "#9333ea", color: "#fff", padding: "0.5rem 1.5rem", borderRadius: "9999px", fontWeight: 600, textDecoration: "none" }}>
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ paddingTop: "7rem", paddingBottom: "5rem", paddingLeft: "1.5rem", paddingRight: "1.5rem", maxWidth: "1024px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1 style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 700,
            marginBottom: "1rem",
            textShadow: "0 0 10px #06b6d4, 0 0 20px #06b6d4",
            color: "#fff"
          }}>
            Find Missing Royalties
          </h1>
          <p style={{ fontSize: "clamp(1rem, 2vw, 1.25rem)", color: "#d1d5db", maxWidth: "56rem", margin: "0 auto" }}>
            Hunt down unclaimed bags from streams, syncs, performances & playlists. Scan major PROs (ASCAP, BMI, SOCAN, PRS) for gaps — especially in hip hop collabs, features, & R&B hooks.
          </p>
          <p style={{ marginTop: "1rem", fontSize: "1.1rem", color: "#c084fc", fontWeight: 500 }}>
            Free basic search • Real-time estimates • Upgrade for full recovery & on-chain proof
          </p>
        </div>

        {/* Search Card */}
        <div style={{
          background: "rgba(17,24,39,0.6)",
          backdropFilter: "blur(12px)",
          borderRadius: "1.5rem",
          border: "1px solid rgba(168,85,247,0.3)",
          padding: "3rem",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)"
        }}>

          {/* Search Type Toggle */}
          <div style={{ display: "flex", gap: "1rem", marginBottom: "2.5rem" }}>
            <button
              onClick={() => setSearchType("artist")}
              style={{
                flex: 1, padding: "1.25rem",
                borderRadius: "1rem",
                fontWeight: 600,
                fontSize: "1rem",
                border: "none",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem",
                background: searchType === "artist" ? "linear-gradient(to right, #9333ea, #ec4899)" : "#1f2937",
                color: searchType === "artist" ? "#fff" : "#9ca3af",
                transition: "all 0.2s",
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              Search by Artist / Group
            </button>
            <button
              onClick={() => setSearchType("writer")}
              style={{
                flex: 1, padding: "1.25rem",
                borderRadius: "1rem",
                fontWeight: 600,
                fontSize: "1rem",
                border: "none",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem",
                background: searchType === "writer" ? "linear-gradient(to right, #9333ea, #ec4899)" : "#1f2937",
                color: searchType === "writer" ? "#fff" : "#9ca3af",
                transition: "all 0.2s",
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Search by Writer / Producer
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch}>
            <div style={{ position: "relative", marginBottom: "2rem" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ position: "absolute", left: "1.25rem", top: "50%", transform: "translateY(-50%)" }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchType === "artist" ? "Enter artist name (e.g., Future, Metro Boomin, SZA)" : "Enter writer/producer name (e.g., Metro Boomin, Rodney Jerkins)"}
                style={{
                  width: "100%",
                  paddingLeft: "4rem",
                  paddingRight: "1.5rem",
                  paddingTop: "1.5rem",
                  paddingBottom: "1.5rem",
                  fontSize: "1.1rem",
                  background: "#1f2937",
                  border: "2px solid rgba(168,85,247,0.3)",
                  borderRadius: "1rem",
                  color: "#fff",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !query.trim()}
              style={{
                width: "100%",
                padding: "1.5rem",
                background: loading ? "#4b5563" : "linear-gradient(to right, #9333ea, #ec4899)",
                color: "#fff",
                borderRadius: "9999px",
                fontWeight: 700,
                fontSize: "1.4rem",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "1rem",
                transition: "all 0.2s",
              }}
            >
              {loading ? (
                <>Searching...</>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                  </svg>
                  Search for Missing Royalties
                </>
              )}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "1.5rem", color: "#9ca3af", fontSize: "1rem" }}>
            Free basic search (limited results) •{" "}
            <Link href="/free-audit" style={{ color: "#a855f7", textDecoration: "underline" }}>Full catalog scan in Free Audit</Link>
          </p>

          {/* Error */}
          {error && (
            <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "0.75rem", color: "#f87171" }}>
              Error: {error}
            </div>
          )}

          {/* Results */}
          {results && (
            <div style={{ marginTop: "2rem" }}>
              <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "1.2rem", color: "#a855f7", marginBottom: "1rem" }}>Results</h3>

              {results.missing?.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  <h4 style={{ color: "#f87171", marginBottom: "0.5rem", fontWeight: 600 }}>⚠️ Missing Rights Detected</h4>
                  {results.missing.map((m: any, i: number) => (
                    <div key={i} style={{ padding: "0.75rem", background: "rgba(239,68,68,0.1)", borderRadius: "0.5rem", marginBottom: "0.5rem", color: "#fca5a5" }}>
                      {m.reason}
                    </div>
                  ))}
                </div>
              )}

              {results.publishing?.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  <h4 style={{ color: "#34d399", marginBottom: "0.5rem", fontWeight: 600 }}>✅ Publishing</h4>
                  {results.publishing.map((p: any, i: number) => (
                    <div key={i} style={{ padding: "0.75rem", background: "rgba(52,211,153,0.1)", borderRadius: "0.5rem", marginBottom: "0.5rem" }}>
                      {p.publisher} {p.ipi && `• IPI: ${p.ipi}`}
                    </div>
                  ))}
                </div>
              )}

              {results.pro?.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  <h4 style={{ color: "#60a5fa", marginBottom: "0.5rem", fontWeight: 600 }}>✅ PRO Registrations</h4>
                  {results.pro.map((p: any, i: number) => (
                    <div key={i} style={{ padding: "0.75rem", background: "rgba(96,165,250,0.1)", borderRadius: "0.5rem", marginBottom: "0.5rem" }}>
                      {p.writer} {p.pro && `• ${p.pro}`} {p.ipi && `• IPI: ${p.ipi}`}
                    </div>
                  ))}
                </div>
              )}

              {results.publishing?.length === 0 && results.pro?.length === 0 && results.missing?.length === 0 && (
                <div style={{ textAlign: "center", color: "#9ca3af", padding: "2rem" }}>
                  No results found. Try a different name or{" "}
                  <Link href="/free-audit" style={{ color: "#a855f7" }}>run a full audit</Link>.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Features */}
        <div style={{ marginTop: "5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2.5rem" }}>
          {[
            {
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/></svg>,
              title: "Global PRO Coverage",
              desc: "Scans ASCAP, BMI, SOCAN, PRS & more — find unclaimed from viral TikToks to radio spins.",
              color: "#a855f7"
            },
            {
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
              title: "Real-Time Estimates",
              desc: "Instant insights on potential missing earnings — see where your streams & syncs fell through the cracks.",
              color: "#06b6d4"
            },
            {
              icon: <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
              title: "Claim Your Bag",
              desc: "Link to recovery tools — upgrade for crypto-verified claims & payment simulation.",
              color: "#a855f7"
            }
          ].map((f, i) => (
            <div key={i} style={{
              textAlign: "center",
              background: "rgba(17,24,39,0.4)",
              borderRadius: "1rem",
              padding: "2rem",
              border: "1px solid rgba(168,85,247,0.2)"
            }}>
              <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "center" }}>{f.icon}</div>
              <h3 style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: "1.25rem",
                fontWeight: 700,
                marginBottom: "1rem",
                textShadow: `0 0 10px ${f.color}`,
                color: "#fff"
              }}>{f.title}</h3>
              <p style={{ color: "#d1d5db" }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Upsell CTA */}
        <div style={{ marginTop: "4rem", textAlign: "center" }}>
          <h2 style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
            fontWeight: 700,
            marginBottom: "1.5rem",
            textShadow: "0 0 10px #06b6d4, 0 0 20px #06b6d4",
            color: "#fff"
          }}>
            Ready to Recover What's Yours?
          </h2>
          <p style={{ fontSize: "1.2rem", color: "#d1d5db", marginBottom: "2rem" }}>
            Basic search shows gaps — full power (unlimited, monitoring, on-chain proof) in Royalty Accelerator.
          </p>
          <Link href="/accelerator" style={{
            display: "inline-block",
            background: "linear-gradient(to right, #ec4899, #9333ea)",
            color: "#fff",
            fontWeight: 700,
            padding: "1.5rem 3rem",
            borderRadius: "9999px",
            fontSize: "1.4rem",
            textDecoration: "none",
            boxShadow: "0 20px 40px rgba(236,72,153,0.3)",
          }}>
            Join Accelerator – Limited Spots
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: "3rem 1.5rem", background: "#000", borderTop: "1px solid rgba(168,85,247,0.2)", textAlign: "center", color: "#6b7280" }}>
        <p>© 2026 TrapRoyalties Pro. Built for the culture. All rights reserved.</p>
        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: "1.5rem" }}>
          <Link href="/privacy" style={{ color: "#6b7280", textDecoration: "none" }}>Privacy</Link>
          <Link href="/terms" style={{ color: "#6b7280", textDecoration: "none" }}>Terms</Link>
          <Link href="/contact" style={{ color: "#6b7280", textDecoration: "none" }}>Contact</Link>
        </div>
      </footer>
    </div>
  );
}
