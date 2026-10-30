import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (import.meta.env.DEV) {
      console.log(
        `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`,
        config.data || ""
      );
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(
        `✅ API Response: ${response.status} ${response.config.url}`,
        response.data
      );
    }
    return response;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error(
        `❌ API Error: ${error.response?.status} ${error.config?.url}`,
        error.response?.data || error.message
      );
    }

    if (error.response?.status === 401) {
      handleLogout();
      window.location.href = "/role-selection";
    }

    if (error.response?.status === 429) {
      const errorData = error.response.data;
      return Promise.reject({
        ...error,
        isRateLimit: true,
        delayActive: errorData.delayActive,
        remainingTime: errorData.remainingTime,
        failedAttempts: errorData.failedAttempts,
      });
    }

    return Promise.reject(error);
  }
);

// Enhanced Auth API with better error handling
export const authAPI = {
  getRoles: () => api.get("/auth/roles"),

  sendPhoneOTP: (data) => api.post("/auth/send-phone-otp", data),
  verifyPhoneOTP: (data) => api.post("/auth/verify-phone-otp", data),
  setupProfile: (formData) =>
    api.post("/auth/setup-profile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    }),
  setupEmail: (data) => api.post("/auth/setup-email", data),
  verifyEmailOTP: (data) => api.post("/auth/verify-email-otp", data),

  login: (credentials) => api.post("/auth/login", credentials),

  customerLogin: (credentials) =>
    api.post("/auth/login", {
      ...credentials,
      role: "customer",
    }),

  staffLogin: (credentials) =>
    api.post("/auth/login", {
      ...credentials,
      role: "salon_staff",
    }),

  adminLogin: (credentials) => api.post("/auth/admin-login", credentials),

  register: (userData) => api.post("/auth/register", userData),
  customerRegister: (userData) =>
    api.post("/auth/register", {
      ...userData,
      role: "customer",
    }),
  staffRegister: (userData) =>
    api.post("/auth/register", {
      ...userData,
      role: "salon_staff",
    }),

  googleAuth: (tokenData) => api.post("/auth/auth/google", tokenData),
  facebookAuth: (tokenData) => api.post("/auth/auth/facebook", tokenData),

  guestLogin: () => api.post("/auth/guest"),
  convertGuest: (userData) => api.post("/auth/convert-guest", userData),

  forgotPassword: (data) => api.post("/auth/forgot-password", data),
  resetPassword: (resetData) => api.post("/auth/reset-password", resetData),
  changePassword: (data) => api.post("/auth/change-password", data),

  getProfile: () => api.get("/auth/profile"),
  updateProfile: (profileData) => api.put("/auth/profile", profileData),
  uploadProfilePicture: (formData) =>
    api.post("/auth/profile/picture", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    }),

  checkPasswordStrength: (data) =>
    api.post("/auth/check-password-strength", data),
  getPasswordRequirements: () => api.get("/auth/password-requirements"),
  checkUsername: (data) => api.post("/auth/check-username", data),

  verifyAdmin: () => api.get("/auth/verify-admin"),
  registerAdmin: (adminData) => api.post("/auth/register-admin", adminData),

  validateToken: () => api.get("/auth/verify-admin"),
};

// Services API
// Add this to your api.js file in the servicesAPI section:
export const servicesAPI = {
  getAll: (params = {}) => api.get("/services", { params }),
  getByCategory: (category, params = {}) =>
    api.get(`/services/category/${category}`, { params }),
  getById: (id) => api.get(`/services/${id}`),
  getCategories: () => api.get("/services/categories"),
  getTopRated: (limit = 10) =>
    api.get("/services/featured/top-rated", { params: { limit } }),
  getRatings: (id, params = {}) =>
    api.get(`/services/${id}/ratings`, { params }),
  // FIXED: Enhanced bookService method
  bookService: (id, bookingData = {}) =>
    api.post(`/services/${id}/book`, bookingData),
  addRating: (id, ratingData) =>
    api.post(`/services/${id}/ratings`, ratingData),
  updateRating: (id, ratingData) =>
    api.put(`/services/${id}/ratings`, ratingData),
  getRatingSummary: (id) => api.get(`/services/${id}/rating-summary`),
  search: (query, category = null) => {
    const params = { q: query };
    if (category) params.category = category;
    return api.get("/services/search", { params });
  },
  getStats: () => api.get("/services/stats/overview"),
  getPopular: (limit = 10) =>
    api.get("/services/featured/popular", { params: { limit } }),
  getPromos: () => api.get("/services/featured/promos"),
};

// Products API
export const productsAPI = {
  getAll: (params = {}) => api.get("/products", { params }),
  getByCategory: (category, params = {}) =>
    api.get(`/products/category/${category}`, { params }),
  getById: (id) => api.get(`/products/${id}`),
  getCategories: () => api.get("/products/categories"),
  getTopRated: (limit = 10) =>
    api.get("/products/featured/top-rated", { params: { limit } }),
  getRatings: (id, params = {}) =>
    api.get(`/products/${id}/ratings`, { params }),
  purchase: (id, quantity = 1) =>
    api.post(`/products/${id}/purchase`, { quantity }),
  addRating: (id, ratingData) =>
    api.post(`/products/${id}/ratings`, ratingData),
  updateRating: (id, ratingData) =>
    api.put(`/products/${id}/ratings`, ratingData),
  getRatingSummary: (id) => api.get(`/products/${id}/rating-summary`),
  search: (query, category = null) => {
    const params = { q: query };
    if (category) params.category = category;
    return api.get("/products/search", { params });
  },
  create: (productData) => api.post("/products", productData),
  update: (id, productData) => api.put(`/products/${id}`, productData),
  delete: (id) => api.delete(`/products/${id}`),
  getStats: () => api.get("/products/stats/overview"),
  getFeatured: (limit = 10) =>
    api.get("/products/featured", { params: { limit } }),
  getByStock: (inStock = true) => api.get("/products", { params: { inStock } }),
  getProductsWithFilters: (filters = {}) =>
    api.get("/products", { params: filters }),
  getProductsAdvanced: (filters = {}) => {
    const {
      sortBy,
      sortOrder,
      category,
      minRating,
      inStock,
      page,
      limit,
      ...otherFilters
    } = filters;

    return api.get("/products", {
      params: {
        sortBy,
        sortOrder,
        category,
        minRating,
        inStock,
        page,
        limit,
        ...otherFilters,
      },
    });
  },
  getProductWithContext: (id) => api.get(`/products/${id}`),
  rateProduct: (id, ratingData) =>
    api.post(`/products/${id}/ratings`, ratingData),
  updateStockStatus: (id, inStock) => api.put(`/products/${id}`, { inStock }),
  bulkUpdate: (productIds, updateData) =>
    api.put("/products/bulk-update", { productIds, updateData }),
  getAnalytics: (period = "monthly") =>
    api.get("/products/analytics", { params: { period } }),
};

// Appointments API - UPDATED WITH ALL ROUTES
export const appointmentsAPI = {
  // Basic appointment routes
  getAll: (params) => api.get("/appointments", { params }),
  getById: (id, params) => api.get(`/appointments/${id}`, { params }),
  getByCustomer: (customerId, params) =>
    api.get(`/appointments/customer/${customerId}`, { params }),
  create: (appointmentData) => api.post("/appointments", appointmentData),
  update: (id, updateData) => api.put(`/appointments/${id}`, updateData),
  cancel: (id, reason) =>
    api.put(`/appointments/${id}/cancel`, { cancellationReason: reason }),
  complete: (id, notes) =>
    api.put(`/appointments/${id}/complete`, { staffNotes: notes }),
  delete: (id) => api.delete(`/appointments/${id}`),

  // Staff appointment routes
  getStaffAppointments: (params) =>
    api.get("/appointments/staff/my-appointments", { params }),
  getStaffClients: (params) =>
    api.get("/appointments/staff/clients", { params }),
  getStaffAppointmentsById: (staffId, params) =>
    api.get(`/appointments/staff/${staffId}`, { params }),
  staffComplete: (id, notes) =>
    api.put(`/appointments/staff/${id}/complete`, { staffNotes: notes }),
  staffCancel: (id, data) => api.put(`/appointments/staff/${id}/cancel`, data),
  updateNotes: (id, notes) =>
    api.put(`/appointments/staff/${id}/notes`, { staffNotes: notes }),
  assignStaff: (id, staffId) =>
    api.put(`/appointments/staff/${id}/assign`, { staffId }),
};

