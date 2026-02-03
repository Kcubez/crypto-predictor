import { Suspense } from 'react';
import { BTCPredictor } from '@/components/btc-predictor';

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-purple-300">Loading dashboard...</p>
      </div>
    </div>
  );
}

export default function PredictPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BTCPredictor />
    </Suspense>
  );
}
