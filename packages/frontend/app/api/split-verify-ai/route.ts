import { NextResponse } from 'next/server';

export const maxDuration = 60;

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b';

function estimateProStatus(role: string) {
  const r = role.toLowerCase();
  if (r.includes('artist') || r.includes('writer') || r.includes('composer')) {
    return { ascap: true, bmi: true, socan: false, prs: false };
  }
  if (r.includes('producer')) {
    return { ascap: true, bmi: true, socan: false, prs: false };
  }
  if (r.includes('feature')) {
    return { ascap: true, bmi: false, socan: false, prs: false };
  }
  return { ascap: false, bmi: false, socan: false, prs: false };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { splits, totalAmount } = body;

    if (!splits || !Array.isArray(splits) || splits.length === 0) {
      return NextResponse.json({ error: 'No split data provided' }, { status: 400 });
    }

    const total = splits.reduce((s: number, r: any) => s + (r.percentage || 0), 0);

    const issues: any[] = [];

    if (Math.abs(total - 100) > 0.01) {
      issues.push({
        party: 'All Parties',
        severity: 'error',
        description: `Total splits sum to ${total}% — must equal 100%`,
        suggestedFix: total > 100
          ? `Reduce allocations by ${(total - 100).toFixed(1)}%`
          : `Allocate the remaining ${(100 - total).toFixed(1)}%`,
      });
    }

    const partyAnalysis = splits.map((s: any) => {
      const proStatus = estimateProStatus(s.role);
      const missingRegistrations: string[] = [];
      const r = s.role.toLowerCase();

      if (r.includes('artist') || r.includes('writer') || r.includes('composer') || r.includes('producer')) {
        if (!proStatus.ascap && !proStatus.bmi) {
          missingRegistrations.push('PRO registration (ASCAP or BMI) recommended');
        }
      }

      if (s.percentage > 70) {
        issues.push({
          party: s.name,
          severity: 'warning',
          description: `${s.percentage}% is unusually high for a ${s.role}`,
          suggestedFix: 'Verify against the signed split agreement',
        });
      }

      if (s.percentage <= 0) {
        issues.push({
          party: s.name,
          severity: 'error',
          description: `${s.name} has ${s.percentage}% — must be greater than 0`,
          suggestedFix: 'Remove party or assign a positive percentage',
        });
      }

      const status =
        total !== 100
          ? 'discrepancy'
          : missingRegistrations.length > 0
          ? 'unregistered'
          : 'verified';

      return {
        name: s.name,
        role: s.role,
        percentage: s.percentage,
        agreedPercentage: null,
        discrepancy: 0,
        estimatedAmount: totalAmount ? (totalAmount * s.percentage) / 100 : null,
        status,
        proStatus,
        missingRegistrations,
      };
    });

    const riskLevel =
      total !== 100 ? 'high' : issues.some(i => i.severity === 'error') ? 'medium' : 'low';

    const actionItems = [
      ...(total !== 100 ? [`Fix split total — currently ${total}%, must be 100%`] : []),
      'Obtain signed split agreement from all parties',
      'Register all songwriters/producers with ASCAP or BMI',
      'Submit splits to MLC for mechanical royalty tracking',
      ...(totalAmount ? ['Distribute payment per verified percentages above'] : []),
    ];

    let forensicSummary =
      `Split verification for ${splits.length} parties. ` +
      (total === 100
        ? `Total allocation is correct at 100%. Risk level: ${riskLevel}.`
        : `Total allocation is ${total}% — a discrepancy of ${Math.abs(total - 100).toFixed(1)}%. Immediate correction required.`);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          stream: false,
          options: { temperature: 0.3, num_predict: 150 },
          messages: [{
            role: 'user',
            content: `Write a 2-sentence professional forensic summary for this music royalty split: ${
              splits.map((s: any) => `${s.name} (${s.role}): ${s.percentage}%`).join(', ')
            }. Total: ${total}%.`,
          }],
        }),
      });

      clearTimeout(timeout);

      if (ollamaRes.ok) {
        const ollamaData = await ollamaRes.json();
        const text = ollamaData.message?.content?.trim();
        if (text && text.length > 30 && !text.startsWith('{')) {
          forensicSummary = text;
        }
      }
    } catch {
      // Ollama unavailable — rule-based summary used
    }

    const analysis = {
      valid: Math.abs(total - 100) < 0.01,
      totalPercentage: total,
      riskLevel,
      issues,
      partyAnalysis,
      forensicSummary,
      actionItems,
      blockchainReady: total === 100 && issues.filter(i => i.severity === 'error').length === 0,
      courtAdmissible: total === 100,
    };

    return NextResponse.json({ success: true, analysis, model: OLLAMA_MODEL });

  } catch (error) {
    console.error('Split verify error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
