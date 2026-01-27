'use client';

import { AssetPriceCard } from './asset-price-card';

export function LivePricesSection() {
  return (
    <div className="mb-12">
      <h2 className="text-xl font-semibold text-white mb-4 text-center">📊 Live Market Prices</h2>
      <AssetPriceCard assets={['BTC', 'GOLD']} showRefreshButton={true} />
    </div>
  );
}
