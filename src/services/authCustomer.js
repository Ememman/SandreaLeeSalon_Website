import { authAPI, handleApiError } from "./api.js";
import React from "react";

// Authentication service with complete backend integration
class AuthService {
  constructor() {
    this.currentUser = null;
    this.isInitialized = false;
    this.authListeners = new Set();
    this.init();
  }

  // Initialize auth service
  async init() {
    if (this.isInitialized) return;

    try {
      const token = localStorage.getItem("token");
      if (token) {
        // Validate token by fetching profile
        const isValid = await this.validateToken();
        if (isValid) {
          this.currentUser = this.getCurrentUser();
          console.log("✅ Auth service initialized with valid user");
        } else {
          this.clearAuth();
          console.log("❌ Token validation failed, clearing auth");
        }
      } else {
        console.log("ℹ️ No token found, user not authenticated");
      }
    } catch (error) {
      console.error("❌ Auth initialization error:", error);
      this.clearAuth();
    } finally {
      this.isInitialized = true;
      this.emitAuthChange();
    }
  }

  // Phone OTP Authentication (Primary method)
  async sendPhoneOTP(phoneNumber, role, email = "") {
    try {
      console.log("📱 Sending phone OTP:", { phoneNumber, role, email });

      const response = await authAPI.sendPhoneOTP({
        phoneNumber,
        role,
        email,
      });

      if (response.data && response.data.success) {
        console.log("✅ OTP sent successfully");
        return {
          success: true,
          message: response.data.message,
          channel: response.data.channel,
          expiresIn: response.data.expiresIn,
          otp: response.data.otp,
        };
      }
      return {
        success: false,
        message: response.data?.message || "Failed to send OTP",
      };
    } catch (error) {
      console.error("❌ Send OTP error:", error);
      return handleApiError(error);
    }
  }

  async verifyPhoneOTP(phoneNumber, otp) {
    try {
      console.log("📱 Verifying phone OTP:", { phoneNumber });

      const response = await authAPI.verifyPhoneOTP({
        phoneNumber,
        otp,
      });

      if (response.data && response.data.success) {
        console.log("✅ Phone OTP verified successfully");
        return {
          success: true,
          message: response.data.message,
          nextStep: response.data.nextStep,
          userId: response.data.userId,
        };
      }
      return {
        success: false,
        message: response.data?.message || "OTP verification failed",
      };
    } catch (error) {
      console.error("❌ Verify OTP error:", error);
      return handleApiError(error);
    }
  }

  // Profile Setup
  async setupProfile(userId, username, firstName, profileImage = null) {
    try {
      console.log("👤 Setting up profile:", { userId, username, firstName });

      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("username", username);
      formData.append("firstName", firstName);

      if (profileImage) {
        formData.append("profileImage", profileImage);
        console.log("📸 Profile image included");
      }

      const response = await authAPI.setupProfile(formData);

      if (response.data && response.data.success) {
        console.log("✅ Profile setup completed");
        return {
          success: true,
          message: response.data.message,
          nextStep: response.data.nextStep,
          user: response.data.user,
        };
      }
      return {
        success: false,
        message: response.data?.message || "Profile setup failed",
      };
    } catch (error) {
      console.error("❌ Profile setup error:", error);
      return handleApiError(error);
    }
  }

  // Email Setup & Verification
  async setupEmail(userId, email, password) {
    try {
      console.log("📧 Setting up email:", { userId, email });

      const response = await authAPI.setupEmail({
        userId,
        email,
        password,
      });

      if (response.data && response.data.success) {
        console.log("✅ Email setup completed");
        return {
          success: true,
          message: response.data.message,
          expiresIn: response.data.expiresIn,
          otp: response.data.otp,
        };
      }
      return {
        success: false,
        message: response.data?.message || "Email setup failed",
      };
    } catch (error) {
      console.error("❌ Email setup error:", error);
      return handleApiError(error);
    }
  }

