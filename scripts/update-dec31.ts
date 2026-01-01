// Manual script to update Dec 31, 2025 prediction
// Run: npx tsx scripts/update-dec31.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const targetDate = '2025-12-30';
  const actualPrice = 88485.49; // Dec 30, 2025 closing price from Binance

  console.log(`🔄 Updating prediction for ${targetDate}...`);

  // Find the prediction
  const prediction = await prisma.prediction.findFirst({
    where: {
      targetDate,
    },
  });

  if (!prediction) {
    console.error(`❌ No prediction found for ${targetDate}`);
    return;
  }

  console.log(`📊 Found prediction:`);
  console.log(`   Predicted Price: $${prediction.predictedPrice}`);
  console.log(`   Actual Price: $${actualPrice}`);

  // Calculate metrics
  const difference = Math.round((actualPrice - prediction.predictedPrice) * 100) / 100;
  const percentageError =
    ((actualPrice - prediction.predictedPrice) / prediction.predictedPrice) * 100;

  console.log(`   Difference: $${difference}`);
  console.log(`   Error: ${percentageError.toFixed(2)}%`);
  console.log(`   Accuracy: ${(100 - Math.abs(percentageError)).toFixed(2)}%`);

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

  console.log(`✅ Prediction updated successfully!`);
  console.log(updated);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
