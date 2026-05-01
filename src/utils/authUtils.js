/**
 * Comprehensive Authentication Utilities
 * Utility functions for authentication, validation, and user management
 */

// Password strength levels with colors and messages
export const PASSWORD_STRENGTH = {
  WEAK: { level: 0, label: "Weak", color: "#ef4444", bgColor: "#fef2f2" },
  FAIR: { level: 1, label: "Fair", color: "#f59e0b", bgColor: "#fffbeb" },
  GOOD: { level: 2, label: "Good", color: "#10b981", bgColor: "#f0fdf4" },
  STRONG: { level: 3, label: "Strong", color: "#059669", bgColor: "#f0fdf4" },
  VERY_STRONG: {
    level: 4,
    label: "Very Strong",
    color: "#047857",
    bgColor: "#f0fdf4",
  },
};

// User roles and permissions
export const USER_ROLES = {
  CUSTOMER: "customer",
  STAFF: "salon_staff",
  ADMIN: "admin",
  GUEST: "guest",
};

export const ROLE_DISPLAY_NAMES = {
  customer: "Customer",
  salon_staff: "Staff Member",
  admin: "Administrator",
  guest: "Guest User",
};

// Permission constants
export const PERMISSIONS = {
  // Customer permissions
  VIEW_SERVICES: "view_services",
  BOOK_APPOINTMENTS: "book_appointments",
  PURCHASE_PRODUCTS: "purchase_products",
  MANAGE_PROFILE: "manage_profile",

  // Staff permissions
  VIEW_APPOINTMENTS: "view_appointments",
  MANAGE_APPOINTMENTS: "manage_appointments",
  VIEW_CLIENTS: "view_clients",
  CLOCK_IN_OUT: "clock_in_out",
  ACCESS_LEARNING_MODULES: "access_learning_modules",

  // Admin permissions
  MANAGE_STAFF: "manage_staff",
  MANAGE_SERVICES: "manage_services",
  MANAGE_PRODUCTS: "manage_products",
  VIEW_REPORTS: "view_reports",
  MANAGE_SETTINGS: "manage_settings",
  ALL: "all",
};

// Role-based permission mappings
export const ROLE_PERMISSIONS = {
  [USER_ROLES.CUSTOMER]: [
    PERMISSIONS.VIEW_SERVICES,
    PERMISSIONS.BOOK_APPOINTMENTS,
    PERMISSIONS.PURCHASE_PRODUCTS,
    PERMISSIONS.MANAGE_PROFILE,
  ],
  [USER_ROLES.STAFF]: [
    PERMISSIONS.VIEW_SERVICES,
    PERMISSIONS.VIEW_APPOINTMENTS,
    PERMISSIONS.MANAGE_APPOINTMENTS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.CLOCK_IN_OUT,
    PERMISSIONS.ACCESS_LEARNING_MODULES,
    PERMISSIONS.MANAGE_PROFILE,
  ],
  [USER_ROLES.ADMIN]: [PERMISSIONS.ALL],
  [USER_ROLES.GUEST]: [PERMISSIONS.VIEW_SERVICES],
};

/**
 * Email validation utility
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== "string") return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email.trim());

  return {
    isValid,
    message: isValid ? "" : "Please enter a valid email address",
    suggestions: isValid
      ? []
      : ["Check for typos", "Ensure email format is correct"],
  };
};

/**
 * Phone number validation (Philippines format)
 */
export const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber || typeof phoneNumber !== "string") {
    return {
      isValid: false,
      message: "Phone number is required",
      suggestions: [],
    };
  }

  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, "");

  // Philippine phone number formats:
  // - 09XXXXXXXXX (11 digits)
  // - +639XXXXXXXXX (12 digits with country code)
  // - 639XXXXXXXXX (11 digits without plus)
  const phoneRegex = /^(09|\+?639|639)\d{9}$/;
  const isValid = phoneRegex.test(cleaned);

  let message = "";
  let suggestions = [];

  if (!isValid) {
    message = "Please enter a valid Philippine phone number";
    suggestions = [
      "Format: 09XX XXX XXXX",
      "Or: +63 9XX XXX XXXX",
      "Must be 11 digits total",
    ];
  }

  return {
    isValid,
    message,
    suggestions,
    formatted: isValid ? formatPhoneNumber(cleaned) : phoneNumber,
  };
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return "";

  const cleaned = phoneNumber.replace(/\D/g, "");

  if (cleaned.length === 10) {
    // 09XXXXXXXX format
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  } else if (cleaned.length === 11) {
    if (cleaned.startsWith("09")) {
      // 09XXXXXXXXX format
      return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, "$1-$2-$3");
    } else {
      // 639XXXXXXXX format
      return `+${cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}`;
    }
  } else if (cleaned.length === 12) {
    // +639XXXXXXXX format
    return `+${cleaned.slice(1).replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}`;
  }

  return phoneNumber;
};

