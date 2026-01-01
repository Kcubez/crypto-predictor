import { NextResponse } from 'next/server';
import { SupabaseStorage } from '@/lib/supabase-storage';

const storage = new SupabaseStorage();

/**
 * GET /api/predictions/latest
 * Get the latest prediction from database
 */
export async function GET() {
  try {
    const prediction = await storage.getLatestPrediction();

    if (!prediction) {
      return NextResponse.json({
        success: false,
        message: 'No predictions available yet',
      });
    }

    return NextResponse.json({
      success: true,
      prediction,
    });
  } catch (error: any) {
    console.error('Error fetching latest prediction:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch latest prediction',
      },
      { status: 500 }
    );
  }
}
