"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function WinTrendChart({
  data,
}: {
  data: { year: number; wins: number }[];
}) {
  if (data.length < 2) return null;
  return (
    <div style={{ width: "100%", height: 200 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="year"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            domain={[0, "dataMax + 4"]}
          />
          <Tooltip
            contentStyle={{
              background: "#0b1220",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#e5e7eb" }}
          />
          <Line
            type="monotone"
            dataKey="wins"
            stroke="var(--wiz-red)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--wiz-red)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