// ✅ CORRECTED: Bookings API - PROPER ENDPOINT MATCHING YOUR BACKEND
export const bookingsAPI = {
  // ✅ FIXED: Use the correct endpoint that matches your backend route
  create: (bookingData) => api.post("/bookings/create", bookingData),

  // Get bookings
  getAll: (params) => api.get("/bookings", { params }),
  getMyBookings: (params) => api.get("/bookings/my-bookings", { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  getByDate: (date) => api.get(`/bookings/date/${date}`),

  // Get booking payments
  getBookingPayments: (id) => api.get(`/bookings/${id}/payments`),

  // Cancel booking with refund calculation
  cancel: (id, reason) =>
    api.put(`/bookings/${id}/cancel`, { cancellationReason: reason }),

  // Update booking status
  updateStatus: (id, statusData) =>
    api.put(`/bookings/${id}/status`, statusData),

  // Process refund for booking
  processRefund: (id, refundData) =>
    api.put(`/bookings/${id}/process-refund`, refundData),

  // Availability and slots
  getAvailableSlots: (date, staffId = null) =>
    api.get(`/bookings/available-slots/${date}`, { params: { staffId } }),

  getAvailableSlotsWithStaff: (date, staffId = null) =>
    api.get(`/bookings/available-slots-with-staff/${date}`, {
      params: staffId ? { staffId } : {},
    }),

  // Sync booking payments (staff only)
  syncPayments: (id) => api.put(`/bookings/${id}/sync-payments`),

  // Get booking by date range
  getByDateRange: (startDate, endDate, params = {}) =>
    api.get("/bookings/date-range", {
      params: { startDate, endDate, ...params },
    }),

  // Get booking analytics
  getAnalytics: (params = {}) => api.get("/bookings/analytics", { params }),

  // Staff availability checks
  checkStaffAvailability: (staffId, date, time) =>
    api.post("/bookings/check-staff-availability", { staffId, date, time }),

  getStaffAvailability: (date) =>
    api.get(`/bookings/staff-availability/${date}`),

  // Stats and management
  getStats: (params) => api.get("/bookings/stats/overview", { params }),
  getAllForStaff: (params) => api.get("/bookings/staff/all", { params }),

  // Rating functions for bookings
  getRatings: (id, params = {}) =>
    api.get(`/bookings/${id}/ratings`, { params }),

  canRate: (id) => api.get(`/bookings/${id}/can-rate`),

  submitRating: (id, ratingData) =>
    api.post(`/bookings/${id}/ratings`, ratingData),

  delete: (id) => api.delete(`/bookings/${id}`),
};

// ✅ UPDATED: Payments API - ENHANCED WITH DOWNPAYMENT AND AUTO-APPROVAL
export const paymentsAPI = {
  // Create payment with payment options
  create: (paymentData) => api.post("/payments/create", paymentData),

  // ✅ NEW: Create payment for remaining amount
  createRemainingPayment: (bookingId, paymentData) =>
    api.post(`/payments/${bookingId}/pay-remaining`, paymentData),

  // Get payments
  getAll: (params) => api.get("/payments", { params }),
  getById: (id) => api.get(`/payments/${id}`),

  webhook: (webhookData) => api.post("/payments/webhook", webhookData),
  // ✅ ENHANCED: Upload proof with auto-approval
  uploadProof: (id, formData) =>
    api.post(`/payments/${id}/upload-proof`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // ✅ NEW: Verify payment eligibility
  verifyEligibility: (paymentData) =>
    api.post("/payments/verify-eligibility", paymentData),

  // ✅ NEW: Get payment history for entity
  getEntityPayments: (entityType, entityId, params = {}) =>
    api.get(`/payments/${entityType}/${entityId}`, { params }),

  // ✅ NEW: Retry failed payment
  retryPayment: (paymentId, retryData) =>
    api.post(`/payments/${paymentId}/retry`, retryData),

  // ✅ ENHANCED: Status check with auto-approval info
  getStatus: (id) => api.get(`/payments/${id}/status`),

  // Approval and denial
  approve: (id, notes) => api.put(`/payments/${id}/approve`, { notes }),
  deny: (id, notes) => api.put(`/payments/${id}/deny`, { notes }),

  // Stats
  getStats: (params) => api.get("/payments/stats/overview", { params }),
  getMethods: () => api.get("/payments/methods"),
};

// Cart API - ENHANCED WITH COMPLETE FUNCTIONALITY
export const cartAPI = {
  // Get user's cart
  get: () => api.get("/cart"),

  // Add product to cart
  add: (productData) => api.post("/cart/add", productData),

  // Update cart item quantity
  update: (itemId, quantity) => api.put(`/cart/update/${itemId}`, { quantity }),

  // Remove item from cart
  remove: (itemId) => api.delete(`/cart/remove/${itemId}`),

  // Clear entire cart
  clear: () => api.delete("/cart/clear"),

  // Get cart items count
  getCount: () => api.get("/cart/count"),

  // Apply coupon to cart
  applyCoupon: (code) => api.post("/cart/apply-coupon", { code }),

  // Remove coupon from cart
  removeCoupon: () => api.delete("/cart/remove-coupon"),

  // Enhanced utility functions for cart management
  utils: {
    // Calculate cart total
    calculateTotal: (cart) => {
      if (!cart || !cart.items) return 0;
      return cart.items.reduce((total, item) => {
        const price = item.productId?.price || 0;
        return total + price * item.quantity;
      }, 0);
    },

    // Get cart items count
    getItemsCount: (cart) => {
      if (!cart || !cart.items) return 0;
      return cart.items.reduce((count, item) => count + item.quantity, 0);
    },

    // Check if product is in cart
    isInCart: (cart, productId) => {
      if (!cart || !cart.items) return false;
      return cart.items.some((item) => item.productId?._id === productId);
    },

    // Get cart item by product ID
    getCartItem: (cart, productId) => {
      if (!cart || !cart.items) return null;
      return cart.items.find((item) => item.productId?._id === productId);
    },

    // Validate cart item
    validateCartItem: (product, quantity) => {
      const errors = [];

      if (!product) {
        errors.push("Product not found");
      }

      if (!product.inStock) {
        errors.push("Product is out of stock");
      }

      if (quantity < 1) {
        errors.push("Quantity must be at least 1");
      }

      if (quantity > 10) {
        errors.push("Maximum quantity per product is 10");
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    },
  },
};

// Favorites API - ENHANCED WITH COMPLETE FUNCTIONALITY
export const favoritesAPI = {
  // Get all favorites for user
  getAll: () => api.get("/favorites"),

  // Add product to favorites - UPDATED TO ACCEPT PRODUCT DATA
  add: (data) => api.post("/favorites/add", data), // Changed to accept object instead of just productId

  // Remove from favorites
  remove: (favoriteId) => api.delete(`/favorites/remove/${favoriteId}`),

  // Check if product is in favorites
  check: (productId) => api.get(`/favorites/check/${productId}`),

  // Get service favorites
  getServiceFavorites: () => api.get("/favorites/services"),

  // Add service to favorites
  addServiceFavorite: (serviceId) =>
    api.post("/favorites/services", { serviceId }),

  // Remove service from favorites
  removeServiceFavorite: (favoriteId) =>
    api.delete(`/favorites/services/${favoriteId}`),

  // Enhanced utility functions for favorites management
  utils: {
    // Transform favorites data to consistent format
    transformFavoritesData: (favoritesData) => {
      if (!favoritesData || !Array.isArray(favoritesData)) return [];

      return favoritesData.map((fav) => {
        // Handle both itemId structure and direct productId structure
        if (fav.itemId) {
          return {
            _id: fav._id,
            userId: fav.userId,
            productId: fav.itemId,
            product: fav.itemId, // For backward compatibility
            addedAt: fav.createdAt || fav.addedAt,
          };
        }

        return fav; // Return as-is if already in correct format
      });
    },

    // Check if product is in favorites list
    isProductFavorited: (favorites, productId) => {
      if (!favorites || !Array.isArray(favorites)) return false;

      return favorites.some((fav) => {
        const favProductId =
          fav.productId?._id || fav.productId || fav.itemId?._id;
        return favProductId === productId;
      });
    },

    // Get favorite ID for a product
    getFavoriteId: (favorites, productId) => {
      if (!favorites || !Array.isArray(favorites)) return null;

      const favorite = favorites.find((fav) => {
        const favProductId =
          fav.productId?._id || fav.productId || fav.itemId?._id;
        return favProductId === productId;
      });

      return favorite?._id || null;
    },

    // Extract products from favorites
    extractProducts: (favorites) => {
      if (!favorites || !Array.isArray(favorites)) return [];

      return favorites
        .map((fav) => {
          return fav.productId || fav.itemId || fav.product;
        })
        .filter(Boolean);
    },
  },
};

// ✅ ENHANCED: Orders API - COMPLETE WITH ALL ROUTES
export const ordersAPI = {
  // ✅ Create new order
  create: (orderData) => api.post("/orders/create", orderData),

  // ✅ Get all orders (with optional filters)
  getAll: (params) => api.get("/orders", { params }),

  // ✅ Get specific order by ID
  getById: (id) => api.get(`/orders/${id}`),

  // ✅ Get user's orders (customer only)
  getMyOrders: (params) => api.get("/orders/my-orders", { params }),

  // ✅ Cancel order
  cancel: (id, reason) =>
    api.put(`/orders/${id}/cancel`, { cancellationReason: reason }),

  // ✅ Update order status (staff/admin only)
  updateStatus: (id, statusData) => api.put(`/orders/${id}/status`, statusData),

  // ✅ Get order tracking information
  getTracking: (id) => api.get(`/orders/${id}/tracking`),

  // ✅ Get order statistics (admin only)
  getStats: (params) => api.get("/orders/stats/overview", { params }),

  // ✅ NEW: Rate order
  rateOrder: (id, ratingData) => api.post(`/orders/${id}/rate`, ratingData),

  // ✅ NEW: Get rateable products in order
  getRateableItems: (id) => api.get(`/orders/${id}/rateable-items`),

  // ✅ NEW: Check if order can be rated
  canRate: (id) => api.get(`/orders/${id}/can-rate`),

  // ✅ NEW: Rate specific product in order
  rateProduct: (orderId, productId, ratingData) =>
    api.post(`/orders/${orderId}/products/${productId}/rate`, ratingData),

  // ✅ NEW: Get order summary
  getSummary: (id) => api.get(`/orders/${id}/summary`),

  // ✅ NEW: Update delivery info
  updateDeliveryInfo: (id, deliveryData) =>
    api.put(`/orders/${id}/delivery-info`, deliveryData),
};

// ✅ ENHANCED: Order Management Utilities
export const orderManagement = {
  // Get user's orders with comprehensive error handling
  getMyOrders: async (params = {}) => {
    try {
      console.log("🔄 Fetching user's orders...");
      const response = await ordersAPI.getMyOrders(params);

      console.log("✅ Orders response:", response);

      // Handle different response structures
      let ordersData = response.data?.data || response.data || [];

      // Ensure it's an array
      if (!Array.isArray(ordersData)) {
        ordersData = [ordersData].filter(Boolean);
      }

      console.log("📦 Processed orders:", ordersData.length);

      return {
        success: true,
        data: ordersData,
        count: ordersData.length,
        message: "Orders retrieved successfully",
      };
    } catch (error) {
      console.error("❌ Error getting orders:", error);
      return {
        success: false,
        data: [],
        count: 0,
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },

  // Get specific order details
  getOrderDetails: async (orderId) => {
    try {
      console.log("🔍 Fetching order details:", orderId);
      const response = await ordersAPI.getById(orderId);

      if (response.data?.success) {
        return {
          success: true,
          order: response.data.data,
          message: "Order details retrieved successfully",
        };
      } else {
        throw new Error(response.data?.message || "Failed to fetch order");
      }
    } catch (error) {
      console.error("❌ Error getting order details:", error);
      return {
        success: false,
        order: null,
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },

  // Create new order
  createOrder: async (orderData) => {
    try {
      console.log("📝 Creating order...", orderData);

      if (!orderData.items || orderData.items.length === 0) {
        throw new Error("Order items are required");
      }

      const response = await ordersAPI.create(orderData);

      if (response.data?.success) {
        console.log("✅ Order created:", response.data.data);
        return {
          success: true,
          order: response.data.data,
          message: response.data.message || "Order created successfully",
          nextStep: response.data.nextStep,
        };
      } else {
        throw new Error(response.data?.message || "Failed to create order");
      }
    } catch (error) {
      console.error("❌ Error creating order:", error);
      return {
        success: false,
        order: null,
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },

  // Cancel order
  cancelOrder: async (orderId, reason = "") => {
    try {
      console.log("🚫 Cancelling order:", orderId);
      const response = await ordersAPI.cancel(orderId, reason);

      if (response.data?.success) {
        return {
          success: true,
          order: response.data.data,
          message: response.data.message || "Order cancelled successfully",
        };
      } else {
        throw new Error(response.data?.message || "Failed to cancel order");
      }
    } catch (error) {
      console.error("❌ Error cancelling order:", error);
      return {
        success: false,
        order: null,
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },

  // Update order status
  updateOrderStatus: async (orderId, statusData) => {
    try {
      console.log("📊 Updating order status:", orderId, statusData);
      const response = await ordersAPI.updateStatus(orderId, statusData);

      if (response.data?.success) {
        return {
          success: true,
          order: response.data.data,
          message: response.data.message || "Order status updated successfully",
          canRate: response.data.canRate,
        };
      } else {
        throw new Error(
          response.data?.message || "Failed to update order status"
        );
      }
    } catch (error) {
      console.error("❌ Error updating order status:", error);
      return {
        success: false,
        order: null,
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },

  // Get order tracking
  getOrderTracking: async (orderId) => {
    try {
      console.log("📍 Fetching order tracking:", orderId);
      const response = await ordersAPI.getTracking(orderId);

      if (response.data?.success) {
        return {
          success: true,
          tracking: response.data.data,
          message: "Tracking information retrieved successfully",
        };
      } else {
        throw new Error(response.data?.message || "Failed to fetch tracking");
      }
    } catch (error) {
      console.error("❌ Error getting tracking:", error);
      return {
        success: false,
        tracking: null,
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },

  // Check if order can be rated
  checkIfCanRate: async (orderId) => {
    try {
      console.log("✅ Checking if order can be rated:", orderId);
      const response = await ordersAPI.canRate(orderId);

      return (
        response.data || {
          canRate: false,
          reason: "Unable to determine rating eligibility",
        }
      );
    } catch (error) {
      console.error("❌ Error checking rating eligibility:", error);
      return {
        canRate: false,
        reason: error.message,
      };
    }
  },

  // Rate order
  rateOrder: async (orderId, ratingData) => {
    try {
      console.log("⭐ Rating order:", orderId, ratingData);

      // Validate rating data
      if (
        !ratingData.rating ||
        ratingData.rating < 1 ||
        ratingData.rating > 5
      ) {
        throw new Error("Rating must be between 1 and 5");
      }

      const response = await ordersAPI.rateOrder(orderId, ratingData);

      if (response.data?.success) {
        return {
          success: true,
          rating: response.data.data,
          message: response.data.message || "Order rated successfully",
        };
      } else {
        throw new Error(response.data?.message || "Failed to rate order");
      }
    } catch (error) {
      console.error("❌ Error rating order:", error);
      return {
        success: false,
        rating: null,
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },

  // Get rateable items in order
  getRateableItems: async (orderId) => {
    try {
      console.log("📋 Getting rateable items:", orderId);
      const response = await ordersAPI.getRateableItems(orderId);

      if (response.data?.success) {
        return {
          success: true,
          items: response.data.data || [],
          count: response.data.data?.length || 0,
          message: "Rateable items retrieved successfully",
        };
      } else {
        throw new Error(
          response.data?.message || "Failed to fetch rateable items"
        );
      }
    } catch (error) {
      console.error("❌ Error getting rateable items:", error);
      return {
        success: false,
        items: [],
        count: 0,
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },

  // Rate specific product in order
  rateProduct: async (orderId, productId, ratingData) => {
    try {
      console.log("⭐ Rating product:", orderId, productId, ratingData);

      if (
        !ratingData.rating ||
        ratingData.rating < 1 ||
        ratingData.rating > 5
      ) {
        throw new Error("Rating must be between 1 and 5");
      }

      const response = await ordersAPI.rateProduct(
        orderId,
        productId,
        ratingData
      );

      if (response.data?.success) {
        return {
          success: true,
          rating: response.data.data,
          message: response.data.message || "Product rated successfully",
        };
      } else {
        throw new Error(response.data?.message || "Failed to rate product");
      }
    } catch (error) {
      console.error("❌ Error rating product:", error);
      return {
        success: false,
        rating: null,
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },

  // Get order summary
  getOrderSummary: async (orderId) => {
    try {
      const response = await ordersAPI.getSummary(orderId);

      if (response.data?.success) {
        return {
          success: true,
          summary: response.data.data,
          message: "Order summary retrieved successfully",
        };
      } else {
        throw new Error(response.data?.message || "Failed to fetch summary");
      }
    } catch (error) {
      console.error("❌ Error getting order summary:", error);
      return {
        success: false,
        summary: null,
        message: error.message,
      };
    }
  },

  // Update delivery information
  updateDeliveryInfo: async (orderId, deliveryData) => {
    try {
      const response = await ordersAPI.updateDeliveryInfo(
        orderId,
        deliveryData
      );

      if (response.data?.success) {
        return {
          success: true,
          order: response.data.data,
          message:
            response.data.message || "Delivery info updated successfully",
        };
      } else {
        throw new Error(
          response.data?.message || "Failed to update delivery info"
        );
      }
    } catch (error) {
      console.error("❌ Error updating delivery info:", error);
      return {
        success: false,
        order: null,
        message: error.message,
      };
    }
  },

  // Filter orders by status
  filterOrdersByStatus: (orders, status) => {
    if (!status || status === "all") return orders;
    return orders.filter((order) => order.status === status);
  },

  // Sort orders by date
  sortOrdersByDate: (orders, direction = "desc") => {
    return [...orders].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return direction === "desc" ? dateB - dateA : dateA - dateB;
    });
  },

  // Get order statistics
  calculateOrderStats: (orders) => {
    const stats = {
      total: orders.length,
      byStatus: {
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        refunded: 0,
      },
      totalValue: 0,
      averageValue: 0,
    };

    orders.forEach((order) => {
      stats.totalValue += order.totalAmount || 0;
      if (stats.byStatus[order.status] !== undefined) {
        stats.byStatus[order.status]++;
      }
    });

    stats.averageValue = stats.total > 0 ? stats.totalValue / stats.total : 0;

    return stats;
  },

  // Format order for display
  formatOrder: (order) => {
    if (!order) return null;

    return {
      id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      statusDisplay: getOrderStatusDisplay(order.status),
      createdAt: order.createdAt,
      createdAtFormatted: new Date(order.createdAt).toLocaleDateString(
        "en-PH",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      ),
      totalAmount: order.totalAmount,
      totalAmountFormatted: formatPrice(order.totalAmount),
      itemsCount: order.items?.length || 0,
      deliveryType: order.deliveryInfo?.type || "pickup",
      isRated: order.isRated || false,
      canRate: order.status === "delivered" && !order.isRated,
      payment: order.payment,
      tracking: order.tracking,
      items: order.items || [],
    };
  },
};

// ✅ UPDATED: Bookings Management - ENHANCED WITH PAYMENT OPTIONS AND STAFF AVAILABILITY
// ✅ FIXED: Updated bookingsManagement.createBooking
export const bookingsManagement = {
  // Create booking with enhanced payment options
  createBooking: async (bookingData) => {
    try {
      console.log("📝 Creating booking with payment options...", bookingData);

      const response = await bookingsAPI.create(bookingData);

      if (response.data?.success) {
        console.log("✅ Booking created:", response.data.data);

        // ✅ FIXED: Return proper structure with bookingId
        return {
          success: true,
          booking: response.data.data,
          bookingId: response.data.data._id || response.data.data.id, // Add this line
          message: response.data.message || "Booking created successfully",
          paymentOption: response.data.data.paymentOption,
          downpaymentAmount: response.data.data.downpaymentAmount,
          remainingAmount: response.data.data.remainingAmount,
        };
      } else {
        throw new Error(response.data?.message || "Failed to create booking");
      }
    } catch (error) {
      console.error("❌ Error creating booking:", error);
      return {
        success: false,
        booking: null,
        bookingId: null, // Add this line
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },

  // Get available slots with staff consideration
  getAvailableSlots: async (date, staffId = null) => {
    try {
      console.log("⏰ Fetching available slots for:", date, "Staff:", staffId);

      let response;
      if (staffId) {
        response = await bookingsAPI.getAvailableSlotsWithStaff(date, staffId);
      } else {
        response = await bookingsAPI.getAvailableSlots(date);
      }

      if (response.data?.success) {
        return {
          success: true,
          availableSlots: response.data.availableSlots || [],
          staffAvailableSlots: response.data.staffAvailableSlots || [],
          staffUnavailableSlots: response.data.staffUnavailableSlots || [],
          date: response.data.date,
          staffId: response.data.staffId,
        };
      } else {
        throw new Error(
          response.data?.message || "Failed to fetch available slots"
        );
      }
    } catch (error) {
      console.error("❌ Error fetching available slots:", error);
      return {
        success: false,
        availableSlots: [],
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },

  // Check staff availability
  checkStaffAvailability: async (staffId, date, time) => {
    try {
      console.log("🔍 Checking staff availability:", { staffId, date, time });

      const response = await bookingsAPI.checkStaffAvailability(
        staffId,
        date,
        time
      );

      return {
        success: true,
        isAvailable: response.data.isAvailable,
        staffId: response.data.staffId,
        date: response.data.date,
        time: response.data.time,
      };
    } catch (error) {
      console.error("❌ Error checking staff availability:", error);
      return {
        success: false,
        isAvailable: false,
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },

  // Get staff availability for date
  getStaffAvailabilityForDate: async (date) => {
    try {
      console.log("👥 Fetching staff availability for:", date);

      const response = await bookingsAPI.getStaffAvailability(date);

      if (response.data?.success) {
        return {
          success: true,
          staffAvailability: response.data.data || [],
          date: response.data.date,
        };
      } else {
        throw new Error(
          response.data?.message || "Failed to fetch staff availability"
        );
      }
    } catch (error) {
      console.error("❌ Error fetching staff availability:", error);
      return {
        success: false,
        staffAvailability: [],
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },

  // Cancel booking with refund calculation
  cancelBooking: async (bookingId, reason = "") => {
    try {
      console.log("🚫 Cancelling booking:", bookingId);

      const response = await bookingsAPI.cancel(bookingId, reason);

      if (response.data?.success) {
        return {
          success: true,
          booking: response.data.data.booking,
          refundDetails: response.data.data.refundDetails,
          message: response.data.message || "Booking cancelled successfully",
        };
      } else {
        throw new Error(response.data?.message || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("❌ Error cancelling booking:", error);
      return {
        success: false,
        booking: null,
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },

  // Process refund for booking
  processRefund: async (bookingId, refundData) => {
    try {
      console.log("💰 Processing refund for booking:", bookingId);

      const response = await bookingsAPI.processRefund(bookingId, refundData);

      if (response.data?.success) {
        return {
          success: true,
          booking: response.data.data.booking,
          refundPayment: response.data.data.refundPayment,
          message: response.data.message || "Refund processed successfully",
        };
      } else {
        throw new Error(response.data?.message || "Failed to process refund");
      }
    } catch (error) {
      console.error("❌ Error processing refund:", error);
      return {
        success: false,
        booking: null,
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },

  // Get user's bookings
  getMyBookings: async (params = {}) => {
    try {
      console.log("📋 Fetching user's bookings...");

      const response = await bookingsAPI.getMyBookings(params);

      if (response.data?.success) {
        return {
          success: true,
          bookings: response.data.data || [],
          count: response.data.count || 0,
          message: "Bookings retrieved successfully",
        };
      } else {
        throw new Error(response.data?.message || "Failed to fetch bookings");
      }
    } catch (error) {
      console.error("❌ Error fetching bookings:", error);
      return {
        success: false,
        bookings: [],
        count: 0,
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },

  // Get booking details
  getBookingDetails: async (bookingId) => {
    try {
      console.log("🔍 Fetching booking details:", bookingId);

      const response = await bookingsAPI.getById(bookingId);

      if (response.data?.success) {
        return {
          success: true,
          booking: response.data.data,
          message: "Booking details retrieved successfully",
        };
      } else {
        throw new Error(response.data?.message || "Failed to fetch booking");
      }
    } catch (error) {
      console.error("❌ Error fetching booking details:", error);
      return {
        success: false,
        booking: null,
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },
};

// ✅ UPDATED: Payments Management - ENHANCED WITH DOWNPAYMENT AND AUTO-APPROVAL
export const paymentsManagement = {
  // Create payment with enhanced options
  createPayment: async (paymentData) => {
    try {
      console.log("💳 Creating payment...", paymentData);

      const response = await paymentsAPI.create(paymentData);

      if (response.data?.success) {
        console.log("✅ Payment created:", response.data.data);
        return {
          success: true,
          payment: response.data.data,
          message: response.data.message || "Payment created successfully",
          qrCode: response.data.data.qrCode,
          paymentReference: response.data.data.paymentReference,
        };
      } else {
        throw new Error(response.data?.message || "Failed to create payment");
      }
    } catch (error) {
      console.error("❌ Error creating payment:", error);
      return {
        success: false,
        payment: null,
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },

  // Create remaining payment for booking
  createRemainingPayment: async (bookingId, paymentData) => {
    try {
      console.log("💳 Creating remaining payment for booking:", bookingId);

      const response = await paymentsAPI.createRemainingPayment(
        bookingId,
        paymentData
      );

      if (response.data?.success) {
        return {
          success: true,
          payment: response.data.data,
          message:
            response.data.message || "Remaining payment created successfully",
        };
      } else {
        throw new Error(
          response.data?.message || "Failed to create remaining payment"
        );
      }
    } catch (error) {
      console.error("❌ Error creating remaining payment:", error);
      return {
        success: false,
        payment: null,
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },

  // Upload proof of payment with auto-approval
  uploadProof: async (paymentId, formData, proofDetails = {}) => {
    try {
      console.log("📤 Uploading proof for payment:", paymentId);

      // Create FormData with proof details
      const uploadData = new FormData();
      uploadData.append("proofImage", formData.get("proofImage"));
      uploadData.append("referenceNumber", proofDetails.referenceNumber || "");
      uploadData.append("name", proofDetails.name || "");
      uploadData.append("amountPaid", proofDetails.amountPaid || "");
      uploadData.append(
        "dateOfTransaction",
        proofDetails.dateOfTransaction || ""
      );

      const response = await paymentsAPI.uploadProof(paymentId, uploadData);

      if (response.data?.success) {
        return {
          success: true,
          payment: response.data.data,
          autoApproved: response.data.data.autoApproved,
          verificationScore: response.data.data.verificationScore,
          message: response.data.message || "Proof uploaded successfully",
        };
      } else {
        throw new Error(response.data?.message || "Failed to upload proof");
      }
    } catch (error) {
      console.error("❌ Error uploading proof:", error);
      return {
        success: false,
        payment: null,
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },

  // Check payment status with auto-approval info
  checkPaymentStatus: async (paymentId) => {
    try {
      console.log("🔍 Checking payment status:", paymentId);

      const response = await paymentsAPI.getStatus(paymentId);

      if (response.data?.success) {
        return {
          success: true,
          status: response.data.data.status,
          autoApproved: response.data.data.autoApproved,
          verificationScore: response.data.data.verificationScore,
          processingNotes: response.data.data.processingNotes,
          autoApprovalReason: response.data.data.autoApprovalReason,
          processedAt: response.data.data.processedAt,
          processedBy: response.data.data.processedBy,
        };
      } else {
        throw new Error(
          response.data?.message || "Failed to check payment status"
        );
      }
    } catch (error) {
      console.error("❌ Error checking payment status:", error);
      return {
        success: false,
        status: null,
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },

  // Approve payment
  approvePayment: async (paymentId, notes = "") => {
    try {
      console.log("✅ Approving payment:", paymentId);

      const response = await paymentsAPI.approve(paymentId, notes);

      if (response.data?.success) {
        return {
          success: true,
          payment: response.data.data,
          message: response.data.message || "Payment approved successfully",
        };
      } else {
        throw new Error(response.data?.message || "Failed to approve payment");
      }
    } catch (error) {
      console.error("❌ Error approving payment:", error);
      return {
        success: false,
        payment: null,
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },

  // Deny payment
  denyPayment: async (paymentId, notes = "") => {
    try {
      console.log("❌ Denying payment:", paymentId);

      const response = await paymentsAPI.deny(paymentId, notes);

      if (response.data?.success) {
        return {
          success: true,
          payment: response.data.data,
          message: response.data.message || "Payment denied successfully",
        };
      } else {
        throw new Error(response.data?.message || "Failed to deny payment");
      }
    } catch (error) {
      console.error("❌ Error denying payment:", error);
      return {
        success: false,
        payment: null,
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },

  // Get payment details
  getPaymentDetails: async (paymentId) => {
    try {
      console.log("🔍 Fetching payment details:", paymentId);

      const response = await paymentsAPI.getById(paymentId);

      if (response.data?.success) {
        return {
          success: true,
          payment: response.data.data,
          message: "Payment details retrieved successfully",
        };
      } else {
        throw new Error(response.data?.message || "Failed to fetch payment");
      }
    } catch (error) {
      console.error("❌ Error fetching payment details:", error);
      return {
        success: false,
        payment: null,
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },

  // Get user's payments
  getMyPayments: async (params = {}) => {
    try {
      console.log("💳 Fetching user's payments...");

      const response = await paymentsAPI.getAll(params);

      if (response.data?.success) {
        return {
          success: true,
          payments: response.data.data || [],
          count: response.data.count || 0,
          message: "Payments retrieved successfully",
        };
      } else {
        throw new Error(response.data?.message || "Failed to fetch payments");
      }
    } catch (error) {
      console.error("❌ Error fetching payments:", error);
      return {
        success: false,
        payments: [],
        count: 0,
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },
};

// ✅ ENHANCED: Booking-Payment Integration Management
export const bookingPaymentManagement = {
  // Create booking with payment in one transaction
  createBookingWithPayment: async (bookingData, paymentData) => {
    try {
      console.log("💳 Creating booking with payment...", {
        bookingData,
        paymentData,
      });

      const response = await bookingPaymentAPI.createWithPayment({
        ...bookingData,
        payment: paymentData,
      });

      if (response.data?.success) {
        console.log("✅ Booking with payment created:", response.data.data);
        return {
          success: true,
          booking: response.data.data.booking,
          payment: response.data.data.payment,
          message:
            response.data.message || "Booking and payment created successfully",
        };
      } else {
        throw new Error(
          response.data?.message || "Failed to create booking with payment"
        );
      }
    } catch (error) {
      console.error("❌ Error creating booking with payment:", error);
      const bookingPaymentError = handleBookingPaymentError(error);
      return {
        success: false,
        booking: null,
        payment: null,
        ...bookingPaymentError,
      };
    }
  },

  // Get complete booking with payment status
  getBookingWithPaymentStatus: async (bookingId) => {
    try {
      console.log("🔍 Fetching booking with payment status:", bookingId);

      const [bookingResponse, paymentsResponse] = await Promise.all([
        bookingsAPI.getById(bookingId),
        bookingsAPI.getBookingPayments(bookingId),
      ]);

      if (bookingResponse.data?.success && paymentsResponse.data?.success) {
        const booking = bookingResponse.data.data;
        const payments = paymentsResponse.data.data;

        return {
          success: true,
          booking: {
            ...booking,
            payments,
            paymentStatus: booking.paymentStatus,
            amountPaid: booking.amountPaid,
            remainingAmount: booking.remainingAmount,
          },
          message: "Booking with payment status retrieved successfully",
        };
      } else {
        throw new Error("Failed to fetch booking with payment data");
      }
    } catch (error) {
      console.error("❌ Error fetching booking with payment status:", error);
      return {
        success: false,
        booking: null,
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },

  // Process booking cancellation with refund
  cancelBookingWithRefund: async (bookingId, cancellationData) => {
    try {
      console.log("🚫 Processing booking cancellation with refund:", bookingId);

      // First calculate refund amount
      const refundCalculation = await bookingPaymentAPI.calculateRefund(
        bookingId,
        cancellationData
      );

      if (!refundCalculation.data?.success) {
        throw new Error("Failed to calculate refund amount");
      }

      // Then cancel the booking
      const cancelResponse = await bookingsAPI.cancel(
        bookingId,
        cancellationData.cancellationReason
      );

      if (cancelResponse.data?.success) {
        return {
          success: true,
          booking: cancelResponse.data.data.booking,
          refundDetails: cancelResponse.data.data.refundDetails,
          message:
            cancelResponse.data.message || "Booking cancelled successfully",
        };
      } else {
        throw new Error(
          cancelResponse.data?.message || "Failed to cancel booking"
        );
      }
    } catch (error) {
      console.error("❌ Error cancelling booking with refund:", error);
      return {
        success: false,
        booking: null,
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },

  // Get payment schedule for booking
  getBookingPaymentSchedule: async (bookingId) => {
    try {
      console.log("📅 Fetching payment schedule for booking:", bookingId);

      const response = await bookingPaymentAPI.getPaymentSchedule(bookingId);

      if (response.data?.success) {
        return {
          success: true,
          paymentSchedule: response.data.data,
          message: "Payment schedule retrieved successfully",
        };
      } else {
        throw new Error(
          response.data?.message || "Failed to fetch payment schedule"
        );
      }
    } catch (error) {
      console.error("❌ Error fetching payment schedule:", error);
      return {
        success: false,
        paymentSchedule: null,
        message: error.response?.data?.message || error.message,
        error: error.message,
      };
    }
  },
};

// Enhanced Ratings API with comprehensive functionality
export const ratingsAPI = {
  // Submit a rating for any entity type
  submit: (ratingData) => api.post("/ratings", ratingData),

  // Submit rating for specific entity types (convenience methods)
  submitBooking: (bookingId, ratingData) =>
    api.post("/ratings", {
      entityType: "booking",
      entityId: bookingId,
      ...ratingData,
    }),

  submitService: (serviceId, ratingData) =>
    api.post("/ratings", {
      entityType: "service",
      entityId: serviceId,
      ...ratingData,
    }),

  submitProduct: (productId, ratingData) =>
    api.post("/ratings", {
      entityType: "product",
      entityId: productId,
      ...ratingData,
    }),

  submitStaff: (staffId, ratingData) =>
    api.post("/ratings", {
      entityType: "staff",
      entityId: staffId,
      ...ratingData,
    }),

  submitAppointment: (appointmentId, ratingData) =>
    api.post("/ratings", {
      entityType: "appointment",
      entityId: appointmentId,
      ...ratingData,
    }),

  submitOrder: (orderId, ratingData) =>
    api.post("/ratings", {
      entityType: "order",
      entityId: orderId,
      ...ratingData,
    }),

  submitOrderProduct: (orderId, productId, ratingData) =>
    api.post("/ratings/order-product", {
      orderId,
      productId,
      ...ratingData,
    }),

  // Get ratings for specific entity
  getByEntity: (entityType, entityId, params = {}) =>
    api.get(`/ratings/${entityType}/${entityId}`, { params }),

  // Get user's ratings (ratings they gave)
  getMyRatings: (params = {}) =>
    api.get("/ratings/user/my-ratings", { params }),

  // Get user rating stats
  getMyStats: () => api.get("/ratings/user/stats"),

  // Get rateable entities for user
  getRateable: () => api.get("/ratings/user/rateable"),

  // Update existing rating
  update: (ratingId, updateData) => api.put(`/ratings/${ratingId}`, updateData),

  // Delete/remove rating
  delete: (ratingId) => api.delete(`/ratings/${ratingId}`),

  // Add response to rating (staff only)
  addResponse: (ratingId, responseText) =>
    api.post(`/ratings/${ratingId}/response`, { text: responseText }),

  // Flag rating (staff only)
  flag: (ratingId) => api.put(`/ratings/${ratingId}/flag`),

  // Get staff ratings
  getStaffRatings: (staffId, params = {}) =>
    api.get(`/ratings/staff/${staffId}`, { params }),

  // Check rating eligibility
  checkEligibility: (entityType, entityId) =>
    api.post("/ratings/check-eligibility", { entityType, entityId }),

  // Get rating summary for entity
  getSummary: (entityType, entityId) =>
    api.get(`/ratings/summary/${entityType}/${entityId}`),

  // Update rating stats manually
  updateStats: (entityType, entityId) =>
    api.put(`/ratings/update-stats/${entityType}/${entityId}`),

  // Export ratings (staff only)
  export: (params = {}) => api.get("/ratings/export", { params }),

  // Get ratings with advanced filters
  getWithFilters: (filters = {}) => api.get("/ratings", { params: filters }),
};

// ✅ FIXED: Attendance API - COMPLETE WITH BREAK FUNCTIONALITY AND LEADERBOARD INTEGRATION
export const attendanceAPI = {
  getDashboard: () => api.get("/attendance/dashboard"),
  clockIn: (locationData) => api.post("/attendance/clock-in", locationData),
  clockOut: (locationData) => api.post("/attendance/clock-out", locationData),
  startBreak: (breakData) => api.post("/attendance/break-start", breakData),
  endBreak: (locationData) => api.post("/attendance/break-end", locationData),
  getBreakStatus: () => api.get("/attendance/break-status"),
  getHistory: (params) => api.get("/attendance/history", { params }),
  getMonthlyChart: (year) =>
    api.get("/attendance/monthly-chart", { params: { year } }),
  getMonthlyStats: (params) => api.get("/attendance/monthly-stats", { params }),
  getStatus: () => api.get("/attendance/status"),

  // ✅ NEW: Enhanced break management
  getBreakHistory: (params) => api.get("/attendance/break-history", { params }),
  getBreakAnalytics: (period) =>
    api.get("/attendance/break-analytics", { params: { period } }),

  // ✅ NEW: Leaderboard integration for attendance
  updateLeaderboardFromAttendance: (userId, action, isOnTime = true) =>
    api.post("/attendance/update-leaderboard", { userId, action, isOnTime }),
};

// ✅ FIXED: Learning Modules API - COMPLETE WITH QUIZ SYSTEM AND ALL ENDPOINTS
export const learningModulesAPI = {
  getAll: (params) => api.get("/learning-modules", { params }),
  getFeatured: () => api.get("/learning-modules/featured"),
  getById: (id) => api.get(`/learning-modules/${id}`),
  enroll: (id) => api.post(`/learning-modules/${id}/enroll`),
  updateProgress: (id, progressData) =>
    api.put(`/learning-modules/${id}/progress`, progressData),
  getProgress: (id) => api.get(`/learning-modules/${id}/progress`),
  submitQuiz: (id, attemptData) =>
    api.post(`/learning-modules/${id}/quiz/attempt`, attemptData),
  getQuizResults: (id) => api.get(`/learning-modules/${id}/quiz/results`),
  getQuizAnalytics: (id) => api.get(`/learning-modules/${id}/quiz/analytics`),
  updateQuiz: (id, quizData) =>
    api.put(`/learning-modules/${id}/quiz`, quizData),
  toggleBookmark: (id) => api.post(`/learning-modules/${id}/bookmark`),
  getUserDashboard: () => api.get("/learning-modules/user/dashboard"),

  // ✅ NEW: Enhanced quiz and leaderboard integration
  completeWithLeaderboard: (id, quizData) =>
    api.post(`/learning-modules/${id}/complete-with-leaderboard`, quizData),
  getQuizAnalyticsAdmin: (id) =>
    api.get(`/learning-modules/${id}/quiz/analytics`),
  submitLegacyQuiz: (id, answers) =>
    api.post(`/learning-modules/${id}/quiz`, { answers }),
};

// ✅ FIXED: Leaderboards API - COMPLETE WITH ALL FUNCTIONALITY AND SERVICE INTEGRATION
export const leaderboardsAPI = {
  getAll: (type = "overall", limit = 50) =>
    api.get("/leaderboards", { params: { type, limit } }),
  getTopPerformers: (type = "overall") =>
    api.get("/leaderboards/top-performers", { params: { type } }),
  getProfile: (userId) => api.get(`/leaderboards/profile/${userId}`),
  getMyPerformance: () => api.get("/leaderboards/my-performance"),
  getDaily: (limit = 50) =>
    api.get("/leaderboards/daily", { params: { limit } }),
  getWeekly: (limit = 50) =>
    api.get("/leaderboards/weekly", { params: { limit } }),
  getMonthly: (limit = 50) =>
    api.get("/leaderboards/monthly", { params: { limit } }),
  updateFromQuiz: (quizData) =>
    api.post("/leaderboards/update-from-quiz", quizData),
  updateMetrics: (userId, metricsData) =>
    api.put(`/leaderboards/update-metrics/${userId}`, metricsData),
  awardBadge: (userId, badgeData) =>
    api.post(`/leaderboards/award-badge/${userId}`, badgeData),
  getStatistics: () => api.get("/leaderboards/statistics"),
  updateRankings: () => api.post("/leaderboards/admin/update-rankings"),
  resetPoints: (period) =>
    api.post("/leaderboards/admin/reset-points", { period }),
  getStaffPerformance: (userId) =>
    api.get(`/leaderboards/staff/performance/${userId}`),

  // ✅ NEW: Missing service endpoints
  updateAttendance: (userId, action, isOnTime = true) =>
    api.post("/leaderboards/update-attendance", { userId, action, isOnTime }),

  updateFromAppointment: (userId, revenue, serviceType = "standard") =>
    api.post("/leaderboards/update-appointment", {
      userId,
      revenue,
      serviceType,
    }),
};

// ✅ NEW: Leaderboard Service API - For integration with other modules
export const leaderboardServiceAPI = {
  updateAttendance: (userId, action, isOnTime = true) =>
    api.post("/leaderboard-service/update-attendance", {
      userId,
      action,
      isOnTime,
    }),

  getStaffPerformance: (userId) =>
    api.get(`/leaderboard-service/staff-performance/${userId}`),

  updateFromAppointment: (userId, revenue, serviceType = "standard") =>
    api.post("/leaderboard-service/update-appointment", {
      userId,
      revenue,
      serviceType,
    }),

  updateFromQuiz: (userId, score, pointsEarned = null) =>
    api.post("/leaderboard-service/update-from-quiz", {
      userId,
      score,
      pointsEarned,
    }),

  // ✅ NEW: Enhanced integration methods
  updateFromModule: (userId, moduleId, score) =>
    api.post("/leaderboard-service/update-from-module", {
      userId,
      moduleId,
      score,
    }),
};

// ✅ ENHANCED: Stylists API - Get all salon staff with profile images and availability
export const stylistsAPI = {
  // Get all stylists (salon staff) with profile images and availability
  getAll: (params = {}) => api.get("/stylists", { params }),

  // Get available stylists for booking with availability status
  getAvailable: () => api.get("/staff/available-stylists"),

  // Get stylist by ID with complete profile information
  getById: (id) => api.get(`/stylists/${id}`),

  // Get stylists by service with availability
  getByService: (serviceId) => api.get(`/stylists/service/${serviceId}`),

  // Search stylists with profile data
  search: (query, params = {}) =>
    api.get("/stylists/search", { params: { q: query, ...params } }),

  // Get top-rated stylists with images and ratings
  getTopRated: (limit = 10) =>
    api.get("/stylists/top-rated", { params: { limit } }),

  // Get stylist ratings and reviews
  getRatings: (stylistId, params = {}) =>
    api.get(`/stylists/${stylistId}/ratings`, { params }),

  // Get stylist availability for specific date
  getAvailability: (stylistId, date) =>
    api.get(`/stylists/${stylistId}/availability`, { params: { date } }),

  // Get stylist schedule
  getSchedule: (stylistId, startDate, endDate) =>
    api.get(`/stylists/${stylistId}/schedule`, {
      params: { startDate, endDate },
    }),
};

// ✅ ADD THESE INTEGRATION ENDPOINTS FOR BOOKING-PAYMENT SYNC:

// Booking-Payment Integration API
export const bookingPaymentAPI = {
  // Create booking with immediate payment
  createWithPayment: (bookingAndPaymentData) =>
    api.post("/bookings/create-with-payment", bookingAndPaymentData),

  // Get booking payment summary
  getPaymentSummary: (bookingId) =>
    api.get(`/bookings/${bookingId}/payment-summary`),

  // Calculate refund amount
  calculateRefund: (bookingId, cancellationData) =>
    api.post(`/bookings/${bookingId}/calculate-refund`, cancellationData),

  // Get payment schedule for booking
  getPaymentSchedule: (bookingId) =>
    api.get(`/bookings/${bookingId}/payment-schedule`),
};

// ✅ ADD THESE STAFF BOOKING MANAGEMENT ENDPOINTS:
export const staffBookingsAPI = {
  // Get staff's assigned bookings
  getMyBookings: (params = {}) => api.get("/staff/my-bookings", { params }),

  // Update booking notes (staff only)
  updateBookingNotes: (bookingId, notes) =>
    api.put(`/staff/bookings/${bookingId}/notes`, { notes }),

  // Assign staff to booking
  assignToBooking: (bookingId, staffId) =>
    api.put(`/staff/bookings/${bookingId}/assign`, { staffId }),

  // Get staff booking statistics
  getBookingStats: (staffId, period = "month") =>
    api.get(`/staff/${staffId}/booking-stats`, { params: { period } }),
};

// ✅ NEW: Reports Management API - FOR STAFF REPORTS AND ANALYTICS
export const reportsManagement = {
  // Get comprehensive reports data
  fetchComprehensiveReports: async (timeframe = "monthly") => {
    try {
      console.log(
        "📊 Fetching comprehensive reports for timeframe:",
        timeframe
      );

      // Use the existing staffAPI endpoints to fetch reports data
      const [
        performanceResponse,
        leaderboardResponse,
        modulesResponse,
        attendanceResponse,
      ] = await Promise.all([
        staffAPI.getPerformanceMetrics({ timeframe }),
        leaderboardsAPI.getMyPerformance(),
        learningModulesAPI.getUserDashboard(),
        attendanceAPI.getMonthlyStats({ timeframe }),
      ]);

      // Transform the data into the expected format
      const reportsData = {
        staff: {
          clientsCount: performanceResponse.data?.clientsCount || 0,
          questionsAnswered: performanceResponse.data?.questionsAnswered || 0,
          avgSessionLength:
            performanceResponse.data?.avgSessionLength || "0h 00m",
          knowledgeGain: performanceResponse.data?.knowledgeGain || 0,
          startingKnowledge: performanceResponse.data?.startingKnowledge || 50,
          currentKnowledge: performanceResponse.data?.currentKnowledge || 0,
          performanceScore: performanceResponse.data?.performanceScore || 0,
          monthlyGrowth: performanceResponse.data?.monthlyGrowth || 0,
          satisfactionRate: performanceResponse.data?.satisfactionRate || 0,
          productivity: performanceResponse.data?.productivity || 0,
          efficiency: performanceResponse.data?.efficiency || 0,
        },
        leaderboard: {
          topPerformers: leaderboardResponse.data?.topPerformers || [],
          myRank: leaderboardResponse.data?.myRank || 0,
          myPoints: leaderboardResponse.data?.myPoints || 0,
          totalParticipants: leaderboardResponse.data?.totalParticipants || 0,
          rankChange: leaderboardResponse.data?.rankChange || 0,
        },
        modules: {
          progress: modulesResponse.data?.progress || [],
          completedCount: modulesResponse.data?.completedCount || 0,
          inProgressCount: modulesResponse.data?.inProgressCount || 0,
          totalModules: modulesResponse.data?.totalModules || 0,
          certificationCount: modulesResponse.data?.certificationCount || 0,
        },
        attendance: {
          monthlyData:
            attendanceResponse.data?.monthlyData || Array(12).fill(0),
          presentDays: attendanceResponse.data?.presentDays || 0,
          absentDays: attendanceResponse.data?.absentDays || 0,
          lateDays: attendanceResponse.data?.lateDays || 0,
          attendanceRate: attendanceResponse.data?.attendanceRate || 0,
          punctuality: attendanceResponse.data?.punctuality || 0,
          averageHours: attendanceResponse.data?.averageHours || 0,
        },
        profile: performanceResponse.data?.profile || {},
      };

      return {
        success: true,
        data: reportsData,
        lastUpdated: new Date(),
        message: "Reports data fetched successfully",
      };
    } catch (error) {
      console.error("❌ Error fetching comprehensive reports:", error);
      return {
        success: false,
        error: error.message,
        data: null,
        message: "Failed to fetch reports data",
      };
    }
  },

  // Export reports data
  exportReportsData: async (format = "json") => {
    try {
      const response = await reportsAPI.exportReports(format);
      return {
        success: true,
        data: response.data,
        message: "Reports exported successfully",
      };
    } catch (error) {
      console.error("❌ Error exporting reports:", error);
      return {
        success: false,
        error: error.message,
        data: null,
        message: "Failed to export reports",
      };
    }
  },

  // Get performance analytics
  getPerformanceAnalytics: async (timeframe = "monthly") => {
    try {
      const response = await staffPerformanceAPI.getMetrics(timeframe);
      return {
        success: true,
        data: response.data,
        message: "Performance analytics fetched successfully",
      };
    } catch (error) {
      console.error("❌ Error fetching performance analytics:", error);
      return {
        success: false,
        error: error.message,
        data: null,
        message: "Failed to fetch performance analytics",
      };
    }
  },

  // Get attendance reports
  getAttendanceReports: async (params = {}) => {
    try {
      const response = await reportsAPI.getAttendanceReports(params);
      return {
        success: true,
        data: response.data,
        message: "Attendance reports fetched successfully",
      };
    } catch (error) {
      console.error("❌ Error fetching attendance reports:", error);
      return {
        success: false,
        error: error.message,
        data: null,
        message: "Failed to fetch attendance reports",
      };
    }
  },
};

// ✅ COMPLETED: Enhanced Staff API with ALL FUNCTIONALITY from staffRoutes.js
export const staffAPI = {
  // ==================== TRAINING MODULES FOR STAFF ====================
  getTrainingModules: (params) =>
    api.get("/staff/training-modules", { params }),
  getTrainingModule: (id) => api.get(`/staff/training-modules/${id}`),

  // ==================== STAFF DASHBOARD ====================
  getDashboard: () => api.get("/staff/dashboard"),
  getEnhancedDashboard: () => api.get("/staff/dashboard/enhanced"),

  // ==================== AVAILABLE STYLISTS ====================
  getAvailableStylists: () => api.get("/staff/available-stylists"),

  // ==================== STAFF APPOINTMENT MANAGEMENT ====================
  getAppointments: (params) => api.get("/staff/appointments", { params }),
  completeAppointment: (id, data) =>
    api.put(`/staff/appointments/${id}/complete`, data),
  cancelAppointment: (id, data) =>
    api.put(`/staff/appointments/${id}/cancel`, data),
  getAppointmentStats: () => api.get("/staff/appointments/stats"),

  // ==================== CLIENT BOOKINGS ====================
  getClientBookings: (params) => api.get("/staff/client-bookings", { params }),
  updateBookingStatus: (id, statusData) =>
    api.put(`/staff/bookings/${id}/status`, statusData),

  // ==================== STAFF PROFILE ====================
  getProfile: () => api.get("/staff/profile"),
  updateProfile: (profileData) => api.put("/staff/profile", profileData),

  // ==================== FAVORITES MANAGEMENT ====================
  getFavorites: () => api.get("/staff/favorites/learning-modules"),
  addFavorite: (moduleId) =>
    api.post(`/staff/favorites/learning-modules/${moduleId}`),
  removeFavorite: (favoriteId) =>
    api.delete(`/staff/favorites/learning-modules/${favoriteId}`),

  // ==================== LEARNING MODULES ====================
  getLearningModules: (params) =>
    api.get("/staff/learning-modules", { params }),
  completeModule: (moduleId, quizData) =>
    api.post(`/staff/learning-modules/${moduleId}/complete`, quizData),

  // ==================== LEADERBOARD ====================
  getLeaderboard: (params) => api.get("/staff/leaderboard", { params }),

  // ==================== ATTENDANCE REPORTS ====================
  getAttendanceReport: (params) =>
    api.get("/staff/attendance/report", { params }),

  // ==================== NEW BOOKINGS NOTIFICATION ====================
  getNewBookings: (lastChecked) =>
    api.get("/staff/bookings/new", { params: { lastChecked } }),

  // ==================== STAFF REPORTS & ANALYTICS ====================
  getComprehensiveReports: (params) =>
    api.get("/staff/reports/comprehensive", { params }),
  getPerformanceMetrics: (params) =>
    api.get("/staff/performance/metrics", { params }),
  getPerformanceAnalytics: (params) =>
    api.get("/staff/performance/analytics", { params }),
  exportReports: (format = "json") =>
    api.get("/staff/reports/export", { params: { format } }),

  // ==================== ENHANCED METHODS ====================
  completeAppointmentWithNotes: (id, staffNotes) =>
    api.put(`/staff/appointments/${id}/complete`, { staffNotes }),
  cancelAppointmentWithReason: (id, cancellationReason, staffNotes) =>
    api.put(`/staff/appointments/${id}/cancel`, {
      cancellationReason,
      staffNotes,
    }),
  getAppointmentStatsWithPeriod: (period = "month") =>
    api.get("/staff/appointments/stats", { params: { period } }),
  getDetailedProfile: () => api.get("/staff/profile"),
  updateDetailedProfile: (profileData) =>
    api.put("/staff/profile", profileData),
  getModuleFavorites: () => api.get("/staff/favorites/learning-modules"),
  addModuleToFavorites: (moduleId) =>
    api.post(`/staff/favorites/learning-modules/${moduleId}`),
  removeModuleFromFavorites: (favoriteId) =>
    api.delete(`/staff/favorites/learning-modules/${favoriteId}`),
  getLearningModulesWithProgress: (params = {}) =>
    api.get("/staff/learning-modules", { params }),
  markModuleCompleted: (moduleId, quizData) =>
    api.post(`/staff/learning-modules/${moduleId}/complete`, quizData),
  getLeaderboardByType: (type = "overall", limit = 50) =>
    api.get("/staff/leaderboard", { params: { type, limit } }),
  getMonthlyAttendanceReport: (year, month) =>
    api.get("/staff/attendance/report", { params: { year, month } }),
  checkNewBookings: (lastChecked) =>
    api.get("/staff/bookings/new", { params: { lastChecked } }),
  getFilteredClientBookings: (filters = {}) =>
    api.get("/staff/client-bookings", { params: filters }),
  getTrainingModulesByCategory: (
    category,
    status = "all",
    page = 1,
    limit = 20
  ) =>
    api.get("/staff/training-modules", {
      params: { category, status, page, limit },
    }),

  // ==================== STAFF LISTING AND MANAGEMENT ====================
  getAllStaff: (params = {}) => api.get("/staff/all", { params }),
  getStaffById: (id) => api.get(`/staff/${id}`),
  updateStaffStatus: (id, statusData) =>
    api.put(`/staff/${id}/status`, statusData),
  uploadStaffImage: (staffId, formData) =>
    api.post(`/staff/${staffId}/profile-image`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  // ==================== REPORTS-SPECIFIC ENDPOINTS ====================
  getReports: (params = {}) => api.get("/staff/reports", { params }),
  getPerformance: (timeframe = "monthly") =>
    api.get("/staff/performance", { params: { timeframe } }),
  getAnalytics: () => api.get("/staff/analytics"),
  getClientStats: () => api.get("/staff/clients/stats"),
  getSessionStats: () => api.get("/staff/sessions/stats"),

  // ==================== ENHANCED CLIENT BOOKINGS MANAGEMENT ====================
  getClientBookingsWithDetails: (params = {}) =>
    api.get("/staff/client-bookings", { params }),
  updateBookingStatusWithNotes: (id, statusData) =>
    api.put(`/staff/bookings/${id}/status`, statusData),

  // ==================== TRAINING MODULE PROGRESS TRACKING ====================
  getTrainingModuleProgress: (moduleId) =>
    api.get(`/staff/training-modules/${moduleId}/progress`),
  updateTrainingModuleProgress: (moduleId, progressData) =>
    api.put(`/staff/training-modules/${moduleId}/progress`, progressData),

  // ==================== STAFF PERFORMANCE AND ANALYTICS ====================
  getStaffPerformanceMetrics: (timeframe = "monthly") =>
    api.get("/staff/performance/metrics", { params: { timeframe } }),
  getStaffAttendanceAnalytics: (params = {}) =>
    api.get("/staff/attendance/analytics", { params }),

  // ==================== ENHANCED FAVORITES MANAGEMENT ====================
  checkModuleFavoriteStatus: (moduleId) =>
    api.get(`/staff/favorites/learning-modules/check/${moduleId}`),

  // ==================== BOOKING MANAGEMENT UTILITIES ====================
  getBookingAnalytics: (params = {}) =>
    api.get("/staff/bookings/analytics", { params }),
  updateMultipleBookingStatus: (bookingIds, statusData) =>
    api.put("/staff/bookings/bulk-status", { bookingIds, statusData }),

  // ==================== STAFF AVAILABILITY MANAGEMENT ====================
  updateStaffAvailability: (availabilityData) =>
    api.put("/staff/availability", availabilityData),
  getStaffSchedule: (params = {}) => api.get("/staff/schedule", { params }),

  // ==================== CLIENT MANAGEMENT ====================
  getStaffClients: (params = {}) => api.get("/staff/clients", { params }),
  getClientDetails: (clientId) => api.get(`/staff/clients/${clientId}`),
  updateClientNotes: (clientId, notes) =>
    api.put(`/staff/clients/${clientId}/notes`, { notes }),

  // ==================== REVENUE AND SALES TRACKING ====================
  getStaffRevenue: (params = {}) => api.get("/staff/revenue", { params }),
  getServicePerformance: (params = {}) =>
    api.get("/staff/services/performance", { params }),

  // ==================== NOTIFICATION MANAGEMENT ====================
  getStaffNotifications: (params = {}) =>
    api.get("/staff/notifications", { params }),
  markNotificationAsRead: (notificationId) =>
    api.put(`/staff/notifications/${notificationId}/read`),
  clearStaffNotifications: () => api.delete("/staff/notifications/clear"),

  // ==================== SETTINGS AND PREFERENCES ====================
  getStaffSettings: () => api.get("/staff/settings"),
  updateStaffSettings: (settings) => api.put("/staff/settings", settings),

  // ==================== INTEGRATION WITH OTHER MODULES ====================
  syncLeaderboardData: () => api.post("/staff/leaderboard/sync"),
  updateLearningProgress: (progressData) =>
    api.post("/staff/learning/progress", progressData),
};

// ✅ CORRECTED: Staff API Client with proper endpoints that match your backend
export const staffApiClient = {
  // ==================== APPOINTMENT MANAGEMENT ====================
  getAllBookingsForStaff: (params = {}) =>
    api.get("/staff/appointments", { params }), // Changed from /staff/bookings/all

  getStaffAppointments: (params = {}) =>
    api.get("/staff/appointments", { params }),

  completeAppointment: (appointmentId, notes = "") =>
    api.put(`/staff/appointments/${appointmentId}/complete`, {
      staffNotes: notes,
    }),

  startAppointment: (appointmentId) =>
    api.put(`/staff/appointments/${appointmentId}/start`),

  cancelAppointment: (appointmentId, reason = "") =>
    api.put(`/staff/appointments/${appointmentId}/cancel`, {
      cancellationReason: reason,
    }),

  updateAppointmentStatus: (appointmentId, statusData) =>
    api.put(`/staff/appointments/${appointmentId}/status`, statusData),

  getAppointmentDetails: (appointmentId) =>
    api.get(`/staff/appointments/${appointmentId}`),

  // ==================== CLIENT MANAGEMENT ====================
  getStaffClients: (params = {}) => api.get("/staff/clients", { params }),

  getClientDetails: (clientId) => api.get(`/staff/clients/${clientId}`),

  updateClientNotes: (clientId, notes) =>
    api.put(`/staff/clients/${clientId}/notes`, { notes }),

  // ==================== DASHBOARD & REPORTS ====================
  getStaffDashboard: () => api.get("/staff/dashboard"),

  getAppointmentStats: (period = "month") =>
    api.get("/staff/appointments/stats", { params: { period } }),

  // ==================== UTILITY METHODS ====================
  sendAppointmentReminder: (appointmentId) =>
    api.post(`/staff/appointments/${appointmentId}/reminder`),

  updateAppointmentNotes: (appointmentId, notes) =>
    api.put(`/staff/appointments/${appointmentId}/notes`, {
      staffNotes: notes,
    }),

  getTodayAppointments: () => api.get("/staff/appointments/today"),

  getUpcomingAppointments: (limit = 10) =>
    api.get("/staff/appointments/upcoming", { params: { limit } }),
};

// Enhanced version with error handling
export const staffAppointmentService = {
  // Get appointments with enhanced error handling
  getAppointments: async (params = {}) => {
    try {
      const response = await staffApiClient.getStaffAppointments(params);
      return {
        success: true,
        data: response.data?.data || response.data,
        message: "Appointments retrieved successfully",
      };
    } catch (error) {
      console.error("❌ Error fetching appointments:", error);
      return {
        success: false,
        data: [],
        message: handleApiError(error).message,
        error: error.message,
      };
    }
  },

  // Complete appointment with validation
  completeAppointment: async (appointmentId, notes = "") => {
    try {
      const response = await staffApiClient.completeAppointment(
        appointmentId,
        notes
      );
      return {
        success: true,
        data: response.data?.data,
        message: "Appointment completed successfully",
      };
    } catch (error) {
      console.error("❌ Error completing appointment:", error);
      return {
        success: false,
        message: handleApiError(error).message,
        error: error.message,
      };
    }
  },

  // Start appointment service
  startAppointment: async (appointmentId) => {
    try {
      const response = await staffApiClient.startAppointment(appointmentId);
      return {
        success: true,
        data: response.data?.data,
        message: "Service started successfully",
      };
    } catch (error) {
      console.error("❌ Error starting appointment:", error);
      return {
        success: false,
        message: handleApiError(error).message,
        error: error.message,
      };
    }
  },
};

// Enhanced Customer API with rating functions
export const customerAPI = {
  getDashboard: () => api.get("/customer/dashboard"),
  getBookings: (params) => api.get("/customer/bookings", { params }),
  createBooking: (bookingData) => api.post("/customer/bookings", bookingData),
  cancelBooking: (id, reason) =>
    api.put(`/customer/bookings/${id}/cancel`, { cancellationReason: reason }),
  getFavorites: () => api.get("/customer/favorites"),
  addFavorite: (serviceId) => api.post("/customer/favorites", { serviceId }),
  removeFavorite: (favoriteId) =>
    api.delete(`/customer/favorites/${favoriteId}`),
  getAppointments: (params) => api.get("/customer/appointments", { params }),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (profileData) => api.put("/auth/profile", profileData),
  uploadProfileImage: (formData) =>
    api.post("/auth/profile/picture", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    }),
  getOrderHistory: (params) => api.get("/customer/orders", { params }),
  getLoyaltyPoints: () => api.get("/customer/loyalty-points"),
  getAccountDetails: () => api.get("/customer/account"),
  updateAccountDetails: (accountData) =>
    api.put("/customer/account", accountData),
  changePassword: (passwordData) =>
    api.post("/auth/change-password", passwordData),
  getNotifications: (params) => api.get("/customer/notifications", { params }),
  markNotificationRead: (notificationId) =>
    api.put(`/customer/notifications/${notificationId}/read`),

  // Rating functions for customers
  getMyRatings: (params = {}) => api.get("/customer/ratings", { params }),

  getRateableItems: () => api.get("/customer/rateable-items"),

  getRatingStats: () => api.get("/customer/rating-stats"),

  // ✅ ENHANCED: Customer access to stylist information with images
  getAvailableStylists: () => api.get("/stylists"),
  getStylistProfile: (stylistId) => api.get(`/stylists/${stylistId}`),
  getStylistReviews: (stylistId, params = {}) =>
    api.get(`/stylists/${stylistId}/reviews`, { params }),
};

// Enhanced Cart Management Functions
export const cartManagement = {
  // Get cart with enhanced error handling
  getCart: async () => {
    try {
      const response = await cartAPI.get();
      return {
        success: true,
        cart: response.data.data,
        message: "Cart retrieved successfully",
      };
    } catch (error) {
      console.error("❌ Error getting cart:", error);
      return {
        success: false,
        cart: null,
        message: "Error retrieving cart",
        error: error.message,
      };
    }
  },

  // Add to cart with validation
  addToCart: async (productId, quantity = 1) => {
    try {
      const response = await cartAPI.add({ productId, quantity });
      return {
        success: true,
        cart: response.data.data,
        message: "Product added to cart successfully",
      };
    } catch (error) {
      console.error("❌ Error adding to cart:", error);

      if (error.response?.status === 400) {
        return {
          success: false,
          cart: null,
          message: error.response.data.message || "Cannot add product to cart",
          error: error.response.data.error,
        };
      }

      return {
        success: false,
        cart: null,
        message: "Error adding product to cart",
        error: error.message,
      };
    }
  },

  // Update cart item quantity
  updateCartItem: async (itemId, quantity) => {
    try {
      const response = await cartAPI.update(itemId, quantity);
      return {
        success: true,
        cart: response.data.data,
        message: "Cart updated successfully",
      };
    } catch (error) {
      console.error("❌ Error updating cart:", error);
      return {
        success: false,
        cart: null,
        message: "Error updating cart",
        error: error.message,
      };
    }
  },

  // Remove item from cart
  removeFromCart: async (itemId) => {
    try {
      const response = await cartAPI.remove(itemId);
      return {
        success: true,
        cart: response.data.data,
        message: "Item removed from cart",
      };
    } catch (error) {
      console.error("❌ Error removing from cart:", error);
      return {
        success: false,
        cart: null,
        message: "Error removing item from cart",
        error: error.message,
      };
    }
  },

  // Clear entire cart
  clearCart: async () => {
    try {
      const response = await cartAPI.clear();
      return {
        success: true,
        cart: response.data.data,
        message: "Cart cleared successfully",
      };
    } catch (error) {
      console.error("❌ Error clearing cart:", error);
      return {
        success: false,
        cart: null,
        message: "Error clearing cart",
        error: error.message,
      };
    }
  },

  // Get cart summary (count and total)
  getCartSummary: async () => {
    try {
      const cartResponse = await cartAPI.get();
      const cart = cartResponse.data.data;

      const itemCount = cartAPI.utils.getItemsCount(cart);
      const totalAmount = cartAPI.utils.calculateTotal(cart);

      return {
        success: true,
        itemCount,
        totalAmount,
        message: "Cart summary retrieved successfully",
      };
    } catch (error) {
      console.error("❌ Error getting cart summary:", error);
      return {
        success: false,
        itemCount: 0,
        totalAmount: 0,
        message: "Error getting cart summary",
        error: error.message,
      };
    }
  },
};

// ✅ ENHANCED ERROR HANDLING FOR BOOKING-PAYMENT INTEGRATION
export const handleBookingPaymentError = (error) => {
  const baseError = handleApiError(error);

  // Booking-specific errors
  if (error.response?.status === 400) {
    const errorData = error.response.data;

    if (errorData.message?.includes("staff not available")) {
      return {
        ...baseError,
        isBookingError: true,
        type: "STAFF_UNAVAILABLE",
        message: "Selected staff is not available at the chosen time",
        suggestion: "Please choose a different time or staff member",
      };
    }

    if (errorData.message?.includes("time slot booked")) {
      return {
        ...baseError,
        isBookingError: true,
        type: "TIME_SLOT_BOOKED",
        message: "This time slot is already booked",
        suggestion: "Please select a different time slot",
      };
    }
  }

  // Payment-specific errors
  if (error.response?.data?.error?.includes("payment")) {
    return {
      ...baseError,
      isPaymentError: true,
      message: "Payment processing error",
      suggestion: "Please check your payment details and try again",
    };
  }

  if (error.response?.data?.error?.includes("insufficient funds")) {
    return {
      ...baseError,
      isPaymentError: true,
      type: "INSUFFICIENT_FUNDS",
      message: "Insufficient funds for payment",
      suggestion: "Please use a different payment method or contact your bank",
    };
  }

  return baseError;
};

// Enhanced Favorites Management Functions
export const favoritesManagement = {
  // Get favorites with data transformation
  getFavorites: async () => {
    try {
      const response = await favoritesAPI.getAll();
      const transformedData = favoritesAPI.utils.transformFavoritesData(
        response.data.data
      );

      return {
        success: true,
        favorites: transformedData,
        count: transformedData.length,
        message: "Favorites retrieved successfully",
      };
    } catch (error) {
      console.error("❌ Error getting favorites:", error);
      return {
        success: false,
        favorites: [],
        count: 0,
        message: "Error retrieving favorites",
        error: error.message,
      };
    }
  },

  // Add to favorites with validation
  addToFavorites: async (productId) => {
    try {
      const response = await favoritesAPI.add(productId);
      return {
        success: true,
        favorite: response.data.data,
        message: "Product added to favorites successfully",
      };
    } catch (error) {
      console.error("❌ Error adding to favorites:", error);

      if (error.response?.status === 400) {
        return {
          success: false,
          favorite: null,
          message: error.response.data.message || "Cannot add to favorites",
          error: error.response.data.error,
        };
      }

      return {
        success: false,
        favorite: null,
        message: "Error adding product to favorites",
        error: error.message,
      };
    }
  },

  // Remove from favorites
  removeFromFavorites: async (favoriteId) => {
    try {
      const response = await favoritesAPI.remove(favoriteId);
      return {
        success: true,
        message: "Product removed from favorites",
        data: response.data,
      };
    } catch (error) {
      console.error("❌ Error removing from favorites:", error);
      return {
        success: false,
        message: "Error removing product from favorites",
        error: error.message,
      };
    }
  },

  // Check favorite status
  checkFavoriteStatus: async (productId) => {
    try {
      const response = await favoritesAPI.check(productId);
      return {
        success: true,
        isFavorite: response.data.isFavorite,
        favoriteId: response.data.favoriteId,
        message: "Favorite status checked successfully",
      };
    } catch (error) {
      console.error("❌ Error checking favorite status:", error);
      return {
        success: false,
        isFavorite: false,
        favoriteId: null,
        message: "Error checking favorite status",
        error: error.message,
      };
    }
  },

  // Toggle favorite status
  toggleFavorite: async (productId, currentFavorites = []) => {
    try {
      const isCurrentlyFavorited = favoritesAPI.utils.isProductFavorited(
        currentFavorites,
        productId
      );

      if (isCurrentlyFavorited) {
        const favoriteId = favoritesAPI.utils.getFavoriteId(
          currentFavorites,
          productId
        );
        if (favoriteId) {
          await favoritesAPI.remove(favoriteId);
          return {
            success: true,
            isFavorite: false,
            action: "removed",
            message: "Product removed from favorites",
          };
        }
      } else {
        await favoritesAPI.add(productId);
        return {
          success: true,
          isFavorite: true,
          action: "added",
          message: "Product added to favorites",
        };
      }

      return {
        success: false,
        message: "Unable to toggle favorite",
      };
    } catch (error) {
      console.error("❌ Error toggling favorite:", error);
      return {
        success: false,
        message: "Error toggling favorite",
        error: error.message,
      };
    }
  },

  // Get favorite products
  getFavoriteProducts: async () => {
    try {
      const favoritesResult = await favoritesManagement.getFavorites();
      if (!favoritesResult.success) {
        return favoritesResult;
      }

      const products = favoritesAPI.utils.extractProducts(
        favoritesResult.favorites
      );

      return {
        success: true,
        products,
        count: products.length,
        message: "Favorite products retrieved successfully",
      };
    } catch (error) {
      console.error("❌ Error getting favorite products:", error);
      return {
        success: false,
        products: [],
        count: 0,
        message: "Error getting favorite products",
        error: error.message,
      };
    }
  },
};

// ✅ NEW: Staff Reports API - COMPLETE WITH ALL REPORTS FUNCTIONALITY
export const reportsAPI = {
  // Get comprehensive staff reports data
  getStaffReports: (params = {}) => api.get("/staff/reports", { params }),

  // Get performance analytics
  getPerformanceAnalytics: (timeframe = "monthly") =>
    api.get("/staff/performance/analytics", { params: { timeframe } }),

  // Get attendance reports
  getAttendanceReports: (params = {}) =>
    api.get("/staff/attendance/reports", { params }),

  // Get learning progress reports
  getLearningReports: () => api.get("/staff/learning/reports"),

  // Get leaderboard data for reports
  getLeaderboardReports: (type = "overall") =>
    api.get("/staff/leaderboard/reports", { params: { type } }),

  // Export reports data
  exportReports: (format = "json") =>
    api.get("/staff/reports/export", { params: { format } }),
};

// ✅ NEW: Staff Performance API - SPECIFICALLY FOR REPORTS
export const staffPerformanceAPI = {
  // Get comprehensive dashboard data
  getDashboard: () => api.get("/staff/performance/dashboard"),

  // Get performance metrics
  getMetrics: (timeframe = "monthly") =>
    api.get("/staff/performance/metrics", { params: { timeframe } }),

  // Get performance trends
  getTrends: (period = "30d") =>
    api.get("/staff/performance/trends", { params: { period } }),

  // Get comparison data
  getComparison: (compareWith = "team") =>
    api.get("/staff/performance/comparison", { params: { compareWith } }),

  // Get knowledge progress
  getKnowledgeProgress: () => api.get("/staff/performance/knowledge"),
};

// ✅ NEW: Staff Profile API - FOR CURRENT USER DATA
export const staffProfileAPI = {
  // Get complete staff profile
  getCompleteProfile: () => api.get("/staff/profile/complete"),

  // Get staff statistics
  getStats: () => api.get("/staff/profile/stats"),

  // Update staff profile
  updateProfile: (profileData) => api.put("/staff/profile", profileData),

  // Get staff achievements
  getAchievements: () => api.get("/staff/profile/achievements"),
};

// Enhanced error handling with progressive delay support
export const handleApiError = (error) => {
  if (error.isRateLimit) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Too many attempts. Please wait.",
      error: "RATE_LIMIT_EXCEEDED",
      status: error.response?.status || 429,
      delayActive: error.delayActive,
      remainingTime: error.remainingTime,
      failedAttempts: error.failedAttempts,
      isRateLimit: true,
    };
  }

  if (error.response) {
    const errorData = error.response.data;

    return {
      success: false,
      message: errorData.message || "An error occurred",
      error: errorData.error,
      status: error.response.status,
      data: errorData,
      validationErrors: errorData.validationErrors,
    };
  } else if (error.request) {
    return {
      success: false,
      message: "Network error. Please check your connection.",
      error: "NETWORK_ERROR",
    };
  } else {
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    };
  }
};

// Enhanced authentication utilities
export const getToken = () => {
  return localStorage.getItem("token") || localStorage.getItem("authToken");
};

export const setToken = (token) => {
  if (token) {
    localStorage.setItem("token", token);
    localStorage.setItem("authToken", token);
  }
};

export const setUser = (userData) => {
  if (userData && typeof userData === "object") {
    localStorage.setItem("user", JSON.stringify(userData));
  }
};

export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;

    const user = JSON.parse(userStr);

    if (!user.id || !user.role) {
      console.warn("Invalid user data structure");
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
};

export const isAuthenticated = () => {
  const token = getToken();
  const user = getCurrentUser();

  if (!token || !user) return false;

  if (isSessionExpired()) {
    handleLogout();
    return false;
  }

  return true;
};

export const getUserRole = () => {
  const user = getCurrentUser();
  return user?.role || null;
};

export const isStaff = () => {
  return getUserRole() === "salon_staff";
};

export const isCustomer = () => {
  return getUserRole() === "customer";
};

export const isAdmin = () => {
  return getUserRole() === "admin";
};

export const isGuest = () => {
  const user = getCurrentUser();
  return user?.isGuest || false;
};

export const handleLogout = () => {
  const tokens = ["token", "authToken", "user", "sessionExpiry"];
  tokens.forEach((item) => localStorage.removeItem(item));

  window.dispatchEvent(new CustomEvent("authLogout"));
};

export const logout = () => {
  handleLogout();
  window.location.href = "/role-selection";
};

// Enhanced session management
export const getSessionExpiry = () => {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ? new Date(payload.exp * 1000) : null;
  } catch (error) {
    console.error("Error parsing token expiry:", error);
    return null;
  }
};

export const isSessionExpired = () => {
  const expiry = getSessionExpiry();
  return expiry ? expiry < new Date() : true;
};

export const getSessionTimeRemaining = () => {
  const expiry = getSessionExpiry();
  if (!expiry) return 0;

  const now = new Date();
  return Math.max(0, expiry.getTime() - now.getTime());
};

// Enhanced authentication flow helpers
export const authHelpers = {
  handleLoginResponse: (response) => {
    const { token, user, message, redirectTo } = response.data;

    if (token && user) {
      setToken(token);
      setUser(user);

      const expiry = getSessionExpiry();
      if (expiry) {
        localStorage.setItem("sessionExpiry", expiry.toISOString());
      }

      return {
        success: true,
        user,
        token,
        message: message || "Login successful!",
        redirectTo: redirectTo || getDefaultRedirect(user.role),
      };
    }

    throw new Error("Invalid login response: missing token or user data");
  },

  handleRegisterResponse: (response) => {
    const { token, user, message } = response.data;

    if (token && user) {
      setToken(token);
      setUser(user);

      return {
        success: true,
        user,
        token,
        message: message || "Registration successful!",
        redirectTo: getDefaultRedirect(user.role),
      };
    }

    return {
      success: true,
      message: message || "Registration successful! Please log in.",
      requiresLogin: !token,
    };
  },

  handleOTPResponse: (response) => {
    const { success, message, nextStep, userId } = response.data;

    return {
      success,
      message,
      nextStep,
      userId,
    };
  },

  handleProfileSetupResponse: (response) => {
    const { success, message, nextStep, user } = response.data;

    if (user) {
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.id === user.id) {
        setUser({ ...currentUser, ...user });
      }
    }

    return {
      success,
      message,
      nextStep,
      user,
    };
  },
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

// Progressive delay helper
export const delayHelper = {
  getRemainingDelay: (error) => {
    if (error.delayActive) {
      return error.remainingTime || error.delaySeconds || 0;
    }
    return 0;
  },

  formatDelayMessage: (remainingTime) => {
    if (remainingTime <= 0) return "";

    if (remainingTime < 60) {
      return `Please wait ${remainingTime} seconds before trying again.`;
    } else {
      const minutes = Math.ceil(remainingTime / 60);
      return `Please wait ${minutes} minute${
        minutes > 1 ? "s" : ""
      } before trying again.`;
    }
  },

  wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

// Enhanced file upload with progress tracking
export const uploadWithProgress = (url, formData, onProgress) => {
  return api.post(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
};

// Batch request utility
export const makeBatchRequests = async (requests) => {
  try {
    const responses = await Promise.all(requests);
    return responses.map((response) => ({
      success: true,
      data: response.data,
    }));
  } catch (error) {
    return requests.map((_, index) => {
      if (error[index]) {
        return handleApiError(error[index]);
      }
      return {
        success: false,
        message: "Request failed",
      };
    });
  }
};

// API health check with retry logic
export const checkAPIHealth = async (maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await api.get("/health");
      return {
        success: true,
        status: response.status,
        data: response.data,
        attempt,
      };
    } catch (error) {
      if (attempt === maxRetries) {
        return {
          success: false,
          message: "API is unavailable",
          error: error.message,
          attempt,
        };
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
};

// ✅ ENHANCED: Staff Utility Functions for rendering staff information
export const staffUtils = {
  // Format staff data for display with proper image handling
  formatStaffData: (staffData) => {
    if (!staffData) return null;

    // Handle profile image URL
    let profileImageUrl = staffData.profileImage;
    if (!profileImageUrl || profileImageUrl === "") {
      // Generate default avatar based on name
      const name = staffData.firstName || staffData.username || "Staff";
      profileImageUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        name
      )}&backgroundColor=65c9ff,b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    } else if (profileImageUrl.startsWith("/")) {
      // Handle relative URLs - prepend base URL
      const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      profileImageUrl = `${baseURL}${profileImageUrl}`;
    }

    return {
      id: staffData._id || staffData.id,
      username: staffData.username || "Unknown Staff",
      firstName: staffData.firstName || staffData.username || "Staff Member",
      email: staffData.email || "No email",
      phoneNumber: staffData.phoneNumber || "No phone",
      profileImage: profileImageUrl,
      role: staffData.role || "salon_staff",
      position: staffData.position || "Stylist",
      staffId: staffData.staffId || "N/A",
      isActive: staffData.isActive !== false,
      hireDate: staffData.hireDate
        ? new Date(staffData.hireDate).toLocaleDateString()
        : "Unknown",
      rating: staffData.rating || staffData.averageRating || 4.5,
      reviewCount: staffData.reviewCount || staffData.totalReviews || 0,
      topRated: staffData.topRated || false,
      experience: staffData.experience || "1+ years",
      specialization: staffData.specialization || staffData.skills || [],
      bio: staffData.bio || staffData.description || "",
      availability: staffData.availability || "available",

      // Additional formatted fields
      displayName: staffData.firstName
        ? `${staffData.firstName}`
        : staffData.username || "Staff Member",
      initials: staffUtils.getInitials(
        staffData.firstName || staffData.username || "S"
      ),
      joinYear: staffData.hireDate
        ? new Date(staffData.hireDate).getFullYear()
        : new Date().getFullYear(),
      yearsExperience: staffData.hireDate
        ? new Date().getFullYear() - new Date(staffData.hireDate).getFullYear()
        : 1,
    };
  },

  // Get initials from name
  getInitials: (name) => {
    if (!name) return "S";
    return name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  },

  // Validate and format profile image URL
  validateProfileImage: (imageUrl, staffName = "Staff") => {
    if (!imageUrl || imageUrl === "" || imageUrl === "null") {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        staffName
      )}&backgroundColor=65c9ff,b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    }

    // Check if it's a default avatar or uploaded image
    if (imageUrl.includes("dicebear") || imageUrl.includes("http")) {
      return imageUrl;
    }

    // Handle uploaded images - prepend base URL if needed
    if (imageUrl.startsWith("/uploads") || imageUrl.startsWith("/images")) {
      const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      return `${baseURL}${imageUrl}`;
    }

    return imageUrl;
  },

  // Check staff availability
  checkAvailability: (staffData, selectedDate, selectedTime) => {
    if (!staffData.availability) return true;

    // Simple availability check - you can enhance this with more complex logic
    if (staffData.availability === "available") return true;
    if (staffData.availability === "unavailable") return false;

    // Check against specific date/time if provided
    if (selectedDate && selectedTime) {
      // Add your availability logic here based on staff schedule
      return true; // Default to available
    }

    return true;
  },

  // Format availability status
  formatAvailability: (availability) => {
    switch (availability) {
      case "available":
        return {
          status: "Available",
          color: "var(--success)",
          icon: "fas fa-check-circle",
        };
      case "busy":
        return {
          status: "Busy",
          color: "var(--warning)",
          icon: "fas fa-clock",
        };
      case "unavailable":
        return {
          status: "Unavailable",
          color: "var(--error)",
          icon: "fas fa-times-circle",
        };
      case "on-break":
        return {
          status: "On Break",
          color: "var(--text-muted)",
          icon: "fas fa-coffee",
        };
      default:
        return {
          status: "Available",
          color: "var(--success)",
          icon: "fas fa-check-circle",
        };
    }
  },

  // Sort staff by various criteria
  sortStaff: (staffList, sortBy = "name", sortOrder = "asc") => {
    const sorted = [...staffList];

    switch (sortBy) {
      case "name":
        sorted.sort((a, b) => {
          const nameA = a.firstName || a.username || "";
          const nameB = b.firstName || b.username || "";
          return sortOrder === "asc"
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        });
        break;
      case "rating":
        sorted.sort((a, b) => {
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          return sortOrder === "asc" ? ratingA - ratingB : ratingB - ratingA;
        });
        break;
      case "experience":
        sorted.sort((a, b) => {
          const expA = a.yearsExperience || 0;
          const expB = b.yearsExperience || 0;
          return sortOrder === "asc" ? expA - expB : expB - expA;
        });
        break;
      case "position":
        sorted.sort((a, b) => {
          const posA = a.position || "";
          const posB = b.position || "";
          return sortOrder === "asc"
            ? posA.localeCompare(posB)
            : posB.localeCompare(posA);
        });
        break;
      default:
        sorted.sort((a, b) => {
          const nameA = a.firstName || a.username || "";
          const nameB = b.firstName || b.username || "";
          return nameA.localeCompare(nameB);
        });
    }

    return sorted;
  },

  // Filter staff by position
  filterByPosition: (staffList, position) => {
    if (!position || position === "all") return staffList;
    return staffList.filter((staff) =>
      staff.position?.toLowerCase().includes(position.toLowerCase())
    );
  },

  // Search staff
  searchStaff: (staffList, query) => {
    if (!query) return staffList;
    const lowercaseQuery = query.toLowerCase();
    return staffList.filter(
      (staff) =>
        staff.firstName?.toLowerCase().includes(lowercaseQuery) ||
        staff.username?.toLowerCase().includes(lowercaseQuery) ||
        staff.position?.toLowerCase().includes(lowercaseQuery) ||
        staff.email?.toLowerCase().includes(lowercaseQuery) ||
        staff.specialization?.some((spec) =>
          spec.toLowerCase().includes(lowercaseQuery)
        )
    );
  },
};

// ✅ ENHANCED: Stylists Management Functions
export const stylistsManagement = {
  // Get all stylists with enhanced error handling and image processing
  getAllStylists: async (params = {}) => {
    try {
      const response = await stylistsAPI.getAll(params);

      if (response.data && response.data.success) {
        const formattedStylists = (response.data.data || []).map((stylist) =>
          staffUtils.formatStaffData(stylist)
        );

        return {
          success: true,
          stylists: formattedStylists,
          count: formattedStylists.length,
          message: "Stylists retrieved successfully",
        };
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("❌ Error getting stylists:", error);
      return {
        success: false,
        stylists: [],
        count: 0,
        message: "Error retrieving stylists",
        error: error.message,
      };
    }
  },

  // Get available stylists for booking with availability check
  getAvailableStylists: async (date = null, time = null) => {
    try {
      const response = await stylistsAPI.getAvailable();

      if (response.data && response.data.success) {
        let stylists = (response.data.data || []).map((stylist) =>
          staffUtils.formatStaffData(stylist)
        );

        // Filter by availability if date/time provided
        if (date || time) {
          stylists = stylists.filter((stylist) =>
            staffUtils.checkAvailability(stylist, date, time)
          );
        }

        return {
          success: true,
          stylists: stylists,
          count: stylists.length,
          message: "Available stylists retrieved successfully",
        };
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("❌ Error getting available stylists:", error);
      return {
        success: false,
        stylists: [],
        count: 0,
        message: "Error retrieving available stylists",
        error: error.message,
      };
    }
  },

  // Get stylist by ID with complete profile
  getStylistById: async (stylistId) => {
    try {
      const response = await stylistsAPI.getById(stylistId);

      if (response.data && response.data.success) {
        const formattedStylist = staffUtils.formatStaffData(response.data.data);

        return {
          success: true,
          stylist: formattedStylist,
          message: "Stylist profile retrieved successfully",
        };
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("❌ Error getting stylist:", error);
      return {
        success: false,
        stylist: null,
        message: "Error retrieving stylist profile",
        error: error.message,
      };
    }
  },

  // Search stylists with formatted results
  searchStylists: async (query, params = {}) => {
    try {
      const response = await stylistsAPI.search(query, params);

      if (response.data && response.data.success) {
        const formattedStylists = (response.data.data || []).map((stylist) =>
          staffUtils.formatStaffData(stylist)
        );

        return {
          success: true,
          stylists: formattedStylists,
          count: formattedStylists.length,
          message: "Stylists search completed successfully",
        };
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("❌ Error searching stylists:", error);
      return {
        success: false,
        stylists: [],
        count: 0,
        message: "Error searching stylists",
        error: error.message,
      };
    }
  },

  // Get top-rated stylists with images and ratings
  getTopRatedStylists: async (limit = 10) => {
    try {
      const response = await stylistsAPI.getTopRated(limit);

      if (response.data && response.data.success) {
        const formattedStylists = (response.data.data || []).map((stylist) =>
          staffUtils.formatStaffData(stylist)
        );

        return {
          success: true,
          stylists: formattedStylists,
          count: formattedStylists.length,
          message: "Top-rated stylists retrieved successfully",
        };
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("❌ Error getting top-rated stylists:", error);
      return {
        success: false,
        stylists: [],
        count: 0,
        message: "Error retrieving top-rated stylists",
        error: error.message,
      };
    }
  },

  // Get stylist availability for specific date
  getStylistAvailability: async (stylistId, date) => {
    try {
      const response = await stylistsAPI.getAvailability(stylistId, date);

      if (response.data && response.data.success) {
        return {
          success: true,
          availability: response.data.data,
          message: "Stylist availability retrieved successfully",
        };
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("❌ Error getting stylist availability:", error);
      return {
        success: false,
        availability: null,
        message: "Error retrieving stylist availability",
        error: error.message,
      };
    }
  },
};

// Rating Utility Functions
export const ratingUtils = {
  // Calculate average rating from ratings array
  calculateAverageRating: (ratings) => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return Math.round((sum / ratings.length) * 10) / 10;
  },

  // Generate rating breakdown
  generateRatingBreakdown: (ratings) => {
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (!ratings || ratings.length === 0) return breakdown;

    ratings.forEach((rating) => {
      if (rating.rating >= 1 && rating.rating <= 5) {
        breakdown[Math.floor(rating.rating)]++;
      }
    });

    return breakdown;
  },

  // Calculate rating percentages
  calculateRatingPercentages: (breakdown, totalRatings) => {
    const percentages = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (totalRatings === 0) return percentages;

    Object.keys(breakdown).forEach((key) => {
      percentages[key] = Math.round((breakdown[key] / totalRatings) * 100);
    });

    return percentages;
  },

  // Generate star display data
  generateStarRating: (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return {
      fullStars,
      halfStar,
      emptyStars,
      displayRating: rating.toFixed(1),
    };
  },

  // Format rating for display
  formatRating: (rating) => {
    if (!rating || rating === 0) return "No ratings yet";
    return `${rating.toFixed(1)} out of 5 stars`;
  },

  // Validate rating data before submission
  validateRatingData: (ratingData) => {
    const errors = [];

    if (!ratingData.rating || ratingData.rating < 1 || ratingData.rating > 5) {
      errors.push("Rating must be between 1 and 5");
    }

    if (!Number.isInteger(ratingData.rating)) {
      errors.push("Rating must be a whole number");
    }

    if (ratingData.comment && ratingData.comment.length > 500) {
      errors.push("Comment must be less than 500 characters");
    }

    // Validate categories if provided
    if (ratingData.categories) {
      const validCategories = [
        "serviceQuality",
        "professionalism",
        "communication",
        "timeliness",
        "valueForMoney",
      ];

      Object.keys(ratingData.categories).forEach((category) => {
        if (!validCategories.includes(category)) {
          errors.push(`Invalid category: ${category}`);
        }

        const value = ratingData.categories[category];
        if (value && (value < 1 || value > 5 || !Number.isInteger(value))) {
          errors.push(`Category ${category} must be integer between 1-5`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // Check if user can rate an entity
  checkRatingEligibility: async (entityType, entityId) => {
    try {
      const response = await ratingsAPI.checkEligibility(entityType, entityId);
      return response.data;
    } catch (error) {
      console.error("Error checking rating eligibility:", error);
      return {
        canRate: false,
        hasRated: false,
        reason: "Error checking eligibility",
      };
    }
  },

  // Prepare rating data for submission
  prepareRatingData: (baseData, entityType, entityId, additionalData = {}) => {
    return {
      entityType,
      entityId,
      rating: baseData.rating,
      comment: baseData.comment || "",
      categories: baseData.categories || {},
      ...additionalData,
    };
  },

  // Sort ratings by various criteria
  sortRatings: (ratings, sortBy = "newest") => {
    const sorted = [...ratings];

    switch (sortBy) {
      case "newest":
        return sorted.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      case "oldest":
        return sorted.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      case "highest":
        return sorted.sort((a, b) => b.rating - a.rating);
      case "lowest":
        return sorted.sort((a, b) => a.rating - b.rating);
      case "most_helpful":
        // You might want to add helpful votes to your rating model
        return sorted;
      default:
        return sorted;
    }
  },

  // Filter ratings
  filterRatings: (ratings, filters = {}) => {
    let filtered = [...ratings];

    if (filters.minRating) {
      filtered = filtered.filter(
        (rating) => rating.rating >= filters.minRating
      );
    }

    if (filters.hasComments) {
      filtered = filtered.filter(
        (rating) => rating.comment && rating.comment.trim().length > 0
      );
    }

    if (filters.withImages) {
      // If you add image support to ratings
      filtered = filtered.filter(
        (rating) => rating.images && rating.images.length > 0
      );
    }

    if (filters.withResponse) {
      filtered = filtered.filter(
        (rating) => rating.response && rating.response.text
      );
    }

    return filtered;
  },

  // Calculate entity rating stats
  calculateEntityRatingStats: (ratings) => {
    const totalRatings = ratings.length;
    const averageRating = ratingUtils.calculateAverageRating(ratings);
    const breakdown = ratingUtils.generateRatingBreakdown(ratings);
    const percentages = ratingUtils.calculateRatingPercentages(
      breakdown,
      totalRatings
    );

    return {
      totalRatings,
      averageRating,
      breakdown,
      percentages,
      starDisplay: ratingUtils.generateStarRating(averageRating),
    };
  },
};

// Enhanced error handling for ratings
export const handleRatingError = (error) => {
  const baseError = handleApiError(error);

  if (error.response?.status === 400) {
    const errorData = error.response.data;

    if (errorData.message?.includes("already rated")) {
      return {
        ...baseError,
        isRatingError: true,
        type: "ALREADY_RATED",
        message: "You have already rated this item",
        suggestion: "You can update your existing rating instead.",
      };
    }

    if (errorData.message?.includes("cannot be rated")) {
      return {
        ...baseError,
        isRatingError: true,
        type: "CANNOT_RATE",
        message: "This item cannot be rated yet",
        suggestion: "Complete the booking or purchase before rating.",
      };
    }
  }

  if (error.response?.status === 403) {
    return {
      ...baseError,
      isRatingError: true,
      type: "NOT_OWNER",
      message: "You can only rate your own items",
      suggestion: "You can only rate items that belong to you.",
    };
  }

  return baseError;
};

// Rating session management
export const ratingSession = {
  // Check if user has pending ratings
  hasPendingRatings: async () => {
    try {
      const response = await ratingsAPI.getRateable();
      return response.data?.length > 0;
    } catch (error) {
      console.error("Error checking pending ratings:", error);
      return false;
    }
  },

  // Get rateable items for user
  getRateableItems: async () => {
    try {
      const response = await ratingsAPI.getRateable();
      return {
        success: true,
        items: response.data || [],
        count: response.data?.length || 0,
      };
    } catch (error) {
      console.error("Error getting rateable items:", error);
      return {
        success: false,
        items: [],
        count: 0,
        error: error.message,
      };
    }
  },

  // Submit rating with enhanced error handling
  submitRating: async (ratingData) => {
    try {
      // Validate rating data
      const validation = ratingUtils.validateRatingData(ratingData);
      if (!validation.isValid) {
        return {
          success: false,
          message: "Invalid rating data",
          errors: validation.errors,
        };
      }

      const response = await ratingsAPI.submit(ratingData);

      return {
        success: true,
        data: response.data,
        message: "Rating submitted successfully",
      };
    } catch (error) {
      const ratingError = handleRatingError(error);
      return {
        success: false,
        ...ratingError,
      };
    }
  },

  // Bulk check rating eligibility
  checkMultipleEligibility: async (items) => {
    try {
      const results = {};

      for (const item of items) {
        const eligibility = await ratingUtils.checkRatingEligibility(
          item.entityType,
          item.entityId
        );
        results[`${item.entityType}_${item.entityId}`] = eligibility;
      }

      return {
        success: true,
        results,
      };
    } catch (error) {
      console.error("Error checking multiple eligibility:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

// Customer Utility Functions for rendering
export const customerUtils = {
  // Format customer data for display
  formatCustomerData: (customerData) => {
    if (!customerData) return null;

    return {
      id: customerData._id || customerData.id,
      username: customerData.username || "Unknown User",
      firstName: customerData.firstName || customerData.username || "Customer",
      email: customerData.email || "No email",
      phoneNumber: customerData.phoneNumber || "No phone",
      profileImage:
        customerData.profileImage ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${
          customerData.username || "user"
        }`,
      role: customerData.role || "customer",
      isGuest: customerData.isGuest || false,
      isVerified: customerData.verification?.emailVerified || false,
      joinDate: customerData.createdAt
        ? new Date(customerData.createdAt).toLocaleDateString()
        : "Unknown",
      loyaltyPoints: customerData.loyaltyPoints || 0,
      // Additional formatted fields
      displayName: customerData.firstName
        ? `${customerData.firstName}`
        : customerData.username || "Customer",
      initials: customerUtils.getInitials(
        customerData.firstName || customerData.username || "C"
      ),
      joinYear: customerData.createdAt
        ? new Date(customerData.createdAt).getFullYear()
        : new Date().getFullYear(),
    };
  },

  // Get initials from name
  getInitials: (name) => {
    if (!name) return "C";
    return name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  },

  // Validate profile image
  validateProfileImage: (imageUrl) => {
    if (!imageUrl) {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`;
    }

    // Check if it's a default avatar or uploaded image
    if (imageUrl.includes("dicebear") || imageUrl.includes("http")) {
      return imageUrl;
    }

    // Handle uploaded images - prepend base URL if needed
    if (imageUrl.startsWith("/uploads")) {
      const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      return `${baseURL}${imageUrl}`;
    }

    return imageUrl;
  },

  // Format join date
  formatJoinDate: (dateString) => {
    if (!dateString) return "Member";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `Joined ${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `Joined ${months} month${months > 1 ? "s" : ""} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `Joined ${years} year${years > 1 ? "s" : ""} ago`;
    }
  },
};

// Enhanced customer profile management
export const customerProfile = {
  // Load customer profile with error handling
  loadProfile: async () => {
    try {
      const response = await customerAPI.getProfile();

      if (response.data && response.data.success) {
        const formattedProfile = customerUtils.formatCustomerData(
          response.data.user
        );
        return {
          success: true,
          profile: formattedProfile,
          rawData: response.data.user,
        };
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("❌ Error loading customer profile:", error);
      return {
        success: false,
        error: error.message,
        profile: null,
      };
    }
  },

  // Update customer profile
  updateProfile: async (profileData) => {
    try {
      const response = await customerAPI.updateProfile(profileData);

      if (response.data && response.data.success) {
        const formattedProfile = customerUtils.formatCustomerData(
          response.data.user
        );
        return {
          success: true,
          profile: formattedProfile,
          message: response.data.message || "Profile updated successfully",
        };
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("❌ Error updating customer profile:", error);
      return {
        success: false,
        error: error.message,
        profile: null,
      };
    }
  },

  // Upload profile image
  uploadProfileImage: async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append("profileImage", imageFile);

      const response = await customerAPI.uploadProfileImage(formData);

      if (response.data && response.data.success) {
        const formattedProfile = customerUtils.formatCustomerData(
          response.data.user
        );
        return {
          success: true,
          profile: formattedProfile,
          message:
            response.data.message || "Profile image updated successfully",
        };
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("❌ Error uploading profile image:", error);
      return {
        success: false,
        error: error.message,
        profile: null,
      };
    }
  },

  // Get customer dashboard data
  getDashboardData: async () => {
    try {
      const [profileResponse, bookingsResponse, favoritesResponse] =
        await Promise.all([
          customerAPI.getProfile(),
          customerAPI.getBookings({ limit: 5 }),
          customerAPI.getFavorites(),
        ]);

      const profile = customerUtils.formatCustomerData(
        profileResponse.data.user
      );
      const upcomingBookings = bookingsResponse.data?.data || [];
      const favorites = favoritesResponse.data?.data || [];

      return {
        success: true,
        profile,
        upcomingBookings,
        favorites,
        stats: {
          totalBookings: upcomingBookings.length,
          totalFavorites: favorites.length,
          memberSince: customerUtils.formatJoinDate(
            profileResponse.data.user?.createdAt
          ),
        },
      };
    } catch (error) {
      console.error("❌ Error loading dashboard data:", error);
      return {
        success: false,
        error: error.message,
        profile: null,
        upcomingBookings: [],
        favorites: [],
        stats: {},
      };
    }
  },
};

// Customer session management
export const customerSession = {
  // Get current customer with profile
  getCurrentCustomer: async () => {
    try {
      const user = getCurrentUser();

      if (!user || user.role !== "customer") {
        return { isValid: false, reason: "Not a customer" };
      }

      const profileResult = await customerProfile.loadProfile();

      if (profileResult.success) {
        return {
          isValid: true,
          customer: profileResult.profile,
          rawUser: user,
        };
      } else {
        return {
          isValid: false,
          reason: "Profile load failed",
          error: profileResult.error,
        };
      }
    } catch (error) {
      console.error("❌ Error getting current customer:", error);
      return {
        isValid: false,
        reason: "Session check failed",
        error: error.message,
      };
    }
  },

  // Check if customer is authenticated and valid
  validateCustomerSession: async () => {
    if (!isAuthenticated()) {
      return { isValid: false, reason: "Not authenticated" };
    }

    if (!isCustomer()) {
      return { isValid: false, reason: "Not a customer" };
    }

    return await customerSession.getCurrentCustomer();
  },

  // Refresh customer data
  refreshCustomerData: async () => {
    try {
      const profileResult = await customerProfile.loadProfile();

      if (profileResult.success && profileResult.profile) {
        // Update localStorage user data
        const currentUser = getCurrentUser();
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            username: profileResult.profile.username,
            firstName: profileResult.profile.firstName,
            profileImage: profileResult.profile.profileImage,
          };
          setUser(updatedUser);
        }

        return profileResult;
      }

      return profileResult;
    } catch (error) {
      console.error("❌ Error refreshing customer data:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

// Staff session management
export const staffSession = {
  // Get staff session with profile data
  getStaffSession: async () => {
    try {
      const user = getCurrentUser();

      if (!user || (user.role !== "salon_staff" && user.role !== "admin")) {
        return { isValid: false, reason: "Not a staff member" };
      }

      const [profileResponse, attendanceResponse] = await Promise.all([
        staffAPI.getProfile(),
        attendanceAPI.getStatus(),
      ]);

      return {
        isValid: true,
        staffData: profileResponse.data,
        attendance: attendanceResponse.data,
        user: user,
      };
    } catch (error) {
      console.error("❌ Error getting staff session:", error);
      return {
        isValid: false,
        reason: "Session load failed",
        error: error.message,
      };
    }
  },

  // Validate staff session
  validateStaffSession: async () => {
    if (!isAuthenticated()) {
      return { isValid: false, reason: "Not authenticated" };
    }

    if (!isStaff() && !isAdmin()) {
      return { isValid: false, reason: "Not a staff member" };
    }

    return await staffSession.getStaffSession();
  },

  // Refresh staff session data
  refreshStaffSession: async () => {
    try {
      const sessionResult = await staffSession.getStaffSession();

      if (sessionResult.isValid && sessionResult.staffData) {
        // Update localStorage with fresh staff data
        const currentUser = getCurrentUser();
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            firstName: sessionResult.staffData.firstName,
            position: sessionResult.staffData.position,
            profileImage: sessionResult.staffData.profileImage,
          };
          setUser(updatedUser);
        }

        // Dispatch session updated event
        window.dispatchEvent(
          new CustomEvent("staffSessionUpdated", {
            detail: { session: sessionResult },
          })
        );
      }

      return sessionResult;
    } catch (error) {
      console.error("❌ Error refreshing staff session:", error);
      return {
        isValid: false,
        error: error.message,
      };
    }
  },

  // Check if staff is currently clocked in
  isClockedIn: async () => {
    try {
      const response = await attendanceAPI.getStatus();
      return response.data?.isClockedIn || false;
    } catch (error) {
      console.error("❌ Error checking clock-in status:", error);
      return false;
    }
  },

  // Get staff permissions
  getPermissions: () => {
    const user = getCurrentUser();
    return user?.permissions || [];
  },

  // Check if staff has specific permission
  hasPermission: (permission) => {
    const permissions = staffSession.getPermissions();
    return permissions.includes(permission) || permissions.includes("all");
  },

  // Get staff dashboard data
  getDashboardData: async () => {
    try {
      const [dashboardResponse, appointmentsResponse, attendanceResponse] =
        await Promise.all([
          staffAPI.getDashboard(),
          staffAPI.getAppointments({ limit: 10, status: "upcoming" }),
          attendanceAPI.getDashboard(),
        ]);

      return {
        success: true,
        dashboard: dashboardResponse.data,
        upcomingAppointments: appointmentsResponse.data?.data || [],
        attendance: attendanceResponse.data,
      };
    } catch (error) {
      console.error("❌ Error getting staff dashboard data:", error);
      return {
        success: false,
        error: error.message,
        dashboard: null,
        upcomingAppointments: [],
        attendance: null,
      };
    }
  },
};

// Staff profile management
export const staffProfile = {
  // Load staff profile with error handling
  loadProfile: async () => {
    try {
      const response = await staffAPI.getProfile();

      if (response.data && response.data.success) {
        const formattedProfile = staffUtils.formatStaffData(
          response.data.staff
        );
        return {
          success: true,
          profile: formattedProfile,
          rawData: response.data.staff,
        };
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("❌ Error loading staff profile:", error);
      return {
        success: false,
        error: error.message,
        profile: null,
      };
    }
  },

  // Update staff profile
  updateProfile: async (profileData) => {
    try {
      const response = await staffAPI.updateProfile(profileData);

      if (response.data && response.data.success) {
        const formattedProfile = staffUtils.formatStaffData(
          response.data.staff
        );
        return {
          success: true,
          profile: formattedProfile,
          message: response.data.message || "Profile updated successfully",
        };
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("❌ Error updating staff profile:", error);
      return {
        success: false,
        error: error.message,
        profile: null,
      };
    }
  },

  // Upload staff profile image
  uploadProfileImage: async (imageFile) => {
    try {
      const user = getCurrentUser();
      if (!user) {
        throw new Error("No user logged in");
      }

      const formData = new FormData();
      formData.append("profileImage", imageFile);

      const response = await staffAPI.uploadStaffImage(user.id, formData);

      if (response.data && response.data.success) {
        const formattedProfile = staffUtils.formatStaffData(
          response.data.staff
        );
        return {
          success: true,
          profile: formattedProfile,
          message:
            response.data.message || "Profile image updated successfully",
        };
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("❌ Error uploading staff profile image:", error);
      return {
        success: false,
        error: error.message,
        profile: null,
      };
    }
  },
};

// Enhanced Staff Utility Functions
export const staffPerformanceUtils = {
  calculatePerformanceScore: (
    attendanceRate,
    completionRate,
    customerRating,
    modulesCompleted
  ) => {
    const weights = {
      attendance: 0.25,
      completion: 0.35,
      rating: 0.25,
      learning: 0.15,
    };

    return (
      (attendanceRate * weights.attendance +
        completionRate * weights.completion +
        customerRating * weights.rating +
        Math.min(modulesCompleted / 10, 1) * weights.learning) *
      100
    );
  },

  formatAppointmentDuration: (duration) => {
    if (!duration) return "N/A";
    const minutes = parseInt(duration);
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0
        ? `${hours}h ${remainingMinutes}m`
        : `${hours}h`;
    }
  },

  calculateDailySchedule: (appointments) => {
    const schedule = {};
    appointments.forEach((apt) => {
      const time = apt.appointmentTime;
      if (!schedule[time]) {
        schedule[time] = [];
      }
      schedule[time].push(apt);
    });
    return schedule;
  },

  getStaffAvailability: (attendance, appointments) => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    if (!attendance || !attendance.clockInTime) {
      return { status: "offline", message: "Not clocked in" };
    }

    if (attendance.breakStartTime && !attendance.breakEndTime) {
      return { status: "on-break", message: "On break" };
    }

    const currentAppointment = appointments.find(
      (apt) => apt.appointmentTime <= currentTime && apt.status === "upcoming"
    );

    if (currentAppointment) {
      return {
        status: "busy",
        message: `With client: ${
          currentAppointment.customer?.firstName || "Customer"
        }`,
      };
    }

    return { status: "available", message: "Available for appointments" };
  },

  calculateEarningsSummary: (appointments, period = "month") => {
    const now = new Date();
    let startDate;

    switch (period) {
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const filteredAppointments = appointments.filter(
      (apt) =>
        new Date(apt.appointmentDate) >= startDate && apt.status === "completed"
    );

    const totalEarnings = filteredAppointments.reduce(
      (sum, apt) => sum + (apt.totalAmount || 0),
      0
    );
    const completedServices = filteredAppointments.length;
    const averageEarning =
      completedServices > 0 ? totalEarnings / completedServices : 0;

    return {
      totalEarnings,
      completedServices,
      averageEarning,
      period,
    };
  },
};

// Enhanced error handling for staff-specific errors
export const handleStaffError = (error) => {
  const baseError = handleApiError(error);

  if (error.response?.status === 403) {
    return {
      ...baseError,
      isStaffError: true,
      message: "Access denied. Staff permissions required.",
      suggestion: "Please contact administrator for staff access.",
    };
  }

  if (error.response?.data?.error?.includes("appointment")) {
    return {
      ...baseError,
      isStaffError: true,
      message: "Appointment management error",
      suggestion: "Verify appointment details and try again.",
    };
  }

  return baseError;
};

// Staff session management
export const staffAuthSession = {
  hasStaffPermissions: () => {
    const user = getCurrentUser();
    return user?.role === "salon_staff" || user?.role === "admin";
  },

  getStaffData: () => {
    const user = getCurrentUser();
    return {
      staffId: user?.staffId,
      position: user?.position,
      permissions: user?.permissions || [],
      hireDate: user?.hireDate,
      isActive: user?.isActive,
    };
  },

  validateStaffSession: async () => {
    if (!isAuthenticated()) {
      return { isValid: false, reason: "Not authenticated" };
    }

    if (!staffAuthSession.hasStaffPermissions()) {
      return { isValid: false, reason: "Not a staff member" };
    }

    try {
      const response = await staffAPI.getProfile();
      return {
        isValid: true,
        staffData: response.data,
        user: getCurrentUser(),
      };
    } catch (error) {
      return {
        isValid: false,
        reason: "Staff verification failed",
        error: error.message,
      };
    }
  },
};

// Service and Product Utility Functions
export const serviceUtils = {
  parsePrice: (priceString) => {
    if (!priceString) return 0;
    const match = priceString.match(/[\d,]+/);
    if (match) {
      return Number.parseInt(match[0].replace(/,/g, ""));
    }
    return 0;
  },

  parseDuration: (duration) => {
    if (!duration) return 0;
    const match = duration.match(/([\d.]+)(min|hr)/);
    if (match) {
      const value = Number.parseFloat(match[1]);
      const unit = match[2];
      return unit === "hr" ? value * 60 : value;
    }
    return 0;
  },

  formatDuration: (minutes) => {
    if (minutes < 60) {
      return `${minutes}min`;
    } else {
      const hours = minutes / 60;
      return hours === 1 ? "1hr" : `${hours}hr`;
    }
  },

  calculateAverageRating: (ratings) => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return sum / ratings.length;
  },

  generateRatingBreakdown: (ratings) => {
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (!ratings || ratings.length === 0) return breakdown;

    ratings.forEach((rating) => {
      if (rating.rating >= 1 && rating.rating <= 5) {
        breakdown[Math.floor(rating.rating)]++;
      }
    });

    return breakdown;
  },

  generateStarRating: (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return {
      fullStars,
      halfStar,
      emptyStars,
    };
  },

  formatPrice: (price) => {
    if (typeof price === "string") {
      return price;
    }
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(price);
  },

  sortServices: (services, sortBy, sortOrder = "desc") => {
    const sorted = [...services];

    switch (sortBy) {
      case "price":
        sorted.sort((a, b) => {
          const priceA = serviceUtils.parsePrice(a.priceRange);
          const priceB = serviceUtils.parsePrice(b.priceRange);
          return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
        });
        break;
      case "duration":
        sorted.sort((a, b) => {
          const durationA = serviceUtils.parseDuration(a.duration);
          const durationB = serviceUtils.parseDuration(b.duration);
          return sortOrder === "asc"
            ? durationA - durationB
            : durationB - durationA;
        });
        break;
      case "rating":
        sorted.sort((a, b) => {
          const ratingA = a.rating?.average || 0;
          const ratingB = b.rating?.average || 0;
          return sortOrder === "asc" ? ratingA - ratingB : ratingB - ratingA;
        });
        break;
      case "name":
        sorted.sort((a, b) => {
          return sortOrder === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        });
        break;
      case "popularity":
        sorted.sort((a, b) => {
          const bookingsA = a.totalBookings || 0;
          const bookingsB = b.totalBookings || 0;
          return sortOrder === "asc"
            ? bookingsA - bookingsB
            : bookingsB - bookingsA;
        });
        break;
      default:
        sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        });
    }

    return sorted;
  },

  filterByCategory: (services, category) => {
    if (!category || category === "all") return services;
    return services.filter((service) =>
      service.category?.toLowerCase().includes(category.toLowerCase())
    );
  },

  searchServices: (services, query) => {
    if (!query) return services;
    const lowercaseQuery = query.toLowerCase();
    return services.filter(
      (service) =>
        service.name?.toLowerCase().includes(lowercaseQuery) ||
        service.description?.toLowerCase().includes(lowercaseQuery) ||
        service.category?.toLowerCase().includes(lowercaseQuery)
    );
  },
};

// Product Utility Functions
export const productUtils = {
  formatPrice: (price) => {
    if (typeof price === "string") {
      return price;
    }
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(price);
  },

  calculateAverageRating: (ratingObj) => {
    if (!ratingObj || !ratingObj.average) return 0;
    return ratingObj.average;
  },

  generateStarRating: (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return {
      fullStars,
      halfStar,
      emptyStars,
    };
  },

  calculateRatingPercentages: (ratingObj) => {
    if (!ratingObj || !ratingObj.breakdown || ratingObj.totalRaters === 0) {
      return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    }

    const total = ratingObj.totalRaters;
    return {
      1: Math.round((ratingObj.breakdown[1] / total) * 100),
      2: Math.round((ratingObj.breakdown[2] / total) * 100),
      3: Math.round((ratingObj.breakdown[3] / total) * 100),
      4: Math.round((ratingObj.breakdown[4] / total) * 100),
      5: Math.round((ratingObj.breakdown[5] / total) * 100),
    };
  },

  sortProducts: (products, sortBy, sortOrder = "desc") => {
    const sorted = [...products];

    switch (sortBy) {
      case "price-low":
        sorted.sort((a, b) => {
          return sortOrder === "asc" ? a.price - b.price : b.price - a.price;
        });
        break;
      case "price-high":
        sorted.sort((a, b) => {
          return sortOrder === "asc" ? b.price - a.price : a.price - b.price;
        });
        break;
      case "rating":
        sorted.sort((a, b) => {
          const ratingA = a.rating?.average || 0;
          const ratingB = b.rating?.average || 0;
          return sortOrder === "asc" ? ratingA - ratingB : ratingB - ratingA;
        });
        break;
      case "name-asc":
        sorted.sort((a, b) => {
          return a.name.localeCompare(b.name);
        });
        break;
      case "name-desc":
        sorted.sort((a, b) => {
          return b.name.localeCompare(a.name);
        });
        break;
      case "newest":
        sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        });
        break;
      case "popular":
        sorted.sort((a, b) => {
          const ratersA = a.rating?.totalRaters || 0;
          const ratersB = b.rating?.totalRaters || 0;
          return sortOrder === "asc" ? ratersA - ratersB : ratersB - ratersA;
        });
        break;
      default:
        sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });
    }

    return sorted;
  },

  filterByCategory: (products, category) => {
    if (!category || category === "all") return products;
    return products.filter((product) =>
      product.category?.toLowerCase().includes(category.toLowerCase())
    );
  },

  filterByStock: (products, inStock = true) => {
    return products.filter((product) =>
      inStock ? product.inStock : !product.inStock
    );
  },

  filterByRating: (products, minRating) => {
    if (!minRating) return products;
    return products.filter(
      (product) => (product.rating?.average || 0) >= parseFloat(minRating)
    );
  },

  searchProducts: (products, query) => {
    if (!query) return products;
    const lowercaseQuery = query.toLowerCase();
    return products.filter(
      (product) =>
        product.name?.toLowerCase().includes(lowercaseQuery) ||
        product.description?.toLowerCase().includes(lowercaseQuery) ||
        product.category?.toLowerCase().includes(lowercaseQuery)
    );
  },

  validateProduct: (product) => {
    const errors = [];

    if (!product.name || product.name.trim().length === 0) {
      errors.push("Product name is required");
    }

    if (!product.category || product.category.trim().length === 0) {
      errors.push("Product category is required");
    }

    if (
      product.price === undefined ||
      product.price === null ||
      product.price < 0
    ) {
      errors.push("Valid product price is required");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  generateProductFilters: (queryParams) => {
    const filters = {};

    if (queryParams.category && queryParams.category !== "all") {
      filters.category = queryParams.category;
    }

    if (queryParams.minRating) {
      filters.minRating = parseFloat(queryParams.minRating);
    }

    if (queryParams.inStock !== undefined) {
      filters.inStock = queryParams.inStock === "true";
    }

    if (queryParams.sortBy) {
      filters.sortBy = queryParams.sortBy;
    }

    if (queryParams.sortOrder) {
      filters.sortOrder = queryParams.sortOrder;
    }

    return filters;
  },
};

// Helper function to get status display
const getOrderStatusDisplay = (status) => {
  const statusMap = {
    pending: { label: "⏳ Pending", color: "#f59e0b" },
    confirmed: { label: "✓ Confirmed", color: "#3b82f6" },
    processing: { label: "⏳ Processing", color: "#f59e0b" },
    shipped: { label: "📦 Shipped", color: "#8b5cf6" },
    delivered: { label: "✓ Delivered", color: "#10b981" },
    cancelled: { label: "✕ Cancelled", color: "#ef4444" },
    refunded: { label: "💰 Refunded", color: "#6366f1" },
  };

  return statusMap[status] || { label: status.toUpperCase(), color: "#6b7280" };
};

// Helper function to format price
const formatPrice = (price) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }).format(price || 0);
};

// Enhanced Cart and Favorites specific error handling
export const handleCartError = (error) => {
  const baseError = handleApiError(error);

  if (error.response?.status === 400) {
    const errorData = error.response.data;

    if (errorData.message?.includes("out of stock")) {
      return {
        ...baseError,
        isCartError: true,
        type: "OUT_OF_STOCK",
        message: "Product is out of stock",
        suggestion:
          "Please remove the item from your cart or check back later.",
      };
    }

    if (errorData.message?.includes("not found")) {
      return {
        ...baseError,
        isCartError: true,
        type: "PRODUCT_NOT_FOUND",
        message: "Product not found",
        suggestion: "The product may have been removed.",
      };
    }
  }

  return baseError;
};

export const handleFavoritesError = (error) => {
  const baseError = handleApiError(error);

  if (error.response?.status === 400) {
    const errorData = error.response.data;

    if (errorData.message?.includes("already in favorites")) {
      return {
        ...baseError,
        isFavoritesError: true,
        type: "ALREADY_FAVORITED",
        message: "Product already in favorites",
        suggestion: "This product is already in your favorites list.",
      };
    }

    if (errorData.message?.includes("not found")) {
      return {
        ...baseError,
        isFavoritesError: true,
        type: "PRODUCT_NOT_FOUND",
        message: "Product not found",
        suggestion: "The product may have been removed.",
      };
    }
  }

  return baseError;
};

// Enhanced Cart and Favorites session management
export const cartSession = {
  // Get cart with session validation
  getValidatedCart: async () => {
    if (!isAuthenticated()) {
      return {
        success: false,
        cart: null,
        reason: "Not authenticated",
        message: "Please log in to view your cart",
      };
    }

    if (!isCustomer()) {
      return {
        success: false,
        cart: null,
        reason: "Not a customer",
        message: "Cart is only available for customers",
      };
    }

    return await cartManagement.getCart();
  },

  // Refresh cart data
  refreshCart: async () => {
    try {
      const cartResult = await cartManagement.getCart();

      if (cartResult.success && cartResult.cart) {
        // Dispatch event for cart updates
        window.dispatchEvent(
          new CustomEvent("cartUpdated", {
            detail: { cart: cartResult.cart },
          })
        );

        return cartResult;
      }

      return cartResult;
    } catch (error) {
      console.error("❌ Error refreshing cart:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

export const favoritesSession = {
  // Get favorites with session validation
  getValidatedFavorites: async () => {
    if (!isAuthenticated()) {
      return {
        success: false,
        favorites: [],
        reason: "Not authenticated",
        message: "Please log in to view your favorites",
      };
    }

    return await favoritesManagement.getFavorites();
  },

  // Refresh favorites data
  refreshFavorites: async () => {
    try {
      const favoritesResult = await favoritesManagement.getFavorites();

      if (favoritesResult.success) {
        // Dispatch event for favorites updates
        window.dispatchEvent(
          new CustomEvent("favoritesUpdated", {
            detail: { favorites: favoritesResult.favorites },
          })
        );

        return favoritesResult;
      }

      return favoritesResult;
    } catch (error) {
      console.error("❌ Error refreshing favorites:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

// ✅ NEW: Integration helper functions for cross-module functionality
export const integrationHelpers = {
  // Update leaderboard from attendance (for use in attendance routes)
  updateLeaderboardFromAttendance: async (userId, action, isOnTime = true) => {
    try {
      // Try the dedicated leaderboard service first
      const response = await leaderboardServiceAPI.updateAttendance(
        userId,
        action,
        isOnTime
      );
      return response;
    } catch (error) {
      console.warn(
        "Leaderboard service unavailable, trying direct leaderboard API:",
        error.message
      );
      // Fallback to direct leaderboard API
      try {
        const response = await leaderboardsAPI.updateAttendance(
          userId,
          action,
          isOnTime
        );
        return response;
      } catch (fallbackError) {
        console.error("All leaderboard update methods failed:", fallbackError);
        // Don't fail the main request if leaderboard update fails
        return { success: false, error: fallbackError.message };
      }
    }
  },

  // Update leaderboard from quiz completion
  updateLeaderboardFromQuiz: async (userId, score, pointsEarned = null) => {
    try {
      const response = await leaderboardServiceAPI.updateFromQuiz(
        userId,
        score,
        pointsEarned
      );
      return response;
    } catch (error) {
      console.warn("Leaderboard quiz update failed:", error.message);
      return { success: false, error: error.message };
    }
  },

  // Update leaderboard from module completion
  updateLeaderboardFromModule: async (userId, moduleId, score) => {
    try {
      const response = await leaderboardServiceAPI.updateFromModule(
        userId,
        moduleId,
        score
      );
      return response;
    } catch (error) {
      console.warn("Leaderboard module update failed:", error.message);
      return { success: false, error: error.message };
    }
  },

  // Get staff performance data
  getStaffPerformanceData: async (userId) => {
    try {
      const response = await leaderboardServiceAPI.getStaffPerformance(userId);
      return response;
    } catch (error) {
      console.warn("Staff performance data unavailable:", error.message);
      return { success: false, error: error.message };
    }
  },
};

// Auto-logout when token expires
const setupAutoLogout = () => {
  const checkExpiry = () => {
    if (isSessionExpired() && isAuthenticated()) {
      console.warn("Session expired, auto-logging out");
      logout();
    }
  };

  setInterval(checkExpiry, 60000);
};

// Initialize auto-logout check
if (typeof window !== "undefined") {
  setupAutoLogout();
}

// ✅ ENHANCED: Combined API object for easy imports
export const enhancedAPI = {
  services: servicesAPI,
  products: productsAPI,
  appointments: appointmentsAPI,
  bookings: bookingsAPI,
  payments: paymentsAPI,
  cart: cartAPI,
  favorites: favoritesAPI,
  orders: ordersAPI,
  ratings: ratingsAPI,
  attendance: attendanceAPI,
  learningModules: learningModulesAPI,
  leaderboards: leaderboardsAPI,
  staff: staffAPI,
  customer: customerAPI,
  stylists: stylistsAPI,
  auth: authAPI,
  // ✅ ADD THESE NEW APIS:
  bookingPayment: bookingPaymentAPI,
  staffBookings: staffBookingsAPI,
};

// Export main API instance and all utilities
export default {
  bookingPaymentManagement,
  staffBookingsAPI,
  instance: api,
  auth: authAPI,
  services: servicesAPI,
  products: productsAPI,
  appointments: appointmentsAPI,
  bookings: bookingsAPI,
  cart: cartAPI,
  favorites: favoritesAPI,
  orders: ordersAPI,
  orderManagement,
  payments: paymentsAPI,
  ratings: ratingsAPI,
  attendance: attendanceAPI,
  learningModules: learningModulesAPI,
  leaderboards: leaderboardsAPI,
  leaderboardServiceAPI,
  staff: staffAPI,
  customer: customerAPI,
  stylists: stylistsAPI,

  // ✅ NEW: Enhanced management functions with payment options and staff availability
  bookingsManagement,
  paymentsManagement,

  // Direct auth methods for convenience
  staffLogin: authAPI.staffLogin,
  customerLogin: authAPI.customerLogin,
  login: authAPI.login,
  register: authAPI.register,
  forgotPassword: authAPI.forgotPassword,

  // Enhanced management functions
  bookingsManagement,
  paymentsManagement,
  bookingPaymentManagement, // Add this
  cartManagement,
  favoritesManagement,
  stylistsManagement,

  // Utility functions
  utils: {
    service: serviceUtils,
    product: productUtils,
    auth: authHelpers,
    error: handleApiError,
    delay: delayHelper,
    staff: staffUtils,
    customer: customerUtils,
    rating: ratingUtils,
    cart: cartAPI.utils,
    favorites: favoritesAPI.utils,
    staffPerformance: staffPerformanceUtils,
  },

  // Authentication helpers
  authHelpers: {
    getToken,
    setToken,
    setUser,
    getCurrentUser,
    isAuthenticated,
    getUserRole,
    isStaff,
    isCustomer,
    isAdmin,
    isGuest,
    logout,
    handleLogout,
  },

  // Session management
  cartSession,
  favoritesSession,
  staffSession,
  customerSession,
  staffAuthSession,

  // Profile management
  staffProfile,
  customerProfile,

  // ✅ ADD NEW ERROR HANDLER:
  handleBookingPaymentError,

  // Error handling
  handleApiError,
  handleCartError,
  handleFavoritesError,
  handleStaffError,
  handleRatingError,

  // ✅ COMPLETED: Integration helpers for cross-module functionality
  integration: integrationHelpers,
};