  async verifyEmailOTP(userId, otp) {
    try {
      console.log("📧 Verifying email OTP:", { userId });

      const response = await authAPI.verifyEmailOTP({
        userId,
        otp,
      });

      if (response.data && response.data.success) {
        console.log("✅ Email OTP verified successfully");
        await this.handleAuthSuccess(response.data);
        return {
          success: true,
          message: response.data.message,
          user: response.data.user,
          token: response.data.token,
        };
      }
      return {
        success: false,
        message: response.data?.message || "Email verification failed",
      };
    } catch (error) {
      console.error("❌ Email verification error:", error);
      return handleApiError(error);
    }
  }

  // Traditional Login (for already registered users) - FIXED
  async login(credentials) {
    try {
      const { email, phoneNumber, password, emailOrPhone, role } = credentials;
      console.log("🔑 Login attempt:", {
        emailOrPhone: emailOrPhone || email || phoneNumber,
        role,
      });

      const response = await authAPI.customerLogin({
        email,
        phoneNumber,
        password,
        emailOrPhone,
        role: role || "customer",
      });

      console.log("✅ API Response:", response);

      // Handle the response data directly from axios - FIXED
      if (response.data && response.data.success) {
        console.log("✅ Login successful");
        await this.handleAuthSuccess(response.data);
        return {
          success: true,
          user: response.data.user,
          message: response.data.message,
          redirectTo: response.data.redirectTo,
        };
      } else {
        return {
          success: false,
          message: response.data?.message || "Login failed",
        };
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      const errorData = handleApiError(error);

      if (error.response?.status === 429) {
        return {
          success: false,
          message: errorData.message,
          delayActive: true,
          remainingTime: errorData.remainingTime,
          failedAttempts: errorData.failedAttempts,
          delaySeconds: errorData.delaySeconds,
        };
      }

      return errorData;
    }
  }

  // Staff Login - FIXED
  async staffLogin(credentials) {
    try {
      const { email, phoneNumber, password, emailOrPhone } = credentials;
      console.log("👨‍💼 Staff login attempt:", {
        emailOrPhone: emailOrPhone || email || phoneNumber,
      });

      const response = await authAPI.staffLogin({
        email,
        phoneNumber,
        password,
        emailOrPhone,
        role: "salon_staff",
      });

      console.log("✅ Staff API Response:", response);

      if (response.data && response.data.success) {
        console.log("✅ Staff login successful");
        await this.handleAuthSuccess(response.data);
        return {
          success: true,
          user: response.data.user,
          message: response.data.message,
          redirectTo: response.data.redirectTo,
        };
      }
      return {
        success: false,
        message: response.data?.message || "Staff login failed",
      };
    } catch (error) {
      console.error("❌ Staff login error:", error);
      const errorData = handleApiError(error);

      if (error.response?.status === 429) {
        return {
          success: false,
          message: errorData.message,
          delayActive: true,
          remainingTime: errorData.remainingTime,
          failedAttempts: errorData.failedAttempts,
        };
      }

      return errorData;
    }
  }

  // Admin Login
  async adminLogin(credentials) {
    try {
      console.log("👑 Admin login attempt");

      const response = await authAPI.adminLogin(credentials);

      if (response.data && response.data.success) {
        console.log("✅ Admin login successful");
        await this.handleAuthSuccess(response.data);
        return {
          success: true,
          user: response.data.user,
          message: response.data.message,
          redirectTo: response.data.redirectTo,
        };
      }
      return {
        success: false,
        message: response.data?.message || "Admin login failed",
      };
    } catch (error) {
      console.error("❌ Admin login error:", error);
      return handleApiError(error);
    }
  }

  // Social Authentication (Customer only)
  async socialLogin(provider, token, role = "customer") {
    try {
      console.log("🌐 Social login:", { provider, role });

      let response;

      if (provider === "google") {
        response = await authAPI.googleAuth({ googleToken: token, role });
      } else if (provider === "facebook") {
        response = await authAPI.facebookAuth({ facebookToken: token, role });
      } else {
        throw new Error("Unsupported social provider");
      }

      if (response.data && response.data.success) {
        console.log(`✅ ${provider} login successful`);
        await this.handleAuthSuccess(response.data);
        return {
          success: true,
          user: response.data.user,
          message: response.data.message,
          authProvider: response.data.authProvider,
          redirectTo: response.data.redirectTo,
        };
      }
      return {
        success: false,
        message: response.data?.message || "Social login failed",
      };
    } catch (error) {
      console.error(`❌ ${provider} login error:`, error);
      return handleApiError(error);
    }
  }

  // Guest User System
  async createGuestSession() {
    try {
      console.log("🎭 Creating guest session");

      const response = await authAPI.guestLogin();

      if (response.data && response.data.success) {
        console.log("✅ Guest session created");
        await this.handleAuthSuccess(response.data);
        return {
          success: true,
          user: response.data.user,
          message: response.data.message,
        };
      }
      return {
        success: false,
        message: response.data?.message || "Guest session creation failed",
      };
    } catch (error) {
      console.error("❌ Guest session error:", error);
      return handleApiError(error);
    }
  }

  async convertGuestToUser(userData) {
    try {
      console.log("🔄 Converting guest to user");

      const response = await authAPI.convertGuest(userData);

      if (response.data && response.data.success) {
        console.log("✅ Guest conversion successful");
        await this.handleAuthSuccess(response.data);
        return {
          success: true,
          user: response.data.user,
          message: response.data.message,
        };
      }
      return {
        success: false,
        message: response.data?.message || "Guest conversion failed",
      };
    } catch (error) {
      console.error("❌ Guest conversion error:", error);
      return handleApiError(error);
    }
  }

  // Password Management
  async forgotPassword(identifier) {
    try {
      console.log("🔑 Forgot password request:", { identifier });

      const isEmail = identifier.includes("@");
      const payload = isEmail
        ? { email: identifier }
        : { phoneNumber: identifier };

      const response = await authAPI.forgotPassword(payload);

      if (response.data && response.data.success) {
        console.log("✅ Password reset request sent");
        return {
          success: true,
          message: response.data.message,
          expiresIn: response.data.expiresIn,
          channel: response.data.channel,
          resetToken: response.data.resetToken,
        };
      }
      return {
        success: false,
        message: response.data?.message || "Password reset request failed",
      };
    } catch (error) {
      console.error("❌ Forgot password error:", error);
      const errorData = handleApiError(error);

      if (error.response?.status === 429) {
        return {
          success: false,
          message: errorData.message,
          cooldownRemaining: errorData.cooldownRemaining,
        };
      }

      return errorData;
    }
  }

  async resetPassword(token, newPassword) {
    try {
      console.log("🔑 Resetting password");

      const response = await authAPI.resetPassword({
        token,
        newPassword,
      });

      if (response.data && response.data.success) {
        console.log("✅ Password reset successful");
        return {
          success: true,
          message: response.data.message,
        };
      }
      return {
        success: false,
        message: response.data?.message || "Password reset failed",
      };
    } catch (error) {
      console.error("❌ Reset password error:", error);
      return handleApiError(error);
    }
  }

  async changePassword(currentPassword, newPassword, userId = null) {
    try {
      console.log("🔑 Changing password");

      const response = await authAPI.changePassword({
        currentPassword,
        newPassword,
        userId,
      });

      if (response.data && response.data.success) {
        console.log("✅ Password changed successfully");
        return {
          success: true,
          message: response.data.message,
          passwordStrength: response.data.passwordStrength,
        };
      }
      return {
        success: false,
        message: response.data?.message || "Password change failed",
      };
    } catch (error) {
      console.error("❌ Change password error:", error);
      return handleApiError(error);
    }
  }

  // Profile Management
  async getProfile() {
    try {
      console.log("👤 Fetching user profile");

      const response = await authAPI.getProfile();

      if (response.data && response.data.success) {
        this.currentUser = response.data.user;
        localStorage.setItem("user", JSON.stringify(this.currentUser));
        console.log("✅ Profile fetched successfully");
        return {
          success: true,
          user: this.currentUser,
        };
      }
      return {
        success: false,
        message: response.data?.message || "Failed to get profile",
      };
    } catch (error) {
      console.error("❌ Get profile error:", error);
      return handleApiError(error);
    }
  }

  async updateProfile(profileData) {
    try {
      console.log("👤 Updating profile:", profileData);

      const response = await authAPI.updateProfile(profileData);

      if (response.data && response.data.success) {
        this.currentUser = { ...this.currentUser, ...profileData };
        localStorage.setItem("user", JSON.stringify(this.currentUser));
        console.log("✅ Profile updated successfully");
        return {
          success: true,
          user: this.currentUser,
          message: response.data.message,
        };
      }
      return {
        success: false,
        message: response.data?.message || "Profile update failed",
      };
    } catch (error) {
      console.error("❌ Update profile error:", error);
      return handleApiError(error);
    }
  }

  async uploadProfilePicture(file) {
    try {
      console.log("📸 Uploading profile picture");

      const formData = new FormData();
      formData.append("profileImage", file);

      const response = await authAPI.uploadProfilePicture(formData);

      if (response.data && response.data.success) {
        this.currentUser.profileImage = response.data.user.profileImage;
        localStorage.setItem("user", JSON.stringify(this.currentUser));
        console.log("✅ Profile picture uploaded successfully");
        return {
          success: true,
          user: this.currentUser,
          message: response.data.message,
        };
      }
      return {
        success: false,
        message: response.data?.message || "Profile picture upload failed",
      };
    } catch (error) {
      console.error("❌ Upload profile picture error:", error);
      return handleApiError(error);
    }
  }

  // Username & Password Validation
  async checkUsernameAvailability(username) {
    try {
      console.log("🔍 Checking username availability:", username);

      const response = await authAPI.checkUsername({ username });

      if (response.data && response.data.success) {
        console.log("✅ Username check completed");
        return {
          success: true,
          available: response.data.available,
          message: response.data.message,
          suggestions: response.data.suggestions || [],
        };
      } else {
        return {
          success: false,
          available: false,
          message: response.data?.message,
          suggestions: response.data?.suggestions || [],
        };
      }
    } catch (error) {
      console.error("❌ Username check error:", error);
      return handleApiError(error);
    }
  }

  async checkPasswordStrength(password) {
    try {
      console.log("🔐 Checking password strength");

      const response = await authAPI.checkPasswordStrength({ password });

      if (response.data && response.data.success) {
        return {
          success: true,
          strength: response.data.data.strength,
          color: response.data.data.color,
          score: response.data.data.score,
          isValid: response.data.data.isValid,
          message: response.data.data.message,
          checks: response.data.data.checks,
        };
      }
      return {
        success: false,
        message: response.data?.message || "Password strength check failed",
      };
    } catch (error) {
      console.error("❌ Password strength check error:", error);
      return handleApiError(error);
    }
  }

  async getPasswordRequirements() {
    try {
      console.log("📋 Getting password requirements");

      const response = await authAPI.getPasswordRequirements();

      if (response.data && response.data.success) {
        return {
          success: true,
          requirements: response.data.data,
        };
      }
      return {
        success: false,
        message:
          response.data?.message || "Failed to get password requirements",
      };
    } catch (error) {
      console.error("❌ Get password requirements error:", error);
      return handleApiError(error);
    }
  }

  // Role Management
  async getAvailableRoles() {
    try {
      console.log("🎭 Getting available roles");

      const response = await authAPI.getRoles();

      if (response.data && response.data.success) {
        return {
          success: true,
          roles: response.data.data.roles,
        };
      }
      return {
        success: false,
        message: response.data?.message || "Failed to get available roles",
      };
    } catch (error) {
      console.error("❌ Get roles error:", error);
      return handleApiError(error);
    }
  }

  // Admin Verification
  async verifyAdminAccess() {
    try {
      console.log("👑 Verifying admin access");

      const response = await authAPI.verifyAdmin();

      if (response.data && response.data.success) {
        console.log("✅ Admin access verified");
        return {
          success: true,
          isAdmin: true,
          user: response.data.user,
        };
      }
      return {
        success: false,
        message: response.data?.message || "Admin verification failed",
      };
    } catch (error) {
      console.error("❌ Admin verification error:", error);
      return handleApiError(error);
    }
  }

  // Token & Session Management
  async validateToken() {
    try {
      console.log("🔐 Validating token");

      const response = await authAPI.getProfile();
      if (response.data && response.data.success) {
        this.currentUser = response.data.user;
        localStorage.setItem("user", JSON.stringify(this.currentUser));
        console.log("✅ Token validated successfully");
        return true;
      }
      console.log("❌ Token validation failed - profile fetch unsuccessful");
      return false;
    } catch (error) {
      console.error("❌ Token validation error:", error);
      this.clearAuth();
      return false;
    }
  }

  // FIXED: Enhanced handleAuthSuccess method
  async handleAuthSuccess(authData) {
    const { token, user, message, redirectTo } = authData;

    console.log("✅ Authentication successful, storing user data:", {
      hasToken: !!token,
      hasUser: !!user,
      message,
      redirectTo,
    });

    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      this.currentUser = user;

      this.emitAuthChange();

      console.log("✅ Auth data stored successfully");
    } else {
      console.error("❌ No token received in auth success");
    }
  }

