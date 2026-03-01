"use client";

import Link from "next/link";
import { useState } from "react";

export default function DigitalHandshakePage() {
  const [signed, setSigned] = useState(false);

  return (
    <div style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #1a1a2f 100%)", color: "white", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>

      {/* Navbar */}
      <nav style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(59,130,246,0.3)", position: "fixed", width: "100%", zIndex: 50 }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: "1.5rem", fontWeight: 700 }}>
              <span style={{ color: "#3b82f6" }}>TrapRoyalties</span>
              <span style={{ color: "white" }}>Pro</span>
            </span>
          </Link>
          <Link href="/" style={{ color: "#d1d5db", textDecoration: "none" }}>← Back to Home</Link>
        </div>
      </nav>

      <div style={{ paddingTop: "6rem", paddingBottom: "5rem", paddingLeft: "1.5rem", paddingRight: "1.5rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

          {/* Badge */}
          <div style={{ display: "inline-block", background: "#3b82f6", color: "white", padding: "0.5rem 1.5rem", borderRadius: "9999px", fontWeight: "bold", fontSize: "0.875rem", marginBottom: "2rem", border: "2px solid #60a5fa" }}>
            🏷️ LABELS & MANAGERS PORTAL
          </div>

          {/* Header */}
          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: "1rem" }}>
            <span style={{ color: "#3b82f6", textShadow: "0 0 20px rgba(59,130,246,0.5)" }}>The Digital Handshake</span>
            <br />
            <span style={{ color: "white", fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>For Modern Royalty Splits</span>
          </h1>
          <p style={{ fontSize: "1.25rem", color: "#9ca3af", maxWidth: "600px", marginBottom: "3rem" }}>
            No crypto wallets. No blockchain confusion. Just legally binding split agreements sent via text or email.
          </p>

          {/* Main Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "3rem", marginBottom: "3rem" }}>

            {/* Left: Story Flow */}
            <div style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "1.5rem", padding: "2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
                <div style={{ width: "2.5rem", height: "2.5rem", background: "#3b82f6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "1.25rem" }}>1</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#3b82f6" }}>Artist Sets Split</div>
              </div>

              {/* Timeline items */}
              {[
                {
                  icon: "🎤",
                  title: "Artist creates agreement",
                  desc: "Enter percentages and producer's contact",
                  extra: (
                    <div style={{ background: "#1f2937", padding: "1rem", borderRadius: "0.5rem", marginTop: "0.75rem" }}>
                      <div>Track: "Neon Dreams"</div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
                        <span>Artist: 50%</span>
                        <span>Producer: 50%</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", fontSize: "0.75rem", color: "#10b981" }}>
                        <span>✓</span>
                        <span>Invite sent to producer@email.com</span>
                      </div>
                    </div>
                  ),
                  borderColor: "rgba(59,130,246,0.5)",
                  dotColor: "#3b82f6",
                },
                { icon: "📲", title: "Producer receives invite", desc: "Text or email with magic link to sign", borderColor: "rgba(59,130,246,0.5)", dotColor: "#3b82f6" },
                { icon: "✍️", title: "Biometric signature", desc: "FaceID/TouchID optional on mobile", borderColor: "rgba(59,130,246,0.5)", dotColor: "#3b82f6" },
                { icon: "✅", title: "Deal executed", desc: "Audit trail + verification hash created", borderColor: "#10b981", dotColor: "#10b981", green: true },
              ].map((item, i) => (
                <div key={i} style={{ position: "relative", paddingLeft: "2rem", borderLeft: `2px solid ${item.borderColor}`, marginBottom: "2rem" }}>
                  <div style={{ position: "absolute", left: "-0.75rem", top: 0, width: "1.5rem", height: "1.5rem", background: item.dotColor, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>
                    {item.icon}
                  </div>
                  <div style={{ background: item.green ? "rgba(16,185,129,0.1)" : "rgba(59,130,246,0.1)", borderRadius: "0.75rem", padding: "1rem" }}>
                    <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>{item.title}</div>
                    <div style={{ color: "#9ca3af" }}>{item.desc}</div>
                    {item.extra}
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Live Preview */}
            <div style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(168,85,247,0.2))", borderRadius: "1.5rem", border: "1px solid rgba(168,85,247,0.5)", padding: "2rem" }}>
              <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                <span style={{ color: "#a855f7", fontFamily: "monospace" }}>⚡ LIVE PREVIEW</span>
              </div>

              {/* Phone Mockup */}
              <div style={{ maxWidth: "350px", margin: "0 auto", background: "black", borderRadius: "3rem", border: "4px solid #374151", padding: "1rem" }}>
                <div style={{ background: "#111827", borderRadius: "2rem", overflow: "hidden" }}>
                  <div style={{ background: "#1f2937", padding: "1rem", display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                    <span>9:41</span>
                    <span>📶 🔋 100%</span>
                  </div>

                  {!signed ? (
                    <div style={{ padding: "1rem" }}>
                      <div style={{ background: "rgba(59,130,246,0.2)", border: "1px solid #3b82f6", borderRadius: "0.75rem", padding: "1rem" }}>
                        <div style={{ display: "flex", gap: "0.75rem" }}>
                          <div style={{ width: "2.5rem", height: "2.5rem", background: "#a855f7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>🎧</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: "bold" }}>Royalty Split Invite</div>
                            <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>From: King Kai</div>
                            <div style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>Track: "Neon Dreams" • 50% share</div>
                            <button
                              onClick={() => setSigned(true)}
                              style={{ width: "100%", background: "linear-gradient(to right, #3b82f6, #a855f7)", color: "white", fontWeight: "bold", padding: "0.75rem", borderRadius: "9999px", border: "none", marginTop: "0.75rem", cursor: "pointer", fontSize: "0.875rem" }}>
                              ✍️ Sign with FaceID
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ margin: "1rem", background: "rgba(16,185,129,0.2)", border: "1px solid #10b981", borderRadius: "0.75rem", padding: "1.5rem", textAlign: "center" }}>
                      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✅</div>
                      <div style={{ fontWeight: "bold" }}>Deal Signed!</div>
                      <div style={{ fontSize: "0.625rem", color: "#9ca3af", marginTop: "0.5rem", fontFamily: "monospace" }}>TxID: 7d3c...f8a2</div>
                    </div>
                  )}
                </div>
              </div>

              {/* CTA Buttons */}
              <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <Link href="/split-verification" style={{ background: "linear-gradient(to right, #3b82f6, #a855f7)", color: "white", fontWeight: "bold", padding: "1rem", borderRadius: "9999px", border: "none", cursor: "pointer", fontSize: "1.125rem", textAlign: "center", textDecoration: "none" }}>
                  🚀 Create Your First Split
                </Link>
                <button style={{ background: "transparent", border: "2px solid #3b82f6", color: "#3b82f6", fontWeight: "bold", padding: "1rem", borderRadius: "9999px", cursor: "pointer", fontSize: "1.125rem" }}>
                  📱 Send Test Invite to My Phone
                </button>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginTop: "3rem" }}>
            {[
              { icon: "📧", title: "Email + SMS Invites", desc: "No app download required. Collaborators sign via magic link." },
              { icon: "🔐", title: "Biometric-Ready", desc: "FaceID/TouchID optional but supported on mobile devices." },
              { icon: "⚖️", title: "Court-Admissible", desc: "Full audit trail with timestamps, IPs, and signature hashes." },
            ].map((f, i) => (
              <div key={i} style={{ background: "rgba(0,0,0,0.4)", border: "1px solid #1f2937", borderRadius: "0.75rem", padding: "1.5rem", textAlign: "center" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{f.icon}</div>
                <h3 style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>{f.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "#9ca3af" }}>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div style={{ marginTop: "4rem", textAlign: "center", padding: "3rem", background: "rgba(59,130,246,0.1)", borderRadius: "1.5rem", border: "1px solid rgba(59,130,246,0.3)" }}>
            <h2 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "1rem" }}>
              Ready to Protect Your <span style={{ color: "#3b82f6" }}>Split?</span>
            </h2>
            <p style={{ color: "#9ca3af", marginBottom: "2rem", fontSize: "1.1rem" }}>
              Create a legally binding agreement in under 2 minutes. No lawyers required.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/split-verification" style={{ background: "linear-gradient(to right, #3b82f6, #a855f7)", color: "white", fontWeight: "bold", padding: "1rem 2.5rem", borderRadius: "9999px", textDecoration: "none", fontSize: "1.1rem" }}>
                🤝 Create Split Agreement
              </Link>
              <Link href="/for-attorneys" style={{ border: "2px solid #f59e0b", color: "#f59e0b", fontWeight: "bold", padding: "1rem 2.5rem", borderRadius: "9999px", textDecoration: "none", fontSize: "1.1rem" }}>
                ⚖️ Attorney Portal
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer style={{ padding: "2rem 1.5rem", background: "#000", borderTop: "1px solid rgba(59,130,246,0.2)", textAlign: "center", color: "#6b7280" }}>
        <p>© 2026 TrapRoyalties Pro. Built for the culture. All rights reserved.</p>
      </footer>
    </div>
  );
}
