import { NextRequest, NextResponse } from 'next/server';
import { SupabaseStorage } from '@/lib/supabase-storage';
import { getSession } from '@/lib/auth';

const storage = new SupabaseStorage();

/**
 * GET /api/predictions/history
 * Query params:
 * - filter: "7days" | "1month" | "all"
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user (just for authentication)
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';

    let predictions;

    // Show ALL predictions to ALL users (no userId filtering)
    switch (filter) {
      case '7days':
        predictions = await storage.getRecentPredictions(7); // No userId
        break;
      case '1month':
        predictions = await storage.getRecentPredictions(30); // No userId
        break;
      case 'all':
      default:
        predictions = await storage.getAllPredictions(); // No userId
        break;
    }

    // Sort by date (newest first)
    predictions.sort((a, b) => (b.createdAt as number) - (a.createdAt as number));

    // Get accuracy stats for ALL predictions
    const stats = await storage.getAccuracyStats(); // No userId

    return NextResponse.json({
      success: true,
      predictions,
      stats,
      filter,
    });
  } catch (error: any) {
    console.error('Error fetching prediction history:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch prediction history',
      },
      { status: 500 }
    );
  }
}
