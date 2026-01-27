import { NextResponse } from 'next/server';

// Binance P2P API endpoint
const BINANCE_P2P_URL = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';

// Fallback MMK rate (based on current black market rate ~4,085 MMK)
const FALLBACK_MMK_RATE = 0;

interface P2PAdvert {
  adv: {
    price: string;
    surplusAmount: string;
    tradableQuantity: string;
    minSingleTransAmount: string;
    maxSingleTransAmount: string;
  };
  advertiser: {
    nickName: string;
    monthOrderCount: number;
    monthFinishRate: number;
  };
}

interface P2PResponse {
  code: string;
  data: P2PAdvert[];
  total: number;
  success: boolean;
}

// This endpoint acts as a proxy to call Binance P2P API
// The actual call should be made from client-side for geo-location to work
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fiat = 'MMK', tradeType = 'BUY', payTypes = [] } = body;

    const response = await fetch(BINANCE_P2P_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        asset: 'USDT',
        fiat: fiat,
        merchantCheck: false,
        page: 1,
        payTypes: payTypes,
        publisherType: null,
        rows: 10,
        tradeType: tradeType,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        rate: FALLBACK_MMK_RATE,
        source: 'fallback',
        error: `API error: ${response.status}`,
      });
    }

    const data: P2PResponse = await response.json();

    if (data.success && data.data && data.data.length > 0) {
      const prices = data.data.map(ad => parseFloat(ad.adv.price));
      const averageRate = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      const minRate = Math.min(...prices);
      const maxRate = Math.max(...prices);

      return NextResponse.json({
        success: true,
        rate: Math.round(averageRate),
        minRate: Math.round(minRate),
        maxRate: Math.round(maxRate),
        source: 'binance_p2p',
        offersCount: data.data.length,
        timestamp: Date.now(),
      });
    }

    // Return fallback if no data
    return NextResponse.json({
      success: true,
      rate: FALLBACK_MMK_RATE,
      source: 'fallback',
      message: 'No P2P offers available - geo-restricted',
    });
  } catch (error) {
    console.error('Error in P2P proxy:', error);
    return NextResponse.json({
      success: true,
      rate: FALLBACK_MMK_RATE,
      source: 'fallback',
      error: 'Failed to fetch P2P rate',
    });
  }
}

// GET endpoint returns the fallback info and instructs client to call directly
export async function GET() {
  return NextResponse.json({
    success: true,
    rate: FALLBACK_MMK_RATE,
    source: 'fallback',
    message: 'Use client-side fetch for geo-located P2P rates, or POST to this endpoint',
    binanceP2PUrl: BINANCE_P2P_URL,
    samplePayload: {
      asset: 'USDT',
      fiat: 'MMK',
      merchantCheck: false,
      page: 1,
      payTypes: ['KBZPay'],
      publisherType: null,
      rows: 10,
      tradeType: 'BUY',
    },
  });
}