  async logout() {
    try {
      console.log("🚪 Logging out user");
    } catch (error) {
      console.error("❌ Logout error:", error);
    } finally {
      this.clearAuth();
      console.log("✅ User logged out successfully");
    }
  }

  clearAuth() {
    console.log("🧹 Clearing authentication data");

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    this.currentUser = null;
    this.emitAuthChange();
  }

  // Utility Methods
  getCurrentUser() {
    if (this.currentUser) return this.currentUser;

    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && typeof user === "object") {
          return user;
        }
      }
      return null;
    } catch (error) {
      console.error("❌ Error parsing user data:", error);
      this.clearAuth();
      return null;
    }
  }

  isAuthenticated() {
    const token = localStorage.getItem("token");
    const user = this.getCurrentUser();

    if (!token || !user) {
      console.log("🔐 Not authenticated: missing token or user");
      return false;
    }

    if (this.isSessionExpired()) {
      console.log("🔐 Session expired");
      this.clearAuth();
      return false;
    }

    console.log("🔐 User is authenticated");
    return true;
  }

  getUserRole() {
    const user = this.getCurrentUser();
    return user?.role || null;
  }

  isStaff() {
    return this.getUserRole() === "salon_staff";
  }

  isCustomer() {
    return this.getUserRole() === "customer";
  }

  isAdmin() {
    return this.getUserRole() === "admin";
  }

  isGuest() {
    const user = this.getCurrentUser();
    return user?.isGuest || false;
  }

  getToken() {
    return localStorage.getItem("token");
  }

  // Event System for Auth State Changes
  emitAuthChange() {
    const authState = {
      isAuthenticated: this.isAuthenticated(),
      user: this.getCurrentUser(),
      role: this.getUserRole(),
      isGuest: this.isGuest(),
    };

    console.log("🔄 Emitting auth state change:", authState);

    const event = new CustomEvent("authStateChange", {
      detail: authState,
    });
    window.dispatchEvent(event);

    this.authListeners.forEach((listener) => {
      try {
        listener(authState);
      } catch (error) {
        console.error("❌ Error in auth listener:", error);
      }
    });
  }

  onAuthStateChange(callback) {
    console.log("👂 Adding auth state change listener");

    this.authListeners.add(callback);

    return () => {
      console.log("👋 Removing auth state change listener");
      this.authListeners.delete(callback);
    };
  }

  // Session Management
  getSessionExpiry() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp ? new Date(payload.exp * 1000) : null;
    } catch (error) {
      console.error("❌ Error parsing token expiry:", error);
      return null;
    }
  }

  isSessionExpired() {
    const expiry = this.getSessionExpiry();
    const isExpired = expiry ? expiry < new Date() : false;

    if (isExpired) {
      console.log("⏰ Session expired at:", expiry);
    }

    return isExpired;
  }

  // Registration flow helpers
  getRegistrationStep() {
    const user = this.getCurrentUser();
    return user?.registrationStep || "phone_verification";
  }

  isPhoneVerified() {
    const user = this.getCurrentUser();
    return user?.verification?.phoneVerified || false;
  }

  isEmailVerified() {
    const user = this.getCurrentUser();
    return user?.verification?.emailVerified || false;
  }

  // Activity tracking (for admin/staff)
  async updateActivity() {
    if (this.isAdmin() || this.isStaff()) {
      try {
        console.log("📊 Updating user activity");
      } catch (error) {
        console.error("❌ Error updating activity:", error);
      }
    }
  }
}

