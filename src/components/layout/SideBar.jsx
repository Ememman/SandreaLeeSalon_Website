import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Users,
  Clock,
  GraduationCap,
  LogOut,
  ChevronRight,
  User,
  Trophy,
  BarChart3,
} from "lucide-react";
import logo from "../../assets/SandreaLeeSalonLogoCapstone.png";
import "../../styles/SideBar.css";
import {
  staffAPI,
  authAPI,
  staffUtils,
  staffSession,
} from "../../services/api"; // Adjust import path as needed

const navigation = [
  { name: "Reports", href: "/employees/reports", icon: BarChart3 },
  { name: "Attendance", href: "/employees/attendance", icon: Clock },
  { name: "Clients", href: "/employees/clients", icon: User },
  {
    name: "Learning Modules",
    href: "/employees/learning-modules",
    icon: GraduationCap,
  },
];

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real user data
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Method 1: Try to get staff profile first
      let userData = null;

      try {
        const staffResponse = await staffAPI.getProfile();
        if (staffResponse.data && staffResponse.data.success) {
          userData = staffUtils.formatStaffData(staffResponse.data.staff);
        }
      } catch (staffError) {
        console.log("Not a staff user, trying general auth profile...");
      }

      // Method 2: If staff profile fails, try general auth profile
      if (!userData) {
        try {
          const authResponse = await authAPI.getProfile();
          if (authResponse.data && authResponse.data.success) {
            userData = staffUtils.formatStaffData(authResponse.data.user);
          }
        } catch (authError) {
          console.log("Auth profile also failed, using fallback data");
        }
      }

      // Method 3: Use session data as fallback
      if (!userData) {
        const sessionResult = await staffSession.getStaffSession();
        if (sessionResult.isValid && sessionResult.staffData) {
          userData = staffUtils.formatStaffData(sessionResult.staffData);
        }
      }

      // Method 4: Final fallback to localStorage data
      if (!userData) {
        const currentUser = staffSession.getCurrentUser();
        if (currentUser) {
          userData = staffUtils.formatStaffData(currentUser);
        }
      }

      setUser(userData);
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Failed to load user data");
      // Set fallback user data
      setUser(getFallbackUserData());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackUserData = () => {
    // Get user data from localStorage as fallback
    const currentUser = staffSession.getCurrentUser();
    if (currentUser) {
      return staffUtils.formatStaffData(currentUser);
    }

    // Ultimate fallback
    return {
      firstName: "Staff",
      username: "staffuser",
      email: "staff@salon.com",
      role: "salon_staff",
      profileImage: null,
      displayName: "Staff Member",
      position: "Stylist",
    };
  };

  const handleLogout = () => {
    // Clear authentication and redirect
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/role-selection");
  };

  const sidebarWidth = isHovered ? "280px" : "100px";

  // Get profile image URL with proper validation
  const getProfileImageUrl = () => {
    if (!user) {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=staff&backgroundColor=65c9ff,b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    }

    return staffUtils.validateProfileImage(
      user.profileImage,
      user.firstName || user.username
    );
  };

  // Get user display name
  const getDisplayName = () => {
    if (!user) return "Staff Member";
    return (
      user.displayName || user.firstName || user.username || "Staff Member"
    );
  };

  // Get user role/position
  const getUserRole = () => {
    if (!user) return "staff";
    return user.position || user.role || "staff";
  };

  // Get user email
  const getUserEmail = () => {
    if (!user) return "staff@salon.com";
    return user.email || "staff@salon.com";
  };

  if (loading) {
    return (
      <>
        <div
          className="sidebar-container"
          style={{
            width: sidebarWidth,
            borderTopRightRadius: "30px",
            borderBottomRightRadius: "30px",
          }}>
          {/* Loading skeleton */}
          <div className="h-24 flex items-center justify-center border-b border-gray-800/50">
            <div className="w-14 h-14 rounded-lg bg-gray-700 animate-pulse"></div>
          </div>

          {/* Navigation skeleton */}
          <nav className="flex-1 py-6 px-0 space-y-2">
            {navigation.map((item, index) => (
              <div
                key={item.name}
                className={`w-full flex items-center justify-start transition-all duration-300 ${
                  isHovered ? "px-6 py-4" : "px-0 py-4 justify-center"
                }`}>
                <div className="h-6 w-6 bg-gray-700 rounded animate-pulse"></div>
                {isHovered && (
                  <div className="ml-4 flex-1">
                    <div className="h-4 bg-gray-700 rounded animate-pulse w-3/4"></div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* User section skeleton */}
          <div
            className={`border-t border-gray-800/50 ${
              isHovered ? "p-6" : "p-4"
            }`}>
            <div
              className={`flex items-center ${
                isHovered ? "mb-4" : "justify-center"
              }`}>
              <div className="w-10 h-10 rounded-full bg-gray-700 animate-pulse"></div>
              {isHovered && (
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-700 rounded animate-pulse w-20 mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded animate-pulse w-24"></div>
                </div>
              )}
            </div>
            <div className="w-full h-10 bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Spacer div */}
        <div
          className="transition-all duration-500 ease-out"
          style={{ width: sidebarWidth }}
        />
      </>
    );
  }

  return (
    <>
      {/* Sidebar */}
      <div
        className="sidebar-container"
        style={{
          width: sidebarWidth,
          borderTopRightRadius: "30px",
          borderBottomRightRadius: "30px",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}>
        {/* Logo Section */}
        <div className="h-24 flex items-center justify-center border-b border-gray-800/50 transition-all duration-500">
          <div className="flex items-center justify-center space-x-3 relative">
            <img
              src={logo}
              alt="Salon Logo"
              className="w-14 h-14 rounded-lg object-cover transition-transform duration-500 hover:scale-105"
            />
            {isHovered && (
              <p
                className="text-[#619AE4] text-3xl font-semibold relative top-1 transition-all duration-500 ease-out animate-fadeIn"
                style={{ fontFamily: "'Tenali Ramakrishna', sans-serif" }}>
                SALON
              </p>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-0 space-y-2 overflow-y-auto scrollbar-hide">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.href);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center justify-start transition-all duration-300 group relative overflow-hidden
                  ${isHovered ? "px-6 py-4" : "px-0 py-4 justify-center"}
                  ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-l-4 border-blue-500 text-white"
                      : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/30"
                  }
                `}>
                <Icon
                  className={`h-6 w-6 transition-all duration-300 ${
                    isActive
                      ? "text-blue-400 scale-110"
                      : "group-hover:text-blue-400 group-hover:scale-110"
                  } flex-shrink-0`}
                />

                {isHovered && (
                  <div className="flex items-center justify-between flex-1 ml-4 transition-all duration-300 ease-out opacity-0 animate-slideInRight">
                    <span
                      className={`text-sm font-medium whitespace-nowrap transition-colors duration-300 ${
                        isActive
                          ? "text-white"
                          : "text-gray-400 group-hover:text-gray-200"
                      }`}>
                      {item.name}
                    </span>
                    {isActive && (
                      <ChevronRight className="h-4 w-4 text-blue-400 transition-transform duration-300 hover:translate-x-1" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        <div
          className={`border-t border-gray-800/50 transition-all duration-500 ${
            isHovered ? "p-6" : "p-4"
          }`}>
          <div
            className={`flex items-center transition-all duration-500 ${
              isHovered ? "mb-4" : "justify-center"
            }`}>
            <img
              src={getProfileImageUrl()}
              alt={getDisplayName()}
              className="w-10 h-10 rounded-full border-2 border-blue-500/50 flex-shrink-0 transition-all duration-500 hover:border-blue-400 hover:scale-105 object-cover"
              onError={(e) => {
                // Fallback if image fails to load
                e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                  getDisplayName()
                )}&backgroundColor=65c9ff,b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
              }}
            />
            {isHovered && (
              <div className="flex-1 ml-4 min-w-0 transition-all duration-500 ease-out opacity-0 animate-fadeIn">
                <div className="flex items-baseline space-x-2">
                  <p className="text-white font-semibold text-sm truncate">
                    {getDisplayName()}
                  </p>
                  <p className="text-gray-400 text-xs capitalize">
                    {getUserRole()}
                  </p>
                </div>
                <p className="text-gray-500 text-xs truncate mt-1">
                  {getUserEmail()}
                </p>
                {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center justify-center transition-all duration-300 group
              ${isHovered ? "px-4 py-3" : "p-3"}
              border border-red-500/30 hover:border-red-500/60 hover:bg-red-900/20 rounded-lg
              text-red-400 hover:text-red-300 text-sm font-medium
              hover:scale-105 active:scale-95
            `}>
            <LogOut className="h-4 w-4 flex-shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
            {isHovered && (
              <span className="ml-3 whitespace-nowrap transition-all duration-300 opacity-0 animate-fadeIn">
                LOG OUT
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Spacer div to prevent content overlap - matches sidebar width */}
      <div
        className="transition-all duration-500 ease-out"
        style={{ width: sidebarWidth }}
      />
    </>
  );
};

export default Sidebar;
