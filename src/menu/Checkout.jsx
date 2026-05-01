import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import apiClient from "../services/api";
import "../styles/checkout.css";

// Payment method images
const paymentMethodImages = {
  gcash:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/GCash_logo.svg/1200px-GCash_logo.svg.png",
  paymaya:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Maya_logo.svg/2560px-Maya_logo.svg.png",
  paypal:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/1200px-PayPal.svg.png",
};

// QR Code images
const qrCodeImages = {
  gcash:
    "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=GCashPayment-Checkout-REF123456",
  paymaya:
    "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PayMayaPayment-Checkout-REF123456",
  paypal:
    "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PayPalPayment-Checkout-REF123456",
  default:
    "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=DefaultPayment-Checkout-REF123456",
};

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const cartData = location.state?.cart;

  const [currentScreen, setCurrentScreen] = useState("delivery");
  const [deliveryType, setDeliveryType] = useState("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("gcash");
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [currentPaymentId, setCurrentPaymentId] = useState(null);
  const [receiptData, setReceiptData] = useState({
    referenceNumber: "",
    name: "",
    amountPaid: "",
    dateOfTransaction: "",
  });
  const [proofImage, setProofImage] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("idle");
  const [paymentStatusMessage, setPaymentStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  const screens = [
    "delivery",
    "summary",
    "payment",
    "receipt",
    "receiptInfo",
    "status",
  ];

  // Refs for input elements
  const addressRef = useRef(null);
  const contactRef = useRef(null);
  const referenceNumberRef = useRef(null);
  const nameRef = useRef(null);
  const amountRef = useRef(null);
  const dateRef = useRef(null);

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Fetch customer information
  useEffect(() => {
    const fetchCustomerInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const user = JSON.parse(userStr);
            setCustomerInfo({
              name: user.name || user.firstName || "Customer",
              email: user.email || "",
              phone: user.phone || "",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching customer info:", error);
      }
    };

    fetchCustomerInfo();
  }, []);

  // Enhanced authentication check
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;

        if (token && user) {
          setIsAuthenticated(true);
          setIsGuest(user.isGuest || false);
        } else {
          // Only attempt guest login if we don't have any auth data
          await apiClient.auth.guestLogin();
          setIsAuthenticated(true);
          setIsGuest(true);
        }
      } catch (error) {
        console.error("Error checking auth:", error.message);
        setIsAuthenticated(false);
        setIsGuest(true);
      } finally {
        setLoading(false);
        setAuthChecked(true);
      }
    };

    if (!authChecked) {
      checkAuthStatus();
    }
  }, [authChecked]);

  // Enhanced payment status polling with better error handling
  const checkPaymentStatus = useCallback(async () => {
    if (!currentPaymentId) {
      console.log("⚠️ [POLL] No payment ID, skipping check");
      return;
    }

    try {
      console.log("🔄 [POLL] Checking payment status for:", currentPaymentId);

      const statusResponse = await apiClient.payments.getStatus(
        currentPaymentId
      );

      if (statusResponse.data?.success && statusResponse.data.data) {
        const status = statusResponse.data.data.status;

        console.log("📊 [POLL] Payment status from server:", status);

        if (status === "approved" || status === "completed") {
          console.log("✅ [POLL] Status is APPROVED/COMPLETED");
          setPaymentStatus("approved");
          setPaymentStatusMessage(
            statusResponse.data.data.processingNotes ||
              "Your order is confirmed! Thank you for your purchase."
          );
          // Clear interval when payment is approved
          return true;
        } else if (status === "denied") {
          console.log("❌ [POLL] Status is DENIED");
          setPaymentStatus("denied");
          setPaymentStatusMessage(
            statusResponse.data.data.processingNotes ||
              "Your payment was declined. Please check your payment details and try again."
          );
          // Clear interval when payment is denied
          return true;
        } else if (status === "processing") {
          console.log("⏳ [POLL] Status still PROCESSING");
          if (paymentStatus !== "processing") {
            setPaymentStatus("processing");
          }
        }
      }
    } catch (error) {
      console.error("❌ [POLL] Error checking payment status:", error.message);
    }
    return false;
  }, [currentPaymentId, paymentStatus]);

  // Enhanced polling with cleanup
  useEffect(() => {
    let interval = null;

    const startPolling = async () => {
      if (
        currentScreen === "status" &&
        currentPaymentId &&
        (paymentStatus === "processing" || paymentStatus === "idle")
      ) {
        console.log("✅ [POLLING SETUP] Starting polling every 3 seconds");

        // Check immediately first
        const isComplete = await checkPaymentStatus();

        if (!isComplete) {
          interval = setInterval(async () => {
            const isComplete = await checkPaymentStatus();
            if (isComplete && interval) {
              clearInterval(interval);
            }
          }, 3000);
        }
      }
    };

    startPolling();

    return () => {
      if (interval) {
        console.log("🛑 [POLLING CLEANUP] Stopping polling");
        clearInterval(interval);
      }
    };
  }, [currentScreen, currentPaymentId, paymentStatus, checkPaymentStatus]);

  // Navigation handlers
  const handleBack = () => {
    const idx = screens.indexOf(currentScreen);
    if (idx === 0) {
      navigate("/cart");
    } else {
      setCurrentScreen(screens[idx - 1]);
    }
  };

  // Enhanced validation for delivery info
  const handleContinueFromDelivery = () => {
    // Enhanced phone number validation
    const phoneRegex = /^(\+63|0)?[9]\d{9}$/;

    if (deliveryType === "delivery" && !deliveryAddress.trim()) {
      toast.error("Please enter your delivery address.");
      addressRef.current?.focus();
      return;
    }

    if (!contactNumber.trim()) {
      toast.error("Please enter your contact number.");
      contactRef.current?.focus();
      return;
    }

    if (!phoneRegex.test(contactNumber.replace(/\s/g, ""))) {
      toast.error(
        "Please enter a valid Philippine phone number (e.g., +63 912 345 6789 or 09123456789)"
      );
      contactRef.current?.focus();
      return;
    }

    setCurrentScreen("summary");
  };

  // Enhanced order creation with better error handling
  const handleProceedToPayment = async () => {
    if (!cartData || !cartData.items || cartData.items.length === 0) {
      toast.error("Your cart is empty.");
      navigate("/cart");
      return;
    }

    if (!authChecked) {
      toast.error("Checking authentication status...");
      return;
    }

    if (!isAuthenticated) {
      if (
        window.confirm(
          "Please log in to complete your order. Would you like to log in?"
        )
      ) {
        navigate("/auth");
      }
      return;
    }

    if (isGuest) {
      if (
        window.confirm(
          "Please complete your profile to place an order. Would you like to complete your profile?"
        )
      ) {
        navigate("/auth/signup");
      }
      return;
    }

    try {
      setLoading(true);

      // Enhanced order items preparation
      const orderItems = cartData.items.map((item) => {
        const product =
          typeof item.productId === "string" ? null : item.productId;

        return {
          productId:
            typeof item.productId === "string"
              ? item.productId
              : item.productId._id,
          quantity: item.quantity,
          price: product?.price || item.price,
          name: product?.name || item.name,
        };
      });

      // Enhanced order data
      const orderData = {
        items: orderItems,
        deliveryType,
        deliveryAddress:
          deliveryType === "delivery" ? deliveryAddress.trim() : undefined,
        contactNumber: contactNumber.trim(),
        specialInstructions: specialInstructions.trim(),
        customerNotes: "",
        totalAmount:
          cartData.totalAmount + (deliveryType === "delivery" ? 100 : 0),
      };

      console.log("📤 Creating order:", orderData);

      const orderResponse = await apiClient.orders.create(orderData);

      if (orderResponse.data?.success) {
        setCurrentOrderId(orderResponse.data.data._id);
        setCurrentScreen("payment");
        toast.success("Your order has been placed!");
      } else {
        throw new Error(
          orderResponse.data?.message || "Failed to create order"
        );
      }
    } catch (error) {
      console.error("❌ Error creating order:", error.message);
      toast.error(
        error.message ||
          "There was a problem creating your order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Enhanced payment creation
  const handlePayNow = async () => {
    if (!currentOrderId || !paymentMethod) {
      toast.error("Order or payment method is missing.");
      return;
    }

    try {
      setLoading(true);

      const paymentResponse = await apiClient.payments.create({
        orderId: currentOrderId,
        paymentMethod: paymentMethod,
      });

      if (paymentResponse.data?.success && paymentResponse.data.data) {
        const paymentId = paymentResponse.data.data._id;

        if (paymentId) {
          console.log("✅ Setting payment ID:", paymentId);
          setCurrentPaymentId(paymentId);
          setPaymentStatus("processing");
          setCurrentScreen("receipt");
        } else {
          throw new Error("Failed to get payment ID from server");
        }
      } else {
        throw new Error(
          paymentResponse.data?.message || "Failed to create payment"
        );
      }
    } catch (error) {
      console.error("❌ Error creating payment:", error);
      toast.error(error.message || "Failed to create payment.");
    } finally {
      setLoading(false);
    }
  };

  // Enhanced image picker with file validation
  const handlePickImage = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          // Enhanced file validation
          const maxSize = 5 * 1024 * 1024; // 5MB
          if (file.size > maxSize) {
            toast.error("Image size must be less than 5MB");
            return;
          }

          const validTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
          ];
          if (!validTypes.includes(file.type)) {
            toast.error("Please select a valid image file (JPEG, PNG, GIF)");
            return;
          }

          const imageUrl = URL.createObjectURL(file);
          setProofImage({
            uri: imageUrl,
            file: file,
            name: file.name,
            type: file.type,
          });
          toast.success("Payment proof image has been selected.");
        }
      };
      input.click();
    } catch (error) {
      console.error("Error picking image:", error.message);
      toast.error("Failed to select image.");
    }
  };

  const handleContinueToPersonalInfo = () => {
    if (!proofImage) {
      toast.error("Please upload payment proof.");
      return;
    }

    // Auto-generate receipt data
    const generatedReceiptData = {
      referenceNumber: `REF${Date.now().toString().slice(-8)}`,
      name: customerInfo?.name || "Customer Payment",
      amountPaid:
        cartData?.totalAmount + (deliveryType === "delivery" ? 100 : 0) || 0,
      dateOfTransaction: new Date().toISOString().split("T")[0],
    };

    setReceiptData(generatedReceiptData);
    setCurrentScreen("receiptInfo");
  };

  // Enhanced proof submission with better validation
  const handleSubmitProof = async () => {
    if (!currentPaymentId) {
      toast.error("Payment ID is missing. Please try again.");
      return;
    }

    if (!proofImage) {
      toast.error("Please upload payment proof.");
      return;
    }

    // Enhanced validation
    if (!receiptData.referenceNumber.trim()) {
      toast.error("Please enter reference number.");
      referenceNumberRef.current?.focus();
      return;
    }

    if (!receiptData.name.trim()) {
      toast.error("Please enter your full name.");
      nameRef.current?.focus();
      return;
    }

    if (!receiptData.amountPaid || parseFloat(receiptData.amountPaid) <= 0) {
      toast.error("Please enter a valid amount paid.");
      amountRef.current?.focus();
      return;
    }

    if (!receiptData.dateOfTransaction) {
      toast.error("Please select date of transaction.");
      dateRef.current?.focus();
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

      const uploadResponse = await apiClient.payments.uploadProof(
        currentPaymentId,
        formData
      );

      if (uploadResponse.data?.success) {
        setPaymentStatus("processing");
        setCurrentScreen("status");
        toast.success("Your payment is being verified.");

        // Start polling immediately
        setTimeout(() => {
          checkPaymentStatus();
        }, 2000);
      } else {
        throw new Error(uploadResponse.data?.message || "Upload failed");
      }
    } catch (error) {
      console.error("❌ Error uploading proof:", error.message);
      toast.error(error.message || "Failed to upload payment proof.");
    } finally {
      setUploadingProof(false);
    }
  };

  // Enhanced retry payment handler
  const handleRetryPayment = () => {
    setReceiptData({
      referenceNumber: "",
      name: "",
      amountPaid: "",
      dateOfTransaction: "",
    });
    setProofImage(null);
    setPaymentStatus("idle");
    setCurrentScreen("receipt");
  };

  const handleChangePaymentMethod = () => {
    setCurrentScreen("payment");
    setPaymentStatus("idle");
  };

  const handleBackToHome = async () => {
    // Clear cart after successful order
    try {
      await apiClient.cart.clear();
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
    navigate("/");
  };

  // Helper functions
  const getProduct = (item) => {
    if (typeof item.productId === "string") {
      return null;
    }
    return item.productId;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Enhanced input handlers to prevent typing issues
  const handleContactNumberChange = (value) => {
    // Allow only numbers, +, and spaces
    const cleanedValue = value.replace(/[^\d+\s]/g, "");
    setContactNumber(cleanedValue);
  };

  const handleAmountChange = (value) => {
    // Allow only numbers and decimal point
    const cleanedValue = value.replace(/[^\d.]/g, "");
    // Ensure only one decimal point
    const parts = cleanedValue.split(".");
    if (parts.length > 2) {
      setReceiptData({
        ...receiptData,
        amountPaid: parts[0] + "." + parts.slice(1).join(""),
      });
    } else {
      setReceiptData({ ...receiptData, amountPaid: cleanedValue });
    }
  };

  // Handle image loading errors
  const handleImageError = (imageType) => {
    setImageErrors((prev) => ({ ...prev, [imageType]: true }));
  };

  // Enhanced QR Code component
  const QRCodeDisplay = ({ paymentMethod }) => {
    if (!paymentMethod) return null;

    const qrImageUrl = qrCodeImages[paymentMethod] || qrCodeImages.default;
    const hasError = imageErrors[`qr-${paymentMethod}`];
    const totalAmount =
      cartData?.totalAmount + (deliveryType === "delivery" ? 100 : 0);

    return (
      <div className="qr-code-container enhanced">
        <div className="qr-code-header">
          <h4>Scan to Pay with {paymentMethod.toUpperCase()}</h4>
          <p className="payment-amount">Amount: {formatPrice(totalAmount)}</p>
        </div>
        <div className="qr-code-placeholder">
          <div className="qr-code-image">
            {!hasError ? (
              <img
                src={qrImageUrl}
                alt={`${paymentMethod} QR Code`}
                className="qr-code-img"
                onError={() => handleImageError(`qr-${paymentMethod}`)}
              />
            ) : (
              <div className="qr-code-fallback">
                <div className="qr-placeholder-text">
                  <i className="fas fa-qrcode"></i>
                  <span>QR Code</span>
                  <small>{paymentMethod.toUpperCase()}</small>
                </div>
              </div>
            )}
          </div>
          <div className="qr-instructions">
            <h5>How to Pay with {paymentMethod.toUpperCase()}:</h5>
            <ol>
              <li>Open your {paymentMethod} app</li>
              <li>Tap 'Scan QR Code' or 'Pay with QR'</li>
              <li>Point camera at the QR code above</li>
              <li>
                Enter amount: <strong>{formatPrice(totalAmount)}</strong>
              </li>
              <li>Confirm and complete payment</li>
              <li>Take a screenshot of the payment confirmation</li>
              <li>Upload the screenshot on the next screen</li>
            </ol>
            <div className="payment-note">
              <i className="fas fa-info-circle"></i>
              <span>Payment will be verified within 2-5 minutes</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Payment Method Icons Component
  const PaymentMethodIcons = () => {
    const methods = [
      { id: "gcash", name: "GCash", image: paymentMethodImages.gcash },
      { id: "paymaya", name: "Maya", image: paymentMethodImages.paymaya },
      { id: "paypal", name: "PayPal", image: paymentMethodImages.paypal },
    ];

    return (
      <div className="payment-methods-display">
        <div className="payment-methods-grid">
          {methods.map((method) => (
            <div
              key={method.id}
              className={`payment-method-icon ${
                paymentMethod === method.id ? "active" : ""
              }`}
              onClick={() => setPaymentMethod(method.id)}>
              <div className="payment-icon-container">
                {!imageErrors[`payment-${method.id}`] ? (
                  <img
                    src={method.image}
                    alt={method.name}
                    onError={() => handleImageError(`payment-${method.id}`)}
                  />
                ) : (
                  <div className="payment-icon-fallback">
                    <i className="fas fa-credit-card"></i>
                  </div>
                )}
              </div>
              <span>{method.name}</span>
              {paymentMethod === method.id && (
                <div className="selected-indicator">
                  <i className="fas fa-check"></i>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Progress indicator component
  const ProgressIndicator = ({ currentScreen }) => {
    const steps = ["delivery", "summary", "payment", "receipt", "status"];
    const currentStep = steps.indexOf(currentScreen);

    return (
      <div className="progress-indicator">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`progress-step ${
              index < currentStep
                ? "completed"
                : index === currentStep
                ? "active"
                : ""
            }`}>
            {index < currentStep ? <i className="fas fa-check"></i> : index + 1}
          </div>
        ))}
      </div>
    );
  };

  // DELIVERY INFO SCREEN
  const DeliveryInfoScreen = () => {
    const shippingFee = deliveryType === "delivery" ? 100 : 0;
    const total = (cartData?.totalAmount || 0) + shippingFee;

    return (
      <div className={`checkout-container ${isMobile ? "mobile" : ""}`}>
        <div className="checkout-header">
          <button className="back-button" onClick={handleBack}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1>Delivery Information</h1>
          <ProgressIndicator currentScreen={currentScreen} />
        </div>

        <div className="checkout-content">
          <div className="delivery-wrapper">
            <h2 className="section-title">Delivery Type</h2>

            <div className="delivery-options">
              <button
                className={`delivery-option ${
                  deliveryType === "pickup" ? "active" : ""
                }`}
                onClick={() => setDeliveryType("pickup")}>
                <div className="option-icon">
                  <i className="fas fa-store"></i>
                </div>
                <div className="option-info">
                  <h3>Pickup at Store</h3>
                  <p>Free - Available during business hours</p>
                </div>
                <div
                  className={`radio-button ${
                    deliveryType === "pickup" ? "active" : ""
                  }`}>
                  {deliveryType === "pickup" && <div className="radio-dot" />}
                </div>
              </button>

              <button
                className={`delivery-option ${
                  deliveryType === "delivery" ? "active" : ""
                }`}
                onClick={() => setDeliveryType("delivery")}>
                <div className="option-icon">
                  <i className="fas fa-motorcycle"></i>
                </div>
                <div className="option-info">
                  <h3>Home Delivery</h3>
                  <p>₱100 delivery fee</p>
                </div>
                <div
                  className={`radio-button ${
                    deliveryType === "delivery" ? "active" : ""
                  }`}>
                  {deliveryType === "delivery" && <div className="radio-dot" />}
                </div>
              </button>
            </div>

            {deliveryType === "delivery" && (
              <div className="form-section">
                <label className="form-label">Delivery Address *</label>
                <textarea
                  ref={addressRef}
                  className="form-input"
                  placeholder="Enter your full address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            <div className="form-section">
              <label className="form-label">Contact Number *</label>
              <input
                ref={contactRef}
                type="tel"
                className="form-input"
                placeholder="+63 XXX XXX XXXX or 09XXXXXXXXX"
                value={contactNumber}
                onChange={(e) => handleContactNumberChange(e.target.value)}
              />
              <small className="input-hint">
                Format: +63 912 345 6789 or 09123456789
              </small>
            </div>

            <div className="form-section">
              <label className="form-label">Special Instructions</label>
              <textarea
                className="form-input"
                placeholder="Any special requests? (Optional)"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>

        {!isMobile && (
          <div className="checkout-sidebar">
            <div className="service-summary">
              <h3>Order Summary</h3>
              <div className="summary-info">
                <div className="info-row">
                  <span className="label">Items:</span>
                  <span>{cartData?.items?.length || 0} items</span>
                </div>
                <div className="info-row">
                  <span className="label">Subtotal:</span>
                  <span>{formatPrice(cartData?.totalAmount || 0)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Shipping:</span>
                  <span>{formatPrice(shippingFee)}</span>
                </div>
                <div className="divider"></div>
                <div className="info-row total">
                  <span className="label">Total:</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
            <button
              className="continue-button"
              onClick={handleContinueFromDelivery}
              disabled={loading}>
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  Loading...
                </>
              ) : (
                "Continue to Summary"
              )}
            </button>
          </div>
        )}

        {isMobile && (
          <div className="mobile-bottom-bar">
            <div className="mobile-summary">
              <div className="mobile-summary-content">
                <div className="mobile-service-info">
                  <span className="service-name">
                    {cartData?.items?.length || 0} items
                  </span>
                  <span className="service-price">{formatPrice(total)}</span>
                </div>
                <div className="mobile-delivery-info">
                  <span>
                    {deliveryType === "pickup"
                      ? "Store Pickup"
                      : "Home Delivery"}
                  </span>
                </div>
              </div>
            </div>
            <button
              className="mobile-continue-button"
              onClick={handleContinueFromDelivery}
              disabled={loading}>
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  Loading...
                </>
              ) : (
                "Continue"
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  // ORDER SUMMARY SCREEN
  const OrderSummaryScreen = () => {
    const shippingFee = deliveryType === "delivery" ? 100 : 0;
    const total = (cartData?.totalAmount || 0) + shippingFee;

    return (
      <div className={`checkout-container ${isMobile ? "mobile" : ""}`}>
        <div className="checkout-header">
          <button className="back-button" onClick={handleBack}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1>Order Summary</h1>
          <ProgressIndicator currentScreen={currentScreen} />
        </div>

        <div className="checkout-content">
          <div className="summary-grid">
            {/* Order Items Card */}
            <div className="summary-card">
              <h3 className="card-title">
                <i className="fas fa-shopping-cart"></i> Order Items
              </h3>
              <div className="card-content">
                {cartData?.items?.map((item) => {
                  const product = getProduct(item);
                  if (!product) return null;

                  return (
                    <div key={item._id} className="summary-item">
                      <div className="item-image">
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          onError={(e) => {
                            e.target.src = "/placeholder.svg";
                          }}
                        />
                      </div>
                      <div className="item-info">
                        <h4>{product.name}</h4>
                        <p>Qty: {item.quantity}</p>
                      </div>
                      <div className="item-price">
                        {formatPrice(product.price * item.quantity)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Details Card */}
            <div className="summary-card">
              <h3 className="card-title">
                <i className="fas fa-truck"></i> Delivery Details
              </h3>
              <div className="card-content">
                <div className="detail-row">
                  <span>Type</span>
                  <span>
                    {deliveryType === "pickup"
                      ? "Pickup at Store"
                      : "Home Delivery"}
                  </span>
                </div>
                {deliveryType === "delivery" && (
                  <div className="detail-row">
                    <span>Address</span>
                    <span>{deliveryAddress}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span>Contact</span>
                  <span>{contactNumber}</span>
                </div>
                {specialInstructions && (
                  <div className="detail-row">
                    <span>Instructions</span>
                    <span>{specialInstructions}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing Card */}
            <div className="summary-card">
              <h3 className="card-title">
                <i className="fas fa-receipt"></i> Price Details
              </h3>
              <div className="card-content">
                <div className="pricing-row">
                  <span>Subtotal ({cartData?.items?.length || 0} items)</span>
                  <span>{formatPrice(cartData?.totalAmount || 0)}</span>
                </div>
                <div className="pricing-row">
                  <span>Shipping Fee</span>
                  <span>{formatPrice(shippingFee)}</span>
                </div>
                <div className="divider"></div>
                <div className="pricing-row total">
                  <span>Total Amount</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!isMobile && (
          <div className="checkout-sidebar">
            <div className="service-summary">
              <h3>Order Summary</h3>
              <div className="summary-info">
                <div className="info-row">
                  <span className="label">Items:</span>
                  <span>{cartData?.items?.length || 0} items</span>
                </div>
                <div className="info-row">
                  <span className="label">Subtotal:</span>
                  <span>{formatPrice(cartData?.totalAmount || 0)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Shipping:</span>
                  <span>{formatPrice(shippingFee)}</span>
                </div>
                <div className="divider"></div>
                <div className="info-row total">
                  <span className="label">Total:</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
            <button
              className="continue-button"
              onClick={handleProceedToPayment}
              disabled={loading}>
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  Processing...
                </>
              ) : (
                "Proceed to Payment"
              )}
            </button>
          </div>
        )}

        {isMobile && (
          <div className="mobile-bottom-bar">
            <div className="mobile-summary">
              <div className="mobile-summary-content">
                <div className="mobile-service-info">
                  <span className="service-name">
                    {cartData?.items?.length || 0} items
                  </span>
                  <span className="service-price">{formatPrice(total)}</span>
                </div>
                <div className="mobile-delivery-info">
                  <span>
                    {deliveryType === "pickup"
                      ? "Store Pickup"
                      : "Home Delivery"}
                  </span>
                </div>
              </div>
            </div>
            <button
              className="mobile-continue-button"
              onClick={handleProceedToPayment}
              disabled={loading}>
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  Processing...
                </>
              ) : (
                "Proceed to Payment"
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  // PAYMENT METHOD SCREEN
  const PaymentMethodScreen = () => {
    const shippingFee = deliveryType === "delivery" ? 100 : 0;
    const total = (cartData?.totalAmount || 0) + shippingFee;

    return (
      <div className={`checkout-container ${isMobile ? "mobile" : ""}`}>
        <div className="checkout-header">
          <button className="back-button" onClick={handleBack}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1>Payment Method</h1>
          <ProgressIndicator currentScreen={currentScreen} />
        </div>

        <div className="checkout-content">
          <div className="payment-wrapper">
            <h2 className="payment-title">Choose Payment Method</h2>

            {/* Enhanced Payment Method Icons */}
            <PaymentMethodIcons />

            {/* Enhanced QR Code Display */}
            <div className="qr-code-section enhanced">
              <QRCodeDisplay paymentMethod={paymentMethod} />
            </div>
          </div>
        </div>

        {!isMobile && (
          <div className="checkout-sidebar">
            <div className="service-summary">
              <h3>Payment Summary</h3>
              <div className="summary-info">
                <div className="info-row">
                  <span className="label">Items:</span>
                  <span>{cartData?.items?.length || 0} items</span>
                </div>
                <div className="info-row">
                  <span className="label">Subtotal:</span>
                  <span>{formatPrice(cartData?.totalAmount || 0)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Shipping:</span>
                  <span>{formatPrice(shippingFee)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Payment Method:</span>
                  <span className="payment-method-badge">
                    {paymentMethod === "gcash" && "GCash"}
                    {paymentMethod === "paymaya" && "Maya"}
                    {paymentMethod === "paypal" && "PayPal"}
                  </span>
                </div>
                <div className="divider"></div>
                <div className="info-row total">
                  <span className="label">Total:</span>
                  <span className="total-amount">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
            <button
              className="continue-button"
              onClick={handlePayNow}
              disabled={loading}>
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  Processing...
                </>
              ) : (
                `Pay ${formatPrice(total)}`
              )}
            </button>
          </div>
        )}

        {isMobile && (
          <div className="mobile-bottom-bar">
            <div className="mobile-summary">
              <div className="mobile-summary-content">
                <div className="mobile-service-info">
                  <span className="service-name">
                    {cartData?.items?.length || 0} items
                  </span>
                  <span className="service-price">{formatPrice(total)}</span>
                </div>
                <div className="mobile-payment-info">
                  <span>
                    {paymentMethod === "gcash" && "GCash"}
                    {paymentMethod === "paymaya" && "Maya"}
                    {paymentMethod === "paypal" && "PayPal"}
                  </span>
                </div>
              </div>
            </div>
            <button
              className="mobile-continue-button"
              onClick={handlePayNow}
              disabled={loading}>
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  Processing...
                </>
              ) : (
                `Pay ${formatPrice(total)}`
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  // RECEIPT SCREEN
  const ReceiptScreen = () => {
    const shippingFee = deliveryType === "delivery" ? 100 : 0;
    const total = (cartData?.totalAmount || 0) + shippingFee;

    return (
      <div className={`checkout-container ${isMobile ? "mobile" : ""}`}>
        <div className="checkout-header">
          <button className="back-button" onClick={handleBack}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1>Upload Payment Proof</h1>
          <ProgressIndicator currentScreen={currentScreen} />
        </div>

        <div className="checkout-content">
          <div className="receipt-wrapper enhanced">
            <div className="upload-section enhanced">
              <div className="upload-header">
                <i className="fas fa-camera"></i>
                <h2>Upload Payment Receipt</h2>
              </div>
              <p className="upload-description">
                Please take a screenshot of your payment confirmation and upload
                it below for verification
              </p>

              {!proofImage ? (
                <div className="upload-area" onClick={handlePickImage}>
                  <div className="upload-placeholder">
                    <i className="fas fa-cloud-upload-alt"></i>
                    <h4>Click to Upload Payment Proof</h4>
                    <p>Supported formats: JPG, PNG, GIF (Max 5MB)</p>
                  </div>
                </div>
              ) : (
                <div className="selected-image enhanced">
                  <div className="image-preview">
                    <img src={proofImage.uri} alt="Payment proof" />
                    <div className="image-overlay">
                      <button
                        className="remove-button"
                        onClick={() => setProofImage(null)}>
                        <i className="fas fa-times"></i> Remove
                      </button>
                    </div>
                  </div>
                  <p className="image-filename">
                    <i className="fas fa-file-image"></i> {proofImage.name}
                  </p>
                </div>
              )}
            </div>

            {/* Enhanced QR Code Display */}
            <div className="qr-code-section enhanced">
              <QRCodeDisplay paymentMethod={paymentMethod} />
            </div>
          </div>
        </div>

        {!isMobile && (
          <div className="checkout-sidebar">
            <div className="service-summary">
              <h3>Payment Details</h3>
              <div className="summary-info">
                <div className="info-row">
                  <span className="label">Items:</span>
                  <span>{cartData?.items?.length || 0} items</span>
                </div>
                <div className="info-row">
                  <span className="label">Amount:</span>
                  <span className="amount">{formatPrice(total)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Payment Method:</span>
                  <span className="payment-method-badge">
                    {paymentMethod === "gcash" && "GCash"}
                    {paymentMethod === "paymaya" && "Maya"}
                    {paymentMethod === "paypal" && "PayPal"}
                  </span>
                </div>
                <div className="info-row status">
                  <span className="label">Proof Status:</span>
                  <span
                    className={`status-badge ${
                      proofImage ? "uploaded" : "pending"
                    }`}>
                    {proofImage ? "Uploaded" : "Pending"}
                  </span>
                </div>
                <div className="divider"></div>
                <div className="info-row total">
                  <span className="label">Total Paid:</span>
                  <span className="total-amount">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
            <button
              className="continue-button"
              onClick={handleContinueToPersonalInfo}
              disabled={!proofImage || loading}>
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  Processing...
                </>
              ) : (
                "Continue to Payment Details"
              )}
            </button>
          </div>
        )}

        {isMobile && (
          <div className="mobile-bottom-bar">
            <div className="mobile-upload-status">
              {proofImage ? (
                <div className="upload-status success">
                  <i className="fas fa-check-circle"></i>
                  <span>Proof Uploaded</span>
                </div>
              ) : (
                <div className="upload-status pending">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>Proof Required</span>
                </div>
              )}
            </div>
            <button
              className="mobile-continue-button"
              onClick={handleContinueToPersonalInfo}
              disabled={!proofImage || loading}>
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  Processing...
                </>
              ) : (
                "Continue to Payment Details"
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  // RECEIPT INFO SCREEN
  const ReceiptInfoScreen = () => {
    const shippingFee = deliveryType === "delivery" ? 100 : 0;
    const total = (cartData?.totalAmount || 0) + shippingFee;

    return (
      <div className={`checkout-container ${isMobile ? "mobile" : ""}`}>
        <div className="checkout-header">
          <button className="back-button" onClick={handleBack}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1>Payment Confirmation</h1>
          <ProgressIndicator currentScreen={currentScreen} />
        </div>

        <div className="checkout-content">
          <div className="form-wrapper">
            <div className="payment-confirmation-header enhanced">
              <div className="confirmation-icon">
                <i className="fas fa-file-invoice-dollar"></i>
              </div>
              <h2>Payment Confirmation</h2>
              <p>
                Please review and verify your payment details before submission
              </p>
            </div>

            <div className="payment-details-container enhanced">
              {/* Customer Information */}
              {customerInfo && (
                <div className="info-card customer-info-card enhanced">
                  <div className="card-header enhanced">
                    <div className="header-icon">
                      <i className="fas fa-user-circle"></i>
                    </div>
                    <div className="header-content">
                      <h4>Customer Information</h4>
                      <span>Your personal details</span>
                    </div>
                  </div>
                  <div className="card-content enhanced">
                    <div className="info-grid enhanced">
                      <div className="info-item enhanced">
                        <div className="info-label">
                          <i className="fas fa-user"></i>
                          <span>Full Name</span>
                        </div>
                        <span className="info-value">{customerInfo.name}</span>
                      </div>
                      {customerInfo.email && (
                        <div className="info-item enhanced">
                          <div className="info-label">
                            <i className="fas fa-envelope"></i>
                            <span>Email Address</span>
                          </div>
                          <span className="info-value">
                            {customerInfo.email}
                          </span>
                        </div>
                      )}
                      {customerInfo.phone && (
                        <div className="info-item enhanced">
                          <div className="info-label">
                            <i className="fas fa-phone"></i>
                            <span>Phone Number</span>
                          </div>
                          <span className="info-value">
                            {customerInfo.phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Details */}
              <div className="info-card payment-info-card enhanced">
                <div className="card-header enhanced">
                  <div className="header-icon">
                    <i className="fas fa-credit-card"></i>
                  </div>
                  <div className="header-content">
                    <h4>Payment Details</h4>
                    <span>Transaction information</span>
                  </div>
                </div>
                <div className="card-content enhanced">
                  <div className="info-grid enhanced">
                    <div className="info-item enhanced highlight">
                      <div className="info-label">
                        <i className="fas fa-hashtag"></i>
                        <span>Reference Number</span>
                      </div>
                      <span className="info-value reference-number">
                        {receiptData.referenceNumber}
                      </span>
                    </div>
                    <div className="info-item enhanced">
                      <div className="info-label">
                        <i className="fas fa-user-tag"></i>
                        <span>Account Name</span>
                      </div>
                      <span className="info-value">{receiptData.name}</span>
                    </div>
                    <div className="info-item enhanced highlight">
                      <div className="info-label">
                        <i className="fas fa-money-bill-wave"></i>
                        <span>Amount Paid</span>
                      </div>
                      <span className="info-value amount-paid">
                        {formatPrice(total)}
                      </span>
                    </div>
                    <div className="info-item enhanced">
                      <div className="info-label">
                        <i className="fas fa-wallet"></i>
                        <span>Payment Method</span>
                      </div>
                      <span className="info-value payment-method">
                        <span
                          className={`payment-badge enhanced ${paymentMethod}`}>
                          {paymentMethod === "gcash" && (
                            <>
                              <img
                                src={paymentMethodImages.gcash}
                                alt="GCash"
                              />
                              <span>GCash</span>
                            </>
                          )}
                          {paymentMethod === "paymaya" && (
                            <>
                              <img
                                src={paymentMethodImages.paymaya}
                                alt="Maya"
                              />
                              <span>Maya</span>
                            </>
                          )}
                          {paymentMethod === "paypal" && (
                            <>
                              <img
                                src={paymentMethodImages.paypal}
                                alt="PayPal"
                              />
                              <span>PayPal</span>
                            </>
                          )}
                        </span>
                      </span>
                    </div>
                    <div className="info-item enhanced">
                      <div className="info-label">
                        <i className="fas fa-calendar-alt"></i>
                        <span>Transaction Date & Time</span>
                      </div>
                      <span className="info-value">
                        {new Date().toLocaleString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="info-card service-info-card enhanced">
                <div className="card-header enhanced">
                  <div className="header-icon">
                    <i className="fas fa-shopping-bag"></i>
                  </div>
                  <div className="header-content">
                    <h4>Order Details</h4>
                    <span>Purchase information</span>
                  </div>
                </div>
                <div className="card-content enhanced">
                  <div className="info-grid enhanced">
                    <div className="info-item enhanced">
                      <div className="info-label">
                        <i className="fas fa-box"></i>
                        <span>Items</span>
                      </div>
                      <span className="info-value">
                        {cartData?.items?.length || 0} products
                      </span>
                    </div>
                    <div className="info-item enhanced">
                      <div className="info-label">
                        <i className="fas fa-truck"></i>
                        <span>Delivery Type</span>
                      </div>
                      <span className="info-value">
                        {deliveryType === "pickup"
                          ? "Store Pickup"
                          : "Home Delivery"}
                      </span>
                    </div>
                    {deliveryType === "delivery" && (
                      <div className="info-item enhanced">
                        <div className="info-label">
                          <i className="fas fa-map-marker-alt"></i>
                          <span>Delivery Address</span>
                        </div>
                        <span className="info-value">{deliveryAddress}</span>
                      </div>
                    )}
                    <div className="info-item enhanced">
                      <div className="info-label">
                        <i className="fas fa-phone"></i>
                        <span>Contact Number</span>
                      </div>
                      <span className="info-value">{contactNumber}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Uploaded Proof Preview */}
              {proofImage && (
                <div className="info-card proof-card enhanced">
                  <div className="card-header enhanced">
                    <div className="header-icon">
                      <i className="fas fa-receipt"></i>
                    </div>
                    <div className="header-content">
                      <h4>Uploaded Payment Proof</h4>
                      <span>Screenshot of payment confirmation</span>
                    </div>
                  </div>
                  <div className="card-content enhanced">
                    <div className="proof-preview enhanced">
                      <div className="proof-image-container">
                        <img src={proofImage.uri} alt="Payment proof" />
                        <div className="proof-overlay">
                          <button
                            className="view-proof-btn"
                            onClick={() =>
                              window.open(proofImage.uri, "_blank")
                            }>
                            <i className="fas fa-expand"></i>
                            View Full Size
                          </button>
                        </div>
                      </div>
                      <div className="proof-details">
                        <i className="fas fa-file-image"></i>
                        <div className="file-info">
                          <span className="filename">{proofImage.name}</span>
                          <span className="file-size">
                            {(proofImage.file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="verification-notice enhanced">
              <div className="notice-icon">
                <i className="fas fa-shield-check"></i>
              </div>
              <div className="notice-content">
                <h5>Verification in Progress</h5>
                <p>
                  Your payment details have been submitted and are being
                  verified. You will receive a confirmation email once the
                  verification is complete. This usually takes 2-5 minutes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {!isMobile && (
          <div className="checkout-sidebar">
            <div className="service-summary enhanced">
              <div className="summary-header">
                <i className="fas fa-clipboard-check"></i>
                <h3>Ready to Submit</h3>
              </div>
              <div className="summary-info enhanced">
                <div className="summary-item">
                  <div className="item-icon">
                    <i className="fas fa-box"></i>
                  </div>
                  <div className="item-content">
                    <span className="item-label">Items</span>
                    <span className="item-value">
                      {cartData?.items?.length || 0} products
                    </span>
                  </div>
                </div>
                <div className="summary-item">
                  <div className="item-icon">
                    <i className="fas fa-truck"></i>
                  </div>
                  <div className="item-content">
                    <span className="item-label">Delivery</span>
                    <span className="item-value">
                      {deliveryType === "pickup"
                        ? "Store Pickup"
                        : "Home Delivery"}
                    </span>
                  </div>
                </div>
                <div className="summary-item">
                  <div className="item-icon">
                    <i className="fas fa-money-bill"></i>
                  </div>
                  <div className="item-content">
                    <span className="item-label">Amount Paid</span>
                    <span className="item-value">{formatPrice(total)}</span>
                  </div>
                </div>
                {proofImage && (
                  <div className="summary-item success">
                    <div className="item-icon">
                      <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="item-content">
                      <span className="item-label">Proof Status</span>
                      <span className="item-value success">Uploaded ✓</span>
                    </div>
                  </div>
                )}
                <div className="status-indicator">
                  <div className="status-content">
                    <span className="status-label">Verification Status</span>
                    <span className="status-badge pending-verification">
                      <i className="fas fa-spinner fa-spin"></i>
                      Pending Verification
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button
              className="submit-button enhanced"
              onClick={handleSubmitProof}
              disabled={uploadingProof}>
              {uploadingProof ? (
                <>
                  <div className="loading-spinner"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i>
                  Confirm & Submit Payment
                </>
              )}
            </button>
          </div>
        )}

        {isMobile && (
          <div className="mobile-bottom-bar">
            <div className="mobile-summary-enhanced">
              <div className="mobile-status">
                <div className="status-indicator-mobile">
                  <i className="fas fa-shield-alt"></i>
                  <span>Ready for Verification</span>
                </div>
                {proofImage && (
                  <div className="proof-status-mobile success">
                    <i className="fas fa-check-circle"></i>
                    <span>Proof Uploaded</span>
                  </div>
                )}
              </div>
              <button
                className="mobile-submit-button enhanced"
                onClick={handleSubmitProof}
                disabled={uploadingProof}>
                {uploadingProof ? (
                  <>
                    <div className="loading-spinner"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    Submit Payment
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // PAYMENT STATUS SCREEN
  const PaymentStatusScreen = () => {
    const shippingFee = deliveryType === "delivery" ? 100 : 0;
    const total = (cartData?.totalAmount || 0) + shippingFee;

    const getStatusColor = () => {
      switch (paymentStatus) {
        case "approved":
          return "#10b981";
        case "denied":
          return "#ef4444";
        default:
          return "#f59e0b";
      }
    };

    const getStatusText = () => {
      switch (paymentStatus) {
        case "approved":
          return "Approved";
        case "denied":
          return "Denied";
        default:
          return "Pending";
      }
    };

    return (
      <div className={`checkout-container ${isMobile ? "mobile" : ""}`}>
        <div className="checkout-header">
          <button className="back-button" onClick={handleBackToHome}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1>Order Status</h1>
          <ProgressIndicator currentScreen={currentScreen} />
        </div>

        <div className="checkout-content">
          <div className="status-wrapper">
            <div className="status-card">
              <div className={`status-icon ${paymentStatus}`}>
                {paymentStatus === "processing" && (
                  <i className="fas fa-spinner fa-spin"></i>
                )}
                {paymentStatus === "approved" && (
                  <i className="fas fa-check-circle"></i>
                )}
                {paymentStatus === "denied" && (
                  <i className="fas fa-times-circle"></i>
                )}
              </div>

              <h2 className="status-title">
                {paymentStatus === "processing" && "Payment Processing"}
                {paymentStatus === "approved" && "Payment Approved!"}
                {paymentStatus === "denied" && "Payment Failed"}
              </h2>

              <p className="status-message">{paymentStatusMessage}</p>

              {paymentStatus === "processing" && (
                <div className="status-details">
                  <div className="status-detail-item">
                    <span className="detail-label">Status</span>
                    <span className="detail-value">Processing</span>
                  </div>
                  <div className="status-detail-item">
                    <span className="detail-label">Estimated Time</span>
                    <span className="detail-value">2-5 minutes</span>
                  </div>
                  <div className="status-detail-item">
                    <span className="detail-label">Reference</span>
                    <span className="detail-value">{currentPaymentId}</span>
                  </div>
                </div>
              )}

              {paymentStatus === "approved" && (
                <div className="booking-confirmed">
                  <div className="status-details">
                    <div className="status-detail-item">
                      <span className="detail-label">Order ID</span>
                      <span className="detail-value">{currentOrderId}</span>
                    </div>
                    <div className="status-detail-item">
                      <span className="detail-label">Items</span>
                      <span className="detail-value">
                        {cartData?.items?.length || 0} products
                      </span>
                    </div>
                    <div className="status-detail-item">
                      <span className="detail-label">Total Amount</span>
                      <span className="detail-value">{formatPrice(total)}</span>
                    </div>
                    <div className="status-detail-item">
                      <span className="detail-label">Delivery</span>
                      <span className="detail-value">
                        {deliveryType === "pickup"
                          ? "Store Pickup"
                          : "Home Delivery"}
                      </span>
                    </div>
                  </div>
                  <button
                    className="continue-button"
                    onClick={handleBackToHome}
                    style={{ marginTop: "1.5rem" }}>
                    Back to Home
                  </button>
                </div>
              )}

              {paymentStatus === "denied" && (
                <div className="booking-denied">
                  <div className="status-details">
                    <div className="status-detail-item">
                      <span className="detail-label">Reason</span>
                      <span className="detail-value">
                        Payment verification failed
                      </span>
                    </div>
                  </div>
                  <div className="action-buttons">
                    <button
                      onClick={handleRetryPayment}
                      className="retry-button">
                      Re-upload Proof
                    </button>
                    <button
                      onClick={handleChangePaymentMethod}
                      className="change-method-button">
                      Change Payment Method
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // RENDER CURRENT SCREEN
  const renderCurrentScreen = () => {
    if (loading && !authChecked) {
      return (
        <div className="loading-container">
          <div className="loading-spinner large"></div>
          <p>Checking authentication...</p>
        </div>
      );
    }

    if (!cartData || !cartData.items || cartData.items.length === 0) {
      return (
        <div className="no-cart">
          <i className="fas fa-shopping-cart"></i>
          <h2>Your cart is empty</h2>
          <p>Please add some products to your cart first</p>
          <button onClick={() => navigate("/products")}>Browse Products</button>
        </div>
      );
    }

    switch (currentScreen) {
      case "delivery":
        return <DeliveryInfoScreen />;
      case "summary":
        return <OrderSummaryScreen />;
      case "payment":
        return <PaymentMethodScreen />;
      case "receipt":
        return <ReceiptScreen />;
      case "receiptInfo":
        return <ReceiptInfoScreen />;
      case "status":
        return <PaymentStatusScreen />;
      default:
        return null;
    }
  };

  return (
    <div className="checkout-page">
      {renderCurrentScreen()}
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
};

export default Checkout;