// Create and export singleton instance
const authService = new AuthService();

// Export the service instance as default
export default authService;

// Export individual functions that safely call the service instance
export const sendPhoneOTP = (...args) => authService.sendPhoneOTP(...args);
export const verifyPhoneOTP = (...args) => authService.verifyPhoneOTP(...args);
export const setupProfile = (...args) => authService.setupProfile(...args);
export const setupEmail = (...args) => authService.setupEmail(...args);
export const verifyEmailOTP = (...args) => authService.verifyEmailOTP(...args);
export const login = (...args) => authService.login(...args);
export const staffLogin = (...args) => authService.staffLogin(...args);
export const adminLogin = (...args) => authService.adminLogin(...args);
export const socialLogin = (...args) => authService.socialLogin(...args);
export const createGuestSession = (...args) =>
  authService.createGuestSession(...args);
export const convertGuestToUser = (...args) =>
  authService.convertGuestToUser(...args);
export const forgotPassword = (...args) => authService.forgotPassword(...args);
export const resetPassword = (...args) => authService.resetPassword(...args);
export const changePassword = (...args) => authService.changePassword(...args);
export const getProfile = (...args) => authService.getProfile(...args);
export const updateProfile = (...args) => authService.updateProfile(...args);
export const uploadProfilePicture = (...args) =>
  authService.uploadProfilePicture(...args);
