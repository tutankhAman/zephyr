import { shareStatsCache } from '@zephyr/db';
import { NextResponse } from 'next/server';

type Params = { params: { postId: string } };

export async function GET(params: Params) {
  const { postId } = await params.params;

  if (!postId) {
    return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
  }

  try {
    const platforms = [
      'twitter',
      'facebook',
      'linkedin',
      'instagram',
      'pinterest',
      'reddit',
      'whatsapp',
      'discord',
      'email',
      'copy',
      'qr',
    ];

    const stats = await Promise.all(
      platforms.map(async (platform) => {
        const platformStats = await shareStatsCache.getStats(postId, platform);
        return {
          platform,
          ...platformStats,
        };
      })
    );

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching share stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch share statistics' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
