import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ModelLogin from "../../assets/ModelLogin.png";
import SalonLogo from "../../assets/SandreaLeeSalonLogoCapstone.png";
import GoogleIcon from "../../assets/icons/google.png";
import FacebookIcon from "../../assets/icons/Facebook.png"; // Fixed path
import authService, {
  login,
  staffLogin,
  forgotPassword,
} from "../../services/authCustomer";
import { handleApiError } from "../../services/api";
import "../../styles/CustomerAuth.css";

const CustomerAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [loginForm, setLoginForm] = useState({
    emailOrPhone: "",
    password: "",
    rememberMe: false,
  });

  const [signupForm, setSignupForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  // Floating label states
  const [focusedFields, setFocusedFields] = useState({
    loginEmailOrPhone: false,
    loginPassword: false,
    signupFirstName: false,
    signupLastName: false,
    signupEmail: false,
    signupPhone: false,
    signupPassword: false,
    signupConfirmPassword: false,
  });

  useEffect(() => {
    // Get selected role from navigation state
    if (location.state?.selectedRole) {
      setSelectedRole(location.state.selectedRole);
    } else {
      // Default to customer if no role specified
      setSelectedRole({ id: "customer", name: "Customer" });
    }

    // Check screen size
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    // Load Urbanist font
    const font = new FontFace(
      "Urbanist",
      "url(../assets/fonts/Urbanist-VariableFont_wght.ttf)"
    );

    font
      .load()
      .then((loadedFont) => {
        document.fonts.add(loadedFont);
        document.body.style.fontFamily = "Urbanist, sans-serif";
      })
      .catch((error) => {
        console.error("Error loading Urbanist font:", error);
      });

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, [location]);

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
  };

  const handleSignupChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSignupForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear errors when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const validateLoginForm = () => {
    const newErrors = {};

    if (!loginForm.emailOrPhone.trim()) {
      newErrors.emailOrPhone = "Email or phone number is required";
    }

    if (!loginForm.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignupForm = () => {
    const newErrors = {};

    if (!signupForm.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!signupForm.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!signupForm.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(signupForm.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!signupForm.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^0\d{10}$/.test(signupForm.phone)) {
      newErrors.phone = "Phone must start with 0 and be 11 digits";
    }

    if (!signupForm.password) {
      newErrors.password = "Password is required";
    } else if (signupForm.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!signupForm.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (signupForm.password !== signupForm.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!signupForm.acceptTerms) {
      newErrors.acceptTerms = "You must accept the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!validateLoginForm()) return;

    setLoading(true);

    try {
      let result;
      const credentials = {
        emailOrPhone: loginForm.emailOrPhone,
        password: loginForm.password,
        role: selectedRole?.id,
      };

      // Use the appropriate login function based on role
      if (selectedRole?.id === "salon_staff") {
        result = await staffLogin(credentials);
      } else {
        result = await login(credentials);
      }

      // Handle the response - FIXED: Check for success property directly
      if (result && result.success) {
        setMessage(
          result.message || "Login successful! Redirecting to home..."
        );

        // Redirect to home page
        setTimeout(() => {
          navigate("/"); // Redirect to Home.jsx
        }, 1500);
      } else {
        // Handle specific error cases
        if (result && result.delayActive) {
          setMessage(
            `${result.message} Please wait ${
              result.remainingTime || result.delaySeconds
            } seconds before trying again.`
          );
        } else {
          setMessage(
            result?.message || "Login failed. Please check your credentials."
          );
        }
      }
    } catch (error) {
      console.error("❌ Login error:", error);

      // Enhanced error handling
      const errorData = handleApiError(error);

      if (errorData.isRateLimit) {
        setMessage(
          `Too many attempts. Please wait ${
            errorData.remainingTime || 30
          } seconds before trying again.`
        );
      } else if (error.response) {
        // Server responded with error status
        setMessage(
          errorData.message || `Login failed: ${error.response.status}`
        );
      } else if (error.request) {
        // Network error
        setMessage(
          "Network error. Please check your connection and try again."
        );
      } else {
        // Other errors
        setMessage(
          errorData.message || "An unexpected error occurred. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!validateSignupForm()) return;

    setLoading(true);

    try {
      // For the new OTP-based registration flow, we start with phone verification
      console.log("📱 Starting OTP registration flow");

      // First, send phone OTP
      const otpResult = await authService.sendPhoneOTP(
        signupForm.phone,
        selectedRole?.id || "customer",
        signupForm.email
      );

      if (otpResult.success) {
        setMessage(
          "Verification code sent to your phone! Check terminal for OTP."
        );

        // Store user data for the next steps
        const userData = {
          phoneNumber: signupForm.phone,
          email: signupForm.email,
          firstName: signupForm.firstName,
          lastName: signupForm.lastName,
          password: signupForm.password,
          role: selectedRole?.id || "customer",
        };

        // Navigate to OTP verification with user data
        setTimeout(() => {
          navigate("/phone-verification", {
            state: {
              phoneNumber: signupForm.phone,
              userData: userData,
              otp: otpResult.otp,
              role: selectedRole?.id,
            },
          });
        }, 2000);
      } else {
        setMessage(otpResult.message || "Failed to send verification code");
      }
    } catch (error) {
      console.error("❌ Signup error:", error);
      const errorData = handleApiError(error);
      setMessage(errorData.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    if (selectedRole?.id === "salon_staff") {
      setMessage("Social login is not available for staff accounts");
      return;
    }

    setLoading(true);
    try {
      setMessage(`Redirecting to ${provider} authentication...`);

      // TODO: Implement actual social login
      setTimeout(() => {
        setMessage(`${provider} authentication is not yet implemented`);
        setLoading(false);
      }, 1000);
    } catch (error) {
      setMessage(`${provider} login failed`);
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/role-selection");
  };

  const handleForgotPassword = async () => {
    if (!loginForm.emailOrPhone) {
      setMessage("Please enter your email or phone number first");
      return;
    }

    setLoading(true);
    try {
      const result = await forgotPassword(loginForm.emailOrPhone);

      if (result.success) {
        setMessage(result.message || "Password reset instructions sent!");

        // If we have the OTP in development, show it
        if (result.resetToken) {
          setMessage(
            (prev) =>
              `${prev} Reset token: ${result.resetToken} (Development only)`
          );
        }
      } else {
        setMessage(result.message || "Failed to send reset instructions");

        // Handle cooldown
        if (result.cooldownRemaining) {
          setMessage(
            (prev) => `${prev} Please wait ${result.cooldownRemaining} seconds.`
          );
        }
      }
    } catch (error) {
      console.error("❌ Forgot password error:", error);
      const errorData = handleApiError(error);
      setMessage(errorData.message || "Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form-container">
      {/* Back Button */}
      <button className="back-button" onClick={handleBack}>
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
        <span className="back-text">Back to Roles</span>
      </button>

      <div className="login-form-card">
        <div className="login-content">
          <div className="login-left-panel">
            {/* Mobile Header Logo */}
            {isMobile && (
              <div className="mobile-logo">
                <img
                  src={SalonLogo}
                  alt="Sandrea Lee Salon"
                  className="salon-logo-mobile"
                />
              </div>
            )}

            <div className="login-header">
              {!isMobile && (
                <div className="logo-section">
                  <img
                    src={SalonLogo}
                    alt="Sandrea Lee Salon"
                    className="salon-logo"
                  />
                </div>
              )}

              <h2>Welcome Back!</h2>
              <p>Sign in to continue your journey with us</p>

              {/* Show current role for clarity */}
              {selectedRole && (
                <div className="current-role-badge">
                  <small>
                    Signing in as: <strong>{selectedRole.name}</strong>
                  </small>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="auth-tabs">
              <button
                className={`tab-button ${
                  activeTab === "login" ? "active" : ""
                }`}
                onClick={() => setActiveTab("login")}>
                Sign In
              </button>
              <button
                className={`tab-button ${
                  activeTab === "signup" ? "active" : ""
                }`}
                onClick={() => setActiveTab("signup")}>
                Create Account
              </button>
            </div>

            {/* Message Display */}
            {message && (
              <div
                className={`message ${
                  message.includes("successful") ||
                  message.includes("sent") ||
                  message.includes("check your email") ||
                  message.includes("Verification code")
                    ? "success"
                    : "error"
                }`}>
                {message}
                {message.includes("unexpected error") && (
                  <div style={{ fontSize: "12px", marginTop: "5px" }}>
                    Please check your network connection and try again.
                  </div>
                )}
              </div>
            )}

            {/* Login Form */}
            {activeTab === "login" && (
              <form className="auth-form" onSubmit={handleLogin}>
                <div className="floating-label-group">
                  <div
                    className={`floating-input-container ${
                      errors.emailOrPhone ? "error" : ""
                    }`}>
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
                      className="floating-input"
                      placeholder=" "
                      disabled={loading}
                    />
                    <label
                      htmlFor="loginEmailOrPhone"
                      className={`floating-label ${
                        focusedFields.loginEmailOrPhone ||
                        loginForm.emailOrPhone
                          ? "floating"
                          : ""
                      }`}>
                      Email or Phone Number
                      <span className="required-asterisk">*</span>
                    </label>
                  </div>
                  {errors.emailOrPhone && (
                    <span className="error-text">{errors.emailOrPhone}</span>
                  )}
                </div>

                <div className="floating-label-group">
                  <div
                    className={`floating-input-container password-container ${
                      errors.password ? "error" : ""
                    }`}>
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
                      className="floating-input"
                      placeholder=" "
                      disabled={loading}
                    />
                    <label
                      htmlFor="loginPassword"
                      className={`floating-label ${
                        focusedFields.loginPassword || loginForm.password
                          ? "floating"
                          : ""
                      }`}>
                      Password<span className="required-asterisk">*</span>
                    </label>
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={togglePasswordVisibility}
                      tabIndex="-1">
                      {showPassword ? (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M2 2L22 22"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="error-text">{errors.password}</span>
                  )}
                  <div className="password-hint">At least 8 characters</div>
                </div>

                <div className="form-options">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={loginForm.rememberMe}
                      onChange={handleLoginChange}
                      disabled={loading}
                    />
                    <span className="checkmark"></span>
                    Remember me
                  </label>

                  <button
                    type="button"
                    className="forgot-password"
                    onClick={handleForgotPassword}
                    disabled={loading}>
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading}>
                  {loading ? <div className="button-spinner"></div> : "Sign In"}
                </button>

                {/* Social Login - Only for customers */}
                {selectedRole?.id === "customer" && (
                  <div className="social-login">
                    <div className="divider">
                      <span>Or continue with</span>
                    </div>

                    <div className="social-buttons">
                      <button
                        type="button"
                        className="social-button google"
                        onClick={() => handleSocialLogin("google")}
                        disabled={loading}>
                        <img src={GoogleIcon} alt="Google" />
                        Google
                      </button>

                      <button
                        type="button"
                        className="social-button facebook"
                        onClick={() => handleSocialLogin("facebook")}
                        disabled={loading}>
                        <img src={FacebookIcon} alt="Facebook" />
                        Facebook
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}

            {/* Signup Form */}
            {activeTab === "signup" && (
              <form className="auth-form" onSubmit={handleSignup}>
                <div className="name-fields">
                  <div className="floating-label-group">
                    <div
                      className={`floating-input-container ${
                        errors.firstName ? "error" : ""
                      }`}>
                      <input
                        type="text"
                        id="signupFirstName"
                        name="firstName"
                        value={signupForm.firstName}
                        onChange={handleSignupChange}
                        onFocus={() => handleFocus("signupFirstName")}
                        onBlur={(e) =>
                          handleBlur("signupFirstName", e.target.value)
                        }
                        className="floating-input"
                        placeholder=" "
                        disabled={loading}
                      />
                      <label
                        htmlFor="signupFirstName"
                        className={`floating-label ${
                          focusedFields.signupFirstName || signupForm.firstName
                            ? "floating"
                            : ""
                        }`}>
                        First Name<span className="required-asterisk">*</span>
                      </label>
                    </div>
                    {errors.firstName && (
                      <span className="error-text">{errors.firstName}</span>
                    )}
                  </div>

                  <div className="floating-label-group">
                    <div
                      className={`floating-input-container ${
                        errors.lastName ? "error" : ""
                      }`}>
                      <input
                        type="text"
                        id="signupLastName"
                        name="lastName"
                        value={signupForm.lastName}
                        onChange={handleSignupChange}
                        onFocus={() => handleFocus("signupLastName")}
                        onBlur={(e) =>
                          handleBlur("signupLastName", e.target.value)
                        }
                        className="floating-input"
                        placeholder=" "
                        disabled={loading}
                      />
                      <label
                        htmlFor="signupLastName"
                        className={`floating-label ${
                          focusedFields.signupLastName || signupForm.lastName
                            ? "floating"
                            : ""
                        }`}>
                        Last Name<span className="required-asterisk">*</span>
                      </label>
                    </div>
                    {errors.lastName && (
                      <span className="error-text">{errors.lastName}</span>
                    )}
                  </div>
                </div>

                <div className="floating-label-group">
                  <div
                    className={`floating-input-container ${
                      errors.email ? "error" : ""
                    }`}>
                    <input
                      type="email"
                      id="signupEmail"
                      name="email"
                      value={signupForm.email}
                      onChange={handleSignupChange}
                      onFocus={() => handleFocus("signupEmail")}
                      onBlur={(e) => handleBlur("signupEmail", e.target.value)}
                      className="floating-input"
                      placeholder=" "
                      disabled={loading}
                    />
                    <label
                      htmlFor="signupEmail"
                      className={`floating-label ${
                        focusedFields.signupEmail || signupForm.email
                          ? "floating"
                          : ""
                      }`}>
                      Email Address<span className="required-asterisk">*</span>
                    </label>
                  </div>
                  {errors.email && (
                    <span className="error-text">{errors.email}</span>
                  )}
                </div>

                <div className="floating-label-group">
                  <div
                    className={`floating-input-container ${
                      errors.phone ? "error" : ""
                    }`}>
                    <input
                      type="tel"
                      id="signupPhone"
                      name="phone"
                      value={signupForm.phone}
                      onChange={handleSignupChange}
                      onFocus={() => handleFocus("signupPhone")}
                      onBlur={(e) => handleBlur("signupPhone", e.target.value)}
                      className="floating-input"
                      placeholder=" "
                      disabled={loading}
                      maxLength="11"
                    />
                    <label
                      htmlFor="signupPhone"
                      className={`floating-label ${
                        focusedFields.signupPhone || signupForm.phone
                          ? "floating"
                          : ""
                      }`}>
                      Phone Number<span className="required-asterisk">*</span>
                    </label>
                  </div>
                  {errors.phone && (
                    <span className="error-text">{errors.phone}</span>
                  )}
                  <div className="password-hint">
                    Must start with 0 and be 11 digits
                  </div>
                </div>

                <div className="floating-label-group">
                  <div
                    className={`floating-input-container password-container ${
                      errors.password ? "error" : ""
                    }`}>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="signupPassword"
                      name="password"
                      value={signupForm.password}
                      onChange={handleSignupChange}
                      onFocus={() => handleFocus("signupPassword")}
                      onBlur={(e) =>
                        handleBlur("signupPassword", e.target.value)
                      }
                      className="floating-input"
                      placeholder=" "
                      disabled={loading}
                    />
                    <label
                      htmlFor="signupPassword"
                      className={`floating-label ${
                        focusedFields.signupPassword || signupForm.password
                          ? "floating"
                          : ""
                      }`}>
                      Password<span className="required-asterisk">*</span>
                    </label>
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={togglePasswordVisibility}
                      tabIndex="-1">
                      {showPassword ? (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M2 2L22 22"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="error-text">{errors.password}</span>
                  )}
                  <div className="password-hint">At least 8 characters</div>
                </div>

                <div className="floating-label-group">
                  <div
                    className={`floating-input-container password-container ${
                      errors.confirmPassword ? "error" : ""
                    }`}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="signupConfirmPassword"
                      name="confirmPassword"
                      value={signupForm.confirmPassword}
                      onChange={handleSignupChange}
                      onFocus={() => handleFocus("signupConfirmPassword")}
                      onBlur={(e) =>
                        handleBlur("signupConfirmPassword", e.target.value)
                      }
                      className="floating-input"
                      placeholder=" "
                      disabled={loading}
                    />
                    <label
                      htmlFor="signupConfirmPassword"
                      className={`floating-label ${
                        focusedFields.signupConfirmPassword ||
                        signupForm.confirmPassword
                          ? "floating"
                          : ""
                      }`}>
                      Confirm Password
                      <span className="required-asterisk">*</span>
                    </label>
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={toggleConfirmPasswordVisibility}
                      tabIndex="-1">
                      {showConfirmPassword ? (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M2 2L22 22"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className="error-text">{errors.confirmPassword}</span>
                  )}
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      checked={signupForm.acceptTerms}
                      onChange={handleSignupChange}
                      disabled={loading}
                    />
                    <span className="checkmark"></span>I agree to the{" "}
                    <a href="/terms" className="terms-link">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" className="terms-link">
                      Privacy Policy
                    </a>
                    <span className="required-asterisk">*</span>
                  </label>
                  {errors.acceptTerms && (
                    <span className="error-text">{errors.acceptTerms}</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading}>
                  {loading ? (
                    <div className="button-spinner"></div>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Hide right panel on mobile */}
          {!isMobile && (
            <div className="login-right-panel">
              <div className="image-container">
                <img
                  src={ModelLogin}
                  alt="Salon Professional"
                  className="model-image"
                />
                <div className="image-overlay">
                  <div className="overlay-content">
                    <h3>Your Beauty Journey Starts Here</h3>
                    <p>
                      Join thousands of satisfied customers and professional
                      stylists
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

export default CustomerAuth;