export const checkUsernameAvailability = (...args) =>
  authService.checkUsernameAvailability(...args);
export const checkPasswordStrength = (...args) =>
  authService.checkPasswordStrength(...args);
export const getPasswordRequirements = (...args) =>
  authService.getPasswordRequirements(...args);
export const getAvailableRoles = (...args) =>
  authService.getAvailableRoles(...args);
export const verifyAdminAccess = (...args) =>
  authService.verifyAdminAccess(...args);
export const logout = (...args) => authService.logout(...args);
export const validateToken = (...args) => authService.validateToken(...args);

// For the utility methods that are used in route components, make them safe:
export const getCurrentUser = () => {
  if (!authService.isInitialized) {
    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      return null;
    }
  }
  return authService.getCurrentUser();
};

export const isAuthenticated = () => {
  if (!authService.isInitialized) {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    return !!(token && userStr);
  }
  return authService.isAuthenticated();
};

export const getUserRole = () => {
  const user = getCurrentUser();
  return user?.role || null;
};

export const isStaff = () => getUserRole() === "salon_staff";
export const isCustomer = () => getUserRole() === "customer";
export const isAdmin = () => getUserRole() === "admin";
export const isGuest = () => {
  const user = getCurrentUser();
  return user?.isGuest || false;
};
export const getToken = () => localStorage.getItem("token");
export const onAuthStateChange = (...args) =>
  authService.onAuthStateChange(...args);
