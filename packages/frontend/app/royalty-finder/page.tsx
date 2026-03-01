"use client";

import { useState } from "react";
import Link from "next/link";

export default function RoyaltyFinderPage() {
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

  const missingIcons: Record<string, string> = {
    ascap: "🎵",
    bmi: "🎼",
    soundexchange: "💿",
    default: "⚠️",
  };

  const missingColors: Record<string, string> = {
    ascap: "#f59e0b",
    bmi: "#3b82f6",
    soundexchange: "#10b981",
    default: "#f87171",
  };

  return (
    <div style={{ background: "linear-gradient(135deg, #1e0033, #000033, #000)", color: "#e0e0e0", fontFamily: "'Inter', sans-serif", minHeight: "100vh" }}>

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
            <Link href="/royalty-finder" style={{ color: "#a855f7", fontWeight: 500, textDecoration: "none" }}>Find Missing Royalties</Link>
            <Link href="/for-attorneys" style={{ color: "#fbbf24", textDecoration: "none" }}>⚖️ Attorneys</Link>
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <Link href="/signin" style={{ color: "#d1d5db", textDecoration: "none" }}>Sign In</Link>
            <Link href="/free-audit" style={{ background: "#9333ea", color: "#fff", padding: "0.5rem 1.5rem", borderRadius: "9999px", fontWeight: 600, textDecoration: "none" }}>
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main style={{ paddingTop: "7rem", paddingBottom: "5rem", paddingLeft: "1.5rem", paddingRight: "1.5rem", maxWidth: "1024px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700, marginBottom: "1rem", textShadow: "0 0 10px #06b6d4, 0 0 20px #06b6d4", color: "#fff" }}>
            Find Missing Royalties
          </h1>
          <p style={{ fontSize: "clamp(1rem, 2vw, 1.25rem)", color: "#d1d5db", maxWidth: "56rem", margin: "0 auto" }}>
            Hunt down unclaimed bags from streams, syncs, performances & playlists. Scan MusicBrainz for recordings, ISRCs, and rights gaps — built for hip hop & R&B creators.
          </p>
          <p style={{ marginTop: "1rem", fontSize: "1.1rem", color: "#c084fc", fontWeight: 500 }}>
            Free basic search • Real ISRC data • Direct PRO verification links
          </p>
        </div>

        {/* Search Card */}
        <div style={{ background: "rgba(17,24,39,0.6)", backdropFilter: "blur(12px)", borderRadius: "1.5rem", border: "1px solid rgba(168,85,247,0.3)", padding: "3rem", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>

          {/* Toggle */}
          <div style={{ display: "flex", gap: "1rem", marginBottom: "2.5rem" }}>
            {["artist", "writer"].map((type) => (
              <button key={type} onClick={() => setSearchType(type as "artist" | "writer")}
                style={{ flex: 1, padding: "1.25rem", borderRadius: "1rem", fontWeight: 600, fontSize: "1rem", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", background: searchType === type ? "linear-gradient(to right, #9333ea, #ec4899)" : "#1f2937", color: searchType === type ? "#fff" : "#9ca3af", transition: "all 0.2s" }}>
                {type === "artist" ? "🎵 Search by Artist / Group" : "✍️ Search by Writer / Producer"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSearch}>
            <div style={{ position: "relative", marginBottom: "2rem" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: "1.25rem", top: "50%", transform: "translateY(-50%)" }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder={searchType === "artist" ? "Enter artist name (e.g., Future, SZA, Metro Boomin)" : "Enter writer/producer name"}
                style={{ width: "100%", paddingLeft: "4rem", paddingRight: "1.5rem", paddingTop: "1.5rem", paddingBottom: "1.5rem", fontSize: "1.1rem", background: "#1f2937", border: "2px solid rgba(168,85,247,0.3)", borderRadius: "1rem", color: "#fff", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <button type="submit" disabled={loading || !query.trim()}
              style={{ width: "100%", padding: "1.5rem", background: loading ? "#4b5563" : "linear-gradient(to right, #9333ea, #ec4899)", color: "#fff", borderRadius: "9999px", fontWeight: 700, fontSize: "1.4rem", border: "none", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", transition: "all 0.2s" }}>
              {loading ? "Searching..." : "🔍 Search for Missing Royalties"}
            </button>
          </form>

          {error && (
            <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "0.75rem", color: "#f87171" }}>
              Error: {error}
            </div>
          )}

          {/* Results */}
          {results && (
            <div style={{ marginTop: "2rem" }}>
              <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "1.2rem", color: "#a855f7", marginBottom: "1.5rem" }}>Results</h3>

              {/* Recordings Found */}
              {results.neighboring?.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <h4 style={{ color: "#c084fc", marginBottom: "0.75rem", fontWeight: 600 }}>🎵 Recordings Found</h4>
                  {results.neighboring.map((n: any, i: number) => (
                    <div key={i} style={{ padding: "1rem", background: "rgba(192,132,252,0.1)", borderRadius: "0.75rem", marginBottom: "0.75rem", border: "1px solid rgba(192,132,252,0.2)" }}>
                      <div style={{ fontWeight: 600, color: "#e9d5ff" }}>{n.title}</div>
                      <div style={{ fontSize: "0.85rem", color: "#9ca3af", marginTop: "0.4rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                        <span>👤 {n.performer}</span>
                        {n.release_date && <span>📅 {n.release_date}</span>}
                        {n.label && <span>🏷️ {n.label}</span>}
                        <span>📦 {n.source}</span>
                        {n.isrc && <span style={{ color: "#a855f7", fontWeight: 600 }}>🎫 ISRC: {n.isrc}</span>}
                      </div>
                      {n.all_isrcs?.length > 1 && (
                        <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.4rem" }}>
                          All ISRCs: {n.all_isrcs.join(" • ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Publishing */}
              {results.publishing?.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <h4 style={{ color: "#34d399", marginBottom: "0.75rem", fontWeight: 600 }}>✅ Publishing Found</h4>
                  {results.publishing.map((p: any, i: number) => (
                    <div key={i} style={{ padding: "1rem", background: "rgba(52,211,153,0.1)", borderRadius: "0.75rem", marginBottom: "0.75rem", border: "1px solid rgba(52,211,153,0.2)" }}>
                      <div style={{ fontWeight: 600 }}>{p.publisher}</div>
                      <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                        {p.role && `Role: ${p.role}`} {p.ipi && `• IPI: ${p.ipi}`} {p.source && `• ${p.source}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* PRO */}
              {results.pro?.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <h4 style={{ color: "#60a5fa", marginBottom: "0.75rem", fontWeight: 600 }}>✅ PRO Registrations Found</h4>
                  {results.pro.map((p: any, i: number) => (
                    <div key={i} style={{ padding: "1rem", background: "rgba(96,165,250,0.1)", borderRadius: "0.75rem", marginBottom: "0.75rem", border: "1px solid rgba(96,165,250,0.2)" }}>
                      <div style={{ fontWeight: 600 }}>{p.writer}</div>
                      <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                        {p.pro && `PRO: ${p.pro}`} {p.ipi && `• IPI: ${p.ipi}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Missing Rights with Action Links */}
              {results.missing?.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <h4 style={{ color: "#f87171", marginBottom: "0.75rem", fontWeight: 600 }}>⚠️ Potential Missing Rights</h4>
                  {results.missing.map((m: any, i: number) => {
                    const color = missingColors[m.type] || missingColors.default;
                    const icon = missingIcons[m.type] || missingIcons.default;
                    return (
                      <div key={i} style={{ padding: "1rem", background: `rgba(0,0,0,0.3)`, borderRadius: "0.75rem", marginBottom: "0.75rem", border: `1px solid ${color}40` }}>
                        <div style={{ color: "#e5e7eb", marginBottom: "0.5rem" }}>{icon} {m.reason}</div>
                        {m.link && (
                          <a href={m.link} target="_blank" rel="noopener noreferrer"
                            style={{ display: "inline-block", marginTop: "0.25rem", padding: "0.4rem 1rem", background: `${color}20`, border: `1px solid ${color}60`, borderRadius: "0.5rem", color: color, fontSize: "0.85rem", fontWeight: 600, textDecoration: "none" }}>
                            {m.action} →
                          </a>
                        )}
                      </div>
                    );
                  })}

                  {/* Direct PRO Search Links */}
                  {results.search && (
                    <div style={{ marginTop: "1rem", padding: "1.25rem", background: "rgba(168,85,247,0.1)", borderRadius: "0.75rem", border: "1px solid rgba(168,85,247,0.3)" }}>
                      <p style={{ color: "#c084fc", fontWeight: 600, marginBottom: "0.75rem" }}>🔎 Search directly on PRO databases:</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                        <a href={results.search.ascap_link} target="_blank" rel="noopener noreferrer"
                          style={{ padding: "0.5rem 1.25rem", background: "#1f2937", border: "1px solid #f59e0b60", borderRadius: "0.5rem", color: "#f59e0b", fontWeight: 600, textDecoration: "none", fontSize: "0.9rem" }}>
                          ASCAP Repertory →
                        </a>
                        <a href={results.search.bmi_link} target="_blank" rel="noopener noreferrer"
                          style={{ padding: "0.5rem 1.25rem", background: "#1f2937", border: "1px solid #3b82f660", borderRadius: "0.5rem", color: "#3b82f6", fontWeight: 600, textDecoration: "none", fontSize: "0.9rem" }}>
                          BMI Repertoire →
                        </a>
                        <a href="https://www.soundexchange.com/performer-copyright-owner/claim-royalties/" target="_blank" rel="noopener noreferrer"
                          style={{ padding: "0.5rem 1.25rem", background: "#1f2937", border: "1px solid #10b98160", borderRadius: "0.5rem", color: "#10b981", fontWeight: 600, textDecoration: "none", fontSize: "0.9rem" }}>
                          SoundExchange →
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* No results */}
              {results.publishing?.length === 0 && results.pro?.length === 0 && results.neighboring?.length === 0 && results.missing?.length === 0 && (
                <div style={{ textAlign: "center", color: "#9ca3af", padding: "2rem" }}>
                  No results found. Try a different name or <Link href="/free-audit" style={{ color: "#a855f7" }}>run a full audit</Link>.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Features */}
        <div style={{ marginTop: "5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2.5rem" }}>
          {[
            { icon: "🔍", title: "Global PRO Coverage", desc: "Scans MusicBrainz + direct links to ASCAP, BMI, SOCAN, PRS — find unclaimed from viral TikToks to radio spins.", color: "#a855f7" },
            { icon: "🎫", title: "Real ISRC Data", desc: "Pull real ISRCs from MusicBrainz to verify neighboring rights and SoundExchange claims.", color: "#06b6d4" },
            { icon: "💰", title: "Claim Your Bag", desc: "Direct links to every PRO and rights org — no more guessing where to go.", color: "#10b981" }
          ].map((f, i) => (
            <div key={i} style={{ textAlign: "center", background: "rgba(17,24,39,0.4)", borderRadius: "1rem", padding: "2rem", border: "1px solid rgba(168,85,247,0.2)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{f.icon}</div>
              <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", textShadow: `0 0 10px ${f.color}`, color: "#fff" }}>{f.title}</h3>
              <p style={{ color: "#d1d5db" }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: "4rem", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "clamp(1.5rem, 4vw, 2.5rem)", fontWeight: 700, marginBottom: "1.5rem", textShadow: "0 0 10px #06b6d4", color: "#fff" }}>
            Ready to Recover What's Yours?
          </h2>
          <p style={{ fontSize: "1.2rem", color: "#d1d5db", marginBottom: "2rem" }}>
            Full catalog scan, monitoring, and recovery tools in Royalty Accelerator.
          </p>
          <Link href="/accelerator" style={{ display: "inline-block", background: "linear-gradient(to right, #ec4899, #9333ea)", color: "#fff", fontWeight: 700, padding: "1.5rem 3rem", borderRadius: "9999px", fontSize: "1.4rem", textDecoration: "none", boxShadow: "0 20px 40px rgba(236,72,153,0.3)" }}>
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
