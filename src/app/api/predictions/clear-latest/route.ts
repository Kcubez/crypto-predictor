import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

/**
 * DELETE /api/predictions/clear-latest
 * Clear the latest prediction (admin only)
 */
export async function DELETE() {
  try {
    const session = await getSession();

    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get the latest prediction
    const latest = await prisma.prediction.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!latest) {
      return NextResponse.json({
        success: false,
        message: 'No prediction to clear',
      });
    }

    // Delete it
    await prisma.prediction.delete({
      where: { id: latest.id },
    });

    console.log(`✅ Admin ${session.email} cleared latest prediction`);

    return NextResponse.json({
      success: true,
      message: 'Latest prediction cleared',
    });
  } catch (error: any) {
    console.error('Error clearing latest prediction:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to clear prediction',
      },
      { status: 500 }
    );
  }
}
