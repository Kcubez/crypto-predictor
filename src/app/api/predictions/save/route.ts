import { NextRequest, NextResponse } from 'next/server';
import { SupabaseStorage } from '@/lib/supabase-storage';
import { getSession } from '@/lib/auth';

const storage = new SupabaseStorage();

/**
 * POST /api/predictions/save
 * Save a new prediction (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const {
      predictedPrice,
      confidence,
      trend,
      reasoning,
      action,
      entryZone,
      target,
      stopLoss,
      marketContext,
    } = await request.json();

    const prediction = await storage.savePrediction(
      predictedPrice,
      confidence,
      trend,
      reasoning,
      session.id,
      action,
      entryZone,
      target,
      stopLoss,
      marketContext
    );

    console.log('✅ Admin prediction saved:', prediction);

    return NextResponse.json({
      success: true,
      prediction,
    });
  } catch (error: any) {
    console.error('Error saving prediction:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to save prediction',
      },
      { status: 500 }
    );
  }
}