export const getSessionExpiry = () => authService.getSessionExpiry();
export const isSessionExpired = () => authService.isSessionExpired();

// Additional utility exports
export const getRegistrationStep = () => authService.getRegistrationStep();
export const isPhoneVerified = () => authService.isPhoneVerified();
export const isEmailVerified = () => authService.isEmailVerified();
export const updateActivity = () => authService.updateActivity();

// React Hook for authentication state
export const useAuth = () => {
  const [authState, setAuthState] = React.useState({
    isAuthenticated: authService.isAuthenticated(),
    user: authService.getCurrentUser(),
    role: authService.getUserRole(),
    isGuest: authService.isGuest(),
    isLoading: !authService.isInitialized,
  });

  React.useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((newAuthState) => {
      setAuthState((prev) => ({ ...prev, ...newAuthState, isLoading: false }));
    });

    if (authService.isInitialized) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }

    return unsubscribe;
  }, []);

  return {
    ...authState,
    sendPhoneOTP: authService.sendPhoneOTP,
    verifyPhoneOTP: authService.verifyPhoneOTP,
    setupProfile: authService.setupProfile,
    setupEmail: authService.setupEmail,
    verifyEmailOTP: authService.verifyEmailOTP,
    login: authService.login,
    staffLogin: authService.staffLogin,
    adminLogin: authService.adminLogin,
    socialLogin: authService.socialLogin,
    createGuestSession: authService.createGuestSession,
    convertGuestToUser: authService.convertGuestToUser,
    forgotPassword: authService.forgotPassword,
    resetPassword: authService.resetPassword,
    changePassword: authService.changePassword,
    getProfile: authService.getProfile,
    updateProfile: authService.updateProfile,
    uploadProfilePicture: authService.uploadProfilePicture,
    checkUsernameAvailability: authService.checkUsernameAvailability,
    checkPasswordStrength: authService.checkPasswordStrength,
    getPasswordRequirements: authService.getPasswordRequirements,
    getAvailableRoles: authService.getAvailableRoles,
    verifyAdminAccess: authService.verifyAdminAccess,
    logout: authService.logout,
    getRegistrationStep: authService.getRegistrationStep,
    isPhoneVerified: authService.isPhoneVerified,
    isEmailVerified: authService.isEmailVerified,
    updateActivity: authService.updateActivity,
  };
};

// Higher Order Component for protected routes
export const withAuth = (Component) => {
  return function WithAuthComponent(props) {
    const auth = useAuth();
    return React.createElement(Component, { ...props, auth });
  };
};

// Route protection utilities
export const requireAuth = (to, from, next) => {
  if (authService.isAuthenticated()) {
    next();
  } else {
    next("/role-selection");
  }
};

export const requireRole = (role) => (to, from, next) => {
  if (authService.isAuthenticated() && authService.getUserRole() === role) {
    next();
  } else {
    next("/unauthorized");
  }
};

export const requireGuest = (to, from, next) => {
  if (!authService.isAuthenticated() || authService.isGuest()) {
    next();
  } else {
    next("/dashboard");
  }
};

// Registration flow protection
export const requireRegistrationStep = (step) => (to, from, next) => {
  const currentStep = authService.getRegistrationStep();
  if (currentStep === step) {
    next();
  } else {
    const stepRoutes = {
      phone_verification: "/phone-verification",
      profile_setup: "/profile-setup",
      email_setup: "/email-setup",
      completed: "/dashboard",
    };
    next(stepRoutes[currentStep] || "/role-selection");
  }
};

export { handleApiError };
