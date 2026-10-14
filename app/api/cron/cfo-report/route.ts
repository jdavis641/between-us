import { NextResponse } from 'next/server';
import { runCfoEngine } from '@/../scripts/cfo-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await runCfoEngine();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      activeSubscribers: result.activeSubscribers,
      mrr: result.liveMRR,
      grossMargin: result.grossMargin,
      meetsThreshold: result.meetsThreshold,
      reportPath: 'docs/financial-reports/weekly-summary.md'
    });
  } catch (error: any) {
    console.error('[CFO Cron API] Error executing reporting engine:', error);
    return NextResponse.json({ error: error.message || 'Failed to execute CFO reporting engine' }, { status: 500 });
  }
}
