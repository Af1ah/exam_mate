"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type ChartPoint = {
  id: string;
  displayDate: string;
  score: number;
};

export function ScoreChart({ data }: { data: ChartPoint[] }) {
  if (!data.length) {
    return <p className="empty-chart">Your score trend will appear after your first completed quiz.</p>;
  }

  return (
    <div className="score-chart" aria-label="Recent score trend">
      <ResponsiveContainer width="100%" height={240} minWidth={100} minHeight={200}>
        <LineChart data={data} margin={{ top: 12, right: 10, left: -22, bottom: 0 }}>
          <CartesianGrid stroke="#e6eaf3" strokeDasharray="4 4" vertical={false} />
          <XAxis 
            dataKey="id" 
            tickFormatter={(value) => data.find((d) => d.id === value)?.displayDate ?? value}
            tick={{ fill: "#72809a", fontSize: 12 }} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#72809a", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            cursor={{ stroke: "#cbd5ea", strokeWidth: 1 }}
            labelFormatter={(label) => data.find((d) => d.id === label)?.displayDate ?? label}
            formatter={(value) => [`${value}%`, "Score"]}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#315be2"
            strokeWidth={3}
            dot={{ fill: "#315be2", stroke: "#fff", strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
