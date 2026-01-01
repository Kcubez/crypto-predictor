// Prediction tracking system for accuracy measurement
export interface DailyPrediction {
  day: number; // 1 (tomorrow only)
  date: string; // "2024-12-14"
  predictedPrice: number;
  actualPrice?: number;
  difference?: number; // $ difference
  percentageError?: number; // % error
  status: "pending" | "completed";
}

export interface PredictionTracking {
  id: string;
  timestamp: number;
  predictionDate: string; // Date when prediction was made
  predictions: DailyPrediction[];
  aiConfidence: number;
  trend: "bullish" | "bearish" | "neutral";
}

export class PredictionTracker {
  private readonly STORAGE_KEY = 'btc_prediction_tracking';

  // Save new prediction
  savePrediction(
    predictions: number[],
    confidence: number,
    trend: "bullish" | "bearish" | "neutral"
  ): PredictionTracking {
    const today = new Date();
    const dailyPredictions: DailyPrediction[] = predictions.map((price, i) => {
      const predDate = new Date(today);
      predDate.setDate(predDate.getDate() + i); // Changed from i+1 to i (start from today)
      
      return {
        day: i + 1,
        date: predDate.toISOString().split('T')[0],
        predictedPrice: Math.round(price * 100) / 100,
        status: "pending"
      };
    });

    const tracking: PredictionTracking = {
      id: `pred_${Date.now()}`,
      timestamp: Date.now(),
      predictionDate: today.toISOString().split('T')[0],
      predictions: dailyPredictions,
      aiConfidence: confidence,
      trend
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tracking));
    console.log('✅ Prediction tracking saved:', tracking);
    
    return tracking;
  }

  // Get current tracking data
  getTracking(): PredictionTracking | null {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return null;
    
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing tracking data:', error);
      return null;
    }
  }

  // Fetch actual price for a specific date
  async fetchActualPrice(date: string): Promise<number | null> {
    try {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const timestamp = targetDate.getTime();
      
      // Fetch daily candle for that date
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&startTime=${timestamp}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch actual price');
      }
      
      const data = await response.json();
      if (data && data.length > 0) {
        const closePrice = parseFloat(data[0][4]); // Close price
        console.log(`✅ Fetched actual price for ${date}: $${closePrice}`);
        return closePrice;
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching actual price for ${date}:`, error);
      return null;
    }
  }

  // Update tracking with actual prices
  async updateActualPrices(): Promise<PredictionTracking | null> {
    const tracking = this.getTracking();
    if (!tracking) return null;

    const now = new Date();
    let updated = false;

    for (const pred of tracking.predictions) {
      // Check if this day's CLOSING TIME has passed (not just the date)
      if (pred.status === "pending") {
        const predDate = new Date(pred.date);
        
        // Set to end of day (23:59:59 UTC)
        const closingTime = new Date(predDate);
        closingTime.setUTCHours(23, 59, 59, 999);
        
        // Only fetch if closing time has passed
        if (now > closingTime) {
          console.log(`Checking actual price for ${pred.date} (closing time passed)...`);
          
          const actualPrice = await this.fetchActualPrice(pred.date);
          
          if (actualPrice) {
            pred.actualPrice = Math.round(actualPrice * 100) / 100;
            pred.difference = Math.round((actualPrice - pred.predictedPrice) * 100) / 100;
            pred.percentageError = ((actualPrice - pred.predictedPrice) / pred.predictedPrice) * 100;
            pred.status = "completed";
            updated = true;
            
            console.log(`✅ Updated Day ${pred.day}:`, {
              predicted: pred.predictedPrice,
              actual: pred.actualPrice,
              error: pred.percentageError.toFixed(2) + '%'
            });
          }
        } else {
          const hoursLeft = Math.ceil((closingTime.getTime() - now.getTime()) / (1000 * 60 * 60));
          console.log(`⏳ ${pred.date} closing time not reached yet (${hoursLeft}h remaining)`);
        }
      }
    }

    if (updated) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tracking));
      console.log('✅ Tracking data updated');
    }

    return tracking;
  }

  // Calculate overall accuracy
  calculateOverallAccuracy(tracking: PredictionTracking): number {
    const completed = tracking.predictions.filter(p => p.status === "completed");
    if (completed.length === 0) return 0;

    const avgAbsError = completed.reduce((sum, p) => 
      sum + Math.abs(p.percentageError!), 0
    ) / completed.length;

    // Convert to accuracy score (0-100)
    // 0% error = 100% accuracy
    // 10% error = 0% accuracy
    return Math.max(0, Math.min(100, 100 - (avgAbsError * 10)));
  }

  // Get completion status
  getCompletionStatus(tracking: PredictionTracking): {
    completed: number;
    total: number;
    percentage: number;
  } {
    const completed = tracking.predictions.filter(p => p.status === "completed").length;
    const total = tracking.predictions.length;
    const percentage = (completed / total) * 100;
    
    return { completed, total, percentage };
  }

  // Clear tracking data (for testing or reset)
  clearTracking(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('✅ Tracking data cleared');
  }
}
