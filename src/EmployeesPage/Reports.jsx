import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/layout/SideBar";
import {
  staffAPI,
  leaderboardsAPI,
  learningModulesAPI,
  attendanceAPI,
  handleApiError,
  staffSession,
  getCurrentUser,
  staffProfile,
  reportsManagement,
} from "../services/api";

// Lucide Icons
import {
  Users,
  MessageCircle,
  Clock,
  TrendingUp,
  Download,
  RefreshCw,
  Award,
  BookOpen,
  Calendar,
  BarChart3,
  LineChart,
  Crown,
  Medal,
  CheckCircle2,
  PlayCircle,
  FileText,
  Brain,
  TargetIcon,
  Activity,
} from "lucide-react";

// Chart Components
import AttendanceChart from "../components/charts/AttendanceChart";
import KnowledgeProgressChart from "../components/charts/KnowledgeProgressChart";
import PerformanceRadarChart from "../components/charts/PerformanceRadarChart";
import PerformanceTrendChart from "../components/charts/PerformanceTrendChart";
import PerformanceComparisonChart from "../components/charts/PerformanceComparisonChart";

const Reports = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeframe, setTimeframe] = useState("monthly");
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [activeView, setActiveView] = useState("overview");
  const [performanceView, setPerformanceView] = useState("radar");
  const [currentUser, setCurrentUser] = useState(null);
  const [greeting, setGreeting] = useState("");

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Get current staff session
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = getCurrentUser();
        if (user) {
          setCurrentUser(user);
          setGreeting(getGreeting());
        } else {
          const session = await staffSession.getStaffSession();
          if (session.isValid) {
            setCurrentUser(session.user);
            setGreeting(getGreeting());
          }
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  // Enhanced data fetching with real-time updates
  // In your fetchReportsData function in Reports.jsx, add better error handling:
  const fetchReportsData = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      console.log("🔄 Fetching real-time reports data for:", currentUser.id);

      // Try to fetch data with fallbacks for each API call
      const [
        performanceResponse,
        leaderboardResponse,
        modulesResponse,
        attendanceResponse,
      ] = await Promise.allSettled([
        staffAPI.getPerformanceMetrics({ timeframe }),
        leaderboardsAPI.getMyPerformance(),
        learningModulesAPI.getUserDashboard(),
        attendanceAPI.getMonthlyStats({ timeframe }),
      ]);

      // Handle responses with fallbacks
      const reportsResult = {
        success: true,
        data: {
          staff:
            performanceResponse.status === "fulfilled"
              ? performanceResponse.value.data?.data ||
                performanceResponse.value.data ||
                {}
              : {},
          leaderboard:
            leaderboardResponse.status === "fulfilled"
              ? leaderboardResponse.value.data?.data ||
                leaderboardResponse.value.data ||
                {}
              : {},
          modules:
            modulesResponse.status === "fulfilled"
              ? modulesResponse.value.data?.data ||
                modulesResponse.value.data ||
                {}
              : {},
          attendance:
            attendanceResponse.status === "fulfilled"
              ? attendanceResponse.value.data?.data ||
                attendanceResponse.value.data ||
                {}
              : {},
          profile: {},
        },
        lastUpdated: new Date(),
      };

      console.log("✅ Raw API data received:", reportsResult.data);

      // Transform data for charts
      const transformedData = transformReportsData(reportsResult.data);
      console.log("📊 Transformed data for charts:", transformedData);

      setReportsData(transformedData);
      setLastUpdated(reportsResult.lastUpdated || new Date());
    } catch (err) {
      console.error("Error fetching reports data:", err);
      const errorData = handleApiError(err);
      setError(errorData);
      // Set minimal fallback data with proper structure for charts
      setReportsData(getFallbackData());
    } finally {
      setLoading(false);
    }
  }, [timeframe, currentUser]);

  // Data transformation function
  const transformReportsData = (apiData) => {
    if (!apiData) return getFallbackData();

    return {
      staff: {
        clientsCount: apiData.staff?.clientsCount || 0,
        questionsAnswered: apiData.staff?.questionsAnswered || 0,
        avgSessionLength: apiData.staff?.avgSessionLength || "0h 00m",
        knowledgeGain: apiData.staff?.knowledgeGain || 0,
        startingKnowledge: apiData.staff?.startingKnowledge || 50,
        currentKnowledge: apiData.staff?.currentKnowledge || 0,
        performanceScore: apiData.staff?.performanceScore || 0,
        monthlyGrowth: apiData.staff?.monthlyGrowth || 0,
        satisfactionRate: apiData.staff?.satisfactionRate || 0,
        productivity: apiData.staff?.productivity || 0,
        efficiency: apiData.staff?.efficiency || 0,
      },
      leaderboard: {
        topPerformers: Array.isArray(apiData.leaderboard?.topPerformers)
          ? apiData.leaderboard.topPerformers.map((performer, index) => ({
              id: performer.id || performer._id || `user-${index}`,
              name: performer.name || performer.username || `User ${index + 1}`,
              points: performer.points || performer.score || 0,
              position: performer.position || performer.role || "Staff",
              isCurrentUser: performer.isCurrentUser || false,
            }))
          : [],
        myRank: apiData.leaderboard?.myRank || 0,
        myPoints: apiData.leaderboard?.myPoints || 0,
        totalParticipants: apiData.leaderboard?.totalParticipants || 0,
        rankChange: apiData.leaderboard?.rankChange || 0,
      },
      modules: {
        progress: Array.isArray(apiData.modules?.progress)
          ? apiData.modules.progress.map((module, index) => ({
              id: module.id || module._id || `module-${index}`,
              title:
                module.title || module.name || `Learning Module ${index + 1}`,
              progress: module.progress || module.completionRate || 0,
              status:
                module.status ||
                (module.progress === 100 ? "completed" : "in-progress"),
              category: module.category || module.type || "General",
              level: module.level || module.difficulty || "Beginner",
            }))
          : [],
        completedCount: apiData.modules?.completedCount || 0,
        inProgressCount: apiData.modules?.inProgressCount || 0,
        totalModules: apiData.modules?.totalModules || 0,
        certificationCount: apiData.modules?.certificationCount || 0,
      },
      attendance: {
        monthlyData: Array.isArray(apiData.attendance?.monthlyData)
          ? apiData.attendance.monthlyData
          : Array(12).fill(0),
        presentDays: apiData.attendance?.presentDays || 0,
        absentDays: apiData.attendance?.absentDays || 0,
        lateDays: apiData.attendance?.lateDays || 0,
        attendanceRate: apiData.attendance?.attendanceRate || 0,
        punctuality: apiData.attendance?.punctuality || 0,
        averageHours: apiData.attendance?.averageHours || 0,
      },
      profile: apiData.profile || {},
    };
  };

  const getFallbackData = () => ({
    staff: {
      clientsCount: 0,
      questionsAnswered: 0,
      avgSessionLength: "0h 00m",
      knowledgeGain: 0,
      startingKnowledge: 50,
      currentKnowledge: 0,
      performanceScore: 0,
      monthlyGrowth: 0,
      satisfactionRate: 0,
      productivity: 0,
      efficiency: 0,
    },
    leaderboard: {
      topPerformers: [],
      myRank: 0,
      myPoints: 0,
      totalParticipants: 0,
      rankChange: 0,
    },
    modules: {
      progress: [],
      completedCount: 0,
      inProgressCount: 0,
      totalModules: 0,
      certificationCount: 0,
    },
    attendance: {
      monthlyData: Array(12).fill(0),
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      attendanceRate: 0,
      punctuality: 0,
      averageHours: 0,
    },
    profile: {},
  });

  useEffect(() => {
    if (currentUser) {
      fetchReportsData();
    }
  }, [fetchReportsData, currentUser]);

  useEffect(() => {
    if (autoRefresh && currentUser) {
      const interval = setInterval(fetchReportsData, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchReportsData, autoRefresh, currentUser]);

  // Enhanced export function with API integration
  const exportReports = async () => {
    if (!reportsData) return;

    try {
      const exportResult = await staffAPI.exportReports("json");

      if (exportResult.success) {
        const dataStr = JSON.stringify(exportResult.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `performance-report-${
          new Date().toISOString().split("T")[0]
        }.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Fallback to client-side export
        const dataStr = JSON.stringify(reportsData, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `performance-report-${
          new Date().toISOString().split("T")[0]
        }.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting reports:", error);
      // Fallback to client-side export
      const dataStr = JSON.stringify(reportsData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `performance-report-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  if (loading && !reportsData) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 lg:ml-70 p-6 lg:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div className="mb-4 lg:mb-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {greeting}
                  {currentUser
                    ? `, ${currentUser.firstName || currentUser.username}!`
                    : "!"}
                </h1>
              </div>
              <p className="text-gray-400 text-lg">
                Here's your performance overview
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
                {lastUpdated && (
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
                <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-xs">Live Data</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportReports}
                disabled={!reportsData}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40">
                <FileText size={18} />
                Export Report
              </button>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                  autoRefresh
                    ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40"
                    : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                }`}>
                <RefreshCw
                  size={18}
                  className={autoRefresh ? "animate-spin" : ""}
                />
                {autoRefresh ? "Auto ON" : "Auto OFF"}
              </button>
              <button
                onClick={fetchReportsData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-xl text-gray-300 font-medium transition-all duration-200">
                <RefreshCw
                  size={18}
                  className={loading ? "animate-spin" : ""}
                />
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex gap-1 p-1 bg-gray-700/50 rounded-2xl w-fit mb-6">
            {[
              {
                id: "overview",
                label: "Overview",
                icon: <BarChart3 size={16} />,
              },
              {
                id: "performance",
                label: "Performance",
                icon: <Activity size={16} />,
              },
              { id: "learning", label: "Learning", icon: <Brain size={16} /> },
              {
                id: "attendance",
                label: "Attendance",
                icon: <Calendar size={16} />,
              },
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeView === view.id
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                    : "text-gray-400 hover:text-white hover:bg-gray-600/50"
                }`}>
                {view.icon}
                {view.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <p className="text-red-400 text-sm">
                {error.message ||
                  "Failed to load some data. Showing available information."}
              </p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Users className="text-blue-400" size={24} />}
            title="Total Clients"
            value={reportsData?.staff?.clientsCount || 0}
            subtitle="Your Monthly Clients"
            trend={reportsData?.staff?.monthlyGrowth || 0}
            color="blue"
          />
          <StatCard
            icon={<MessageCircle className="text-green-400" size={24} />}
            title="Questions Answered"
            value={reportsData?.staff?.questionsAnswered || 0}
            subtitle="Your Client Interactions"
            trend={12}
            color="green"
          />
          <StatCard
            icon={<Clock className="text-purple-400" size={24} />}
            title="Avg. Session"
            value={reportsData?.staff?.avgSessionLength || "0h 00m"}
            subtitle="Your Engagement Time"
            trend={8}
            color="purple"
          />
          <StatCard
            icon={<TrendingUp className="text-orange-400" size={24} />}
            title="Knowledge Gain"
            value={`+${reportsData?.staff?.knowledgeGain || 0}%`}
            subtitle="Your Skill Improvement"
            trend={reportsData?.staff?.knowledgeGain || 0}
            color="orange"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Charts */}
          <div className="xl:col-span-2 space-y-8">
            {/* Performance Analytics with Tabs */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-3xl p-6 border border-gray-700/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Your Performance Analytics
                  </h3>
                  <p className="text-gray-400">
                    Multi-dimensional performance insights
                  </p>
                </div>
                <div className="flex gap-1 p-1 bg-gray-700/50 rounded-xl">
                  {[
                    {
                      id: "radar",
                      label: "Radar",
                      icon: <TargetIcon size={14} />,
                    },
                    {
                      id: "trend",
                      label: "Trend",
                      icon: <LineChart size={14} />,
                    },
                    {
                      id: "comparison",
                      label: "Compare",
                      icon: <BarChart3 size={14} />,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        performanceView === tab.id
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                          : "text-gray-400 hover:text-white"
                      }`}
                      onClick={() => setPerformanceView(tab.id)}>
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-80">
                {performanceView === "radar" && (
                  <PerformanceRadarChart data={reportsData} />
                )}
                {performanceView === "trend" && (
                  <PerformanceTrendChart data={reportsData} />
                )}
                {performanceView === "comparison" && (
                  <PerformanceComparisonChart data={reportsData} />
                )}
              </div>
            </div>

            {/* Attendance & Knowledge Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-3xl p-6 border border-gray-700/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      Your Attendance
                    </h3>
                    <p className="text-gray-400 text-sm">Monthly trend</p>
                  </div>
                  <div className="flex items-center gap-1 text-green-400 text-sm">
                    <TrendingUp size={16} />
                    <span>{reportsData?.attendance?.attendanceRate || 0}%</span>
                  </div>
                </div>
                <div className="h-64">
                  <AttendanceChart data={reportsData?.attendance} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-3xl p-6 border border-gray-700/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      Your Knowledge Progress
                    </h3>
                    <p className="text-gray-400 text-sm">Skill development</p>
                  </div>
                  <div className="flex items-center gap-1 text-blue-400 text-sm">
                    <Brain size={16} />
                    <span>+{reportsData?.staff?.knowledgeGain || 0}%</span>
                  </div>
                </div>
                <div className="h-64">
                  <KnowledgeProgressChart data={reportsData} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Leaderboard */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-3xl p-6 border border-gray-700/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  Performance Leaderboard
                </h3>
                <Award className="text-yellow-400" size={20} />
              </div>

              <div className="space-y-3 mb-4">
                {reportsData?.leaderboard?.topPerformers?.length > 0 ? (
                  reportsData.leaderboard.topPerformers.map((user, index) => (
                    <LeaderboardItem
                      key={user.id || index}
                      user={user}
                      rank={index + 1}
                      isCurrentUser={user.isCurrentUser}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Award size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No leaderboard data available</p>
                  </div>
                )}
              </div>

              {/* Personal Stats */}
              {reportsData?.leaderboard && (
                <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl border border-blue-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-white font-semibold">
                        Your Ranking
                      </div>
                      <div className="text-gray-400 text-sm">
                        Among {reportsData.leaderboard.totalParticipants || 0}{" "}
                        professionals
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-yellow-400">
                        #{reportsData.leaderboard.myRank || "N/A"}
                      </div>
                      <div className="text-green-400 text-sm font-medium">
                        +{reportsData.leaderboard.rankChange || 0}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">
                      {reportsData.leaderboard.myPoints || 0} points
                    </span>
                    <span className="text-blue-400">
                      {reportsData.leaderboard.myRank &&
                      reportsData.leaderboard.totalParticipants
                        ? `Top ${Math.round(
                            (reportsData.leaderboard.myRank /
                              reportsData.leaderboard.totalParticipants) *
                              100
                          )}%`
                        : "Rank not available"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Learning Progress */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-3xl p-6 border border-gray-700/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  Your Learning Progress
                </h3>
                <BookOpen className="text-green-400" size={20} />
              </div>

              <div className="space-y-4 mb-6">
                {reportsData?.modules?.progress?.length > 0 ? (
                  reportsData.modules.progress.map((module) => (
                    <LearningModuleItem key={module.id} module={module} />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No learning modules in progress</p>
                  </div>
                )}
              </div>

              {/* Progress Summary */}
              <div className="p-4 bg-gray-700/30 rounded-2xl">
                <div className="flex justify-between items-center text-sm mb-3">
                  <span className="text-gray-400">Your Overall Progress</span>
                  <span className="text-white font-semibold">
                    {reportsData?.modules?.completedCount || 0}/
                    {reportsData?.modules?.totalModules || 0} Completed
                  </span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2 mb-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-1000"
                    style={{
                      width: `${
                        ((reportsData?.modules?.completedCount || 0) /
                          (reportsData?.modules?.totalModules || 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>
                    {reportsData?.modules?.inProgressCount || 0} in progress
                  </span>
                  <span>
                    {reportsData?.modules?.certificationCount || 0}{" "}
                    certifications
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, title, value, subtitle, trend, color }) => {
  const colorClasses = {
    blue: "from-blue-500/10 to-blue-600/10 border-blue-500/20",
    green: "from-green-500/10 to-green-600/10 border-green-500/20",
    purple: "from-purple-500/10 to-purple-600/10 border-purple-500/20",
    orange: "from-orange-500/10 to-orange-600/10 border-orange-500/20",
  };

  const trendColors = {
    blue: "text-blue-400",
    green: "text-green-400",
    purple: "text-purple-400",
    orange: "text-orange-400",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-3xl p-6 border backdrop-blur-sm hover:scale-105 transition-transform duration-300 group`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-gray-700/50 rounded-xl group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <div
          className={`flex items-center gap-1 text-sm ${trendColors[color]} bg-gray-700/50 px-2 py-1 rounded-full`}>
          <TrendingUp size={14} />
          <span>+{trend}%</span>
        </div>
      </div>
      <div className="mb-2">
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
        <div className="text-gray-400 text-sm">{title}</div>
        <div className="text-gray-500 text-xs">{subtitle}</div>
      </div>
    </div>
  );
};

// Leaderboard Item Component
const LeaderboardItem = ({ user, rank, isCurrentUser }) => {
  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="text-yellow-400" size={18} />;
    if (rank === 2) return <Medal className="text-gray-300" size={18} />;
    if (rank === 3) return <Medal className="text-orange-400" size={18} />;
    return <span className="text-gray-400 text-sm font-medium">{rank}</span>;
  };

  return (
    <div
      className={`flex items-center gap-4 p-3 rounded-2xl transition-all duration-200 group ${
        isCurrentUser
          ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30"
          : "bg-gray-700/30 hover:bg-gray-700/50"
      }`}>
      <div
        className={`flex items-center justify-center w-8 h-8 rounded-xl ${
          rank <= 3
            ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20"
            : "bg-gray-600"
        }`}>
        {getRankIcon(rank)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
            {(user.name || "User").substring(0, 2).toUpperCase()}
          </div>
          <span
            className={`font-medium truncate ${
              isCurrentUser ? "text-blue-300" : "text-white"
            }`}>
            {user.name || "Unknown User"}
          </span>
          {isCurrentUser && (
            <span className="px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
              You
            </span>
          )}
        </div>
        <div className="text-gray-400 text-xs truncate">
          {user.position || "Staff"}
        </div>
      </div>
      <div className="text-right">
        <div className="text-white font-semibold text-sm">
          {(user.points || 0).toLocaleString()}
        </div>
        <div className="text-gray-400 text-xs mt-1">points</div>
      </div>
    </div>
  );
};

// Learning Module Item Component
const LearningModuleItem = ({ module }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="text-green-400" size={16} />;
      case "in-progress":
        return <PlayCircle className="text-blue-400" size={16} />;
      default:
        return <BookOpen className="text-gray-400" size={16} />;
    }
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-2xl hover:bg-gray-700/50 transition-colors group">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-600/50 group-hover:scale-110 transition-transform">
        {getStatusIcon(module.status)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white font-medium truncate text-sm">
          {module.title || "Untitled Module"}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
          <span>{module.category || "General"}</span>
          <span>•</span>
          <span>{module.level || "Beginner"}</span>
        </div>
      </div>
      <div className="w-12">
        <div className="w-full bg-gray-600 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              (module.progress || 0) === 100 ? "bg-green-500" : "bg-blue-500"
            }`}
            style={{ width: `${module.progress || 0}%` }}
          />
        </div>
        <div className="text-xs text-gray-400 text-center mt-1">
          {module.progress || 0}%
        </div>
      </div>
    </div>
  );
};

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="flex min-h-screen bg-gray-900">
    <div className="flex-1 p-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-800 rounded-3xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="h-80 bg-gray-800 rounded-3xl"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-64 bg-gray-800 rounded-3xl"></div>
              <div className="h-64 bg-gray-800 rounded-3xl"></div>
            </div>
          </div>
          <div className="space-y-8">
            <div className="h-96 bg-gray-800 rounded-3xl"></div>
            <div className="h-80 bg-gray-800 rounded-3xl"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Reports;
