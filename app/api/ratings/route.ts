import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { contentType, contentId, rating } = body;

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 });
    }

    if (!contentId) {
      return NextResponse.json({ error: 'Missing contentId' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user id if authorization header is provided
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '')?.trim();
    if (token && token !== 'undefined' && token !== 'null') {
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id || null;
      } catch (err) {
        console.warn('Could not extract user from auth token:', err);
      }
    }

    // 1. Insert rating into scenario_ratings
    const { error: ratingInsertError } = await supabase
      .from('scenario_ratings')
      .insert({
        scenario_id: String(contentId),
        rating: numericRating
      });

    if (ratingInsertError) {
      console.warn('Warning inserting to scenario_ratings:', ratingInsertError.message);
    }

    // Also record to content_ratings table if accessible
    try {
      await supabase.from('content_ratings').insert({
        user_id: userId,
        content_type: contentType || 'literature',
        content_id: String(contentId),
        rating: numericRating
      });
    } catch (e) {
      // Non-fatal
    }

    // 2. Locate corresponding source idea in scenario_suggestions
    // Try matching by UUID id, or by suggestion_text matching contentId / title
    let suggestion: any = null;

    // Check if contentId is a valid UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(contentId));
    if (isUuid) {
      const { data: byId } = await supabase
        .from('scenario_suggestions')
        .select('*')
        .eq('id', contentId)
        .maybeSingle();
      suggestion = byId;
    }

    if (!suggestion) {
      // Match by title within suggestion_text
      const { data: byTitle } = await supabase
        .from('scenario_suggestions')
        .select('*')
        .ilike('suggestion_text', `%${contentId}%`)
        .limit(1);
      suggestion = byTitle?.[0] || null;
    }

    // 3. Recalculate average_rating from scenario_ratings
    const { data: allRatings } = await supabase
      .from('scenario_ratings')
      .select('rating')
      .eq('scenario_id', String(contentId));

    const ratingsList: number[] = allRatings?.map((r: any) => Number(r.rating)).filter(Boolean) || [numericRating];
    const sum = ratingsList.reduce((acc, curr) => acc + curr, 0);
    const count = ratingsList.length;
    const newAverage = parseFloat((sum / count).toFixed(2));

    let updatedTimesTested = count;
    let newStatus = suggestion?.status || 'pending';

    // 4. Update the source idea in scenario_suggestions
    if (suggestion) {
      updatedTimesTested = (suggestion.times_tested ?? 0) + 1;
      const updatePayload: any = {
        average_rating: newAverage,
        times_tested: updatedTimesTested
      };

      // Rating-based rotation rule:
      // If a scenario falls below a 4.0 average after the 5-test threshold, update its status to 'archived'
      if (updatedTimesTested >= 5 && newAverage < 4.0) {
        updatePayload.status = 'archived';
        newStatus = 'archived';
      }

      const { error: updateError } = await supabase
        .from('scenario_suggestions')
        .update(updatePayload)
        .eq('id', suggestion.id);

      if (updateError) {
        console.warn('Error updating scenario_suggestions with recalculated rating:', updateError.message);
      }
    }

    return NextResponse.json({
      success: true,
      averageRating: newAverage,
      timesTested: updatedTimesTested,
      status: newStatus
    });
  } catch (error: any) {
    console.error('Error in ratings route:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit rating' }, { status: 500 });
  }
}
