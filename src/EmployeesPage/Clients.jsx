import React, { useState, useEffect } from "react";
import Sidebar from "../components/layout/SideBar";
import {
  staffApiClient,
  handleApiError,
  staffSession,
  getCurrentUser,
  stylistsManagement,
  staffUtils,
} from "../services/api";

const Clients = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [stats, setStats] = useState({
    upcoming: 0,
    completed: 0,
    cancelled: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [greeting, setGreeting] = useState("");
  const [slideDirection, setSlideDirection] = useState("right");
  const [tabAnimation, setTabAnimation] = useState("");

  // Staff data state
  const [staffMembers, setStaffMembers] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [availableStaff, setAvailableStaff] = useState([]);

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

  // Fetch all staff members
  const fetchStaffMembers = async () => {
    try {
      setStaffLoading(true);
      console.log("🔄 Fetching staff members...");

      const response = await stylistsManagement.getAllStylists();

      if (response.success) {
        setStaffMembers(response.staffMembers || response.stylists || []);
        console.log(
          "✅ Staff members loaded:",
          response.staffMembers?.length || response.stylists?.length
        );

        // Filter available staff
        const available = (
          response.staffMembers ||
          response.stylists ||
          []
        ).filter(
          (staff) => staff.availability === "available" || staff.isActive
        );
        setAvailableStaff(available);
      } else {
        console.error("❌ Failed to fetch staff members:", response.message);
      }
    } catch (error) {
      console.error("❌ Error fetching staff members:", error);
      setError("Failed to load staff information");
    } finally {
      setStaffLoading(false);
    }
  };

  // Enhanced tab change with slide animation
  const handleTabChange = (tab) => {
    const currentIndex = ["upcoming", "completed", "cancelled"].indexOf(
      activeTab
    );
    const newIndex = ["upcoming", "completed", "cancelled"].indexOf(tab);

    setSlideDirection(newIndex > currentIndex ? "left" : "right");
    setTabAnimation("slide-out");

    setTimeout(() => {
      setActiveTab(tab);
      setTabAnimation("slide-in");
    }, 300);
  };

  // ✅ UPDATED: Gamitin ang staffApiClient para kunin ang appointments
  const fetchAppointments = async (isRefresh = false) => {
    if (!currentUser) return;

    try {
      if (!isRefresh) setLoading(true);
      setRefreshing(true);
      setError(null);

      console.log("🔄 Fetching appointments for staff:", currentUser.id);

      // Gamitin ang staffApiClient para kunin ang bookings
      const response = await staffApiClient.getAllBookingsForStaff({
        status: "all",
        page: 1,
        limit: 100,
      });

      console.log("📊 Raw API response:", response);

      let appointmentsData = [];

      if (response.success && response.data) {
        appointmentsData = response.data;

        // I-filter para lang sa current staff member
        const filteredAppointments = appointmentsData.filter((apt) => {
          if (!currentUser?.id) return false;

          // Check kung ang appointment ay para sa current staff member
          const isMyAppointment = apt.selectedStylist?.id === currentUser.id;
          return isMyAppointment;
        });

        appointmentsData = filteredAppointments;
      }

      console.log("📊 Processed appointments data:", appointmentsData);

      const processedData = appointmentsData
        .map((appointment) => {
          const now = new Date();
          const appointmentTime = new Date(appointment.appointmentDate);
          const timeUntil = appointmentTime - now;

          // Real-time status calculation
          let realTimeStatus = appointment.status;
          let timeStatus = "";

          if (
            realTimeStatus === "upcoming" ||
            realTimeStatus === "confirmed" ||
            realTimeStatus === "pending"
          ) {
            if (timeUntil < 0) {
              realTimeStatus = "overdue";
              timeStatus = "Overdue";
            } else if (timeUntil < 1800000) {
              timeStatus = "Starting soon";
            } else if (timeUntil < 3600000) {
              timeStatus = "Within hour";
            } else {
              timeStatus = getTimeUntilAppointment(appointment.appointmentDate);
            }
          }

          return {
            ...appointment,
            realTimeStatus,
            timeStatus,
            isUrgent: timeUntil > 0 && timeUntil < 1800000,
            lastUpdated: new Date().toISOString(),
          };
        })
        .sort((a, b) => {
          if (a.isUrgent && !b.isUrgent) return -1;
          if (!a.isUrgent && b.isUrgent) return 1;
          return new Date(a.appointmentDate) - new Date(b.appointmentDate);
        });

      setAppointments(processedData);
      updateStats(processedData);
      setLastUpdated(new Date());

      console.log("✅ Appointments loaded:", {
        count: processedData.length,
        tab: activeTab,
        staff: currentUser.id,
        appointments: processedData,
      });
    } catch (err) {
      console.error("❌ Error fetching appointments:", err);
      const apiError = handleApiError(err);
      setError(apiError.message || "Failed to load appointments");
      setAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateStats = (appointmentsData) => {
    const upcoming = appointmentsData.filter(
      (apt) =>
        apt.status === "upcoming" ||
        apt.realTimeStatus === "upcoming" ||
        apt.status === "confirmed" ||
        apt.status === "pending"
    ).length;
    const completed = appointmentsData.filter(
      (apt) => apt.status === "completed" || apt.realTimeStatus === "completed"
    ).length;
    const cancelled = appointmentsData.filter(
      (apt) => apt.status === "cancelled" || apt.realTimeStatus === "cancelled"
    ).length;
    setStats({ upcoming, completed, cancelled });
  };

  useEffect(() => {
    if (currentUser) {
      fetchAppointments();
      fetchStaffMembers();
    }
  }, [activeTab, currentUser]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(() => {
        fetchAppointments(true);
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [activeTab, currentUser]);

  const handleRefresh = () => {
    fetchAppointments(true);
    fetchStaffMembers();
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const getTimeUntilAppointment = (dateString) => {
    try {
      const now = new Date();
      const appointmentDate = new Date(dateString);
      const diffMs = appointmentDate - now;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffHours < 1) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} minutes`;
      } else if (diffHours < 24) {
        return `${diffHours} hours`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} days`;
      }
    } catch (error) {
      return "Time calculation error";
    }
  };

  // ✅ UPDATED: Gamitin ang staffApiClient para sa appointment actions
  const handleStartService = async (appointmentId) => {
    try {
      // Update local state immediately for real-time feedback
      setAppointments((prev) =>
        prev.map((apt) =>
          apt._id === appointmentId
            ? {
                ...apt,
                realTimeStatus: "in-progress",
                timeStatus: "In Progress",
              }
            : apt
        )
      );

      // You can add API call here to update the appointment status
      // await staffApiClient.updateAppointmentStatus(appointmentId, { status: "in-progress" });
    } catch (error) {
      console.error("Error starting service:", error);
    }
  };

  const handleCompleteService = async (appointmentId) => {
    try {
      // Gamitin ang staffApiClient para i-complete ang appointment
      const response = await staffApiClient.completeAppointment(appointmentId);

      if (response.success) {
        // Update local state
        setAppointments((prev) =>
          prev.map((apt) =>
            apt._id === appointmentId
              ? {
                  ...apt,
                  realTimeStatus: "completed",
                  timeStatus: "Completed",
                  status: "completed",
                }
              : apt
          )
        );

        console.log("✅ Service completed successfully");
      }
    } catch (error) {
      console.error("Error completing service:", error);
    }
  };

  // ✅ ENHANCED: Render staff information section
  const renderStaffSection = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Salon Staff</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>{availableStaff.length} Available</span>
          <span className="text-gray-600">•</span>
          <span>{staffMembers.length} Total Staff</span>
        </div>
      </div>

      {staffLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-gray-800/50 rounded-lg p-4 animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffMembers.map((staff) => (
            <div
              key={staff.id}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-all duration-200">
              <div className="flex items-center space-x-3">
                <img
                  src={staff.profileImage}
                  alt={staff.displayName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                  onError={(e) => {
                    e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.username}`;
                  }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">
                      {staff.displayName}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        staff.availability === "available"
                          ? "bg-green-500/20 text-green-400"
                          : staff.availability === "busy"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                      }`}>
                      {staff.availability === "available"
                        ? "Available"
                        : staff.availability === "busy"
                        ? "Busy"
                        : "Unavailable"}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{staff.position}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-400">⭐</span>
                      <span className="text-white text-sm">
                        {staff.rating || "4.5"}
                      </span>
                    </div>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-400 text-sm">
                      {staff.experience || "1+ years"}
                    </span>
                  </div>
                </div>
              </div>

              {staff.specialization && staff.specialization.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {staff.specialization.slice(0, 3).map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                      {skill}
                    </span>
                  ))}
                  {staff.specialization.length > 3 && (
                    <span className="px-2 py-1 bg-gray-700 text-gray-400 rounded text-xs">
                      +{staff.specialization.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {staffMembers.length === 0 && !staffLoading && (
        <div className="text-center py-8 text-gray-400">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👥</span>
          </div>
          <p>No staff members found</p>
        </div>
      )}
    </div>
  );

  // ✅ UPDATED: Render client appointments section gamit ang staffApiClient data
  const renderClientAppointments = () => {
    // I-filter ang appointments base sa active tab
    const filteredAppointments = appointments.filter((apt) => {
      if (activeTab === "upcoming") {
        return (
          apt.status === "upcoming" ||
          apt.status === "confirmed" ||
          apt.status === "pending"
        );
      } else if (activeTab === "completed") {
        return apt.status === "completed";
      } else if (activeTab === "cancelled") {
        return apt.status === "cancelled";
      }
      return true;
    });

    if (loading && appointments.length === 0) {
      return (
        <div className="space-y-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                </div>
              </div>
              <div className="h-3 bg-gray-700 rounded w-2/3 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => (
            <div
              key={appointment._id || appointment.id}
              className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border transition-all duration-200 ${
                appointment.isUrgent
                  ? "border-orange-500 hover:border-orange-400 animate-pulse"
                  : "border-gray-700 hover:border-gray-600"
              }`}>
              {/* Appointment Header */}
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4 gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {appointment.customer?.firstName?.charAt(0) || "C"}
                      {appointment.customer?.lastName?.charAt(0) || "L"}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {appointment.customer?.firstName ||
                          appointment.customer?.username ||
                          "Customer"}{" "}
                        {appointment.customer?.lastName || ""}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {formatDate(
                          appointment.appointmentDate ||
                            appointment.preferredDate
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-white font-medium flex items-center space-x-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          appointment.realTimeStatus === "completed" ||
                          appointment.status === "completed"
                            ? "bg-green-500"
                            : appointment.realTimeStatus === "in-progress"
                            ? "bg-yellow-500 animate-pulse"
                            : appointment.isUrgent
                            ? "bg-orange-500 animate-pulse"
                            : "bg-blue-500"
                        }`}></span>
                      <span>{appointment.service?.name || "Hair Service"}</span>
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {appointment.customer?.phoneNumber && (
                        <p className="text-gray-400">
                          📞 {appointment.customer.phoneNumber}
                        </p>
                      )}
                      {appointment.customer?.email && (
                        <p className="text-gray-400">
                          ✉️ {appointment.customer.email}
                        </p>
                      )}
                      {appointment.totalAmount && (
                        <p className="text-green-400">
                          💰 ₱{appointment.totalAmount}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {activeTab === "upcoming" && (
                  <div className="flex flex-col items-end space-y-2">
                    <div
                      className={`text-sm font-medium px-3 py-1 rounded-full ${
                        appointment.isUrgent
                          ? "bg-orange-500/20 text-orange-400 animate-pulse"
                          : "bg-blue-500/20 text-blue-400"
                      }`}>
                      {appointment.timeStatus}
                    </div>
                    {(appointment.realTimeStatus === "upcoming" ||
                      appointment.status === "upcoming" ||
                      appointment.status === "confirmed") && (
                      <div className="text-green-400 text-xs bg-green-500/20 px-2 py-1 rounded">
                        {appointment.status === "confirmed"
                          ? "Confirmed"
                          : "Upcoming"}
                      </div>
                    )}
                    {appointment.realTimeStatus === "in-progress" && (
                      <div className="text-yellow-400 text-xs bg-yellow-500/20 px-2 py-1 rounded animate-pulse">
                        In Progress
                      </div>
                    )}
                    {appointment.status === "completed" && (
                      <div className="text-gray-400 text-xs bg-gray-500/20 px-2 py-1 rounded">
                        Completed
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Service Information */}
              <div className="mb-4">
                {appointment.notes && (
                  <div className="bg-gray-700/30 rounded-lg p-3">
                    <p className="text-gray-300 text-sm">
                      <span className="font-semibold text-white">Notes:</span>{" "}
                      {appointment.notes}
                    </p>
                  </div>
                )}

                {appointment.service && (
                  <div className="mt-2 text-sm text-gray-400">
                    <span className="font-semibold">Service:</span>{" "}
                    {appointment.service.name}
                    {appointment.service.duration &&
                      ` • ${appointment.service.duration} mins`}
                    {appointment.service.category &&
                      ` • ${appointment.service.category}`}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {activeTab === "upcoming" &&
                  (appointment.realTimeStatus === "upcoming" ||
                    appointment.status === "upcoming" ||
                    appointment.status === "confirmed") && (
                    <>
                      <button
                        onClick={() =>
                          handleStartService(appointment._id || appointment.id)
                        }
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105">
                        Start Service
                      </button>
                      <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105">
                        Send Reminder
                      </button>
                    </>
                  )}

                {activeTab === "upcoming" &&
                  appointment.realTimeStatus === "in-progress" && (
                    <button
                      onClick={() =>
                        handleCompleteService(appointment._id || appointment.id)
                      }
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105">
                      Complete Service
                    </button>
                  )}

                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105">
                  View Details
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📅</span>
            </div>
            <p className="text-gray-400 text-lg mb-2">
              No {activeTab} appointments found
            </p>
            <p className="text-gray-500 text-sm">
              {activeTab === "upcoming"
                ? "You don't have any upcoming appointments scheduled."
                : activeTab === "completed"
                ? "No completed appointments to display."
                : "No cancelled appointments to display."}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (loading && appointments.length === 0) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="h-32 bg-gray-800 rounded-lg mb-4"></div>
            <div className="h-32 bg-gray-800 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 p-6 lg:p-8">
        {/* Enhanced Header */}
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
                Manage your client appointments and staff relationships
              </p>
              {lastUpdated && (
                <span className="text-xs text-gray-500">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Stats Overview */}
            <div className="flex gap-4 mt-4 lg:mt-0">
              <div className="bg-blue-600/20 backdrop-blur-sm rounded-lg p-3 border border-blue-500/30 text-center min-w-20">
                <div className="text-white font-bold text-xl">
                  {stats.upcoming}
                </div>
                <div className="text-blue-300 text-sm">Upcoming</div>
              </div>
              <div className="bg-green-600/20 backdrop-blur-sm rounded-lg p-3 border border-green-500/30 text-center min-w-20">
                <div className="text-white font-bold text-xl">
                  {stats.completed}
                </div>
                <div className="text-green-300 text-sm">Completed</div>
              </div>
              <div className="bg-red-600/20 backdrop-blur-sm rounded-lg p-3 border border-red-500/30 text-center min-w-20">
                <div className="text-white font-bold text-xl">
                  {stats.cancelled}
                </div>
                <div className="text-red-300 text-sm">Cancelled</div>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                title="Refresh Data">
                <svg
                  className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
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
              </button>
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

          {/* Staff Section */}
          {renderStaffSection()}

          {/* Enhanced Tabs with Slide Animation Container */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-2 border border-gray-700 overflow-hidden">
            <div className="flex space-x-1 relative">
              {[
                { key: "upcoming", label: "Upcoming", count: stats.upcoming },
                {
                  key: "completed",
                  label: "Completed",
                  count: stats.completed,
                },
                {
                  key: "cancelled",
                  label: "Cancelled",
                  count: stats.cancelled,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`
                    relative flex items-center space-x-2 pb-3 px-4 pt-2 font-medium text-sm border-b-2 transition-all duration-200 rounded-lg z-10
                    ${
                      activeTab === tab.key
                        ? "text-blue-400 border-blue-500"
                        : "text-gray-400 hover:text-gray-300 hover:bg-gray-700/50 border-transparent"
                    }
                  `}>
                  <span>{tab.label}</span>
                  <span
                    className={`
                    px-2 py-1 rounded-full text-xs font-bold transition-all duration-200
                    ${
                      activeTab === tab.key
                        ? "bg-blue-500 text-white"
                        : "bg-gray-700 text-gray-300"
                    }
                  `}>
                    {tab.count}
                  </span>
                </button>
              ))}

              {/* Animated Slider */}
              <div
                className={`absolute bottom-0 h-0.5 bg-blue-500 transition-all duration-300 ease-in-out ${
                  activeTab === "upcoming"
                    ? "left-2 w-24"
                    : activeTab === "completed"
                    ? "left-28 w-28"
                    : "left-60 w-24"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Enhanced Appointments List with Slide Animation */}
        <div className="relative overflow-hidden min-h-96">
          <div
            className={`transition-all duration-500 ease-in-out ${
              tabAnimation === "slide-out"
                ? slideDirection === "right"
                  ? "-translate-x-full opacity-0"
                  : "translate-x-full opacity-0"
                : tabAnimation === "slide-in"
                ? slideDirection === "right"
                  ? "translate-x-0 opacity-100"
                  : "translate-x-0 opacity-100"
                : "translate-x-0 opacity-100"
            }`}>
            {renderClientAppointments()}
          </div>
        </div>

        {/* Real-time Status Footer */}
        <div className="mt-8 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live Data</span>
              </div>
              <span>•</span>
              <span>Auto-refresh every 60 seconds</span>
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

export default Clients;
