import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Manual endpoint to update Dec 31, 2025 prediction with actual price
 * GET /api/predictions/update-dec31
 */
export async function GET() {
  try {
    const targetDate = '2025-12-31';
    const actualPrice = 88425.94; // Current BTC price

    // Find the prediction for Dec 31, 2025
    const prediction = await prisma.prediction.findFirst({
      where: {
        targetDate,
        status: 'pending',
      },
    });

    if (!prediction) {
      return NextResponse.json({
        success: false,
        error: `No pending prediction found for ${targetDate}`,
      });
    }

    // Calculate metrics
    const difference = Math.round((actualPrice - prediction.predictedPrice) * 100) / 100;
    const percentageError =
      ((actualPrice - prediction.predictedPrice) / prediction.predictedPrice) * 100;

    // Update prediction
    const updated = await prisma.prediction.update({
      where: { id: prediction.id },
      data: {
        actualPrice: Math.round(actualPrice * 100) / 100,
        difference,
        percentageError,
        status: 'completed',
      },
    });

    console.log('✅ Dec 31 prediction updated:', updated);

    return NextResponse.json({
      success: true,
      message: 'Dec 31, 2025 prediction updated successfully',
      prediction: {
        targetDate: updated.targetDate,
        predictedPrice: updated.predictedPrice,
        actualPrice: updated.actualPrice,
        difference: updated.difference,
        percentageError: updated.percentageError,
        accuracy: `${(100 - Math.abs(percentageError)).toFixed(2)}%`,
      },
    });
  } catch (error: any) {
    console.error('Error updating Dec 31 prediction:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update prediction',
      },
      { status: 500 }
    );
  }
}
