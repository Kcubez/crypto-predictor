import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function DELETE() {
  try {
    // Get current user session
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can clear ALL predictions
    if (session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can clear prediction history' },
        { status: 403 }
      );
    }

    // Delete ALL predictions (for all users)
    const result = await prisma.prediction.deleteMany();

    console.log(`✅ Admin ${session.email} cleared ${result.count} predictions`);

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} predictions`,
      count: result.count,
    });
  } catch (error: any) {
    console.error('Error clearing prediction history:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to clear prediction history',
      },
      { status: 500 }
    );
  }
}
