import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const PerformanceRadarChart = ({ data }) => {
  // Transform real API data for radar chart
  const performanceData = [
    {
      subject: "Technical Skills",
      value: data?.staff?.currentKnowledge || 0,
      fullMark: 100,
    },
    {
      subject: "Client Service",
      value: data?.staff?.satisfactionRate || 0,
      fullMark: 100,
    },
    {
      subject: "Productivity",
      value: data?.staff?.productivity || 0,
      fullMark: 100,
    },
    {
      subject: "Knowledge",
      value: (data?.staff?.knowledgeGain || 0) + 70,
      fullMark: 100,
    },
    {
      subject: "Attendance",
      value: data?.attendance?.attendanceRate || 0,
      fullMark: 100,
    },
    {
      subject: "Efficiency",
      value: data?.staff?.efficiency || 0,
      fullMark: 100,
    },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-2xl backdrop-blur-sm">
          <p className="text-white font-semibold mb-2">{label}</p>
          <p className="text-blue-400 font-medium">
            Score: <span className="text-white">{payload[0].value}%</span>
          </p>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
              style={{ width: `${payload[0].value}%` }}
            />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart
        cx="50%"
        cy="50%"
        outerRadius="75%"
        data={performanceData}
        margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
        <defs>
          <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.4} />
          </linearGradient>
          <linearGradient id="borderGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={1} />
          </linearGradient>
        </defs>

        <PolarGrid
          stroke="#374151"
          strokeWidth={1}
          strokeOpacity={0.5}
          radialLines={false}
        />

        <PolarAngleAxis
          dataKey="subject"
          tick={{
            fill: "#9ca3af",
            fontSize: 11,
            fontWeight: 500,
          }}
          tickLine={false}
        />

        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tickCount={6}
          tick={{
            fill: "#6b7280",
            fontSize: 9,
          }}
          tickLine={false}
          axisLine={false}
        />

        <Radar
          name="Performance"
          dataKey="value"
          stroke="url(#borderGradient)"
          strokeWidth={3}
          fill="url(#performanceGradient)"
          fillOpacity={0.6}
          dot={{
            fill: "#ffffff",
            stroke: "#8b5cf6",
            strokeWidth: 2,
            r: 4,
          }}
          activeDot={{
            r: 6,
            fill: "#ffffff",
            stroke: "#8b5cf6",
            strokeWidth: 3,
          }}
        />

        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default PerformanceRadarChart;
