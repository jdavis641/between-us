export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * GET /api/experience/[id]?lens=[a|b]
 * Grants service-role read access to shared experience / story content without RLS dead-ends.
 * If lens === 'b', suppresses Partner A perspective from parsedData to protect spoilers.
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json({ error: 'Missing experience id' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const lens = searchParams.get('lens')?.toLowerCase();

    const admin = getAdminClient();
    const { data: experience, error } = await admin
      .from('generated_content')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error("Defensive fetch of shared experience encountered error:", error);
      return NextResponse.json({ error: 'Failed to retrieve shared experience' }, { status: 500 });
    }

    if (!experience) {
      return NextResponse.json({ error: 'Experience not found' }, { status: 404 });
    }

    // Try parsing body as JSON if stored as JSON string
    let parsedData: any = null;
    if (experience.body) {
      try {
        const cleaned = experience.body.replace(/```json|```/g, '').trim();
        parsedData = JSON.parse(cleaned);
      } catch {
        parsedData = null;
      }
    }

    // Dynamic Perspective Gating on Payload:
    // When recipient accesses via lens=b, sanitize Partner A details from parsedData to prevent spoilers
    if (lens === 'b' && parsedData && typeof parsedData === 'object') {
      const sanitized = { ...parsedData };
      delete sanitized.partnerA;
      delete sanitized.partnerAPerspective;
      delete sanitized.partner_a_perspective;
      delete sanitized.partner_a;
      experience.parsedData = sanitized;
    } else if (parsedData) {
      experience.parsedData = parsedData;
    }

    return NextResponse.json({
      success: true,
      experience,
      story: experience
    }, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate'
      }
    });
  } catch (err: any) {
    console.error("Error retrieving shared experience:", err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error retrieving shared experience' },
      { status: 500 }
    );
  }
}
