import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ModelLogin from "../../assets/ModelLogin.png";
import SalonLogo from "../../assets/SandreaLeeSalonLogoCapstone.png";
import authService, {
  handleApiError,
  isStaff,
  setToken,
  setUser,
} from "../../services/api";
import "../../styles/StaffAuth.css";

// Helper function - Module level
const isAuthenticated = () => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("authToken");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  return !!(token && user);
};

// Icon components for password visibility toggle
const EyeIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 5C5 5 1 12 1 12s4 7 11 7 11-7 11-7-4-7-11-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"
      fill="currentColor"
    />
    <circle cx="12" cy="12" r="2.5" fill="currentColor" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 3l18 18M9.88 9.88A3 3 0 0012 9c1.66 0 3 1.34 3 3 0 .88-.36 1.68-.93 2.25m3.5-3.5A9 9 0 0123 12c-4 7-11 7-11 7s-2.08-.27-4.08-.87m-2.58-3.58A9.001 9.001 0 0112 5c7 0 11 7 11 7-1.31 2.18-3 4-5 5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const StaffAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Form states
  const [loginForm, setLoginForm] = useState({
    emailOrPhone: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error"); // 'error' or 'success'

  // Floating label states
  const [focusedFields, setFocusedFields] = useState({
    loginEmailOrPhone: false,
    loginPassword: false,
  });

  useEffect(() => {
    // Redirect if already authenticated as staff
    if (isStaff() && isAuthenticated()) {
      console.log(
        "✅ Staff already authenticated, redirecting to /employees/reports"
      );
      navigate("/employees/reports", { replace: true });
      return;
    }

    // Get selected role from navigation state
    if (location.state?.selectedRole) {
      setSelectedRole(location.state.selectedRole);
    }

    // Check screen size
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsTablet(width > 768 && width <= 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, [location, navigate]);

  const handleFocus = (fieldName) => {
    setFocusedFields((prev) => ({ ...prev, [fieldName]: true }));
  };

  const handleBlur = (fieldName, value) => {
    if (!value) {
      setFocusedFields((prev) => ({ ...prev, [fieldName]: false }));
    }
  };

  const handleLoginChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLoginForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear errors when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    // Clear general message when user starts typing
    if (message) {
      setMessage("");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateLoginForm = () => {
    const newErrors = {};

    if (!loginForm.emailOrPhone.trim()) {
      newErrors.emailOrPhone = "Email or phone number is required";
    } else if (!isValidEmailOrPhone(loginForm.emailOrPhone)) {
      newErrors.emailOrPhone = "Please enter a valid email or phone number";
    }

    if (!loginForm.password) {
      newErrors.password = "Password is required";
    } else if (loginForm.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper function to validate email or phone
  const isValidEmailOrPhone = (input) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[\d\s-()]{10,}$/;
    return emailRegex.test(input) || phoneRegex.test(input.replace(/\s/g, ""));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!validateLoginForm()) return;

    setLoading(true);

    try {
      console.log("🔐 Attempting staff login...");

      const credentials = {
        emailOrPhone: loginForm.emailOrPhone.trim(),
        password: loginForm.password,
        role: "salon_staff",
      };

      const result = await authService.auth.staffLogin(credentials);
      console.log("✅ Login response:", result);

      if (result?.data?.success) {
        console.log("🎉 Staff login successful!");
        setMessageType("success");
        setMessage("✓ Staff login successful! Redirecting to Reports...");

        // Store authentication
        if (result.data.token) {
          setToken(result.data.token);
          console.log("✅ Token stored");
        }
        if (result.data.user) {
          setUser(result.data.user);
          console.log("✅ User stored:", result.data.user);
        }

        // Store remember me preference
        if (loginForm.rememberMe) {
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("rememberMe");
        }

        // Dispatch auth event
        window.dispatchEvent(
          new CustomEvent("authStateChange", {
            detail: { isAuthenticated: true, user: result.data.user },
          })
        );

        // Navigation with proper timing
        setTimeout(() => {
          console.log("🔄 Navigating to /employees/reports");
          navigate("/employees/reports", {
            replace: true,
            state: { from: "staff-login" },
          });
        }, 1000);
      } else {
        console.warn("❌ Login failed:", result?.data?.message);
        setMessageType("error");
        setMessage(
          result?.data?.message ||
            "Login failed. Please check your credentials."
        );
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      setMessageType("error");

      if (error.response) {
        const errorData = handleApiError(error);

        if (error.response.status === 401) {
          setMessage(
            "Invalid credentials. Please check your email/phone and password."
          );
        } else if (error.response.status === 403) {
          setMessage(
            "Access denied. This account doesn't have staff privileges."
          );
        } else if (error.response.status === 423) {
          setMessage(
            "Account temporarily locked. Please contact administrator."
          );
        } else {
          setMessage(
            errorData?.message || `Login failed: ${error.response.status}`
          );
        }
      } else if (error.request) {
        console.error("Network error:", error.request);
        setMessage(
          "Network error. Please check your connection and try again."
        );
      } else {
        console.error("Unexpected error:", error.message);
        setMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/role-selection", {
      state: { from: "staff-auth" },
    });
  };

  const handleForgotPassword = async () => {
    if (!loginForm.emailOrPhone) {
      setMessageType("error");
      setMessage("Please enter your email or phone number first");
      return;
    }

    if (!isValidEmailOrPhone(loginForm.emailOrPhone)) {
      setMessageType("error");
      setMessage("Please enter a valid email or phone number");
      return;
    }

    setLoading(true);
    try {
      const result = await authService.auth.forgotPassword({
        emailOrPhone: loginForm.emailOrPhone,
        role: "salon_staff",
      });

      if (result?.data?.success) {
        setMessageType("success");
        setMessage(
          "✓ Password reset instructions sent to your registered email!"
        );
      } else {
        setMessageType("error");
        setMessage(
          result?.data?.message || "Failed to send reset instructions"
        );
      }
    } catch (error) {
      const errorData = handleApiError(error);
      setMessageType("error");
      setMessage(
        errorData?.message || "Failed to process password reset request"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleContactAdmin = () => {
    setMessageType("error");
    setMessage(
      "Please contact your administrator at admin@sandrealessalon.com or call (555) 123-4567 for staff account assistance."
    );
  };

  // Clear message after delay
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="staff-auth-container">
      {/* Back Button */}
      <button
        className="staff-back-button"
        onClick={handleBack}
        disabled={loading}
        aria-label="Back to role selection">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M19 12H5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 19L5 12L12 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {!isMobile && <span className="staff-back-text">Back to Roles</span>}
      </button>

      <div className="staff-auth-card">
        <div className="staff-auth-content">
          {/* Left Panel - Main Content */}
          <div className="staff-auth-left-panel">
            {/* Mobile Header Logo */}
            {isMobile && (
              <div className="staff-mobile-logo">
                <img
                  src={SalonLogo}
                  alt="Sandrea Lee Salon Logo"
                  className="staff-salon-logo-mobile"
                  loading="lazy"
                />
              </div>
            )}

            {/* Main Header Section */}
            <div className="staff-auth-header">
              {!isMobile && (
                <div className="staff-logo-section">
                  <img
                    src={SalonLogo}
                    alt="Sandrea Lee Salon Logo"
                    className="staff-salon-logo"
                    loading="lazy"
                  />
                </div>
              )}

              <h1 className="staff-auth-title">Staff Portal</h1>
              <p className="staff-auth-subtitle">
                Access reports, appointment management, and training modules
              </p>
            </div>

            {/* Notice Banner */}
            <div className="staff-notice-banner">
              <div className="staff-notice-icon">💼</div>
              <div className="staff-notice-content">
                <h3>Staff Account Access</h3>
                <p>
                  Your account is provided by administrator. Contact admin for
                  credentials.
                </p>
              </div>
            </div>

            {/* Message Display */}
            {message && (
              <div
                className={`staff-message ${messageType}`}
                role="alert"
                aria-live="polite">
                {message}
              </div>
            )}

            {/* Features Section */}
            <div className="staff-features-section">
              {!isMobile || window.innerWidth > 375 ? (
                <div className="staff-privilege-list">
                  <h4>Staff Account Features</h4>
                  <div className="staff-features-grid">
                    <div className="staff-feature-item">
                      <span className="staff-feature-icon">📊</span>
                      <span>Reports & Analytics</span>
                    </div>
                    <div className="staff-feature-item">
                      <span className="staff-feature-icon">📅</span>
                      <span>Appointment Management</span>
                    </div>
                    <div className="staff-feature-item">
                      <span className="staff-feature-icon">👥</span>
                      <span>Client Booking System</span>
                    </div>
                    <div className="staff-feature-item">
                      <span className="staff-feature-icon">🎓</span>
                      <span>Training Modules</span>
                    </div>
                    <div className="staff-feature-item">
                      <span className="staff-feature-icon">📈</span>
                      <span>Performance Dashboard</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="staff-privilege-list-mobile">
                  <p>
                    <strong>Features:</strong> Reports • Appointments • Training
                  </p>
                </div>
              )}
            </div>

            {/* Login Form */}
            <form className="staff-auth-form" onSubmit={handleLogin}>
              <div className="staff-form-section">
                {/* Email/Phone Input */}
                <div className="staff-floating-label-group">
                  <div
                    className={`staff-floating-input-container ${
                      errors.emailOrPhone ? "error" : ""
                    } ${focusedFields.loginEmailOrPhone ? "focused" : ""}`}>
                    <input
                      type="text"
                      id="loginEmailOrPhone"
                      name="emailOrPhone"
                      value={loginForm.emailOrPhone}
                      onChange={handleLoginChange}
                      onFocus={() => handleFocus("loginEmailOrPhone")}
                      onBlur={(e) =>
                        handleBlur("loginEmailOrPhone", e.target.value)
                      }
                      className="staff-floating-input"
                      placeholder=" "
                      disabled={loading}
                      autoComplete="email"
                      aria-label="Email or phone number"
                      aria-invalid={!!errors.emailOrPhone}
                    />
                    <label
                      htmlFor="loginEmailOrPhone"
                      className={`staff-floating-label ${
                        focusedFields.loginEmailOrPhone ||
                        loginForm.emailOrPhone
                          ? "floating"
                          : ""
                      }`}>
                      Email or Phone Number
                      <span className="staff-required-asterisk">*</span>
                    </label>
                  </div>
                  {errors.emailOrPhone && (
                    <span className="staff-error-text" role="alert">
                      {errors.emailOrPhone}
                    </span>
                  )}
                </div>

                {/* Password Input with Toggle */}
                <div className="staff-floating-label-group">
                  <div
                    className={`staff-floating-input-container ${
                      errors.password ? "error" : ""
                    } ${focusedFields.loginPassword ? "focused" : ""}`}>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="loginPassword"
                      name="password"
                      value={loginForm.password}
                      onChange={handleLoginChange}
                      onFocus={() => handleFocus("loginPassword")}
                      onBlur={(e) =>
                        handleBlur("loginPassword", e.target.value)
                      }
                      className="staff-floating-input"
                      placeholder=" "
                      disabled={loading}
                      autoComplete="current-password"
                      aria-label="Password"
                      aria-invalid={!!errors.password}
                    />
                    <label
                      htmlFor="loginPassword"
                      className={`staff-floating-label ${
                        focusedFields.loginPassword || loginForm.password
                          ? "floating"
                          : ""
                      }`}>
                      Password<span className="staff-required-asterisk">*</span>
                    </label>

                    {/* Password Visibility Toggle Button */}
                    <button
                      type="button"
                      className="staff-password-toggle"
                      onClick={togglePasswordVisibility}
                      disabled={loading || !loginForm.password}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      aria-pressed={showPassword}
                      title={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="staff-error-text" role="alert">
                      {errors.password}
                    </span>
                  )}
                  <div className="staff-password-hint">
                    Provided by administrator
                  </div>
                </div>
              </div>

              <div className="staff-form-options">
                <label className="staff-checkbox-label">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={loginForm.rememberMe}
                    onChange={handleLoginChange}
                    disabled={loading}
                    aria-label="Remember this device"
                  />
                  <span className="staff-checkmark"></span>
                  {isMobile ? "Remember" : "Remember this device"}
                </label>

                <button
                  type="button"
                  className="staff-forgot-password"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  aria-label="Reset your password">
                  {isMobile ? "Forgot?" : "Forgot Password?"}
                </button>
              </div>

              <button
                type="submit"
                className={`staff-submit-button ${loading ? "loading" : ""}`}
                disabled={loading}
                aria-busy={loading}>
                {loading ? (
                  <>
                    <div className="staff-button-spinner"></div>
                    {!isMobile && "Logging in..."}
                  </>
                ) : isMobile ? (
                  "Staff Login"
                ) : (
                  "Login to Reports Portal"
                )}
              </button>
            </form>

            {/* Help Section */}
            <div className="staff-help-section">
              <div className="staff-help-content">
                <p>Don't have staff account credentials?</p>
                <button
                  type="button"
                  className="staff-contact-admin-button"
                  onClick={handleContactAdmin}
                  disabled={loading}>
                  {isMobile ? "Contact Admin" : "Contact Administrator"}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Visual Content with Optimized Image */}
          {!isMobile && !isTablet && (
            <div className="staff-auth-right-panel">
              <div className="staff-image-container">
                {!imageLoaded && <div className="staff-image-skeleton"></div>}
                <img
                  src={ModelLogin}
                  alt="Salon Professional"
                  className={`staff-model-image ${imageLoaded ? "loaded" : ""}`}
                  loading="lazy"
                  onLoad={() => setImageLoaded(true)}
                  style={{
                    objectFit: "cover",
                    objectPosition: "center",
                  }}
                />
                <div className="staff-image-overlay">
                  <div className="staff-overlay-content">
                    <h3>Professional Staff Portal</h3>
                    <p>
                      Access reports and analytics to track performance, manage
                      appointments, and deliver exceptional service
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffAuth;
