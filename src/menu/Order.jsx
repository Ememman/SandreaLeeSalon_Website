import React, { useState, useEffect } from "react";
import {
  ordersAPI,
  orderManagement,
  getCurrentUser,
  isAuthenticated,
} from "../services/api";
import "../styles/Order.css";

const Order = ({ isOpen, onClose }) => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [userData, setUserData] = useState(null);

  // Status filter tabs - Updated to match Bookings style
  const statusTabs = [
    { id: "all", label: "All Orders", color: "var(--blue)" },
    { id: "completed", label: "Completed", color: "var(--success)" },
    { id: "processing", label: "Processing", color: "var(--warning)" },
    { id: "pending", label: "Pending", color: "var(--warning)" },
    { id: "cancelled", label: "Cancelled", color: "var(--error)" },
  ];

  useEffect(() => {
    if (isOpen) {
      console.log("📦 Order modal opened, fetching orders...");
      fetchUserData();
      fetchOrders();
    }
  }, [isOpen]);

  const fetchUserData = () => {
    const user = getCurrentUser();
    setUserData(user);
  };

  // Filter orders based on active tab
  useEffect(() => {
    if (activeTab === "all") {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter((order) => {
        const normalizedStatus = normalizeStatus(order.status);
        return normalizedStatus === activeTab;
      });
      setFilteredOrders(filtered);
    }
  }, [orders, activeTab]);

  const fetchOrders = async () => {
    try {
      console.log("🔄 Starting orders fetch...");
      setLoading(true);
      setError(null);

      // Check authentication first
      const isAuth = isAuthenticated();
      const user = getCurrentUser();

      console.log("🔐 Auth Check:", { isAuth, user });

      if (!isAuth || !user) {
        throw new Error("User not authenticated. Please log in.");
      }

      console.log("📤 Calling orderManagement.getMyOrders()...");

      // Use the enhanced order management utility that matches your mobile app pattern
      const result = await orderManagement.getMyOrders();

      console.log("📦 Order Management Result:", result);

      if (result.success) {
        const ordersData = result.data || [];
        console.log("✅ Orders processed:", {
          count: ordersData.length,
          data: ordersData,
        });

        setOrders(ordersData);

        if (ordersData.length === 0) {
          console.log("📭 No orders found for user");
          setError(
            "No orders found. Your completed orders will appear here after checkout."
          );
        }
      } else {
        throw new Error(result.message || "Failed to load orders");
      }
    } catch (err) {
      console.error("❌ Error fetching orders:", err);

      let errorMessage = "Failed to load orders. ";

      // Handle different error types with simpler logic
      if (err.code === "NETWORK_ERROR" || err.message === "Network Error") {
        errorMessage += "Network error. Please check your connection.";
      } else if (err.message === "Request timeout") {
        errorMessage += "Request timed out. Please try again.";
      } else if (err.response?.status === 500) {
        errorMessage += "Server error. Please try again later.";
      } else if (err.response?.status === 401) {
        errorMessage = "Your session has expired. Please log in again.";
      } else if (err.response?.status === 404) {
        errorMessage = "Orders service is temporarily unavailable.";
      } else if (err.message.includes("not authenticated")) {
        errorMessage = "Please log in to view your orders.";
      } else {
        errorMessage += err.message || "Please try again.";
      }

      setError(errorMessage);

      // For development, automatically load mock data on error
      if (process.env.NODE_ENV === "development") {
        console.log("🔄 Development mode: Loading mock data due to error");
        loadMockOrders();
      } else {
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Enhanced status normalization
  const normalizeStatus = (status) => {
    if (!status) return "pending";
    const statusLower = status.toLowerCase().trim();

    if (
      statusLower.includes("complete") ||
      statusLower.includes("delivered") ||
      statusLower.includes("approve") ||
      statusLower.includes("deliver")
    ) {
      return "completed";
    }
    if (
      statusLower.includes("process") ||
      statusLower.includes("confirm") ||
      statusLower.includes("shipped")
    ) {
      return "processing";
    }
    if (
      statusLower.includes("cancel") ||
      statusLower.includes("deny") ||
      statusLower.includes("fail") ||
      statusLower.includes("refunded")
    ) {
      return "cancelled";
    }
    return "pending";
  };

  const getOrderStatusColor = (status) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case "completed":
        return "status-completed";
      case "processing":
        return "status-processing";
      case "pending":
        return "status-pending";
      case "cancelled":
        return "status-cancelled";
      default:
        return "status-default";
    }
  };

  const getOrderStatusText = (status) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case "completed":
        return "Completed";
      case "processing":
        return "Processing";
      case "pending":
        return "Pending";
      case "cancelled":
        return "Cancelled";
      default:
        return status ? status.toUpperCase() : "PENDING";
    }
  };

  // Mock data for development - SIMPLIFIED VERSION
  const loadMockOrders = () => {
    console.log("🔄 Loading mock orders for development...");
    const mockOrders = [
      {
        _id: "1",
        orderNumber: "ORD-001",
        status: "delivered",
        totalAmount: 1500,
        items: [
          {
            productId: {
              _id: "prod1",
              name: "Hair Treatment",
              price: 1500,
            },
            quantity: 1,
            isRated: false,
          },
        ],
        deliveryType: "pickup",
        contactNumber: "+639123456789",
        createdAt: new Date().toISOString(),
        payment: { status: "paid", method: "gcash" },
        isRated: false,
      },
      {
        _id: "2",
        orderNumber: "ORD-002",
        status: "processing",
        totalAmount: 800,
        items: [
          {
            productId: {
              _id: "prod2",
              name: "Haircut",
              price: 800,
            },
            quantity: 1,
            isRated: false,
          },
        ],
        deliveryType: "delivery",
        deliveryAddress: "123 Main St",
        contactNumber: "+639987654321",
        createdAt: new Date().toISOString(),
        payment: { status: "processing", method: "gcash" },
        isRated: false,
      },
    ];
    setOrders(mockOrders);
    setLoading(false);
    setError(null);
  };

  const handleRetry = () => {
    // For development, use mock data. For production, use fetchOrders()
    if (process.env.NODE_ENV === "development") {
      loadMockOrders();
    } else {
      fetchOrders();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    setActiveTab(newTab);
  };

  if (!isOpen) return null;

  return (
    <div
      className="order-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}>
      <div className="order-container bg-[#1a2332] rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header Section - Updated to match Bookings style */}
        <div className="relative">
          {/* Back Button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 md:top-6 md:left-6 text-white hover:text-gray-300 transition-colors z-10">
            <svg
              className="w-6 h-6 md:w-8 md:h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Welcome Header with Real-time Data */}
          <div className="pt-4 pl-16 pr-4 pb-4 md:pt-6 md:pl-20 md:pr-6 md:pb-4">
            <div>
              <h1 className="text-white text-xl md:text-3xl font-semibold">
                Welcome,{" "}
                {userData?.firstName || userData?.username || "Customer"}
              </h1>
              <p className="text-gray-400 text-xs md:text-sm mt-1">
                {getCurrentDate()}
              </p>
            </div>
          </div>

          {/* Orders Banner */}
          <div className="bg-gradient-to-r from-blue-400 via-purple-300 to-yellow-300 h-16 md:h-24 mx-4 md:mx-6 rounded-t-2xl flex items-center justify-center">
            <h2 className="text-black text-2xl md:text-5xl font-bold tracking-wider">
              ORDERS
            </h2>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-[#0f1621] mx-4 md:mx-6 rounded-b-2xl p-4 md:p-8">
          {/* Tab Navigation - Updated to match Bookings style */}
          <div className="flex border-b border-gray-700 mb-4 md:mb-6 relative">
            <div className="flex w-full bg-[#1a2332] rounded-t-lg overflow-hidden">
              {statusTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`tab-button flex-1 text-center transition-all duration-300 ease-in-out ${
                    activeTab === tab.id
                      ? "tab-active bg-[#0f1621] text-white"
                      : "tab-inactive text-gray-400 hover:text-gray-300"
                  }`}
                  onClick={() => handleTabChange(tab.id)}>
                  {tab.label} (
                  {tab.id === "all"
                    ? orders.length
                    : orders.filter(
                        (order) => normalizeStatus(order.status) === tab.id
                      ).length}
                  )
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 md:py-20">
              <div className="w-8 h-8 md:w-12 md:h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 mt-2 md:mt-4 text-sm md:text-base">
                Loading your orders...
              </p>
            </div>
          ) : error && orders.length === 0 ? (
            <div className="text-center py-10 md:py-20">
              <div className="error-icon mb-4">
                <svg
                  className="w-12 h-12 md:w-16 md:h-16 text-red-400 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-red-400 mb-3 md:mb-4 text-sm md:text-base">
                {error}
              </p>
              <p className="text-gray-500 text-xs md:text-sm mb-4 md:mb-6">
                {process.env.NODE_ENV === "development"
                  ? "Development mode: Using mock data to demonstrate functionality"
                  : "Please check your connection and try again"}
              </p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 md:px-6 md:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm md:text-base">
                {process.env.NODE_ENV === "development"
                  ? "Load Demo Orders"
                  : "Try Again"}
              </button>
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-white text-lg md:text-xl font-semibold">
                {activeTab === "all"
                  ? `All Orders (${orders.length})`
                  : `${
                      activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
                    } Orders (${filteredOrders.length})`}
              </h3>

              {filteredOrders.map((order) => (
                <div
                  key={order._id}
                  className="order-card bg-[#1a2332] rounded-xl p-4 md:p-6 border border-gray-700 hover:border-gray-600 transition-colors"
                  onClick={() => setSelectedOrder(order)}>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1">
                      {/* Order Number and Date */}
                      <div className="text-white text-base md:text-lg font-semibold mb-2">
                        Order #{" "}
                        {order.orderNumber ||
                          order._id?.slice(-8).toUpperCase() ||
                          "N/A"}
                      </div>

                      <div className="text-gray-400 text-xs md:text-sm mb-3">
                        {formatDate(order.createdAt)}
                      </div>

                      {/* Items and Delivery Info */}
                      <div className="text-gray-300 text-sm md:text-base mb-2">
                        <strong>Items :</strong> {order.items?.length || 0}{" "}
                        items
                      </div>

                      <div className="text-gray-300 text-sm md:text-base mb-2">
                        <strong>Delivery :</strong>{" "}
                        {order.deliveryType || "pickup"}
                      </div>

                      {/* Payment Information */}
                      {order.payment && (
                        <div className="text-gray-300 text-xs md:text-sm mb-2">
                          <strong>Payment:</strong> {order.payment.method} •{" "}
                          <span
                            className={
                              order.payment.status === "paid" ||
                              order.payment.status === "completed"
                                ? "text-green-400"
                                : order.payment.status === "processing"
                                ? "text-yellow-400"
                                : "text-red-400"
                            }>
                            {order.payment.status.charAt(0).toUpperCase() +
                              order.payment.status.slice(1)}
                          </span>
                        </div>
                      )}

                      {/* Total Amount */}
                      <div className="text-white text-lg md:text-xl font-bold mt-2">
                        {formatPrice(order.totalAmount)}
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex flex-col items-start md:items-end space-y-3 w-full md:w-auto">
                      <span
                        className={`status-badge ${getOrderStatusColor(
                          order.status
                        )}`}>
                        {getOrderStatusText(order.status)}
                      </span>

                      <button
                        className="px-4 py-2 md:px-6 md:py-2 border-2 border-blue-500 text-blue-500 rounded-full font-semibold text-xs md:text-sm hover:bg-blue-500 hover:text-white transition-all duration-300 tracking-wider w-full md:w-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}>
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 md:py-20">
              <div className="empty-icon text-4xl md:text-6xl mb-4">📦</div>
              <p className="text-gray-400 text-base md:text-lg mb-2">
                No orders yet
              </p>
              <p className="text-gray-500 text-xs md:text-sm mb-4 md:mb-6">
                Your completed orders will appear here after checkout
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 md:px-6 md:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm md:text-base">
                Start Shopping
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          formatDate={formatDate}
          formatPrice={formatPrice}
          getOrderStatusColor={getOrderStatusColor}
          getOrderStatusText={getOrderStatusText}
        />
      )}
    </div>
  );
};

// Separate component for order details modal
const OrderDetailsModal = ({
  order,
  onClose,
  formatDate,
  formatPrice,
  getOrderStatusColor,
  getOrderStatusText,
}) => {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="details-modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4"
      onClick={handleOverlayClick}>
      <div className="details-modal-container bg-[#1a2332] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="details-modal-content p-4 md:p-6">
          <div className="details-modal-header flex justify-between items-center mb-6">
            <h2 className="text-white text-xl md:text-2xl font-semibold">
              Order Details & Receipt
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Order Summary Content */}
          <div className="receipt-section bg-[#0f1621] rounded-xl p-4 md:p-6 mb-6">
            <div className="receipt-grid grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-white text-lg font-semibold mb-4">
                  Order Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Order ID:</span>
                    <span className="text-white font-medium">
                      {order.orderNumber ||
                        order._id?.slice(-8).toUpperCase() ||
                        "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date:</span>
                    <span className="text-white font-medium">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span
                      className={`font-medium ${getOrderStatusColor(
                        order.status
                      )}`}>
                      {getOrderStatusText(order.status)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Delivery Type:</span>
                    <span className="text-white font-medium capitalize">
                      {order.deliveryType || "pickup"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-white text-lg font-semibold mb-4">
                  Payment Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subtotal:</span>
                    <span className="text-white font-medium">
                      {formatPrice(
                        (order.totalAmount || 0) -
                          (order.deliveryType === "delivery" ? 100 : 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Shipping:</span>
                    <span className="text-white font-medium">
                      {formatPrice(order.deliveryType === "delivery" ? 100 : 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-700 pt-3">
                    <span className="text-white font-semibold">Total:</span>
                    <span className="text-white font-bold text-lg">
                      {formatPrice(order.totalAmount || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-actions flex flex-col md:flex-row gap-3 justify-end">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 border-2 border-blue-500 text-blue-500 rounded-full font-semibold hover:bg-blue-500 hover:text-white transition-all duration-300 text-sm md:text-base">
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-all duration-300 text-sm md:text-base">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Order;
