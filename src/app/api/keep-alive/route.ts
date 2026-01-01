import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/keep-alive
 * Keeps the serverless function warm by pinging the database
 * Called every 5 minutes by Vercel cron
 */
export async function GET() {
  try {
    // Simple query to keep connection warm
    const userCount = await prisma.user.count();

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      users: userCount,
    });
  } catch (error: any) {
    console.error('Keep-alive error:', error);
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}
