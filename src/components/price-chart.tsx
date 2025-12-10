"use client";

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
} from "recharts";
import { ChartDataPoint } from "@/lib/price-simulator";

interface PriceChartProps {
  data: ChartDataPoint[];
  timeframe: "1week";
}

export function PriceChart({ data, timeframe }: PriceChartProps) {
  const minPrice = Math.min(...data.map((d) => d.price));
  const maxPrice = Math.max(...data.map((d) => d.price));
  const padding = (maxPrice - minPrice) * 0.1;

  // Find the index where predictions start
  const predictionStartIndex = data.findIndex((d) => !d.isHistorical);

  // Create separate data keys for historical and predicted
  const chartData = data.map((point) => ({
    time: point.time,
    historical: point.isHistorical ? point.price : null,
    predicted: !point.isHistorical ? point.price : null,
    // Add connection point
    connection: point.isHistorical && data[data.indexOf(point) + 1]?.isHistorical === false 
      ? point.price 
      : null,
  }));

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
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            tickLine={{ stroke: "#4b5563" }}
          />
          <YAxis
            stroke="#9ca3af"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            tickLine={{ stroke: "#4b5563" }}
            domain={[minPrice - padding, maxPrice + padding]}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #8b5cf6",
              borderRadius: "8px",
              color: "#fff",
            }}
            formatter={(value: any, name: string) => {
              if (value === null) return null;
              const label = name === "historical" ? "Historical" : "Predicted";
              return [`$${value.toLocaleString()}`, label];
            }}
            labelStyle={{ color: "#9ca3af" }}
          />
          
          {/* Vertical line separating historical and predicted data */}
          {predictionStartIndex > 0 && (
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
          )}

          {/* Historical data area (purple) */}
          <Area
            type="monotone"
            dataKey="historical"
            stroke="#8b5cf6"
            strokeWidth={3}
            fill="url(#colorHistorical)"
            animationDuration={1000}
            connectNulls={false}
          />
          
          {/* Predicted data area (pink) */}
          <Area
            type="monotone"
            dataKey="predicted"
            stroke="#ec4899"
            strokeWidth={4}
            fill="url(#colorPredicted)"
            animationDuration={1000}
            connectNulls={false}
          />
          
          {/* Connection line to bridge historical and predicted */}
          <Line
            type="monotone"
            dataKey="connection"
            stroke="#8b5cf6"
            strokeWidth={3}
            dot={false}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 rounded"></div>
          <span className="text-sm text-gray-400">Historical Data (Last 30 Days)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-pink-500 rounded"></div>
          <span className="text-sm text-gray-400">
            AI Prediction (Next 7 days)
          </span>
        </div>
      </div>
    </div>
  );
}