/**
 * Comprehensive password validation
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== "string") {
    return {
      isValid: false,
      strength: PASSWORD_STRENGTH.WEAK,
      score: 0,
      requirements: {
        minLength: false,
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumbers: false,
        hasSpecialChar: false,
        noSpaces: true,
      },
      messages: ["Password is required"],
    };
  }

  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    noSpaces: !/\s/.test(password),
    noCommonPatterns: !isCommonPassword(password),
  };

  const score = calculatePasswordScore(password, requirements);
  const strength = getPasswordStrength(score);

  const messages = [];
  if (!requirements.minLength) messages.push("At least 8 characters");
  if (!requirements.hasUpperCase) messages.push("One uppercase letter (A-Z)");
  if (!requirements.hasLowerCase) messages.push("One lowercase letter (a-z)");
  if (!requirements.hasNumbers) messages.push("One number (0-9)");
  if (!requirements.hasSpecialChar)
    messages.push("One special character (!@#$% etc.)");
  if (!requirements.noSpaces) messages.push("No spaces allowed");
  if (!requirements.noCommonPatterns) messages.push("Avoid common patterns");

  const isValid = messages.length === 0;

  return {
    isValid,
    strength,
    score,
    requirements,
    messages: isValid ? ["Password meets all requirements"] : messages,
  };
};

/**
 * Calculate password strength score (0-4)
 */
const calculatePasswordScore = (password, requirements) => {
  let score = 0;

  // Length points
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Character variety points
  if (requirements.hasUpperCase) score += 1;
  if (requirements.hasLowerCase) score += 1;
  if (requirements.hasNumbers) score += 1;
  if (requirements.hasSpecialChar) score += 1;

  // Bonus points for length beyond 12
  if (password.length >= 16) score += 1;

  // Penalty for common patterns
  if (!requirements.noCommonPatterns) score = Math.max(0, score - 1);

  return Math.min(score, 4); // Cap at 4 for our strength levels
};

/**
 * Get password strength object based on score
 */
const getPasswordStrength = (score) => {
  switch (score) {
    case 0:
    case 1:
      return PASSWORD_STRENGTH.WEAK;
    case 2:
      return PASSWORD_STRENGTH.FAIR;
    case 3:
      return PASSWORD_STRENGTH.GOOD;
    case 4:
      return PASSWORD_STRENGTH.STRONG;
    case 5:
      return PASSWORD_STRENGTH.VERY_STRONG;
    default:
      return PASSWORD_STRENGTH.WEAK;
  }
};

/**
 * Check for common passwords and patterns
 */
const isCommonPassword = (password) => {
  const commonPasswords = [
    "password",
    "123456",
    "12345678",
    "123456789",
    "password1",
    "qwerty",
    "abc123",
    "111111",
    "123123",
    "admin",
    "welcome",
    "monkey",
    "password123",
    "admin123",
    "letmein",
    "1234",
  ];

  const lowerPassword = password.toLowerCase();

  // Check against common passwords
  if (commonPasswords.includes(lowerPassword)) {
    return true;
  }

  // Check for sequential numbers
  if (/^(123456|234567|345678|456789|567890)+$/.test(password)) {
    return true;
  }

  // Check for repeated characters
  if (/(.)\1{3,}/.test(password)) {
    return true;
  }

  return false;
};

/**
 * Username validation
 */
