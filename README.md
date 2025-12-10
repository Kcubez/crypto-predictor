# BTC Nexus Predictor

BTC ကို အတိတ်က ရှိသမျှ ဒေတာတွေပေါ်မူတည်ပြီး ဖြစ်နိုင်တဲ့စျေးနှုန်းတွေကို နာရီအလိုက် ၁၅ မိနစ်နဲ့ ၂၄ နာရီစာ Simulation လုပ်ခန့်မှန်းပေးတဲ့ AI-Powered Bitcoin Price Prediction Simulator

## 🚀 Features

- **📊 Real-time Price Simulation**: Historical data-based price predictions
- **⏱️ Multiple Timeframes**: 
  - 15 Minutes simulation
  - 1 Hour simulation  
  - 24 Hours simulation
- **🤖 AI-Powered Recommendations**: Buy/Sell/Hold signals with entry zones, targets, and stop-loss levels
- **📈 Interactive Charts**: Beautiful gradient area charts with real-time data
- **🌐 Market Context Analysis**: Comprehensive market analysis and insights
- **🎨 Premium Dark UI**: Modern, responsive design with glassmorphism effects

## 🛠️ Tech Stack

- **Framework**: Next.js v16
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Language**: TypeScript
- **Icons**: Lucide React

## 📦 Installation

```bash
# Clone the repository
cd crypto-predictor

# Install dependencies
npm install

# Setup environment variables
# Create .env.local file and add:
# GEMINI_API_KEY=your_gemini_api_key
# COINMARKETCAP_API_KEY=your_coinmarketcap_api_key

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 API Keys Setup

### 1. Gemini AI API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Add to `.env.local`: `GEMINI_API_KEY=your_key_here`

### 2. CoinMarketCap API Key (Optional)
1. Sign up at [CoinMarketCap Pro](https://pro.coinmarketcap.com/account)
2. Get your free API key (333 calls/day)
3. Add to `.env.local`: `COINMARKETCAP_API_KEY=your_key_here`

**Note**: The app uses Binance API by default (free, unlimited). CoinMarketCap is optional for additional features.

## 🎯 How It Works

### Price Simulation Engine

The application uses a **Geometric Brownian Motion** model with mean reversion to simulate realistic Bitcoin price movements:

1. **Historical Volatility Patterns**: Different volatility levels for each timeframe
   - 15 minutes: 0.3% volatility
   - 1 hour: 0.8% volatility
   - 24 hours: 2% volatility

2. **Random Walk with Drift**: Simulates market trends with random price shocks

3. **Mean Reversion**: Prevents unrealistic price deviations

4. **AI Analysis**: Generates trading recommendations based on:
   - Price change percentage
   - Market momentum
   - Technical indicators
   - Risk-reward ratios

### Components

- **BTCPredictor**: Main component managing state and simulation
- **PriceChart**: Interactive area chart with gradient effects
- **AIRecommendation**: Trading signals with entry/exit zones
- **MarketContext**: Market analysis and context information

## 📱 Usage

1. **Select Timeframe**: Choose between 15 minutes, 1 hour, or 24 hours
2. **View Simulation**: The chart automatically updates with price predictions
3. **Check AI Recommendation**: Review buy/sell signals with specific price levels
4. **Read Market Context**: Understand current market conditions
5. **Run New Simulation**: Click the button to generate fresh predictions

## 🎨 Design Features

- **Dark Mode**: Premium dark theme with purple/pink gradients
- **Glassmorphism**: Backdrop blur effects for modern aesthetics
- **Responsive**: Fully responsive design for all devices
- **Animations**: Smooth transitions and chart animations
- **Color Coding**: 
  - 🟢 Green for bullish signals
  - 🔴 Red for bearish signals
  - 🟡 Yellow for neutral/hold signals

## 📊 Simulation Accuracy

The simulation is based on:
- Historical Bitcoin volatility patterns
- Statistical models (Geometric Brownian Motion)
- Market behavior analysis
- Technical analysis principles

**Note**: This is a simulation tool for educational purposes. Always do your own research before making investment decisions.

## 🔧 Configuration

The simulation parameters can be adjusted in `src/lib/price-simulator.ts`:

```typescript
const VOLATILITY_PATTERNS = {
  "15min": { volatility: 0.003, dataPoints: 15 },
  "1hour": { volatility: 0.008, dataPoints: 24 },
  "24hour": { volatility: 0.02, dataPoints: 48 },
};
```

## 📝 Project Structure

```
crypto-predictor/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with dark mode
│   │   ├── page.tsx             # Home page
│   │   └── globals.css          # Global styles
│   ├── components/
│   │   ├── btc-predictor.tsx    # Main predictor component
│   │   ├── price-chart.tsx      # Chart component
│   │   ├── ai-recommendation.tsx # AI signals component
│   │   ├── market-context.tsx   # Market analysis component
│   │   └── ui/                  # shadcn/ui components
│   └── lib/
│       ├── price-simulator.ts   # Simulation engine
│       └── utils.ts             # Utility functions
├── public/                      # Static assets
└── package.json                 # Dependencies
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm run build
vercel deploy
```

### Other Platforms

```bash
npm run build
npm start
```

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## 📄 License

MIT License

## 🙏 Acknowledgments

- Built with Next.js, Tailwind CSS, and shadcn/ui
- Powered by Gemini 3.0 Pro & Google Search Grounding (as per design)
- Chart library: Recharts

---

**Disclaimer**: This tool is for educational and simulation purposes only. Cryptocurrency trading involves significant risk. Always conduct your own research and consult with financial advisors before making investment decisions.
