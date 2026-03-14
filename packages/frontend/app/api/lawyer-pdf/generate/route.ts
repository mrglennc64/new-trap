import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { track_id, title, artist, isrc, contributors } = body;

    if (!isrc || !title) {
      return NextResponse.json({ detail: 'Missing required fields' }, { status: 400 });
    }

    // Build a plain-text legal evidence package as HTML for browser printing
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const contribRows = (contributors || []).map((c: any) =>
      `<tr><td>${c.name || '—'}</td><td>${c.role || '—'}</td><td>${c.ipi || '⚠ Not on file'}</td><td>${c.share ?? '—'}%</td></tr>`
    ).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Royalty Evidence Package — ${title}</title>
<style>
  body { font-family: 'Times New Roman', serif; margin: 60px; color: #111; }
  h1 { font-size: 18px; text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid #000; padding-bottom: 8px; }
  h2 { font-size: 13px; text-transform: uppercase; margin-top: 28px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
  th { background: #f0f0f0; text-align: left; padding: 6px 8px; border: 1px solid #ccc; }
  td { padding: 6px 8px; border: 1px solid #ccc; }
  .label { font-weight: bold; width: 200px; }
  .warning { color: #b45309; font-size: 11px; }
  .footer { margin-top: 60px; font-size: 10px; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
</style>
</head>
<body>
<h1>Royalty Rights Evidence Package</h1>
<p style="font-size:11px;color:#666;">Generated: ${date} · Source: TrapRoyaltiesPro Forensic Audit System</p>
<p class="warning">⚠ This document is for informational purposes. Consult a licensed attorney before filing claims.</p>

<h2>Recording Identification</h2>
<table>
  <tr><td class="label">Song Title</td><td>${title}</td></tr>
  <tr><td class="label">Artist</td><td>${artist || '—'}</td></tr>
  <tr><td class="label">ISRC</td><td>${isrc}</td></tr>
  <tr><td class="label">Track ID</td><td>${track_id || isrc}</td></tr>
</table>

<h2>Contributor Rights Table</h2>
<table>
  <thead><tr><th>Name</th><th>Role</th><th>IPI</th><th>Share</th></tr></thead>
  <tbody>${contribRows || '<tr><td colspan="4">No contributors on file</td></tr>'}</tbody>
</table>

<h2>Recommended Actions</h2>
<table>
  <tr><td>1. ASCAP Repertory Search</td><td>https://www.ascap.com/repertory</td></tr>
  <tr><td>2. BMI Repertoire Search</td><td>https://repertoire.bmi.com/</td></tr>
  <tr><td>3. The MLC Unmatched Royalties</td><td>https://portal.themlc.com/search</td></tr>
  <tr><td>4. SoundExchange Claim</td><td>https://www.soundexchange.com/</td></tr>
</table>

<div class="footer">
  TrapRoyaltiesPro · traproyaltiespro.com · Data sources: MusicBrainz (open), ListenBrainz (open)<br>
  This package does not constitute legal advice. 17 U.S.C. § 507(b) — 3-year statute of limitations applies.
</div>
</body>
</html>`;

    // Return as downloadable HTML (browser can print-to-PDF)
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="evidence-${isrc}-${Date.now()}.html"`,
      },
    });

  } catch (err) {
    return NextResponse.json({ detail: 'PDF generation failed: ' + String(err) }, { status: 500 });
  }
}
