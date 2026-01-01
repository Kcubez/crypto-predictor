import fs from 'fs';
import path from 'path';

export interface PredictionRecord {
  id: string;
  date: string; // Date when prediction was made (YYYY-MM-DD)
  targetDate: string; // Date being predicted for (YYYY-MM-DD)
  predictedPrice: number;
  actualPrice?: number;
  difference?: number;
  percentageError?: number;
  confidence: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  reasoning: string;
  status: 'pending' | 'completed';
  createdAt: number; // timestamp
  updatedAt?: number; // timestamp
}

export class JSONStorage {
  private readonly DATA_DIR = path.join(process.cwd(), 'data');
  private readonly PREDICTIONS_FILE = path.join(this.DATA_DIR, 'predictions.json');

  constructor() {
    // Ensure data directory exists
    if (!fs.existsSync(this.DATA_DIR)) {
      fs.mkdirSync(this.DATA_DIR, { recursive: true });
    }

    // Ensure predictions file exists
    if (!fs.existsSync(this.PREDICTIONS_FILE)) {
      fs.writeFileSync(this.PREDICTIONS_FILE, JSON.stringify([], null, 2));
    }
  }

  /**
   * Read predictions from file
   */
  private readPredictions(): PredictionRecord[] {
    try {
      const data = fs.readFileSync(this.PREDICTIONS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading predictions:', error);
      return [];
    }
  }

  /**
   * Write predictions to file
   */
  private writePredictions(predictions: PredictionRecord[]): void {
    try {
      fs.writeFileSync(this.PREDICTIONS_FILE, JSON.stringify(predictions, null, 2));
    } catch (error) {
      console.error('Error writing predictions:', error);
    }
  }

  /**
   * Save a new prediction
   */
  async savePrediction(
    predictedPrice: number,
    confidence: number,
    trend: 'bullish' | 'bearish' | 'neutral',
    reasoning: string
  ): Promise<PredictionRecord> {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const record: PredictionRecord = {
      id: `pred_${Date.now()}`,
      date: now.toISOString().split('T')[0],
      targetDate: tomorrow.toISOString().split('T')[0],
      predictedPrice: Math.round(predictedPrice * 100) / 100,
      confidence,
      trend,
      reasoning,
      status: 'pending',
      createdAt: Date.now(),
    };

    // Get existing predictions
    const predictions = this.readPredictions();

    // Add new prediction
    predictions.push(record);

    // Save to file
    this.writePredictions(predictions);

    console.log('✅ Prediction saved to JSON:', record);
    return record;
  }

  /**
   * Get all predictions
   */
  async getAllPredictions(): Promise<PredictionRecord[]> {
    return this.readPredictions();
  }

  /**
   * Get latest prediction
   */
  async getLatestPrediction(): Promise<PredictionRecord | null> {
    const predictions = this.readPredictions();
    if (predictions.length === 0) return null;

    // Sort by createdAt descending and return first
    predictions.sort((a, b) => b.createdAt - a.createdAt);
    return predictions[0];
  }

  /**
   * Update prediction with actual price
   */
  async updateWithActualPrice(
    targetDate: string,
    actualPrice: number
  ): Promise<PredictionRecord | null> {
    const predictions = this.readPredictions();

    // Find prediction for this target date
    const predictionIndex = predictions.findIndex(
      p => p.targetDate === targetDate && p.status === 'pending'
    );

    if (predictionIndex === -1) {
      console.log(`No pending prediction found for ${targetDate}`);
      return null;
    }

    const prediction = predictions[predictionIndex];

    // Update with actual price
    prediction.actualPrice = Math.round(actualPrice * 100) / 100;
    prediction.difference = Math.round((actualPrice - prediction.predictedPrice) * 100) / 100;
    prediction.percentageError =
      ((actualPrice - prediction.predictedPrice) / prediction.predictedPrice) * 100;
    prediction.status = 'completed';
    prediction.updatedAt = Date.now();

    // Update in array
    predictions[predictionIndex] = prediction;

    // Save back to file
    this.writePredictions(predictions);

    console.log('✅ Prediction updated with actual price:', prediction);
    return prediction;
  }

  /**
   * Get predictions by date range
   */
  async getPredictionsByDateRange(startDate: string, endDate: string): Promise<PredictionRecord[]> {
    const allPredictions = this.readPredictions();

    return allPredictions.filter(p => {
      return p.date >= startDate && p.date <= endDate;
    });
  }

  /**
   * Get predictions for last N days
   */
  async getRecentPredictions(days: number): Promise<PredictionRecord[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.getPredictionsByDateRange(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
  }

  /**
   * Calculate accuracy statistics
   */
  async getAccuracyStats(): Promise<{
    totalPredictions: number;
    completedPredictions: number;
    averageError: number;
    accuracy: number;
  }> {
    const predictions = this.readPredictions();
    const completed = predictions.filter(p => p.status === 'completed');

    if (completed.length === 0) {
      return {
        totalPredictions: predictions.length,
        completedPredictions: 0,
        averageError: 0,
        accuracy: 0,
      };
    }

    const avgAbsError =
      completed.reduce((sum, p) => sum + Math.abs(p.percentageError!), 0) / completed.length;

    // Convert to accuracy score (0-100)
    const accuracy = Math.max(0, Math.min(100, 100 - avgAbsError * 10));

    return {
      totalPredictions: predictions.length,
      completedPredictions: completed.length,
      averageError: avgAbsError,
      accuracy,
    };
  }

  /**
   * Clear all predictions (for testing)
   */
  async clearAllPredictions(): Promise<void> {
    this.writePredictions([]);
    console.log('✅ All predictions cleared from JSON storage');
  }
}
