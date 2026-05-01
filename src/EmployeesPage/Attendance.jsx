import React, { useState, useEffect } from "react";
import Sidebar from "../components/layout/SideBar";
import {
  attendanceAPI,
  handleApiError,
  staffSession,
  getCurrentUser,
  staffAPI,
  stylistsManagement,
  staffUtils,
} from "../services/api";

const Attendance = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentStatus, setCurrentStatus] = useState("No record for today");
  const [currentUser, setCurrentUser] = useState(null);
  const [greeting, setGreeting] = useState("");

  // Staff data state
  const [staffData, setStaffData] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isAdminView, setIsAdminView] = useState(false);

  // BREAK STATES - Similar to mobile app
  const [breakStatus, setBreakStatus] = useState({
    onBreak: false,
    activeBreak: null,
    totalBreaksToday: 0,
    totalBreakTime: 0,
    breaks: [],
  });

  // Employee status states
  const [employeeStatus, setEmployeeStatus] = useState({
    status: "absent",
    message: "Not Clocked In",
    color: "#EF4444",
    icon: "close-circle",
  });

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Get status configuration similar to mobile app
  const getStatusConfig = (status) => {
    const configs = {
      working: {
        status: "working",
        message: "Working",
        color: "#10B981",
        icon: "checkmark-circle",
      },
      "break-time": {
        status: "break-time",
        message: "On Break",
        color: "#F59E0B",
        icon: "cafe",
      },
      "rest-day": {
        status: "rest-day",
        message: "Rest Day",
        color: "#3B82F6",
        icon: "bed",
      },
      absent: {
        status: "absent",
        message: "Not Clocked In",
        color: "#EF4444",
        icon: "close-circle",
      },
    };
    return configs[status] || configs.absent;
  };

  // Check employee status
  const checkEmployeeStatus = async (staffId = null) => {
    try {
      const targetStaffId = staffId || currentUser?.id;
      if (!targetStaffId) return getStatusConfig("absent");

      const response = await attendanceAPI.getStatus();

      if (response.data?.success && response.data.data) {
        const attendance = response.data.data;

        if (attendance.status === "on-break") {
          return getStatusConfig("break-time");
        }

        if (attendance.clockInTime && !attendance.clockOutTime) {
          return getStatusConfig("working");
        }
      }

      // Check if today is rest day
      const today = new Date().getDay();
      if (today === 0) {
        // Sunday as rest day
        return getStatusConfig("rest-day");
      }

      return getStatusConfig("absent");
    } catch (error) {
      console.error("Error checking employee status:", error);
      return getStatusConfig("absent");
    }
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Check if current user is admin
  const checkAdminStatus = () => {
    const user = getCurrentUser();
    return user?.role === "admin";
  };

  // Get current staff session
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = getCurrentUser();
        if (user) {
          setCurrentUser(user);
          setGreeting(getGreeting());
          setIsAdminView(checkAdminStatus());

          // If admin, load all staff data
          if (checkAdminStatus()) {
            await fetchAllStaff();
          }
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

  // Fetch all staff members (for admin view)
  const fetchAllStaff = async () => {
    try {
      console.log("🔄 Fetching all staff data...");
      const response = await stylistsManagement.getAllStylists();

      if (response.success) {
        setStaffData(response.staffs || []);
        console.log(`✅ Loaded ${response.staffs?.length || 0} staff members`);
      } else {
        console.error("❌ Failed to fetch staff data:", response.message);
      }
    } catch (error) {
      console.error("❌ Error fetching staff data:", error);
    }
  };

  // Fetch break status
  const fetchBreakStatus = async (staffId = null) => {
    try {
      const response = await attendanceAPI.getBreakStatus();
      if (response.success) {
        setBreakStatus(response.data);

        // Update current status if on break
        if (response.data.onBreak && currentStatus !== "on-break") {
          setCurrentStatus("on-break");
          setEmployeeStatus(getStatusConfig("break-time"));
        }
      }
    } catch (error) {
      console.error("Error fetching break status:", error);
    }
  };

  // Enhanced attendance data fetching
  const fetchAttendanceData = async (isRefresh = false, staffId = null) => {
    const targetStaffId = staffId || currentUser?.id;

    if (!targetStaffId) {
      console.warn("⚠️ No staff ID available for fetching attendance");
      return;
    }

    try {
      if (!isRefresh) setLoading(true);
      setRefreshing(true);
      setError(null);

      console.log(`🔄 Fetching attendance data for staff:`, {
        staffId: targetStaffId,
        month: selectedMonth + 1,
        year: selectedYear,
        isAdminView,
        selectedStaffName: selectedStaff?.firstName,
      });

      // Fetch multiple data in parallel
      const [
        monthlyStatsResponse,
        monthlyChartResponse,
        historyResponse,
        statusResponse,
        breakStatusResponse,
      ] = await Promise.allSettled([
        attendanceAPI.getMonthlyStats({
          year: selectedYear,
          month: selectedMonth + 1,
          staffId: targetStaffId,
        }),
        attendanceAPI.getMonthlyChart(selectedYear),
        attendanceAPI.getHistory({
          page: 1,
          limit: 7,
          staffId: targetStaffId,
        }),
        attendanceAPI.getStatus(),
        attendanceAPI.getBreakStatus(),
      ]);

      // Process monthly stats
      const monthlyStats =
        monthlyStatsResponse.status === "fulfilled"
          ? monthlyStatsResponse.value.data?.data ||
            monthlyStatsResponse.value.data
          : null;

      // Process monthly chart
      const monthlyChart =
        monthlyChartResponse.status === "fulfilled"
          ? monthlyChartResponse.value.data?.data ||
            monthlyChartResponse.value.data
          : [];

      // Process recent attendance
      const recentAttendance =
        historyResponse.status === "fulfilled"
          ? historyResponse.value.data?.data || historyResponse.value.data
          : [];

      // Process current status
      if (statusResponse.status === "fulfilled") {
        const statusData =
          statusResponse.value.data?.data || statusResponse.value.data;
        if (statusData) {
          setCurrentStatus(statusData.status || "not-started");
          // Update employee status based on current status
          const status = await checkEmployeeStatus(targetStaffId);
          setEmployeeStatus(status);
        }
      }

      // Process break status
      if (breakStatusResponse.status === "fulfilled") {
        const breakData =
          breakStatusResponse.value.data?.data ||
          breakStatusResponse.value.data;
        if (breakData) {
          setBreakStatus(breakData);
        }
      }

      const processedData = processAttendanceData(
        {
          monthlyStats,
          monthlyChart,
          recentAttendance,
          monthlyData: monthlyChart,
        },
        targetStaffId
      );

      setAttendanceData(processedData);
      setLastUpdated(new Date());

      console.log("✅ Attendance data loaded:", {
        present: processedData.stats?.presentDays,
        absent: processedData.stats?.absentDays,
        staff: selectedStaff?.firstName || currentUser?.firstName,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("❌ Error fetching attendance data:", err);
      setError(handleApiError(err).message || "Failed to load attendance data");

      // Set minimal fallback data
      const fallbackData = {
        attendanceRecords: [],
        stats: {
          presentDays: 0,
          absentDays: 0,
          attendanceRate: 0,
          totalHours: 0,
          averageHours: 0,
          workingDays: 0,
          present: 0,
          absent: 0,
          totalBreakTime: 0,
        },
        monthlyChart: [],
        summary: "No attendance data available",
        lastSync: new Date().toISOString(),
      };
      setAttendanceData(fallbackData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Enhanced process attendance data
  const processAttendanceData = (rawData, staffId) => {
    if (!rawData) {
      return {
        attendanceRecords: [],
        stats: {
          presentDays: 0,
          absentDays: 0,
          attendanceRate: 0,
          totalHours: 0,
          averageHours: 0,
          workingDays: 0,
          present: 0,
          absent: 0,
          totalBreakTime: 0,
        },
        monthlyChart: [],
        summary: "No attendance records found",
        lastSync: new Date().toISOString(),
        staffId: staffId,
      };
    }

    // Calculate real-time stats
    const stats = calculateRealTimeStats(
      rawData.recentAttendance || [],
      rawData.monthlyStats,
      selectedYear,
      selectedMonth
    );

    return {
      ...rawData,
      stats,
      monthlyChart: rawData.monthlyChart || rawData.monthlyData || [],
      lastSync: new Date().toISOString(),
      staffId: staffId,
    };
  };

  // Calculate real-time stats
  const calculateRealTimeStats = (records, monthlyStats, year, month) => {
    const monthRecords = records.filter((record) => {
      const recordDate = new Date(record.date);
      return (
        recordDate.getFullYear() === year && recordDate.getMonth() === month
      );
    });

    const presentDays = monthRecords.filter(
      (r) => r.status === "present" || r.status === "working"
    ).length;
    const absentDays = monthRecords.filter((r) => r.status === "absent").length;
    const totalDays = presentDays + absentDays;
    const attendanceRate =
      totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return {
      presentDays,
      absentDays,
      attendanceRate,
      totalHours: presentDays * 8,
      averageHours: 8,
      workingDays: monthlyStats?.workingDays || 0,
      present: monthlyStats?.present || presentDays,
      absent: monthlyStats?.absent || absentDays,
      totalBreakTime: monthlyStats?.totalBreakTime || 0,
    };
  };

  // Handle staff selection (for admin view)
  const handleStaffSelect = async (staff) => {
    setSelectedStaff(staff);
    await fetchAttendanceData(false, staff.id);
    // Also fetch status for selected staff
    const status = await checkEmployeeStatus(staff.id);
    setEmployeeStatus(status);
    await fetchBreakStatus(staff.id);
  };

  // Reset to current user view
  const handleResetToSelf = () => {
    setSelectedStaff(null);
    fetchAttendanceData(false, currentUser?.id);
    checkEmployeeStatus(currentUser?.id);
    fetchBreakStatus(currentUser?.id);
  };

  useEffect(() => {
    if (currentUser) {
      fetchAttendanceData();
      checkEmployeeStatus();
      fetchBreakStatus();
    }
  }, [selectedMonth, selectedYear, currentUser]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(() => {
        fetchAttendanceData(true, selectedStaff?.id || currentUser?.id);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [selectedMonth, selectedYear, currentUser, selectedStaff]);

  const handleRefresh = () => {
    fetchAttendanceData(true, selectedStaff?.id || currentUser?.id);
  };

  // Enhanced calendar generation with staff data
  const generateCalendar = () => {
    const year = selectedYear;
    const month = selectedMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const calendar = [];
    let day = 1;

    for (let i = 0; i < 6; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < startingDay) {
          const prevMonth = new Date(year, month, 0);
          const prevMonthDay = prevMonth.getDate() - startingDay + j + 1;
          week.push({ day: prevMonthDay, isCurrentMonth: false });
        } else if (day > daysInMonth) {
          const nextMonthDay = day - daysInMonth;
          week.push({ day: nextMonthDay, isCurrentMonth: false });
          day++;
        } else {
          const currentDate = new Date(year, month, day);
          const isToday =
            currentDate.toDateString() === new Date().toDateString();
          const isWeekend =
            currentDate.getDay() === 0 || currentDate.getDay() === 6;

          const isPresent = attendanceData?.attendanceRecords?.some(
            (record) =>
              new Date(record.date).getDate() === day &&
              (record.status === "present" || record.status === "working")
          );
          const isAbsent = attendanceData?.attendanceRecords?.some(
            (record) =>
              new Date(record.date).getDate() === day &&
              record.status === "absent"
          );
          const isOnBreak = attendanceData?.attendanceRecords?.some(
            (record) =>
              new Date(record.date).getDate() === day &&
              record.status === "on-break"
          );

          week.push({
            day: day,
            isCurrentMonth: true,
            isPresent,
            isAbsent,
            isOnBreak,
            isToday,
            isWeekend,
            isFuture: currentDate > new Date(),
          });
          day++;
        }
      }
      calendar.push(week);
    }

    return calendar;
  };

  // Get recent days for bubble display (similar to mobile app)
  const getRecentDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const record = attendanceData?.recentAttendance?.find(
        (r) => new Date(r.date).toDateString() === date.toDateString()
      );
      const dayName = date.toLocaleString("default", { weekday: "short" });
      const dayNum = date.getDate();
      const isToday = date.toDateString() === today.toDateString();

      let color = "#6B7280"; // gray for no records

      if (record) {
        switch (record.status) {
          case "present":
          case "working":
            color = "#10B981"; // green for present
            break;
          case "late":
            color = "#F59E0B"; // orange for late
            break;
          case "absent":
            color = "#EF4444"; // red for absent
            break;
          case "half-day":
            color = "#8B5CF6"; // purple for half-day
            break;
          case "on-break":
            color = "#F59E0B"; // orange for on-break
            break;
        }
      } else if (date.getDay() === 0) {
        color = "#619AE4"; // blue for rest day (Sunday)
      }

      // Override with white for today if no specific status
      if (isToday && !record) {
        color = "#FFFFFF"; // white for today with no records
      }

      days.push({ dayName, dayNum, color, isToday });
    }
    return days;
  };

  // Render status icon
  const renderStatusIcon = () => {
    const icons = {
      "checkmark-circle": "✓",
      cafe: "☕",
      bed: "🛌",
      "close-circle": "✕",
    };
    return icons[employeeStatus.icon] || "○";
  };

  if (loading && !attendanceData) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-800 rounded-lg mb-8"></div>
          </div>
        </div>
      </div>
    );
  }

  const recentDays = getRecentDays();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 p-6 lg:p-8">
        {/* Enhanced Header with Staff Selection */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <div className="flex items-center space-x-4">
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                  {greeting}
                  {currentUser
                    ? `, ${currentUser.firstName || currentUser.username}!`
                    : "!"}
                </h1>
                {refreshing && (
                  <div className="flex items-center space-x-2 text-blue-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                    <span className="text-sm">Live updating...</span>
                  </div>
                )}
              </div>
              <p className="text-gray-400">
                {isAdminView
                  ? "Track staff attendance and working hours"
                  : "Track your attendance and working hours"}
              </p>

              {/* Staff Selection for Admin */}
              {isAdminView && (
                <div className="flex items-center space-x-4 mt-3">
                  <select
                    value={selectedStaff?.id || "current"}
                    onChange={(e) => {
                      if (e.target.value === "current") {
                        handleResetToSelf();
                      } else {
                        const staff = staffData.find(
                          (s) => s.id === e.target.value
                        );
                        if (staff) handleStaffSelect(staff);
                      }
                    }}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                    <option value="current">My Attendance</option>
                    {staffData.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.displayName} - {staff.position}
                      </option>
                    ))}
                  </select>

                  {selectedStaff && (
                    <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg px-3 py-1">
                      <img
                        src={staffUtils.validateProfileImage(
                          selectedStaff.profileImage,
                          selectedStaff.displayName
                        )}
                        alt={selectedStaff.displayName}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-white text-sm">
                        Viewing: {selectedStaff.displayName}
                      </span>
                      <button
                        onClick={handleResetToSelf}
                        className="text-gray-400 hover:text-white text-sm">
                        ×
                      </button>
                    </div>
                  )}
                </div>
              )}

              {lastUpdated && (
                <span className="text-xs text-gray-500">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Current Status Card - Enhanced with mobile app styling */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 mt-4 lg:mt-0">
              <div className="flex items-center space-x-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: employeeStatus.color }}></div>
                <div>
                  <p className="text-white font-semibold">
                    {selectedStaff
                      ? `${selectedStaff.displayName} - ${employeeStatus.message}`
                      : employeeStatus.message}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {currentTime.toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-xl">{renderStatusIcon()}</div>
              </div>

              {/* Break Status Display */}
              {(currentStatus === "clocked-in" ||
                currentStatus === "on-break") &&
                breakStatus && (
                  <div className="mt-2 pt-2 border-t border-gray-600">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Breaks Today:</span>
                      <span className="text-white">
                        {breakStatus.totalBreaksToday}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Total Break Time:</span>
                      <span className="text-white">
                        {Math.floor(breakStatus.totalBreakTime / 60)}h{" "}
                        {breakStatus.totalBreakTime % 60}m
                      </span>
                    </div>
                    {breakStatus.onBreak && breakStatus.activeBreak && (
                      <div className="flex items-center space-x-1 mt-1 text-amber-400 text-xs">
                        <span>⏰</span>
                        <span>
                          Break started at{" "}
                          {new Date(
                            breakStatus.activeBreak.breakStart
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                )}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-red-400">⚠️</span>
                  <span className="text-red-300">{error}</span>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-300">
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Enhanced Month/Year Selector */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="text-white text-xl font-semibold">
                {months[selectedMonth]} {selectedYear}
                {selectedStaff && (
                  <span className="text-blue-400 text-sm ml-2">
                    • {selectedStaff.displayName}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                  {months.map((month, index) => (
                    <option key={month} value={index}>
                      {month}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                  {[2023, 2024, 2025].map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium disabled:opacity-50 flex items-center space-x-2">
                  <svg
                    className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Stats Container with Background - Similar to mobile app */}
            <div className="mt-6 bg-gray-900/60 rounded-xl p-6 border border-gray-700">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                  <div className="text-2xl font-bold text-blue-400">
                    {attendanceData?.stats?.workingDays || 0}
                  </div>
                  <div className="text-gray-400 text-sm">Working Days</div>
                </div>
                <div className="text-center bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                  <div className="text-2xl font-bold text-green-400">
                    {attendanceData?.stats?.present || 0}
                  </div>
                  <div className="text-gray-400 text-sm">Present</div>
                </div>
                <div className="text-center bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                  <div className="text-2xl font-bold text-red-400">
                    {attendanceData?.stats?.absent || 0}
                  </div>
                  <div className="text-gray-400 text-sm">Absent</div>
                </div>
              </div>

              {/* Break Summary */}
              {attendanceData?.stats &&
                attendanceData.stats.totalBreakTime > 0 && (
                  <div className="flex items-center justify-center space-x-2 text-amber-400 bg-amber-400/10 rounded-lg p-3 border border-amber-400/20">
                    <span>☕</span>
                    <span className="text-sm">
                      Total Break Time:{" "}
                      {Math.floor(attendanceData.stats.totalBreakTime / 60)}h{" "}
                      {attendanceData.stats.totalBreakTime % 60}m
                    </span>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Monthly Attendance Chart */}
        {attendanceData?.monthlyChart &&
          attendanceData.monthlyChart.length > 0 && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
              <h3 className="text-xl font-semibold text-white mb-4">
                Monthly Attendance %
              </h3>
              <div className="flex items-end justify-between h-32 gap-2">
                {attendanceData.monthlyChart.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center flex-1">
                    <div className="relative w-full bg-gray-700 rounded-t-lg h-24 flex items-end">
                      <div
                        className="w-full bg-blue-500 rounded-t-lg transition-all duration-500"
                        style={{
                          height: `${Math.min(
                            item.attendancePercentage || 0,
                            100
                          )}%`,
                        }}></div>
                    </div>
                    <div className="text-gray-400 text-xs mt-2">
                      {item.month}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Recent Attendance Bubbles - Similar to mobile app */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">
            Recent Attendance
          </h3>
          <div className="flex justify-between">
            {recentDays.map((day, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                    day.isToday ? "border-blue-500" : "border-transparent"
                  }`}
                  style={{ backgroundColor: day.color }}>
                  <span
                    className={`font-bold text-sm ${
                      day.color === "#FFFFFF" ? "text-gray-900" : "text-white"
                    }`}>
                    {day.dayNum}
                  </span>
                </div>
                <div className="text-gray-400 text-xs mt-2">{day.dayName}</div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-400">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-gray-400">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded"></div>
              <span className="text-gray-400">On Break/Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-gray-400">Rest Day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white rounded border border-gray-600"></div>
              <span className="text-gray-400">Today</span>
            </div>
          </div>
        </div>

        {/* Enhanced Calendar */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-white">
              {selectedStaff
                ? `${selectedStaff.displayName}'s Attendance Calendar - ${months[selectedMonth]} ${selectedYear}`
                : `Your Attendance Calendar - ${months[selectedMonth]} ${selectedYear}`}
            </h3>
            <div className="flex items-center space-x-2">
              {error && (
                <div className="text-red-400 text-sm bg-red-400/10 px-3 py-1 rounded">
                  {error}
                </div>
              )}
              <span className="text-gray-400 text-sm">
                Live: {currentTime.toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-3 mb-6">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-gray-400 font-medium py-3 text-sm">
                {day}
              </div>
            ))}

            {generateCalendar()
              .flat()
              .map((date, index) => (
                <div
                  key={index}
                  className={`
                    h-14 flex items-center justify-center rounded-xl border-2 transition-all duration-200 cursor-pointer
                    ${
                      !date.isCurrentMonth
                        ? "text-gray-600 border-gray-700 bg-gray-700/30"
                        : date.isToday
                        ? "border-blue-500 bg-blue-500/20 text-white shadow-lg shadow-blue-500/25 animate-pulse"
                        : date.isPresent
                        ? "border-green-500 bg-green-500/20 text-white hover:bg-green-500/30"
                        : date.isAbsent
                        ? "border-red-500 bg-red-500/20 text-white hover:bg-red-500/30"
                        : date.isOnBreak
                        ? "border-amber-500 bg-amber-500/20 text-white hover:bg-amber-500/30"
                        : date.isFuture
                        ? "border-gray-600 bg-gray-700/20 text-gray-400"
                        : date.isWeekend
                        ? "border-gray-600 bg-gray-700/50 text-gray-300"
                        : "border-gray-600 bg-gray-700/30 text-white hover:bg-gray-600/30"
                    }
                    transform hover:scale-105
                  `}>
                  <div className="text-center">
                    <div className="font-medium">{date.day}</div>
                    {date.isToday && (
                      <div className="w-1 h-1 bg-blue-400 rounded-full mx-auto mt-1 animate-pulse"></div>
                    )}
                  </div>
                </div>
              ))}
          </div>

          {/* Enhanced Legend */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-600 rounded bg-gray-700/30"></div>
              <span className="text-gray-400">Working Days</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-green-500 bg-green-500/20 rounded"></div>
              <span className="text-green-400">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-red-500 bg-red-500/20 rounded"></div>
              <span className="text-red-400">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-amber-500 bg-amber-500/20 rounded"></div>
              <span className="text-amber-400">On Break/Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 bg-blue-500/20 rounded animate-pulse"></div>
              <span className="text-blue-400">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-400 bg-gray-400/20 rounded"></div>
              <span className="text-gray-400">Future</span>
            </div>
          </div>
        </div>

        {/* Enhanced Attendance Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">
              {selectedStaff
                ? `${selectedStaff.displayName}'s Attendance Summary`
                : "Your Attendance Summary"}
            </h3>
            <p className="text-gray-300 leading-relaxed">
              {attendanceData?.summary || "No summary available"}
            </p>

            {attendanceData?.stats && (
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center bg-gray-700/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">
                    {attendanceData.stats.presentDays || 0}
                  </div>
                  <div className="text-gray-400 text-sm">Present Days</div>
                </div>
                <div className="text-center bg-gray-700/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-400">
                    {attendanceData.stats.absentDays || 0}
                  </div>
                  <div className="text-gray-400 text-sm">Absent Days</div>
                </div>
                <div className="text-center bg-gray-700/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-400">
                    {attendanceData.stats.attendanceRate || 0}%
                  </div>
                  <div className="text-gray-400 text-sm">Attendance Rate</div>
                </div>
                <div className="text-center bg-gray-700/30 rounded-lg p-4">
                  <div className="text-2xl font-bold text-amber-400">
                    {Math.floor(attendanceData.stats.totalBreakTime / 60)}h
                  </div>
                  <div className="text-gray-400 text-sm">Break Time</div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats Card */}
          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
            <h3 className="text-xl font-semibold text-white mb-4">
              Monthly Overview
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Working Days</span>
                <span className="text-white font-semibold">
                  {attendanceData?.stats?.workingDays || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Scheduled Hours</span>
                <span className="text-white font-semibold">
                  {attendanceData?.stats?.totalHours || 0}h
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Productivity Score</span>
                <span className="text-green-400 font-semibold">
                  {attendanceData?.stats?.attendanceRate || 0}%
                </span>
              </div>
              <div className="pt-4 border-t border-blue-500/30">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Overall Performance</span>
                  <span
                    className={`font-semibold ${
                      (attendanceData?.stats?.attendanceRate || 0) >= 90
                        ? "text-green-400"
                        : (attendanceData?.stats?.attendanceRate || 0) >= 80
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}>
                    {(attendanceData?.stats?.attendanceRate || 0) >= 90
                      ? "Excellent"
                      : (attendanceData?.stats?.attendanceRate || 0) >= 80
                      ? "Good"
                      : "Needs Improvement"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Staff Quick View for Admin */}
        {isAdminView && staffData.length > 0 && (
          <div className="mt-8 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">
              Staff Quick Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffData.slice(0, 6).map((staff) => (
                <div
                  key={staff.id}
                  className="bg-gray-700/30 rounded-lg p-4 border border-gray-600 hover:border-blue-500/50 transition-all cursor-pointer"
                  onClick={() => handleStaffSelect(staff)}>
                  <div className="flex items-center space-x-3">
                    <img
                      src={staffUtils.validateProfileImage(
                        staff.profileImage,
                        staff.displayName
                      )}
                      alt={staff.displayName}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <h4 className="text-white font-semibold text-sm">
                        {staff.displayName}
                      </h4>
                      <p className="text-gray-400 text-xs">{staff.position}</p>
                    </div>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        staff.isActive ? "bg-green-500" : "bg-red-500"
                      }`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Real-time Status Footer */}
        <div className="mt-8 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live Data</span>
              </div>
              <span>•</span>
              <span>Auto-refresh every 30 seconds</span>
              <span>•</span>
              <span>
                Last sync:{" "}
                {lastUpdated ? lastUpdated.toLocaleTimeString() : "Never"}
              </span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-blue-400 hover:text-blue-300 disabled:opacity-50">
              {refreshing ? "Refreshing..." : "Refresh Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