export const validateUsername = (username) => {
  if (!username || typeof username !== "string") {
    return {
      isValid: false,
      message: "Username is required",
      suggestions: [],
    };
  }

  const trimmed = username.trim();
  const minLength = 3;
  const maxLength = 20;

  const requirements = {
    minLength: trimmed.length >= minLength,
    maxLength: trimmed.length <= maxLength,
    validChars: /^[a-zA-Z0-9_.-]+$/.test(trimmed),
    noSpaces: !/\s/.test(trimmed),
    notEmail: !validateEmail(trimmed).isValid,
  };

  const isValid = Object.values(requirements).every(Boolean);

  let message = "";
  const suggestions = [];

  if (!requirements.minLength) {
    message = `Username must be at least ${minLength} characters`;
    suggestions.push(`Add ${minLength - trimmed.length} more characters`);
  } else if (!requirements.maxLength) {
    message = `Username must be less than ${maxLength} characters`;
    suggestions.push(`Remove ${trimmed.length - maxLength} characters`);
  } else if (!requirements.validChars) {
    message =
      "Username can only contain letters, numbers, dots, hyphens, and underscores";
    suggestions.push("Remove special characters");
    suggestions.push("Use only a-z, 0-9, ., -, _");
  } else if (!requirements.noSpaces) {
    message = "Username cannot contain spaces";
    suggestions.push("Remove spaces from username");
  } else if (!requirements.notEmail) {
    message = "Username cannot be an email address";
    suggestions.push("Choose a unique username instead of email");
  } else {
    message = "Username is available";
  }

  return {
    isValid,
    message,
    suggestions: isValid ? [] : suggestions,
    normalized: trimmed.toLowerCase(),
  };
};

/**
 * Name validation (first name, last name)
 */
