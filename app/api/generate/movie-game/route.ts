import { NextResponse } from 'next/server';
import { generateMovieDrinkingGame, getCuratedMovieDrinkingGame, normalizeDrinkingPace } from '@/lib/movie-game-generator';

export const maxDuration = 45;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      console.warn('[MovieGameRoute] Could not parse JSON body:', e);
      body = {};
    }

    const movieTitle = (
      body.movie_title ||
      body.movieTitle ||
      body.title ||
      body.theme ||
      body.searchTerm ||
      ''
    ).trim();

    const drinkingPace = normalizeDrinkingPace(body.drinking_pace || body.drinkingPace || body.pace);

    if (!movieTitle) {
      return NextResponse.json(
        { error: 'movie_title is required to generate a movie drinking game' },
        { status: 400 }
      );
    }

    const game = await generateMovieDrinkingGame(movieTitle, drinkingPace);

    return NextResponse.json(game, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'X-Generated-Category': 'movie_drinking',
        'X-Drinking-Pace': drinkingPace
      }
    });
  } catch (err: any) {
    console.error('[MovieGameRoute] Generation error:', err);
    // Guarantee fallback response so the client never crashes
    const fallback = getCuratedMovieDrinkingGame('Movie Night');
    return NextResponse.json(fallback, { status: 200 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('movie_title') || searchParams.get('title') || 'Movie Night';
  const pace = normalizeDrinkingPace(searchParams.get('drinking_pace') || searchParams.get('pace'));
  const game = await generateMovieDrinkingGame(title, pace);
  return NextResponse.json(game);
}
