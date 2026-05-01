import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import authService, {
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
  getUserRole,
  isStaff,
  isCustomer,
  isAdmin,
  isGuest,
  onAuthStateChange,
  sendPhoneOTP,
  verifyPhoneOTP,
  setupProfile,
  setupEmail,
  verifyEmailOTP,
  staffLogin,
  adminLogin,
  socialLogin,
  createGuestSession,
  convertGuestToUser,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  updateProfile,
  uploadProfilePicture,
  checkUsernameAvailability,
  checkPasswordStrength,
  getPasswordRequirements,
  getAvailableRoles,
  verifyAdminAccess,
} from "../utils/authUtils";

/**
 * Comprehensive authentication hook for managing user authentication state
 * Integrates with your existing authCustomer.js service
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);

        // Check if user is already authenticated
        if (isAuthenticated()) {
          const currentUser = getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            console.log("✅ User authenticated:", currentUser);
          } else {
            // Try to fetch fresh profile data
            try {
              const profileResult = await getProfile();
              if (profileResult.success) {
                setUser(profileResult.user);
              } else {
                console.warn("❌ Failed to fetch user profile");
              }
            } catch (profileError) {
              console.error("❌ Error fetching profile:", profileError);
            }
          }
        } else {
          console.log("ℹ️ No authenticated user found");
        }
      } catch (error) {
        console.error("❌ Auth initialization error:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange((authState) => {
      console.log("🔄 Auth state changed:", authState);
      setUser(authState.user);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Authentication methods
  const authLogin = useCallback(
    async (credentials) => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await login(credentials);

        if (result.success) {
          setUser(result.user);

          // Redirect based on user role
          const redirectPath = getDefaultRedirect(result.user.role);
          if (redirectPath) {
            navigate(redirectPath);
          }

          return { success: true, user: result.user };
        } else {
          setError(result.message);
          return { success: false, error: result.message };
        }
      } catch (error) {
        console.error("❌ Login error:", error);
        setError(error.message);
        return { success: false, error: error.message };
      } finally {
        setIsLoading(false);
      }
    },
    [navigate]
  );

  const authLogout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await logout();
      setUser(null);

      // Navigate to login/role selection
      navigate("/role-selection");

      return { success: true };
    } catch (error) {
      console.error("❌ Logout error:", error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const refreshUser = useCallback(async () => {
    try {
      const result = await getProfile();
      if (result.success) {
        setUser(result.user);
        return { success: true, user: result.user };
      } else {
        setError(result.message);
        return { success: false, error: result.message };
      }
    } catch (error) {
      console.error("❌ Refresh user error:", error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  }, []);

  const updateUserProfile = useCallback(async (profileData) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await updateProfile(profileData);

      if (result.success) {
        setUser(result.user);
        return { success: true, user: result.user };
      } else {
        setError(result.message);
        return { success: false, error: result.message };
      }
    } catch (error) {
      console.error("❌ Update profile error:", error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadUserProfileImage = useCallback(async (file) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await uploadProfilePicture(file);

      if (result.success) {
        setUser(result.user);
        return { success: true, user: result.user };
      } else {
        setError(result.message);
        return { success: false, error: result.message };
      }
    } catch (error) {
      console.error("❌ Upload profile image error:", error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Enhanced authentication status checks
  const checkAuthStatus = useCallback(() => {
    return {
      isAuthenticated: isAuthenticated(),
      isStaff: isStaff(),
      isCustomer: isCustomer(),
      isAdmin: isAdmin(),
      isGuest: isGuest(),
      userRole: getUserRole(),
    };
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Return the auth interface
  return {
    // State
    user,
    isLoading,
    error,

    // Authentication status
    isAuthenticated: isAuthenticated(),
    isStaff: isStaff(),
    isCustomer: isCustomer(),
    isAdmin: isAdmin(),
    isGuest: isGuest(),
    userRole: getUserRole(),

    // Core authentication methods
    login: authLogin,
    logout: authLogout,
    refreshUser,

    // Profile management
    updateProfile: updateUserProfile,
    uploadProfileImage: uploadUserProfileImage,

    // Enhanced authentication methods from authCustomer
    sendPhoneOTP,
    verifyPhoneOTP,
    setupProfile,
    setupEmail,
    verifyEmailOTP,
    staffLogin,
    adminLogin,
    socialLogin,
    createGuestSession,
    convertGuestToUser,
    forgotPassword,
    resetPassword,
    changePassword,
    checkUsernameAvailability,
    checkPasswordStrength,
    getPasswordRequirements,
    getAvailableRoles,
    verifyAdminAccess,

    // Utility methods
    checkAuthStatus,
    clearError,

    // Quick access to user properties (with fallbacks for your sidebar)
    getUserDisplayName: () => {
      return user?.firstName || user?.username || "Staff Member";
    },

    getUserEmail: () => {
      return user?.email || "rogeruegame.com";
    },

    getUserProfileImage: () => {
      return (
        user?.profileImage ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${
          user?.username || "user"
        }`
      );
    },

    getUserRoleDisplay: () => {
      return user?.role || "staff";
    },
  };
};

// Helper function to determine default redirect based on role
const getDefaultRedirect = (role) => {
  switch (role) {
    case "salon_staff":
    case "admin":
      return "/staff/dashboard";
    case "customer":
      return "/customer/dashboard";
    default:
      return "/";
  }
};

// Higher Order Component for protecting routes
export const withAuth = (Component) => {
  return function WithAuthComponent(props) {
    const auth = useAuth();
    return <Component {...props} auth={auth} />;
  };
};

// Hook for route protection
export const useRequireAuth = (
  requiredRole = null,
  redirectPath = "/role-selection"
) => {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading) {
      if (!auth.isAuthenticated) {
        // Not authenticated, redirect to login
        navigate(redirectPath);
      } else if (requiredRole && auth.userRole !== requiredRole) {
        // Wrong role, redirect to unauthorized or dashboard
        navigate("/unauthorized");
      }
    }
  }, [
    auth.isAuthenticated,
    auth.userRole,
    auth.isLoading,
    requiredRole,
    navigate,
    redirectPath,
  ]);

  return auth;
};

// Hook for guest-only routes
export const useRequireGuest = (redirectPath = "/dashboard") => {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated && !auth.isGuest) {
      navigate(redirectPath);
    }
  }, [
    auth.isAuthenticated,
    auth.isGuest,
    auth.isLoading,
    navigate,
    redirectPath,
  ]);

  return auth;
};

export default useAuth;
