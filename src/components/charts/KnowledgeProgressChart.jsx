import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const KnowledgeProgressChart = ({ data }) => {
  // Transform real API data for chart
  const chartData = data?.modules?.progress?.map((module, index) => ({
    name:
      module.title?.split(" ").slice(0, 2).join(" ") || `Module ${index + 1}`,
    progress: module.progress || 0,
    color: ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"][index % 5],
  })) || [{ name: "No Data", progress: 0, color: "#6b7280" }];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-2xl backdrop-blur-sm">
          <p className="text-white font-semibold mb-2">{label}</p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-300">Progress:</span>
            <span className="font-semibold text-white">
              {payload[0].value}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${payload[0].value}%`,
                backgroundColor: payload[0].payload.color,
              }}
            />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#374151"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          angle={-45}
          textAnchor="end"
          height={60}
          tick={{ fill: "#9ca3af", fontSize: 11 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          domain={[0, 100]}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="progress" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default KnowledgeProgressChart;
