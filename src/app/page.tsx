"use client";

import { BTCPredictor } from "@/components/btc-predictor";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <BTCPredictor />
    </main>
  );
}