export const validateName = (name, fieldName = "Name") => {
  if (!name || typeof name !== "string") {
    return {
      isValid: false,
      message: `${fieldName} is required`,
      suggestions: [],
    };
  }

  const trimmed = name.trim();
  const minLength = 1;
  const maxLength = 50;

  const requirements = {
    minLength: trimmed.length >= minLength,
    maxLength: trimmed.length <= maxLength,
    validChars: /^[a-zA-Z\s\-'’.]+$/.test(trimmed),
    notNumbersOnly: !/^\d+$/.test(trimmed),
  };

  const isValid = Object.values(requirements).every(Boolean);

  let message = "";
  const suggestions = [];

  if (!requirements.minLength) {
    message = `${fieldName} is required`;
  } else if (!requirements.maxLength) {
    message = `${fieldName} must be less than ${maxLength} characters`;
    suggestions.push(`Use a shorter ${fieldName.toLowerCase()}`);
  } else if (!requirements.validChars) {
    message = `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
    suggestions.push("Remove special characters");
    suggestions.push("Use only letters and basic punctuation");
  } else if (!requirements.notNumbersOnly) {
    message = `${fieldName} cannot contain only numbers`;
    suggestions.push("Add letters to the name");
  } else {
    message = `${fieldName} is valid`;
  }

  return {
    isValid,
    message,
    suggestions: isValid ? [] : suggestions,
    normalized: trimmed.replace(/\s+/g, " ").trim(), // Normalize spaces
  };
};

/**
 * Check if user has required permissions
 */
export const hasPermission = (user, requiredPermissions = []) => {
  if (!user || !requiredPermissions.length) return false;

  const userPermissions = user.permissions || [];
  const userRole = user.role || USER_ROLES.GUEST;

  // Get role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];

  // Combine user-specific and role-based permissions
  const allPermissions = [...new Set([...userPermissions, ...rolePermissions])];

  // Check if user has all required permissions
  return requiredPermissions.every(
    (permission) =>
      allPermissions.includes(permission) ||
      allPermissions.includes(PERMISSIONS.ALL)
  );
};

/**
 * Check if user has any of the required permissions
 */
export const hasAnyPermission = (user, requiredPermissions = []) => {
  if (!user || !requiredPermissions.length) return false;

  const userPermissions = user.permissions || [];
  const userRole = user.role || USER_ROLES.GUEST;

  // Get role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];

  // Combine user-specific and role-based permissions
  const allPermissions = [...new Set([...userPermissions, ...rolePermissions])];

  // Check if user has any of the required permissions
  return requiredPermissions.some(
    (permission) =>
      allPermissions.includes(permission) ||
      allPermissions.includes(PERMISSIONS.ALL)
  );
};

/**
 * Get user initials for avatar fallback
 */
export const getUserInitials = (user) => {
  if (!user) return "U";

  // Try firstName first
  if (user.firstName) {
    return user.firstName.charAt(0).toUpperCase();
  }

  // Try username
  if (user.username) {
    return user.username.charAt(0).toUpperCase();
  }

  // Try email
  if (user.email) {
    return user.email.charAt(0).toUpperCase();
  }

  return "U";
};

/**
 * Generate avatar URL using DiceBear API
 */
export const generateAvatarUrl = (user, options = {}) => {
  const defaultOptions = {
    style: "avataaars",
    backgroundColor: "65c9ff,b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf",
    size: 128,
    mood: "happy",
    accessories:
      "kurt,prescription01,prescription02,round,sunglasses,wayfarers",
  };

  const config = { ...defaultOptions, ...options };

  let seed = "user";

  if (user?.username) {
    seed = user.username;
  } else if (user?.firstName) {
    seed = user.firstName;
  } else if (user?.email) {
    seed = user.email.split("@")[0];
  } else if (user?.id) {
    seed = user.id;
  }

  const params = new URLSearchParams({
    seed: encodeURIComponent(seed),
    backgroundColor: config.backgroundColor,
    size: config.size.toString(),
    mood: config.mood,
  });

  if (config.accessories) {
    params.append("accessories", config.accessories);
  }

  return `https://api.dicebear.com/7.x/${
    config.style
  }/svg?${params.toString()}`;
};

/**
 * Get user display name with fallbacks
 */
export const getUserDisplayName = (user) => {
  if (!user) return "Guest";

  if (user.firstName) {
    return user.firstName;
  }

  if (user.username) {
    return user.username;
  }

  if (user.email) {
    return user.email.split("@")[0];
  }

  return "User";
};

/**
 * Get user role display name
 */
export const getUserRoleDisplay = (user) => {
  if (!user) return "Guest";

  return ROLE_DISPLAY_NAMES[user.role] || "User";
};

/**
 * Format user join date
 */
export const formatJoinDate = (dateString) => {
  if (!dateString) return "Recently joined";

  try {
    const joinDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - joinDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Joined today";
    } else if (diffDays === 1) {
      return "Joined yesterday";
    } else if (diffDays < 7) {
      return `Joined ${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Joined ${weeks} week${weeks > 1 ? "s" : ""} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `Joined ${months} month${months > 1 ? "s" : ""} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `Joined ${years} year${years > 1 ? "s" : ""} ago`;
    }
  } catch (error) {
    console.error("Error formatting join date:", error);
    return "Member";
  }
};

/**
 * Session management utilities
 */
export const sessionUtils = {
  // Check if session is about to expire (within 5 minutes)
  isSessionExpiring: (expiryDate) => {
    if (!expiryDate) return false;

    try {
      const now = new Date();
      const expiry = new Date(expiryDate);
      const fiveMinutes = 5 * 60 * 1000;

      return expiry - now <= fiveMinutes;
    } catch (error) {
      console.error("Error checking session expiry:", error);
      return false;
    }
  },

  // Format time remaining until session expiry
  formatTimeRemaining: (expiryDate) => {
    if (!expiryDate) return "Unknown";

    try {
      const now = new Date();
      const expiry = new Date(expiryDate);
      const diffMs = expiry - now;

      if (diffMs <= 0) return "Expired";

      const minutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) {
        return `${days}d ${hours % 24}h`;
      } else if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
      } else {
        return `${minutes}m`;
      }
    } catch (error) {
      console.error("Error formatting time remaining:", error);
      return "Unknown";
    }
  },

  // Calculate session expiry date from token
  getExpiryFromToken: (token) => {
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp ? new Date(payload.exp * 1000) : null;
    } catch (error) {
      console.error("Error parsing token expiry:", error);
      return null;
    }
  },

  // Check if token is expired
  isTokenExpired: (token) => {
    const expiry = sessionUtils.getExpiryFromToken(token);
    if (!expiry) return true;

    return expiry < new Date();
  },
};

/**
 * OTP validation and generation utilities
 */
export const otpUtils = {
  // Generate a random 6-digit OTP
  generateOTP: () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // Validate OTP format
  validateOTP: (otp) => {
    if (!otp || typeof otp !== "string") return false;

    const otpRegex = /^\d{6}$/;
    return otpRegex.test(otp.trim());
  },

  // Calculate OTP expiry time (10 minutes from now)
  getOTPExpiry: () => {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);
    return expiry;
  },

  // Check if OTP is expired
  isOTPExpired: (expiryDate) => {
    if (!expiryDate) return true;

    try {
      const expiry = new Date(expiryDate);
      return expiry < new Date();
    } catch (error) {
      console.error("Error checking OTP expiry:", error);
      return true;
    }
  },

  // Format OTP expiry time for display
  formatOTPExpiry: (expiryDate) => {
    if (!expiryDate) return "";

    try {
      const expiry = new Date(expiryDate);
      const now = new Date();
      const diffMs = expiry - now;
      const diffMins = Math.max(0, Math.floor(diffMs / 60000));

      return `${diffMins} minute${diffMins !== 1 ? "s" : ""}`;
    } catch (error) {
      console.error("Error formatting OTP expiry:", error);
      return "";
    }
  },
};

/**
 * Authentication error handling utilities
 */
export const authErrorUtils = {
  // Parse authentication errors for user-friendly messages
  parseAuthError: (error) => {
    if (!error)
      return { message: "An unknown error occurred", type: "UNKNOWN" };

    const errorMessage = error.message || error.toString();
    const errorCode = error.code || error.status;

    // Common authentication errors
    const errorMappings = {
      // Network errors
      NETWORK_ERROR: {
        message: "Network error. Please check your connection.",
        type: "NETWORK",
        action: "RETRY",
      },
      TIMEOUT: {
        message: "Request timed out. Please try again.",
        type: "TIMEOUT",
        action: "RETRY",
      },

      // Authentication errors
      INVALID_CREDENTIALS: {
        message: "Invalid email/phone or password.",
        type: "CREDENTIALS",
        action: "RETRY",
      },
      USER_NOT_FOUND: {
        message: "Account not found. Please check your details.",
        type: "NOT_FOUND",
        action: "SIGNUP",
      },
      ACCOUNT_LOCKED: {
        message: "Account temporarily locked. Try again later.",
        type: "LOCKED",
        action: "WAIT",
      },
      SESSION_EXPIRED: {
        message: "Your session has expired. Please log in again.",
        type: "SESSION",
        action: "RELOGIN",
      },

      // Validation errors
      INVALID_EMAIL: {
        message: "Please enter a valid email address.",
        type: "VALIDATION",
        action: "CORRECT",
      },
      INVALID_PHONE: {
        message: "Please enter a valid phone number.",
        type: "VALIDATION",
        action: "CORRECT",
      },
      WEAK_PASSWORD: {
        message: "Password is too weak. Please choose a stronger password.",
        type: "VALIDATION",
        action: "CORRECT",
      },

      // OTP errors
      INVALID_OTP: {
        message: "Invalid verification code. Please try again.",
        type: "OTP",
        action: "RETRY",
      },
      OTP_EXPIRED: {
        message: "Verification code has expired. Request a new one.",
        type: "OTP",
        action: "RESEND",
      },

      // Rate limiting
      RATE_LIMITED: {
        message: "Too many attempts. Please wait before trying again.",
        type: "RATE_LIMIT",
        action: "WAIT",
      },
    };

    // Try to match error message with known patterns
    for (const [key, mapping] of Object.entries(errorMappings)) {
      if (errorMessage.includes(key) || errorCode === key) {
        return mapping;
      }
    }

    // Default error handling
    return {
      message: errorMessage,
      type: "UNKNOWN",
      action: "RETRY",
    };
  },

  // Check if error is recoverable
  isRecoverableError: (error) => {
    const parsedError = authErrorUtils.parseAuthError(error);
    const nonRecoverableTypes = ["LOCKED", "SESSION"];
    return !nonRecoverableTypes.includes(parsedError.type);
  },

  // Get suggested action for error
  getErrorAction: (error) => {
    const parsedError = authErrorUtils.parseAuthError(error);
    return parsedError.action;
  },
};

/**
 * Export all utilities as default object
 */
export default {
  // Constants
  PASSWORD_STRENGTH,
  USER_ROLES,
  ROLE_DISPLAY_NAMES,
  PERMISSIONS,
  ROLE_PERMISSIONS,

  // Validation functions
  validateEmail,
  validatePhoneNumber,
  validatePassword,
  validateUsername,
  validateName,

  // Formatting functions
  formatPhoneNumber,
  formatJoinDate,

  // User utilities
  hasPermission,
  hasAnyPermission,
  getUserInitials,
  generateAvatarUrl,
  getUserDisplayName,
  getUserRoleDisplay,

  // Session utilities
  sessionUtils,

  // OTP utilities
  otpUtils,

  // Error utilities
  authErrorUtils,
};
