'use client';

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ChartDataPoint } from '@/lib/price-simulator';

interface PriceChartProps {
  data: ChartDataPoint[];
  timeframe: '1week';
}

export function PriceChart({ data, timeframe }: PriceChartProps) {
  // Filter to show ONLY historical data
  const historicalData = data.filter(d => d.isHistorical);

  const minPrice = Math.min(...historicalData.map(d => d.price));
  const maxPrice = Math.max(...historicalData.map(d => d.price));
  const padding = (maxPrice - minPrice) * 0.1;

  // Prepare chart data (historical only)
  const chartData = historicalData.map((point, index) => ({
    time: point.time,
    price: point.price,
    index: index, // Add index for tick calculation
  }));

  // Calculate ticks to show every 2 days
  const ticks = chartData.map((_, index) => index).filter(index => index % 2 === 0); // Every 2nd index

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData}>
          <defs>
            {/* Gradient for historical data */}
            <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
            {/* Gradient for predicted data */}
            <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="time"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            tickLine={{ stroke: '#4b5563' }}
            ticks={ticks.map(i => chartData[i].time)}
          />
          <YAxis
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            tickLine={{ stroke: '#4b5563' }}
            domain={[minPrice - padding, maxPrice + padding]}
            tickFormatter={value => `$${value.toLocaleString()}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #8b5cf6',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: any) => [`$${value.toLocaleString()}`, 'Price']}
            labelStyle={{ color: '#9ca3af' }}
          />

          {/* Vertical line separating historical and predicted data */}
          {/* Not needed if only showing historical */}
          {/* {predictionStartIndex > 0 && (
            <ReferenceLine
              x={data[predictionStartIndex - 1].time}
              stroke="#fbbf24"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: "AI Prediction →",
                position: "top",
                fill: "#fbbf24",
                fontSize: 12,
              }}
            />
          )} */}

          {/* Historical data area (purple gradient) */}
          <Area
            type="monotone"
            dataKey="price"
            stroke="#8b5cf6"
            strokeWidth={2}
            fill="url(#colorHistorical)"
            animationDuration={1000}
            connectNulls={false}
          />

          {/* Predicted data area (pink) */}
          {/* Not needed if only showing historical */}
          {/* <Area
            type="monotone"
            dataKey="predicted"
            stroke="#ec4899"
            strokeWidth={4}
            fill="url(#colorPredicted)"
            animationDuration={1000}
            connectNulls={false}
          /> */}

          {/* Connection line to bridge historical and predicted */}
          {/* Not needed if only showing historical */}
          {/* <Line
            type="monotone"
            dataKey="connection"
            stroke="#8b5cf6"
            strokeWidth={3}
            dot={false}
            connectNulls={false}
          /> */}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 rounded"></div>
          <span className="text-sm text-gray-400">Historical Data (Last 30 Days)</span>
        </div>
      </div>
    </div>
  );
}
