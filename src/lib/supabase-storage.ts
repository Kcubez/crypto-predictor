import { prisma } from './prisma';

export interface PredictionRecord {
  id: string;
  date: string; // Date when prediction was made (YYYY-MM-DD)
  targetDate: string; // Date being predicted for (YYYY-MM-DD)
  predictedPrice: number;
  actualPrice?: number | null;
  difference?: number | null;
  percentageError?: number | null;
  confidence: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  reasoning: string;
  status: 'pending' | 'completed';
  createdAt: Date | number;
  updatedAt?: Date | number | null;
  // Recommendation fields
  action?: string | null;
  entryZone?: string | null;
  target?: string | null;
  stopLoss?: string | null;
  marketContext?: string | null;
}

export class SupabaseStorage {
  /**
   * Get admin user ID (for cron jobs where no user context)
   */
  private async getAdminUserId(): Promise<string> {
    const admin = await prisma.user.findFirst({
      where: { role: 'admin' },
    });
    if (!admin) {
      throw new Error('No admin user found. Please create an admin user first.');
    }
    return admin.id;
  }

  /**
   * Save a new prediction
   */
  async savePrediction(
    predictedPrice: number,
    confidence: number,
    trend: 'bullish' | 'bearish' | 'neutral',
    reasoning: string,
    userId?: string,
    action?: string,
    entryZone?: string,
    target?: string,
    stopLoss?: string,
    marketContext?: string
  ): Promise<PredictionRecord> {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const targetDate = tomorrow.toISOString().split('T')[0];

    // Get admin user if no userId provided (for cron jobs)
    const actualUserId = userId || (await this.getAdminUserId());

    // Check if prediction already exists for this user and target date
    const existing = await prisma.prediction.findFirst({
      where: {
        userId: actualUserId,
        targetDate,
        status: 'pending',
      },
    });

    if (existing) {
      console.log('⚠️ Prediction already exists for user', actualUserId, 'on', targetDate);
      return this.formatPrediction(existing);
    }

    const record = await prisma.prediction.create({
      data: {
        userId: actualUserId,
        date: now.toISOString().split('T')[0],
        targetDate,
        predictedPrice: Math.round(predictedPrice * 100) / 100,
        confidence,
        trend,
        reasoning,
        action,
        entryZone,
        target,
        stopLoss,
        marketContext,
        status: 'pending',
      },
    });

    console.log('✅ Prediction saved to Supabase for user:', actualUserId);
    return this.formatPrediction(record);
  }

  /**
   * Get all predictions for a specific user (or all if no userId)
   */
  async getAllPredictions(userId?: string): Promise<PredictionRecord[]> {
    const predictions = await prisma.prediction.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return predictions.map(this.formatPrediction);
  }

  /**
   * Get latest prediction
   */
  async getLatestPrediction(): Promise<PredictionRecord | null> {
    const prediction = await prisma.prediction.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    return prediction ? this.formatPrediction(prediction) : null;
  }

  /**
   * Update prediction with actual price
   */
  async updateWithActualPrice(
    targetDate: string,
    actualPrice: number
  ): Promise<PredictionRecord | null> {
    // Find pending prediction for this target date
    const prediction = await prisma.prediction.findFirst({
      where: {
        targetDate,
        status: 'pending',
      },
    });

    if (!prediction) {
      console.log(`No pending prediction found for ${targetDate}`);
      return null;
    }

    // Calculate metrics
    const difference = Math.round((actualPrice - prediction.predictedPrice) * 100) / 100;
    const percentageError =
      ((actualPrice - prediction.predictedPrice) / prediction.predictedPrice) * 100;

    // Update prediction
    const updated = await prisma.prediction.update({
      where: { id: prediction.id },
      data: {
        actualPrice: Math.round(actualPrice * 100) / 100,
        difference,
        percentageError,
        status: 'completed',
      },
    });

    console.log('✅ Prediction updated with actual price:', updated);
    return this.formatPrediction(updated);
  }

  /**
   * Get predictions by date range
   */
  async getPredictionsByDateRange(
    startDate: string,
    endDate: string,
    userId?: string
  ): Promise<PredictionRecord[]> {
    const predictions = await prisma.prediction.findMany({
      where: {
        ...(userId ? { userId } : {}),
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return predictions.map(this.formatPrediction);
  }

  /**
   * Get predictions for last N days
   */
  async getRecentPredictions(days: number, userId?: string): Promise<PredictionRecord[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.getPredictionsByDateRange(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      userId
    );
  }

  /**
   * Calculate accuracy statistics
   */
  async getAccuracyStats(userId?: string): Promise<{
    totalPredictions: number;
    completedPredictions: number;
    averageError: number;
    accuracy: number;
  }> {
    const whereClause = userId ? { userId } : undefined;
    const totalPredictions = await prisma.prediction.count({ where: whereClause });
    const completedPredictions = await prisma.prediction.count({
      where: { ...whereClause, status: 'completed' },
    });

    if (completedPredictions === 0) {
      return {
        totalPredictions,
        completedPredictions: 0,
        averageError: 0,
        accuracy: 0,
      };
    }

    const completed = await prisma.prediction.findMany({
      where: { ...whereClause, status: 'completed' },
      select: { percentageError: true },
    });

    const avgAbsError =
      completed.reduce((sum, p) => sum + Math.abs(p.percentageError || 0), 0) / completed.length;

    // Convert to accuracy score (0-100)
    const accuracy = Math.max(0, Math.min(100, 100 - avgAbsError * 10));

    return {
      totalPredictions,
      completedPredictions,
      averageError: avgAbsError,
      accuracy,
    };
  }

  /**
   * Clear all predictions (for testing)
   */
  async clearAllPredictions(): Promise<void> {
    await prisma.prediction.deleteMany();
    console.log('✅ All predictions cleared from Supabase');
  }

  /**
   * Format prediction for consistent output
   */
  private formatPrediction(prediction: any): PredictionRecord {
    return {
      id: prediction.id,
      date: prediction.date,
      targetDate: prediction.targetDate,
      predictedPrice: prediction.predictedPrice,
      actualPrice: prediction.actualPrice,
      difference: prediction.difference,
      percentageError: prediction.percentageError,
      confidence: prediction.confidence,
      trend: prediction.trend as 'bullish' | 'bearish' | 'neutral',
      reasoning: prediction.reasoning,
      status: prediction.status as 'pending' | 'completed',
      createdAt: prediction.createdAt.getTime(),
      updatedAt: prediction.updatedAt ? prediction.updatedAt.getTime() : undefined,
      // Add recommendation fields
      action: prediction.action,
      entryZone: prediction.entryZone,
      target: prediction.target,
      stopLoss: prediction.stopLoss,
      marketContext: prediction.marketContext,
    };
  }
}
