import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const contentId = body.contentId;

    if (!contentId) {
      return NextResponse.json({ error: 'Missing contentId' }, { status: 400 });
    }

    // Check existing content
    const { data: content, error: fetchError } = await supabase
      .from('generated_content')
      .select('id, user_id, theme_tags')
      .eq('id', contentId)
      .maybeSingle();

    if (fetchError && fetchError.code !== '42703') { // 42703 is undefined column
      console.error('Error fetching content:', fetchError);
    }

    // Determine current favorite state
    let currentlyFavorite = false;
    if (content && typeof (content as any).is_favorite === 'boolean') {
      currentlyFavorite = (content as any).is_favorite;
    } else if (content?.theme_tags && content.theme_tags.includes('[favorite]')) {
      currentlyFavorite = true;
    }

    // Also check user_favorites table if available
    try {
      const { data: favRow } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .maybeSingle();
      if (favRow) {
        currentlyFavorite = true;
      }
    } catch {
      // table might not exist yet
    }

    // Compute new target state
    const newStatus = typeof body.isFavorite === 'boolean' ? body.isFavorite : !currentlyFavorite;

    // 1. Try to update is_favorite on generated_content
    try {
      const updatePayload: any = { is_favorite: newStatus };
      
      // Also update theme_tags as a fallback mirror
      if (content) {
        const currentTags = content.theme_tags || '';
        let newTags = currentTags;
        if (newStatus && !currentTags.includes('[favorite]')) {
          newTags = currentTags ? `${currentTags},[favorite]` : '[favorite]';
        } else if (!newStatus && currentTags.includes('[favorite]')) {
          newTags = currentTags.replace(/,\[favorite\]|\[favorite\],?/, '').trim();
        }
        updatePayload.theme_tags = newTags || null;
      }

      await supabase
        .from('generated_content')
        .update(updatePayload)
        .eq('id', contentId);
    } catch (updateErr) {
      console.warn('Direct is_favorite update on generated_content encountered:', updateErr);
    }

    // 2. Try to update user_favorites cross-reference table
    try {
      if (newStatus) {
        await supabase
          .from('user_favorites')
          .upsert({ user_id: user.id, content_id: contentId }, { onConflict: 'user_id,content_id' });
      } else {
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('content_id', contentId);
      }
    } catch (favTableErr) {
      // Table may still be pending migration
    }

    return NextResponse.json({
      success: true,
      contentId,
      isFavorite: newStatus,
      message: newStatus ? 'Added to favorites' : 'Removed from favorites'
    });
  } catch (err: any) {
    console.error('Toggle favorites exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const contentId = searchParams.get('contentId');

    if (!contentId) {
      return NextResponse.json({ error: 'Missing contentId' }, { status: 400 });
    }

    let isFavorite = false;

    // Check generated_content
    const { data: content } = await supabase
      .from('generated_content')
      .select('theme_tags')
      .eq('id', contentId)
      .maybeSingle();

    if (content && typeof (content as any).is_favorite === 'boolean') {
      isFavorite = (content as any).is_favorite;
    } else if (content?.theme_tags && content.theme_tags.includes('[favorite]')) {
      isFavorite = true;
    }

    // Check user_favorites
    try {
      const { data: favRow } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .maybeSingle();
      if (favRow) isFavorite = true;
    } catch {}

    return NextResponse.json({ contentId, isFavorite });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
