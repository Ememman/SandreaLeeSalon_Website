// Payment.jsx
import React, { useState, useEffect, useRef } from "react";
import { bookingsAPI, orderManagement, paymentsAPI } from "../services/api";
import "../styles/Payment.css";

const Payment = ({ isOpen, onClose }) => {
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofImage, setProofImage] = useState(null);
  const [receiptData, setReceiptData] = useState({
    referenceNumber: "",
    name: "",
    amountPaid: "",
    dateOfTransaction: "",
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [expandedTransaction, setExpandedTransaction] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchPaymentHistory();
    }
  }, [isOpen]);

  const fetchPaymentHistory = async () => {
    try {
      setLoadingTransactions(true);
      console.log("📋 Loading payment history...");

      const allTransactions = [];

      // Fetch bookings with payments - USING CORRECT API
      try {
        const bookingsResponse = await bookingsAPI.getMyBookings();
        console.log("📥 Bookings response:", bookingsResponse);

        if (bookingsResponse.data?.success && bookingsResponse.data.data) {
          const bookingTransactions = bookingsResponse.data.data
            .filter((booking) => booking.paymentId || booking.payment)
            .map((booking) => {
              // Extract service information
              let serviceName = "Service";
              let serviceDetails = [];
              let servicePrice = 0;

              // Handle service data from booking
              if (booking.serviceId) {
                if (typeof booking.serviceId === "object") {
                  serviceName = booking.serviceId.name || "Service";
                  servicePrice =
                    booking.serviceId.price || booking.totalAmount || 0;
                  serviceDetails = [
                    {
                      name: booking.serviceId.name || "Service",
                      price: servicePrice,
                      quantity: 1,
                      type: "service",
                      duration: booking.serviceId.duration,
                      category: booking.serviceId.category,
                    },
                  ];
                } else {
                  serviceName = "Service Booking";
                  servicePrice = booking.totalAmount || 0;
                  serviceDetails = [
                    {
                      name: "Service Booking",
                      price: servicePrice,
                      quantity: 1,
                      type: "service",
                    },
                  ];
                }
              }

              // Handle service information directly from booking
              if (booking.service && typeof booking.service === "object") {
                serviceName = booking.service.name || serviceName;
                servicePrice = booking.service.price || servicePrice;
                serviceDetails = [
                  {
                    name: booking.service.name || "Service",
                    price: servicePrice,
                    quantity: 1,
                    type: "service",
                    duration: booking.service.duration,
                    category: booking.service.category,
                  },
                ];
              }

              let amount = servicePrice || booking.totalAmount || 0;
              const payment = booking.paymentId || booking.payment;

              if (payment?.amount) {
                amount = payment.amount;
              }

              let status = "pending";
              if (payment?.status) {
                const paymentStatus = payment.status.toLowerCase();
                if (
                  paymentStatus === "approved" ||
                  paymentStatus === "completed"
                ) {
                  status = "completed";
                } else if (
                  paymentStatus === "denied" ||
                  paymentStatus === "rejected"
                ) {
                  status = "failed";
                } else if (
                  paymentStatus === "processing" ||
                  paymentStatus === "pending"
                ) {
                  status = "pending";
                }
              }

              const dateString =
                booking.completedAt ||
                booking.cancelledAt ||
                booking.createdAt ||
                booking.updatedAt;
              const date = new Date(dateString);

              return {
                id: booking._id,
                type: "booking",
                service: serviceName,
                serviceDetails: serviceDetails,
                date: date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }),
                time: date.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                timestamp: date.getTime(),
                amount: amount,
                formattedAmount: `₱${amount.toFixed(2)}`,
                status: status,
                paymentMethod: payment?.paymentMethod || "Cash",
                referenceNumber:
                  payment?.referenceNumber || booking._id?.slice(-8) || "N/A",
                paymentId: payment?._id,
                stylist: booking.selectedStylistId || booking.stylistPreference,
                location: "Salon Branch",
                bookingDate: booking.preferredDate,
                bookingTime: booking.preferredTime,
              };
            });

          allTransactions.push(...bookingTransactions);
          console.log("✅ Bookings loaded:", bookingTransactions.length);
        }
      } catch (error) {
        console.error("⚠️ Error loading bookings:", error);
      }

      // Fetch orders with payments - USING CORRECT API
      try {
        const ordersResponse = await orderManagement.getMyOrders();
        console.log("📦 Orders response:", ordersResponse);

        if (ordersResponse.success && ordersResponse.data) {
          const orderTransactions = ordersResponse.data.map((order) => {
            let productNames = "Product Order";
            let productDetails = [];
            let totalAmount = order.totalAmount || 0;

            // Extract product information from order items
            if (order.items && order.items.length > 0) {
              productDetails = order.items.map((item) => {
                const product = item.productId || item.product;
                const productName =
                  typeof product === "object" && product?.name
                    ? product.name
                    : "Product";

                const price = item.price || product?.price || 0;
                const quantity = item.quantity || 1;

                return {
                  name: productName,
                  price: price,
                  quantity: quantity,
                  total: price * quantity,
                  image: product?.image || product?.images?.[0],
                  type: "product",
                };
              });

              const firstItem = productDetails[0];
              if (order.items.length > 1) {
                productNames = `${firstItem.name} (+${
                  order.items.length - 1
                } more)`;
              } else {
                productNames = firstItem.name;
              }

              // Calculate total if not provided
              if (!totalAmount) {
                totalAmount = productDetails.reduce(
                  (sum, item) => sum + item.total,
                  0
                );
              }
            }

            let status = "pending";
            const payment = order.payment;

            if (payment?.status) {
              const paymentStatus = payment.status.toLowerCase();
              if (
                paymentStatus === "approved" ||
                paymentStatus === "completed"
              ) {
                status = "completed";
              } else if (
                paymentStatus === "denied" ||
                paymentStatus === "rejected"
              ) {
                status = "failed";
              } else if (
                paymentStatus === "processing" ||
                paymentStatus === "pending"
              ) {
                status = "pending";
              }
            } else if (order.status) {
              // Use order status as fallback
              const orderStatus = order.status.toLowerCase();
              if (orderStatus === "delivered" || orderStatus === "completed") {
                status = "completed";
              } else if (
                orderStatus === "cancelled" ||
                orderStatus === "failed"
              ) {
                status = "failed";
              } else if (
                orderStatus === "processing" ||
                orderStatus === "pending"
              ) {
                status = "pending";
              }
            }

            const dateString = order.updatedAt || order.createdAt;
            const date = new Date(dateString);

            return {
              id: order._id,
              type: "order",
              service: productNames,
              serviceDetails: productDetails,
              orderNumber: order.orderNumber,
              date: date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              time: date.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              timestamp: date.getTime(),
              amount: totalAmount,
              formattedAmount: `₱${totalAmount.toFixed(2)}`,
              status: status,
              paymentMethod:
                payment?.paymentMethod || order.paymentMethod || "N/A",
              referenceNumber:
                payment?.referenceNumber ||
                order.orderNumber ||
                order._id?.slice(-8) ||
                "N/A",
              paymentId: payment?._id,
              deliveryType: order.deliveryType,
              shippingAddress: order.deliveryAddress || order.shippingAddress,
              deliveryStatus: order.deliveryStatus || order.status,
              contactNumber: order.contactNumber,
            };
          });

          allTransactions.push(...orderTransactions);
          console.log("✅ Orders loaded:", orderTransactions.length);
        }
      } catch (error) {
        console.error("⚠️ Error loading orders:", error);
      }

      // Sort by date (newest first)
      allTransactions.sort((a, b) => b.timestamp - a.timestamp);

      console.log("✅ Total transactions:", allTransactions.length);
      setTransactions(allTransactions);
    } catch (error) {
      console.error("❌ Error loading payment history:", error);
      setError("Failed to load payment history");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoadingTransactions(false);
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "#4CAF50";
      case "pending":
        return "#FFA726";
      case "failed":
        return "#EF5350";
      default:
        return "#888";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "pending":
        return "Pending";
      case "failed":
        return "Failed";
      default:
        return status;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "booking":
        return "✂️";
      case "order":
        return "🛒";
      default:
        return "💳";
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "booking":
        return "Service Booking";
      case "order":
        return "Product Order";
      default:
        return "Transaction";
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      setTimeout(() => setError(null), 3000);
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setProofImage({
      uri: imageUrl,
      file: file,
      name: file.name,
      type: file.type,
    });
  };

  const handleUploadProof = (payment) => {
    setSelectedPayment(payment);
    setProofImage(null);
    setReceiptData({
      referenceNumber: "",
      name: "",
      amountPaid: "",
      dateOfTransaction: "",
    });
    setShowUploadModal(true);
  };

  const handleSubmitProof = async () => {
    if (!selectedPayment) {
      setError("No payment selected");
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!proofImage) {
      setError("Please upload payment proof");
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!receiptData.referenceNumber.trim()) {
      setError("Please enter reference number");
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!receiptData.name.trim()) {
      setError("Please enter your full name");
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!receiptData.amountPaid || parseFloat(receiptData.amountPaid) <= 0) {
      setError("Please enter a valid amount paid");
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!receiptData.dateOfTransaction) {
      setError("Please select date of transaction");
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      setUploadingProof(true);

      const formData = new FormData();
      formData.append("proofImage", proofImage.file);
      formData.append("referenceNumber", receiptData.referenceNumber.trim());
      formData.append("name", receiptData.name.trim());
      formData.append("amountPaid", receiptData.amountPaid);
      formData.append("dateOfTransaction", receiptData.dateOfTransaction);

      const uploadResponse = await paymentsAPI.uploadProof(
        selectedPayment.paymentId,
        formData
      );

      if (uploadResponse.data?.success) {
        setSuccessMessage("Payment proof uploaded successfully!");
        setShowUploadModal(false);
        setProofImage(null);
        setReceiptData({
          referenceNumber: "",
          name: "",
          amountPaid: "",
          dateOfTransaction: "",
        });
        setTimeout(() => setSuccessMessage(""), 3000);

        fetchPaymentHistory();
      } else {
        throw new Error(uploadResponse.data?.message || "Upload failed");
      }
    } catch (err) {
      console.error("❌ Error uploading proof:", err);
      setError(err.message || "Failed to upload payment proof");
      setTimeout(() => setError(null), 3000);
    } finally {
      setUploadingProof(false);
    }
  };

  const toggleTransactionDetails = (transactionId) => {
    setExpandedTransaction(
      expandedTransaction === transactionId ? null : transactionId
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  const getStylistDisplayName = (stylistInfo) => {
    if (!stylistInfo) return "Any Available";
    if (stylistInfo === "any") return "Any Available Professional";
    if (typeof stylistInfo === "object") {
      return (
        stylistInfo.firstName || stylistInfo.username || "Selected Professional"
      );
    }
    return "Selected Professional";
  };

  const filteredTransactions =
    paymentFilter === "all"
      ? transactions
      : transactions.filter((t) => t.status === paymentFilter);

  if (!isOpen) return null;

  return (
    <div className="payment-overlay" onClick={handleOverlayClick}>
      <div className="payment-container">
        {/* Success Message */}
        {successMessage && (
          <div className="success-message">✓ {successMessage}</div>
        )}

        {/* Error Message */}
        {error && <div className="error-message">✗ {error}</div>}

        {/* Header Section - Updated to match Bookings.jsx */}
        <div className="payment-header">
          {/* Back Button */}
          <button onClick={onClose} className="payment-back-button">
            <svg
              className="payment-back-icon"
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

          {/* Welcome Header - Updated to match Bookings.jsx */}
          <div className="payment-welcome-header">
            <div className="payment-welcome-text">
              <h1 className="payment-welcome-title">Welcome, James</h1>
              <p className="payment-welcome-date">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchPaymentHistory}
              disabled={loadingTransactions}
              className="payment-refresh-button">
              {loadingTransactions ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {/* Payment Banner - Updated to match Bookings.jsx */}
          <div className="payment-banner">
            <h2 className="payment-banner-text">PAYMENTS</h2>
          </div>
        </div>

        {/* Main Content */}
        <div className="payment-content">
          {loading ? (
            <div className="payment-loading-container">
              <div className="payment-loading-spinner"></div>
              <p className="payment-loading-text">Loading payment history...</p>
            </div>
          ) : error ? (
            <div className="payment-error-container">
              <p className="payment-error-text">Error: {error}</p>
              <button
                onClick={fetchPaymentHistory}
                className="payment-retry-button">
                Try Again
              </button>
            </div>
          ) : (
            <div className="transactions-container">
              {/* Filter Buttons */}
              <div className="payment-filter-container">
                <span className="payment-filter-label">Filter by:</span>
                {["all", "completed", "pending", "failed"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setPaymentFilter(filter)}
                    className={`payment-filter-button ${
                      paymentFilter === filter
                        ? "payment-filter-button-active"
                        : ""
                    }`}>
                    {filter === "all"
                      ? "All Transactions"
                      : getStatusText(filter)}
                  </button>
                ))}
              </div>

              {/* Transactions List */}
              <div className="transactions-list">
                <h3 className="transactions-title">
                  Recent Transactions ({filteredTransactions.length})
                </h3>

                {loadingTransactions ? (
                  <div className="transactions-loading">
                    <div className="payment-loading-spinner-small"></div>
                  </div>
                ) : filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <div key={transaction.id} className="transaction-card">
                      <div className="transaction-header">
                        <div className="transaction-info">
                          <div className="transaction-main">
                            <div
                              className="transaction-icon"
                              style={{
                                backgroundColor: `${getStatusColor(
                                  transaction.status
                                )}20`,
                                border: `1px solid ${getStatusColor(
                                  transaction.status
                                )}`,
                              }}>
                              {getTypeIcon(transaction.type)}
                            </div>
                            <div className="transaction-details">
                              <h4 className="transaction-service">
                                {transaction.service}
                              </h4>
                              <p className="transaction-meta">
                                {getTypeLabel(transaction.type)} •{" "}
                                {transaction.date} at {transaction.time}
                              </p>
                              {transaction.orderNumber && (
                                <p className="transaction-order">
                                  Order #: {transaction.orderNumber}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="transaction-grid">
                            <div className="transaction-field">
                              <span className="field-label">Date:</span>
                              <p className="field-value">{transaction.date}</p>
                            </div>
                            <div className="transaction-field">
                              <span className="field-label">Method:</span>
                              <p className="field-value">
                                {transaction.paymentMethod}
                              </p>
                            </div>
                            <div className="transaction-field">
                              <span className="field-label">Reference:</span>
                              <p className="field-value reference">
                                {transaction.referenceNumber}
                              </p>
                            </div>
                            <div className="transaction-field">
                              <span className="field-label">Amount:</span>
                              <p className="field-value amount">
                                {transaction.formattedAmount}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="transaction-actions">
                          <div
                            className="status-badge"
                            style={{
                              backgroundColor: `${getStatusColor(
                                transaction.status
                              )}20`,
                              color: getStatusColor(transaction.status),
                              border: `1px solid ${getStatusColor(
                                transaction.status
                              )}`,
                            }}>
                            {getStatusText(transaction.status)}
                          </div>

                          {transaction.status === "pending" &&
                            transaction.paymentId && (
                              <button
                                onClick={() => handleUploadProof(transaction)}
                                className="upload-proof-button">
                                Upload Proof
                              </button>
                            )}
                        </div>
                      </div>

                      {/* Expandable Details Section */}
                      <div className="transaction-expandable">
                        <button
                          onClick={() =>
                            toggleTransactionDetails(transaction.id)
                          }
                          className="expand-button">
                          <span>
                            {expandedTransaction === transaction.id
                              ? "Hide"
                              : "View"}{" "}
                            Details
                          </span>
                          <svg
                            className={`expand-icon ${
                              expandedTransaction === transaction.id
                                ? "expanded"
                                : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {expandedTransaction === transaction.id && (
                          <div className="expanded-content">
                            <h5 className="expanded-title">
                              {transaction.type === "booking"
                                ? "Service Details"
                                : "Product Details"}
                            </h5>

                            {/* Products/Services List */}
                            <div className="items-list">
                              {transaction.serviceDetails &&
                                transaction.serviceDetails.map(
                                  (item, index) => (
                                    <div key={index} className="item-card">
                                      <div className="item-info">
                                        {item.image && (
                                          <img
                                            src={item.image}
                                            alt={item.name}
                                            className="item-image"
                                            onError={(e) => {
                                              e.target.style.display = "none";
                                            }}
                                          />
                                        )}
                                        <div className="item-details">
                                          <p className="item-name">
                                            {item.name}
                                          </p>
                                          <p className="item-meta">
                                            {item.type === "service"
                                              ? `Service • ${
                                                  item.duration ||
                                                  "Standard duration"
                                                }`
                                              : `Product • Qty: ${item.quantity}`}
                                          </p>
                                        </div>
                                      </div>
                                      <p className="item-price">
                                        {formatPrice(
                                          item.type === "product"
                                            ? item.total
                                            : item.price
                                        )}
                                      </p>
                                    </div>
                                  )
                                )}
                            </div>

                            {/* Additional Information */}
                            <div className="additional-info">
                              {transaction.type === "booking" && (
                                <>
                                  <div className="info-field">
                                    <span className="info-label">
                                      Professional:
                                    </span>
                                    <p className="info-value">
                                      {getStylistDisplayName(
                                        transaction.stylist
                                      )}
                                    </p>
                                  </div>
                                  {transaction.bookingDate && (
                                    <div className="info-field">
                                      <span className="info-label">
                                        Appointment Date:
                                      </span>
                                      <p className="info-value">
                                        {new Date(
                                          transaction.bookingDate
                                        ).toLocaleDateString()}
                                      </p>
                                    </div>
                                  )}
                                  {transaction.bookingTime && (
                                    <div className="info-field">
                                      <span className="info-label">
                                        Appointment Time:
                                      </span>
                                      <p className="info-value">
                                        {transaction.bookingTime}
                                      </p>
                                    </div>
                                  )}
                                  <div className="info-field">
                                    <span className="info-label">
                                      Location:
                                    </span>
                                    <p className="info-value">
                                      {transaction.location}
                                    </p>
                                  </div>
                                </>
                              )}
                              {transaction.type === "order" && (
                                <>
                                  <div className="info-field">
                                    <span className="info-label">
                                      Delivery Type:
                                    </span>
                                    <p className="info-value capitalize">
                                      {transaction.deliveryType === "delivery"
                                        ? "Home Delivery"
                                        : "Pickup"}
                                    </p>
                                  </div>
                                  {transaction.shippingAddress && (
                                    <div className="info-field">
                                      <span className="info-label">
                                        Shipping Address:
                                      </span>
                                      <p className="info-value">
                                        {transaction.shippingAddress}
                                      </p>
                                    </div>
                                  )}
                                  {transaction.contactNumber && (
                                    <div className="info-field">
                                      <span className="info-label">
                                        Contact:
                                      </span>
                                      <p className="info-value">
                                        {transaction.contactNumber}
                                      </p>
                                    </div>
                                  )}
                                  <div className="info-field">
                                    <span className="info-label">
                                      Delivery Status:
                                    </span>
                                    <p className="info-value capitalize">
                                      {transaction.deliveryStatus}
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Total Amount */}
                            <div className="total-amount">
                              <span className="total-label">Total Amount:</span>
                              <span className="total-value">
                                {transaction.formattedAmount}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-transactions">
                    <div className="empty-icon">💳</div>
                    <h3 className="empty-title">No transactions found</h3>
                    <p className="empty-description">
                      {paymentFilter === "all"
                        ? "You don't have any transactions yet."
                        : `You don't have any ${paymentFilter} transactions.`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Proof Modal */}
      {showUploadModal && (
        <div
          className="upload-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowUploadModal(false);
              setProofImage(null);
              setReceiptData({
                referenceNumber: "",
                name: "",
                amountPaid: "",
                dateOfTransaction: "",
              });
            }
          }}>
          <div className="upload-modal">
            <h3 className="modal-title">Upload Payment Proof</h3>

            <div className="modal-content">
              {/* Payment Proof Image */}
              <div className="upload-field">
                <label className="upload-label">
                  Payment Proof Screenshot *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="file-input"
                />
                <div onClick={handleImageClick} className="upload-area">
                  {proofImage ? (
                    <div className="image-preview">
                      <img
                        src={proofImage.uri}
                        alt="Payment proof"
                        className="preview-image"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setProofImage(null);
                        }}
                        className="remove-image-button">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <div className="upload-icon">📸</div>
                      <p className="upload-text">
                        Click to upload payment screenshot
                      </p>
                      <p className="upload-hint">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Reference Number */}
              <div className="input-field">
                <label className="input-label">Reference Number *</label>
                <input
                  type="text"
                  value={receiptData.referenceNumber}
                  onChange={(e) =>
                    setReceiptData({
                      ...receiptData,
                      referenceNumber: e.target.value,
                    })
                  }
                  className="text-input"
                  placeholder="Enter reference number"
                />
              </div>

              {/* Name */}
              <div className="input-field">
                <label className="input-label">Your Full Name *</label>
                <input
                  type="text"
                  value={receiptData.name}
                  onChange={(e) =>
                    setReceiptData({ ...receiptData, name: e.target.value })
                  }
                  className="text-input"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Amount Paid */}
              <div className="input-field">
                <label className="input-label">Amount Paid *</label>
                <input
                  type="number"
                  value={receiptData.amountPaid}
                  onChange={(e) =>
                    setReceiptData({
                      ...receiptData,
                      amountPaid: e.target.value,
                    })
                  }
                  className="text-input"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Date of Transaction */}
              <div className="input-field">
                <label className="input-label">Date of Transaction *</label>
                <input
                  type="date"
                  value={receiptData.dateOfTransaction}
                  onChange={(e) =>
                    setReceiptData({
                      ...receiptData,
                      dateOfTransaction: e.target.value,
                    })
                  }
                  className="text-input"
                />
              </div>

              {/* Buttons */}
              <div className="modal-buttons">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setProofImage(null);
                    setReceiptData({
                      referenceNumber: "",
                      name: "",
                      amountPaid: "",
                      dateOfTransaction: "",
                    });
                  }}
                  className="cancel-button">
                  Cancel
                </button>
                <button
                  onClick={handleSubmitProof}
                  disabled={uploadingProof || !proofImage}
                  className="submit-button">
                  {uploadingProof ? "Uploading..." : "Submit Proof"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;
