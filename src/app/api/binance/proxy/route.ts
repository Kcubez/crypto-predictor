import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/binance/proxy
 * PUBLIC endpoint - No authentication required
 * Proxy endpoint to fetch Binance data from Vercel (Singapore)
 * This bypasses GitHub Actions IP block
 */
export async function GET(request: NextRequest) {
  // Set CORS headers to allow GitHub Actions
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const { searchParams } = new URL(request.url);

    // Simple API key check to prevent abuse
    const apiKey = searchParams.get('key');
    const validKey = process.env.BINANCE_PROXY_KEY || 'default-secret-key';

    console.log('🔑 API Key check:', {
      provided: apiKey ? 'YES' : 'NO',
      valid: apiKey === validKey,
      envVarSet: !!process.env.BINANCE_PROXY_KEY,
    });

    if (apiKey !== validKey) {
      console.log('❌ Invalid API key');
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 401, headers }
      );
    }

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
      return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400, headers });
    }

    console.log('🔄 Proxy fetching from Binance:', endpoint);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    console.log('✅ Proxy fetch successful:', endpoint);

    return NextResponse.json(
      {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      },
      { headers }
    );
  } catch (error: any) {
    console.error('❌ Binance proxy error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch from Binance',
        details: {
          message: error.message,
          stack: error.stack?.split('\n')[0], // First line of stack
        },
      },
      { status: 500, headers }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
