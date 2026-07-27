"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts";

export default function StandingsBarChart({
  data,
}: {
  data: { abbr: string; wins: number; color: string; isWiz: boolean }[];
}) {
  if (data.length === 0) return null;
  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -20 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="abbr"
            stroke="#64748b"
            fontSize={9}
            interval={0}
            angle={-90}
            textAnchor="end"
            height={44}
            tickLine={false}
          />
          <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
            contentStyle={{
              background: "#0b1220",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#e5e7eb" }}
          />
          <Bar dataKey="wins" radius={[3, 3, 0, 0]}>
            {data.map((d) => (
              <Cell
                key={d.abbr}
                fill={d.color}
                stroke={d.isWiz ? "#fff" : "none"}
                strokeWidth={d.isWiz ? 1.5 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
