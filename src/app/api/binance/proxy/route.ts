import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/binance/proxy
 * Proxy endpoint to fetch Binance data from Vercel (Singapore)
 * This bypasses GitHub Actions IP block
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || 'klines';
    const symbol = searchParams.get('symbol') || 'BTCUSDT';

    let url = '';

    if (endpoint === 'klines') {
      const interval = searchParams.get('interval') || '1d';
      const limit = searchParams.get('limit') || '1000';
      const endTime = Date.now();
      const startTime = endTime - parseInt(limit) * 24 * 60 * 60 * 1000;

      url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&startTime=${startTime}&endTime=${endTime}&limit=${limit}`;
    } else if (endpoint === 'price') {
      url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;
    } else {
      return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
    }

    console.log('Fetching from Binance:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Binance proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch from Binance',
      },
      { status: 500 }
    );
  }
}
