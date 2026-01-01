import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Brain, Target, BarChart3 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-purple-950 to-slate-950 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white">BTC Predictor</h1>
          </div>
          <p className="text-lg sm:text-xl text-gray-300 mb-2">
            AI-Powered Bitcoin Price Prediction
          </p>
          <p className="text-sm text-gray-400">
            Powered by Gemini 2.5 Flash & Advanced Technical Analysis
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-linear-to-br from-slate-900/80 to-purple-900/30 border-purple-500/30 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                  <Brain className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">AI-Powered</h3>
                <p className="text-gray-400 text-sm">
                  Advanced machine learning algorithms analyze 1000+ days of historical data
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-linear-to-br from-slate-900/80 to-blue-900/30 border-blue-500/30 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                  <BarChart3 className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Technical Analysis</h3>
                <p className="text-gray-400 text-sm">
                  RSI, MACD, Bollinger Bands, Fibonacci levels, and more
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-linear-to-br from-slate-900/80 to-green-900/30 border-green-500/30 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <Target className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Trading Signals</h3>
                <p className="text-gray-400 text-sm">
                  Get BUY/SELL/HOLD recommendations with entry zones and targets
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="bg-linear-to-br from-slate-900/80 to-purple-900/40 border-purple-500/40 backdrop-blur-sm max-w-2xl mx-auto">
            <CardContent className="pt-8 pb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Ready to Predict Bitcoin's Future?
              </h2>
              <p className="text-gray-300 mb-6">
                Get AI-powered daily price predictions with detailed analysis and trading
                recommendations
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/predict">
                  <Button className="bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg font-semibold">
                    Start Prediction
                    <TrendingUp className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/history">
                  <Button className="bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-6 text-lg font-semibold">
                    View History
                    <BarChart3 className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pb-8">
          <p className="text-sm text-gray-500">
            Disclaimer: This tool is for educational purposes only. Always do your own research
            before making investment decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
