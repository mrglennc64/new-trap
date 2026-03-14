import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { isrc, title, artist, contributors, territory_deals, genre, version } = payload;

    if (!isrc || !title) {
      return NextResponse.json({ success: false, validation_errors: ['ISRC and title are required'] }, { status: 400 });
    }

    const validation_errors: string[] = [];
    if (!artist) validation_errors.push('Artist name missing');
    if (!contributors?.length) validation_errors.push('No contributors listed');
    else {
      contributors.forEach((c: any) => {
        if (c.ipi && !/^\d{9,11}$/.test(c.ipi.replace(/\D/g, ''))) {
          validation_errors.push(`Invalid IPI format for ${c.name}`);
        }
      });
      // Only validate splits total if contributors have explicit share/percentage fields
      const hasShares = contributors.some((c: any) => c.share != null || c.percentage != null);
      if (hasShares) {
        const total = contributors.reduce((sum: number, c: any) => sum + (c.share ?? c.percentage ?? 0), 0);
        if (Math.abs(total - 100) > 0.5) validation_errors.push(`Splits total ${total}% — must equal 100%`);
      }
    }

    if (validation_errors.length > 0) {
      return NextResponse.json({ success: false, validation_errors });
    }

    const message_id = `TRP-${Date.now()}`;
    const release_id = randomUUID();
    const hash = Buffer.from(`${isrc}-${title}-${Date.now()}`).toString('base64').slice(0, 16);

    return NextResponse.json({
      success: true,
      message_id,
      release_id,
      hash,
      isrc,
      title,
      artist,
      territory_deals: territory_deals || {},
      contributors: contributors || [],
      generated_at: new Date().toISOString(),
    });

  } catch (err) {
    return NextResponse.json({ success: false, validation_errors: ['Server error: ' + String(err)] }, { status: 500 });
  }
}
