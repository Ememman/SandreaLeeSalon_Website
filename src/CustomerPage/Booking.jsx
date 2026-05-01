import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import apiClient from "../services/api";
import "../styles/Booking.css";

// Updated payment method images with proper paths and fallbacks
const paymentMethodImages = {
  gcash:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/GCash_logo.svg/1200px-GCash_logo.svg.png",
  paymaya:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Maya_logo.svg/2560px-Maya_logo.svg.png",
  paypal:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/1200px-PayPal.svg.png",
  card: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/1200px-Visa_Inc._logo.svg.png",
};

// QR Code images with proper fallback URLs
const qrCodeImages = {
  gcash:
    "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=GCashPayment-Booking-REF123456",
  paymaya:
    "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PayMayaPayment-Booking-REF123456",
  paypal:
    "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PayPalPayment-Booking-REF123456",
  default:
    "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=DefaultPayment-Booking-REF123456",
};

// Debug function to log API response structure
const debugResponse = (response, endpoint) => {
  console.log(`🔍 Debug ${endpoint} response:`, {
    fullResponse: response,
    data: response.data,
    success: response.data?.success,
    bookingData: response.data?.data,
    bookingId: response.data?.data?._id || response.data?.data?.id,
    status: response.status,
    statusText: response.statusText,
  });
};

// Enhanced API error handler
const handleApiError = (error, defaultMessage = "An error occurred") => {
  console.error("API Error:", error);

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.message) {
    return error.message;
  }

  return defaultMessage;
};

const Booking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedService = location.state?.service;

  const [currentScreen, setCurrentScreen] = useState("stylist");
  const [selectedStylist, setSelectedStylist] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [stylists, setStylists] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("gcash");
  const [paymentType, setPaymentType] = useState("online");
  const [paymentOption, setPaymentOption] = useState("full");
  const [currentBookingId, setCurrentBookingId] = useState(null);
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
  const [stylistSelectionType, setStylistSelectionType] = useState(null);
  const [filteredStylists, setFilteredStylists] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("all");
  const [availableDates, setAvailableDates] = useState([]);
  const [qrCodeData, setQrCodeData] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [downpaymentAmount, setDownpaymentAmount] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [bookedSlots, setBookedSlots] = useState({});
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [staffAvailability, setStaffAvailability] = useState({});

  const screens = [
    "stylist",
    "datetime",
    "summary",
    "payment-option",
    "payment",
    "receipt",
    "receiptInfo",
    "status",
  ];

  // Calculate payment amounts based on service price
  useEffect(() => {
    if (selectedService) {
      const priceString = selectedService.price;
      const numericAmount = parseFloat(priceString.replace(/[^\d.]/g, "")) || 0;
      setTotalAmount(numericAmount);

      // Calculate downpayment (30% of total - matching backend default)
      const downpayment = Math.floor(numericAmount * 0.3);
      setDownpaymentAmount(downpayment);
      setRemainingAmount(numericAmount - downpayment);
    }
  }, [selectedService]);

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

    checkAuthStatus();
  }, []);

  useEffect(() => {
    const fetchStylists = async () => {
      try {
        setLoading(true);
        console.log("[v0] Fetching stylists...");

        const stylistsResponse = await apiClient.stylists.getAll();

        if (stylistsResponse.data?.success && stylistsResponse.data.data) {
          const stylistList = Array.isArray(stylistsResponse.data.data)
            ? stylistsResponse.data.data
            : [];

          const enhancedStylists = stylistList.map((stylist) =>
            apiClient.utils.staff.formatStaffData(stylist),
          );

          console.log("[v0] Stylists loaded:", enhancedStylists.length);
          setStylists(enhancedStylists);
          setFilteredStylists(enhancedStylists);
        } else {
          console.error("[v0] Invalid stylists response format");
          toast.error("Failed to load professionals.");
          setStylists([]);
          setFilteredStylists([]);
        }
      } catch (error) {
        console.error("[v0] Error fetching stylists:", error);
        toast.error("Failed to load professionals: " + error.message);
        setStylists([]);
        setFilteredStylists([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStylists();
  }, []);

  // Filter stylists based on search and position
  useEffect(() => {
    let filtered = stylists;

    if (searchTerm) {
      filtered = filtered.filter(
        (stylist) =>
          stylist.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stylist.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stylist.position?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (selectedPosition !== "all") {
      filtered = filtered.filter((stylist) =>
        stylist.position
          ?.toLowerCase()
          .includes(selectedPosition.toLowerCase()),
      );
    }

    setFilteredStylists(filtered);
  }, [searchTerm, selectedPosition, stylists]);

  // Generate available dates for the next 30 days
  useEffect(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    setAvailableDates(dates);
  }, []);

  // Enhanced booked slots fetching
  const fetchBookedSlots = useCallback(
    async (date) => {
      if (!date) return;

      try {
        setAvailabilityLoading(true);
        const dateString = date.toISOString().split("T")[0];

        let response;
        if (selectedStylist && selectedStylist !== "any") {
          response = await apiClient.bookings.getAvailableSlots(
            dateString,
            selectedStylist,
          );
        } else {
          response = await apiClient.bookings.getAvailableSlots(dateString);
        }

        if (response.data?.success) {
          const bookedSlotsMap = {};
          const bookedSlots =
            response.data.data?.bookedSlots ||
            response.data.bookedSlots ||
            response.data.unavailableSlots ||
            [];

          bookedSlots.forEach((slot) => {
            bookedSlotsMap[convertTimeTo24Hour(slot)] = 1;
          });

          setBookedSlots(bookedSlotsMap);
        }
      } catch (error) {
        console.error("Error fetching booked slots:", error);
        setBookedSlots({});
      } finally {
        setAvailabilityLoading(false);
      }
    },
    [selectedStylist],
  );

  // Check staff availability
  const checkStaffAvailability = useCallback(async (staffId, date, time) => {
    if (!staffId || !date || !time) return true;

    try {
      const response = await apiClient.bookings.checkStaffAvailability({
        staffId,
        date: date.toISOString().split("T")[0],
        time: convertTimeTo24Hour(time),
      });

      return response.data?.isAvailable !== false;
    } catch (error) {
      console.error("Error checking staff availability:", error);
      return true;
    }
  }, []);

  // Generate all time slots with availability
  const generateTimeSlots = useCallback(() => {
    const allSlots = [
      "9:30 AM",
      "10:00 AM",
      "10:30 AM",
      "11:00 AM",
      "11:30 AM",
      "12:00 PM",
      "12:30 PM",
      "1:00 PM",
      "1:30 PM",
      "2:00 PM",
      "2:30 PM",
      "3:00 PM",
      "3:30 PM",
      "4:00 PM",
      "4:30 PM",
      "5:00 PM",
      "5:30 PM",
      "6:00 PM",
      "6:30 PM",
      "7:00 PM",
      "7:30 PM",
      "8:00 PM",
      "8:30 PM",
    ];

    return allSlots.map((slot) => ({
      time: slot,
      isAvailable: !bookedSlots[convertTimeTo24Hour(slot)],
    }));
  }, [bookedSlots]);

  // Set time slots when date is selected
  useEffect(() => {
    if (selectedDate) {
      fetchBookedSlots(selectedDate);
    }
  }, [selectedDate, fetchBookedSlots]);

  // Update available time slots when booked slots change
  useEffect(() => {
    if (selectedDate) {
      setAvailableTimeSlots(generateTimeSlots());
    }
  }, [bookedSlots, selectedDate, generateTimeSlots]);

  // Enhanced payment status check
  const checkPaymentStatus = useCallback(async () => {
    if (!currentPaymentId) return;

    try {
      const statusResponse =
        await apiClient.payments.getStatus(currentPaymentId);

      if (statusResponse.data?.success && statusResponse.data.data) {
        const status = statusResponse.data.data.status;

        if (status === "approved" || status === "completed") {
          setPaymentStatus("approved");
          setPaymentStatusMessage(
            statusResponse.data.data.processingNotes ||
              "You're all booked! We look forward to seeing you soon.",
          );

          // Update booking status after payment approval
          if (currentBookingId) {
            try {
              await apiClient.bookings.updateStatus(currentBookingId, {
                status: "confirmed",
              });
            } catch (bookingError) {
              console.error("Error updating booking status:", bookingError);
            }
          }
        } else if (status === "denied") {
          setPaymentStatus("denied");
          setPaymentStatusMessage(
            statusResponse.data.data.processingNotes ||
              "Your payment transaction has failed.",
          );
        } else if (status === "processing") {
          if (paymentStatus !== "processing") {
            setPaymentStatus("processing");
          }
        }
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
    }
  }, [currentPaymentId, paymentStatus, currentBookingId]);

  useEffect(() => {
    let interval = null;

    if (
      currentScreen === "status" &&
      currentPaymentId &&
      paymentStatus === "processing"
    ) {
      checkPaymentStatus();
      interval = setInterval(() => {
        checkPaymentStatus();
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentScreen, currentPaymentId, paymentStatus, checkPaymentStatus]);

  const handleBack = () => {
    const idx = screens.indexOf(currentScreen);
    if (idx === 0) {
      navigate("/services");
    } else {
      setCurrentScreen(screens[idx - 1]);
    }
  };

  const handleAnyStylistSelect = () => {
    setStylistSelectionType("any");
    setSelectedStylist("any");
  };

  const handleYourStylistSelect = () => {
    setStylistSelectionType("specific");
    setSelectedStylist(null);
  };

  const handleSpecificStylistSelect = (stylistId) => {
    setSelectedStylist(stylistId);
  };

  const handleContinueFromStylist = async () => {
    if (!stylistSelectionType) {
      toast.error("Please select a stylist preference.");
      return;
    }

    if (stylistSelectionType === "specific" && !selectedStylist) {
      toast.error("Please select your preferred professional.");
      return;
    }

    try {
      setLoading(true);
      setCurrentScreen("datetime");
    } catch (error) {
      console.error("Error fetching time slots:", error.message);
      toast.error("Failed to load available times.");
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = async (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = async (time) => {
    const timeSlot = availableTimeSlots.find((slot) => slot.time === time);
    if (timeSlot && !timeSlot.isAvailable) {
      toast.error(
        "This time slot is fully booked. Please choose another time.",
      );
      return;
    }

    if (selectedStylist && selectedStylist !== "any" && selectedDate) {
      const isAvailable = await checkStaffAvailability(
        selectedStylist,
        selectedDate,
        time,
      );

      if (!isAvailable) {
        toast.error(
          "Selected professional is not available at this time. Please choose a different time.",
        );
        return;
      }
    }

    setSelectedTime(time);
  };

  const handleConfirmDateTime = () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select both date and time.");
      return;
    }
    setCurrentScreen("summary");
  };

  const convertTimeTo24Hour = (timeStr) => {
    // If it's already in 24-hour format, return as-is
    if (timeStr.includes(":")) {
      const [hours, minutes] = timeStr.split(":");
      if (
        hours &&
        minutes &&
        !timeStr.includes("AM") &&
        !timeStr.includes("PM")
      ) {
        return timeStr; // Already in 24-hour format
      }
    }

    // Convert from AM/PM to 24-hour format
    const [time, period] = timeStr.split(" ");
    const [hours, minutes] = time.split(":");
    let hour = parseInt(hours);

    if (period === "PM" && hour !== 12) {
      hour += 12;
    } else if (period === "AM" && hour === 12) {
      hour = 0;
    }

    return `${String(hour).padStart(2, "0")}:${minutes}`;
  };

  const handleProceedToPaymentOption = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      toast.error("Please complete all booking details.");
      return;
    }

    if (!authChecked) {
      toast.error("Checking authentication status...");
      return;
    }

    if (!isAuthenticated) {
      if (
        window.confirm(
          "Please log in to create a booking. Would you like to log in?",
        )
      ) {
        navigate("/auth");
      }
      return;
    }

    if (isGuest) {
      if (
        window.confirm(
          "Please complete your profile to create a booking. Would you like to complete your profile?",
        )
      ) {
        navigate("/auth/signup");
      }
      return;
    }

    try {
      setLoading(true);

      const formattedTime = selectedTime;

      const bookingData = {
        serviceId: selectedService._id || selectedService.id,
        stylistPreference: stylistSelectionType === "any" ? "any" : "specific",
        selectedStylistId:
          selectedStylist !== "any" ? selectedStylist : undefined,
        preferredDate: selectedDate.toISOString().split("T")[0],
        preferredTime: formattedTime, // This should now be in "HH:MM AM/PM" format
        customerNotes: "",
        paymentOption: paymentOption,
        downpaymentPercentage: paymentOption === "downpayment" ? 30 : undefined,
      };

      console.log("📝 Creating booking with data:", bookingData);

      let response;

      // Try different API methods in order
      if (apiClient && apiClient.post) {
        console.log("🔄 Using apiClient.post");
        response = await apiClient.post("/bookings/create", bookingData);
      } else if (apiClient && apiClient.instance && apiClient.instance.post) {
        console.log("🔄 Using apiClient.instance.post");
        response = await apiClient.instance.post(
          "/bookings/create",
          bookingData,
        );
      } else {
        console.log("🔄 Using direct axios");
        // Fallback to direct axios
        const API_BASE_URL =
          import.meta.env.VITE_API_URL || "http://localhost:3000/api";
        const token = localStorage.getItem("token");

        response = await axios.post(
          `${API_BASE_URL}/bookings/create`,
          bookingData,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
      }

      console.log("📋 Booking API Response:", response);

      if (response.data?.success) {
        const bookingId = response.data.data?._id || response.data.data?.id;

        if (bookingId) {
          setCurrentBookingId(bookingId);
          console.log("✅ Current booking ID set to:", bookingId);
          toast.success("Booking created successfully!");
          setCurrentScreen("payment-option");
        } else {
          throw new Error("Booking ID not found in response");
        }
      } else {
        throw new Error(response.data?.message || "Failed to create booking");
      }
    } catch (error) {
      console.error("❌ Error in booking process:", error);

      let errorMessage = error.response?.data?.message || error.message;

      if (errorMessage.includes("staff not available")) {
        errorMessage =
          "The selected professional is not available. Please choose a different time or staff member.";
      } else if (errorMessage.includes("time slot booked")) {
        errorMessage =
          "This time slot is already booked. Please select a different time.";
      } else if (errorMessage.includes("Guest users cannot create bookings")) {
        errorMessage =
          "Please complete your registration to create bookings. Guest accounts cannot book services.";
      }

      toast.error(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentOptionSelect = (option) => {
    setPaymentOption(option);
    setCurrentScreen("payment");
  };

  // ✅ FIXED: Enhanced payment creation with proper error handling
  const handlePayNow = async () => {
    if (!currentBookingId || !paymentMethod) {
      toast.error("Booking or payment method is missing.");
      return;
    }

    try {
      setLoading(true);

      const paymentAmount =
        paymentOption === "full" ? totalAmount : downpaymentAmount;
      const paymentFor = paymentOption === "full" ? "full" : "downpayment";

      console.log("💳 Creating payment for booking:", {
        bookingId: currentBookingId,
        paymentMethod: paymentMethod,
        paymentFor: paymentFor,
        amount: paymentAmount,
      });

      const paymentData = {
        bookingId: currentBookingId,
        paymentMethod: paymentMethod,
        paymentFor: paymentFor,
        amount: paymentAmount,
      };

      // ✅ FIXED: Use the enhanced payments management
      const paymentResult =
        await apiClient.paymentsManagement.createPayment(paymentData);

      if (paymentResult.success && paymentResult.payment) {
        const paymentId = paymentResult.payment._id || paymentResult.payment.id;

        setCurrentPaymentId(paymentId);
        setPaymentStatus("processing");

        if (paymentMethod === "gcash" || paymentMethod === "paymaya") {
          const qrData = `${
            paymentOption === "full" ? "Full" : "Down"
          } Payment - Booking #${currentBookingId.slice(
            -8,
          )} - Amount: ${paymentAmount}`;
          setQrCodeData(qrData);
        }

        setCurrentScreen("receipt");
        toast.success("Payment created successfully!");
      } else {
        throw new Error(paymentResult.message || "Failed to create payment");
      }
    } catch (error) {
      console.error("❌ Error creating payment:", error);

      let errorMessage = handleApiError(
        error,
        "Failed to create payment. Please try again.",
      );

      if (errorMessage.includes("insufficient funds")) {
        errorMessage =
          "Insufficient funds. Please use a different payment method.";
      } else if (errorMessage.includes("payment method not supported")) {
        errorMessage =
          "This payment method is not supported. Please choose another method.";
      }

      toast.error(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 5 * 1024 * 1024) {
            toast.error(
              "File size too large. Please choose an image under 5MB.",
            );
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

    const paymentAmount =
      paymentOption === "full" ? totalAmount : downpaymentAmount;

    const generatedReceiptData = {
      referenceNumber: `REF${Date.now().toString().slice(-8)}`,
      name: customerInfo?.name || "Customer Payment",
      amountPaid: paymentAmount,
      dateOfTransaction: new Date().toISOString(),
    };

    setReceiptData(generatedReceiptData);
    setCurrentScreen("receiptInfo");
  };

  const handleInputChange = (field, value) => {
    setReceiptData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ✅ FIXED: Enhanced proof submission with proper API handling
  const handleSubmitProof = async () => {
    if (!currentPaymentId) {
      toast.error("Payment ID is missing. Please try again.");
      return;
    }

    if (!proofImage) {
      toast.error("Please upload payment proof.");
      return;
    }

    try {
      setUploadingProof(true);

      const formData = new FormData();
      formData.append("proofImage", proofImage.file);

      formData.append("referenceNumber", receiptData.referenceNumber);
      formData.append("name", receiptData.name);
      formData.append("amountPaid", receiptData.amountPaid.toString());
      formData.append("dateOfTransaction", receiptData.dateOfTransaction);

      console.log("📤 Uploading proof for payment:", currentPaymentId);

      // ✅ FIXED: Use the enhanced payments management
      const uploadResult = await apiClient.paymentsManagement.uploadProof(
        currentPaymentId,
        formData,
        {
          referenceNumber: receiptData.referenceNumber,
          name: receiptData.name,
          amountPaid: receiptData.amountPaid,
          dateOfTransaction: receiptData.dateOfTransaction,
        },
      );

      if (uploadResult.success) {
        setPaymentStatus("processing");
        setCurrentScreen("status");
        toast.success(
          "Payment proof uploaded successfully! Verification in progress.",
        );

        setTimeout(() => {
          checkPaymentStatus();
        }, 2000);
      } else {
        throw new Error(uploadResult.message || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading proof:", error);

      const errorMessage = handleApiError(
        error,
        "Failed to upload payment proof. Please try again.",
      );
      toast.error(errorMessage);
    } finally {
      setUploadingProof(false);
    }
  };

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

  const handleBackToServices = () => {
    navigate("/services");
  };

  const handlePayRemaining = async () => {
    if (!currentBookingId || !paymentMethod) {
      toast.error("Booking or payment method is missing.");
      return;
    }

    try {
      setLoading(true);

      const paymentResult =
        await apiClient.paymentsManagement.createRemainingPayment(
          currentBookingId,
          {
            paymentMethod: paymentMethod,
          },
        );

      if (paymentResult.success && paymentResult.payment) {
        const paymentId = paymentResult.payment._id || paymentResult.payment.id;

        setCurrentPaymentId(paymentId);
        setPaymentStatus("processing");
        setCurrentScreen("receipt");

        toast.success("Remaining payment created successfully.");
      } else {
        throw new Error(
          paymentResult.message || "Failed to create remaining payment",
        );
      }
    } catch (error) {
      console.error("Error creating remaining payment:", error);

      const errorMessage = handleApiError(
        error,
        "Failed to create remaining payment. Please try again.",
      );
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getSelectedStylistName = () => {
    if (stylistSelectionType === "any") return "Any Available Professional";
    if (selectedStylist) {
      const stylist = stylists.find((s) => s._id === selectedStylist);
      return stylist
        ? `${stylist.firstName || stylist.username} ${
            stylist.lastName || ""
          }`.trim()
        : "Selected Professional";
    }
    return "Not selected";
  };

  const getSelectedStylistDetails = () => {
    if (stylistSelectionType === "any") return null;
    if (selectedStylist) {
      return stylists.find((s) => s._id === selectedStylist);
    }
    return null;
  };

  const getSelectedStylistFullInfo = () => {
    if (stylistSelectionType === "any") return "Any Available Professional";
    if (selectedStylist) {
      const stylist = stylists.find((s) => s._id === selectedStylist);
      if (stylist) {
        return `${stylist.firstName || stylist.username} ${
          stylist.lastName || ""
        } - ${stylist.position || "Stylist"}`.trim();
      }
    }
    return "Selected Professional";
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateShort = (date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price) => {
    if (typeof price === "string") {
      return price;
    }
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(price || 0);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <span key={i} className="star full">
            ★
          </span>,
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <span key={i} className="star half">
            ★
          </span>,
        );
      } else {
        stars.push(
          <span key={i} className="star empty">
            ☆
          </span>,
        );
      }
    }
    return stars;
  };

  const getUniquePositions = () => {
    const positions = stylists
      .map((stylist) => stylist.position)
      .filter(Boolean);
    return ["all", ...new Set(positions)];
  };

  const getDayName = (date) => {
    return date.toLocaleDateString("en-US", { weekday: "short" });
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
    const paymentAmount =
      paymentOption === "full" ? totalAmount : downpaymentAmount;

    return (
      <div className="qr-code-container enhanced">
        <div className="qr-code-header">
          <h4>Scan to Pay with {paymentMethod.toUpperCase()}</h4>
          <p className="payment-amount">Amount: {formatPrice(paymentAmount)}</p>
          <p className="payment-type">
            {paymentOption === "full" ? "Full Payment" : "Down Payment"}
          </p>
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
                Enter amount: <strong>{formatPrice(paymentAmount)}</strong>
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
      {
        id: "card",
        name: "Credit Card/Debit Card",
        image: paymentMethodImages.card,
      },
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

  // Fixed Progress Indicator Component
  const ProgressIndicator = ({ currentScreen }) => {
    const visibleScreens = screens.filter(
      (screen) => screen !== "payment-option",
    );
    const currentIndex = visibleScreens.indexOf(currentScreen);

    return (
      <div className="progress-indicator-enhanced">
        {visibleScreens.map((screen, index) => {
          let screenName = "";
          switch (screen) {
            case "stylist":
              screenName = "Professional";
              break;
            case "datetime":
              screenName = "Date & Time";
              break;
            case "summary":
              screenName = "Review";
              break;
            case "payment":
              screenName = "Payment";
              break;
            case "receipt":
              screenName = "Upload";
              break;
            case "receiptInfo":
              screenName = "Confirm";
              break;
            case "status":
              screenName = "Status";
              break;
            default:
              screenName = screen;
          }

          return (
            <div key={screen} className="progress-step-container">
              <div
                className={`progress-step-enhanced ${
                  index < currentIndex
                    ? "completed"
                    : index === currentIndex
                      ? "active"
                      : "pending"
                }`}>
                <div className="step-number">{index + 1}</div>
                <div className="step-label">{screenName}</div>
              </div>
              {index < visibleScreens.length - 1 && (
                <div className="step-connector"></div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Staff Availability Badge Component
  const StaffAvailabilityBadge = ({ staffId, date, time }) => {
    const [isAvailable, setIsAvailable] = useState(true);
    const [checking, setChecking] = useState(false);

    useEffect(() => {
      const checkAvailability = async () => {
        if (staffId && date && time) {
          setChecking(true);
          const available = await checkStaffAvailability(staffId, date, time);
          setIsAvailable(available);
          setChecking(false);
        }
      };

      checkAvailability();
    }, [staffId, date, time]);

    if (checking) {
      return <span className="availability-badge checking">Checking...</span>;
    }

    return (
      <span
        className={`availability-badge ${
          isAvailable ? "available" : "unavailable"
        }`}>
        {isAvailable ? "Available" : "Unavailable"}
      </span>
    );
  };

  // SCREEN COMPONENTS

  const StylistSelectionScreen = () => (
    <div className={`booking-container ${isMobile ? "mobile" : ""}`}>
      <div className="booking-header">
        <button className="back-button" onClick={handleBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1>Select Professional</h1>
        <ProgressIndicator currentScreen={currentScreen} />
      </div>

      <div className="booking-content">
        <div className="stylist-selection-wrapper">
          <div className="quick-selection">
            <button
              className={`stylist-option ${
                stylistSelectionType === "any" ? "active" : ""
              }`}
              onClick={handleAnyStylistSelect}>
              <div className="stylist-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="stylist-info">
                <h3>Any Available Professional</h3>
                <p>We'll assign the next available expert for your service</p>
                <span className="option-benefit">
                  <i className="fas fa-bolt"></i> Fastest booking
                </span>
              </div>
              {stylistSelectionType === "any" && (
                <div className="checkmark">
                  <i className="fas fa-check"></i>
                </div>
              )}
            </button>

            <button
              className={`stylist-option ${
                stylistSelectionType === "specific" ? "active" : ""
              }`}
              onClick={handleYourStylistSelect}>
              <div className="stylist-icon">
                <i className="fas fa-user"></i>
              </div>
              <div className="stylist-info">
                <h3>Choose Specific Professional</h3>
                <p>Select your preferred stylist from our expert team</p>
                <span className="option-benefit">
                  <i className="fas fa-crosshairs"></i> Personal preference
                </span>
              </div>
              {stylistSelectionType === "specific" && (
                <div className="checkmark">
                  <i className="fas fa-check"></i>
                </div>
              )}
            </button>
          </div>

          {stylistSelectionType === "specific" && (
            <div className="stylist-selection-area">
              <div className="search-filter-bar">
                <div className="search-box">
                  <i className="fas fa-search search-icon"></i>
                  <input
                    type="text"
                    placeholder="Search professionals by name or specialty..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                <select
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="filter-select">
                  {getUniquePositions().map((position) => (
                    <option key={position} value={position}>
                      {position === "all" ? "All Positions" : position}
                    </option>
                  ))}
                </select>
              </div>

              <div className="results-info">
                <p>
                  Showing {filteredStylists.length} of {stylists.length}{" "}
                  professionals
                </p>
              </div>

              {filteredStylists.length > 0 ? (
                <div className="stylists-grid">
                  {filteredStylists.map((stylist) => (
                    <div
                      key={stylist._id || stylist.id}
                      className={`stylist-card ${
                        selectedStylist === (stylist._id || stylist.id)
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleSpecificStylistSelect(stylist._id || stylist.id)
                      }>
                      <div className="card-header">
                        <div className="stylist-avatar">
                          {stylist.profileImage ? (
                            <img
                              src={stylist.profileImage}
                              alt={stylist.firstName || stylist.username}
                              className="stylist-profile-img"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="avatar-fallback"
                            style={{
                              display: stylist.profileImage ? "none" : "flex",
                            }}>
                            <span className="avatar-initial">
                              {(stylist.firstName || stylist.username || "S")
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                          {stylist.topRated && (
                            <div className="top-rated-badge">
                              <i className="fas fa-star"></i> Top Rated
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="card-body">
                        <h4 className="stylist-name">
                          {stylist.firstName ||
                            stylist.username ||
                            "Professional"}
                        </h4>
                        <p className="specialty">
                          {stylist.position || "Stylist"}
                        </p>

                        {stylist.rating && (
                          <div className="rating">
                            <span className="stars">
                              {renderStars(stylist.rating)}
                            </span>
                            <span className="rating-value">
                              {stylist.rating.toFixed(1)} (
                              {stylist.reviewCount || 0})
                            </span>
                          </div>
                        )}

                        {stylist.experience && (
                          <div className="experience">
                            <i className="fas fa-clock"></i>{" "}
                            {stylist.experience}
                          </div>
                        )}

                        {selectedDate && selectedTime && (
                          <div className="availability-status">
                            <StaffAvailabilityBadge
                              staffId={stylist._id || stylist.id}
                              date={selectedDate}
                              time={selectedTime}
                            />
                          </div>
                        )}
                      </div>

                      <div className="card-footer">
                        <button className="select-button">
                          {selectedStylist === (stylist._id || stylist.id) ? (
                            <>
                              <i className="fas fa-check"></i> Selected
                            </>
                          ) : (
                            "Select"
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-stylists">
                  <i className="fas fa-search no-results-icon"></i>
                  <h3>No professionals found</h3>
                  <p>Try adjusting your search criteria</p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedPosition("all");
                    }}
                    className="clear-filters-btn">
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {!isMobile && (
        <div className="booking-sidebar">
          <div className="service-summary">
            {selectedService && (
              <>
                <h3>Booking Summary</h3>
                <div className="summary-info">
                  <div className="info-row">
                    <span className="label">Service:</span>
                    <span>{selectedService.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Duration:</span>
                    <span>{selectedService.duration}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Price:</span>
                    <span>{selectedService.price}</span>
                  </div>
                  {stylistSelectionType && (
                    <div className="info-row">
                      <span className="label">Professional:</span>
                      <span>{getSelectedStylistFullInfo()}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <button
            className="continue-button"
            onClick={handleContinueFromStylist}
            disabled={loading || !stylistSelectionType}>
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                Loading...
              </>
            ) : (
              "Continue to Date & Time"
            )}
          </button>
        </div>
      )}

      {isMobile && (
        <div className="mobile-bottom-bar">
          <div className="mobile-summary">
            {selectedService && (
              <div className="mobile-summary-content">
                <div className="mobile-service-info">
                  <span className="service-name">{selectedService.name}</span>
                  <span className="service-price">{selectedService.price}</span>
                </div>
                {stylistSelectionType && (
                  <div className="mobile-stylist-info">
                    <span>{getSelectedStylistFullInfo()}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            className="mobile-continue-button"
            onClick={handleContinueFromStylist}
            disabled={loading || !stylistSelectionType}>
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

  const DateTimeSelectionScreen = () => (
    <div className={`booking-container ${isMobile ? "mobile" : ""}`}>
      <div className="booking-header">
        <button className="back-button" onClick={handleBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1>Select Date & Time</h1>
        <ProgressIndicator currentScreen={currentScreen} />
      </div>

      <div className="booking-content">
        <div className="datetime-wrapper">
          <div className="date-section">
            <h3>Select Date</h3>
            <div className="date-scroll">
              {availableDates.map((date, index) => (
                <button
                  key={index}
                  className={`date-button ${
                    selectedDate?.toDateString() === date.toDateString()
                      ? "active"
                      : ""
                  }`}
                  onClick={() => handleDateSelect(date)}>
                  <span className="date-day">{getDayName(date)}</span>
                  <span className="date-number">{date.getDate()}</span>
                  <span className="date-month">{formatDateShort(date)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="time-section">
            <h3>
              Select Time{" "}
              {availabilityLoading && (
                <span className="loading-text">(Checking availability...)</span>
              )}
            </h3>
            {!selectedDate ? (
              <div className="time-placeholder">
                <i className="fas fa-calendar-alt"></i>
                <p>Please select a date first to see available time slots</p>
              </div>
            ) : (
              <div className="time-slots">
                {availableTimeSlots.map((slot) => (
                  <button
                    key={slot.time}
                    className={`time-slot ${
                      selectedTime === slot.time ? "active" : ""
                    } ${!slot.isAvailable ? "booked" : ""}`}
                    onClick={() => handleTimeSelect(slot.time)}
                    disabled={!slot.isAvailable}>
                    {slot.time}
                    {!slot.isAvailable && (
                      <span className="booked-badge">Full</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {!isMobile && (
        <div className="booking-sidebar">
          <div className="service-summary">
            {selectedService && (
              <>
                <h3>Appointment Details</h3>
                <div className="summary-info">
                  <div className="info-row">
                    <span className="label">Service:</span>
                    <span>{selectedService.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Professional:</span>
                    <span>{getSelectedStylistFullInfo()}</span>
                  </div>
                  {selectedDate && (
                    <div className="info-row">
                      <span className="label">Date:</span>
                      <span>{formatDate(selectedDate)}</span>
                    </div>
                  )}
                  {selectedTime && (
                    <div className="info-row">
                      <span className="label">Time:</span>
                      <span>{selectedTime}</span>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="label">Duration:</span>
                    <span>{selectedService.duration}</span>
                  </div>
                  <div className="divider"></div>
                  <div className="info-row total">
                    <span className="label">Total:</span>
                    <span>{selectedService.price}</span>
                  </div>
                </div>
              </>
            )}
          </div>
          <button
            className="continue-button"
            onClick={handleConfirmDateTime}
            disabled={loading || !selectedDate || !selectedTime}>
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                Processing...
              </>
            ) : (
              "Continue to Review"
            )}
          </button>
        </div>
      )}

      {isMobile && (
        <div className="mobile-bottom-bar">
          <div className="mobile-summary">
            {selectedService && (
              <div className="mobile-summary-content">
                <div className="mobile-service-info">
                  <span className="service-name">{selectedService.name}</span>
                  <span className="service-price">{selectedService.price}</span>
                </div>
                {selectedDate && selectedTime && (
                  <div className="mobile-datetime-info">
                    <span>
                      {formatDate(selectedDate)} at {selectedTime}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            className="mobile-continue-button"
            onClick={handleConfirmDateTime}
            disabled={loading || !selectedDate || !selectedTime}>
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                Processing...
              </>
            ) : (
              "Continue"
            )}
          </button>
        </div>
      )}
    </div>
  );

  const BookingSummaryScreen = () => {
    const selectedStylistDetails = getSelectedStylistDetails();

    return (
      <div className={`booking-container ${isMobile ? "mobile" : ""}`}>
        <div className="booking-header">
          <button className="back-button" onClick={handleBack}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1>Booking Summary</h1>
          <ProgressIndicator currentScreen={currentScreen} />
        </div>

        <div className="booking-content">
          <div className="summary-grid">
            <div className="summary-card">
              <h3>
                <i className="fas fa-scissors"></i> Service Details
              </h3>
              {selectedService && (
                <div className="card-content">
                  <p className="service-name">{selectedService.name}</p>
                  <p className="service-rating">
                    <i className="fas fa-star"></i>{" "}
                    {selectedService.rating?.average || 4.5}/5
                  </p>
                  <div className="service-meta">
                    <span>
                      <i className="fas fa-clock"></i>{" "}
                      {selectedService.duration}
                    </span>
                    <span>
                      <i className="fas fa-tag"></i> {selectedService.price}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="summary-card">
              <h3>
                <i className="fas fa-user"></i> Professional Details
              </h3>
              <div className="card-content">
                {selectedStylistDetails ? (
                  <div className="stylist-details-summary">
                    <div className="stylist-avatar-small">
                      {selectedStylistDetails.profileImage ? (
                        <img
                          src={selectedStylistDetails.profileImage}
                          alt={selectedStylistDetails.firstName}
                          className="stylist-profile-img-small"
                        />
                      ) : (
                        <div className="avatar-fallback-small">
                          <span>
                            {(selectedStylistDetails.firstName || "S")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="stylist-info-summary">
                      <p className="stylist-name-summary">
                        <strong>
                          {selectedStylistDetails.firstName}{" "}
                          {selectedStylistDetails.lastName || ""}
                        </strong>
                      </p>
                      <p className="stylist-position">
                        {selectedStylistDetails.position || "Stylist"}
                      </p>
                      {selectedStylistDetails.rating && (
                        <div className="stylist-rating-summary">
                          <span className="stars">
                            {renderStars(selectedStylistDetails.rating)}
                          </span>
                          <span className="rating-value">
                            {selectedStylistDetails.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="any-stylist-summary">
                    <i className="fas fa-users"></i>
                    <p>
                      <strong>Any Available Professional</strong>
                    </p>
                    <p>
                      We'll assign the best available expert for your service
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="summary-card">
              <h3>
                <i className="fas fa-calendar-check"></i> Appointment Details
              </h3>
              <div className="card-content">
                <p>
                  <strong>Date:</strong>{" "}
                  {selectedDate && formatDate(selectedDate)}
                </p>
                <p>
                  <strong>Time:</strong> {selectedTime}
                </p>
                <p>
                  <strong>Duration:</strong> {selectedService?.duration}
                </p>
              </div>
            </div>

            <div className="summary-card">
              <h3>
                <i className="fas fa-receipt"></i> Pricing
              </h3>
              <div className="card-content">
                <div className="pricing-row">
                  <span>{selectedService?.name}</span>
                  <span>{selectedService?.price}</span>
                </div>
                <div className="pricing-row total">
                  <span>
                    <strong>Total</strong>
                  </span>
                  <span>
                    <strong>{selectedService?.price}</strong>
                  </span>
                </div>
              </div>
            </div>

            {customerInfo && (
              <div className="summary-card">
                <h3>
                  <i className="fas fa-user-circle"></i> Your Information
                </h3>
                <div className="card-content">
                  <div className="customer-info">
                    <p>
                      <strong>Name:</strong> {customerInfo.name}
                    </p>
                    {customerInfo.email && (
                      <p>
                        <strong>Email:</strong> {customerInfo.email}
                      </p>
                    )}
                    {customerInfo.phone && (
                      <p>
                        <strong>Phone:</strong> {customerInfo.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {!isMobile && (
          <div className="booking-sidebar">
            <div className="service-summary">
              <h3>Booking Summary</h3>
              <div className="summary-info">
                <div className="info-row">
                  <span className="label">Service:</span>
                  <span>{selectedService?.name}</span>
                </div>
                <div className="info-row">
                  <span className="label">Professional:</span>
                  <span>{getSelectedStylistFullInfo()}</span>
                </div>
                <div className="info-row">
                  <span className="label">Date & Time:</span>
                  <span>
                    {selectedDate && formatDate(selectedDate)} at {selectedTime}
                  </span>
                </div>
                <div className="divider"></div>
                <div className="info-row total">
                  <span className="label">Total:</span>
                  <span>{selectedService?.price}</span>
                </div>
              </div>
            </div>
            <button
              className="continue-button"
              onClick={handleProceedToPaymentOption}
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
                  <span className="service-name">{selectedService?.name}</span>
                  <span className="service-price">
                    {selectedService?.price}
                  </span>
                </div>
                <div className="mobile-stylist-info">
                  <span>{getSelectedStylistFullInfo()}</span>
                </div>
              </div>
            </div>
            <button
              className="mobile-continue-button"
              onClick={handleProceedToPaymentOption}
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

  // ✅ ENHANCED: Beautiful Payment Option Selection Screen with Proper Container
  const PaymentOptionScreen = () => (
    <div className={`booking-container ${isMobile ? "mobile" : ""}`}>
      <div className="booking-header">
        <button className="back-button" onClick={handleBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1>Choose Payment Plan</h1>
        <ProgressIndicator currentScreen={currentScreen} />
      </div>

      <div className="booking-content">
        <div className="payment-plan-container">
          <div className="payment-plan-header">
            <div className="header-icon">
              <i className="fas fa-credit-card"></i>
            </div>
            <div className="header-content">
              <h2>Select Your Payment Plan</h2>
              <p className="subtitle">
                Choose how you'd like to pay for your service
              </p>
            </div>
          </div>

          <div className="payment-options-grid">
            {/* Full Payment Option */}
            <div
              className={`payment-plan-card premium ${
                paymentOption === "full" ? "selected" : ""
              }`}
              onClick={() => handlePaymentOptionSelect("full")}>
              <div className="plan-badge best-value">
                <i className="fas fa-crown"></i>
                Most Popular
              </div>

              <div className="plan-header">
                <div className="plan-icon">
                  <i className="fas fa-gem"></i>
                </div>
                <div className="plan-title">
                  <h3>Full Payment</h3>
                  <p className="plan-description">
                    Pay once and enjoy instant booking
                  </p>
                </div>
              </div>

              <div className="plan-price">
                <span className="amount">{formatPrice(totalAmount)}</span>
                <span className="price-note">One-time payment</span>
              </div>

              <div className="plan-features">
                <div className="feature-item">
                  <i className="fas fa-check-circle"></i>
                  <span>Instant booking confirmation</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-bolt"></i>
                  <span>Faster check-in process</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-gift"></i>
                  <span>Eligible for exclusive discounts</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-star"></i>
                  <span>Priority scheduling</span>
                </div>
              </div>

              <div className="plan-footer">
                {paymentOption === "full" ? (
                  <div className="selected-state">
                    <i className="fas fa-check"></i>
                    <span>Selected</span>
                  </div>
                ) : (
                  <button className="select-plan-btn">
                    Select Full Payment
                  </button>
                )}
              </div>
            </div>

            {/* Down Payment Option */}
            <div
              className={`payment-plan-card standard ${
                paymentOption === "downpayment" ? "selected" : ""
              }`}
              onClick={() => handlePaymentOptionSelect("downpayment")}>
              <div className="plan-badge flexible">
                <i className="fas fa-fire"></i>
                Most Flexible
              </div>

              <div className="plan-header">
                <div className="plan-icon">
                  <i className="fas fa-credit-card"></i>
                </div>
                <div className="plan-title">
                  <h3>Pay Later Plan</h3>
                  <p className="plan-description">
                    Secure now, pay later at salon
                  </p>
                </div>
              </div>

              <div className="plan-price split">
                <div className="price-breakdown">
                  <div className="price-part">
                    <span className="label">Pay Now</span>
                    <span className="amount now">
                      {formatPrice(downpaymentAmount)}
                    </span>
                  </div>
                  <div className="price-part">
                    <span className="label">Pay Later</span>
                    <span className="amount later">
                      {formatPrice(remainingAmount)}
                    </span>
                  </div>
                </div>
                <span className="price-note">30% now, 70% at salon</span>
              </div>

              <div className="plan-features">
                <div className="feature-item">
                  <i className="fas fa-wallet"></i>
                  <span>Lower upfront cost</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-calendar-check"></i>
                  <span>Guaranteed time slot</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-money-bill-wave"></i>
                  <span>Pay balance at appointment</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-shield-alt"></i>
                  <span>Flexible payment options</span>
                </div>
              </div>

              <div className="payment-schedule">
                <h4>Payment Schedule</h4>
                <div className="schedule-timeline">
                  <div className="timeline-item">
                    <div className="timeline-marker now"></div>
                    <div className="timeline-content">
                      <span className="timeline-title">Today</span>
                      <span className="timeline-amount">
                        {formatPrice(downpaymentAmount)}
                      </span>
                      <span className="timeline-desc">
                        30% deposit to secure booking
                      </span>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-marker later"></div>
                    <div className="timeline-content">
                      <span className="timeline-title">
                        At Your Appointment
                      </span>
                      <span className="timeline-amount">
                        {formatPrice(remainingAmount)}
                      </span>
                      <span className="timeline-desc">
                        70% remaining balance
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="plan-footer">
                {paymentOption === "downpayment" ? (
                  <div className="selected-state">
                    <i className="fas fa-check"></i>
                    <span>Selected</span>
                  </div>
                ) : (
                  <button className="select-plan-btn">Select Pay Later</button>
                )}
              </div>
            </div>
          </div>

          <div className="payment-security-notice">
            <div className="security-icon">
              <i className="fas fa-shield-check"></i>
            </div>
            <div className="security-content">
              <h5>Secure Payment Processing</h5>
              <p>
                All payments are processed through our secure payment gateway.
                Your financial information is protected with bank-level
                security.
              </p>
              <div className="security-features">
                <span>
                  <i className="fas fa-lock"></i> 256-bit SSL Encryption
                </span>
                <span>
                  <i className="fas fa-user-shield"></i> PCI DSS Compliant
                </span>
                <span>
                  <i className="fas fa-shield-alt"></i> Fraud Protection
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isMobile && (
        <div className="booking-sidebar">
          <div className="payment-summary-card">
            <div className="summary-header">
              <i className="fas fa-file-invoice-dollar"></i>
              <h3>Payment Summary</h3>
            </div>

            <div className="summary-content">
              <div className="summary-item">
                <div className="item-icon">
                  <i className="fas fa-scissors"></i>
                </div>
                <div className="item-details">
                  <span className="item-label">Service</span>
                  <span className="item-value">{selectedService?.name}</span>
                </div>
              </div>

              <div className="summary-item">
                <div className="item-icon">
                  <i className="fas fa-user-tie"></i>
                </div>
                <div className="item-details">
                  <span className="item-label">Professional</span>
                  <span className="item-value">
                    {getSelectedStylistFullInfo()}
                  </span>
                </div>
              </div>

              <div className="summary-item highlight">
                <div className="item-icon">
                  <i className="fas fa-calendar-alt"></i>
                </div>
                <div className="item-details">
                  <span className="item-label">Appointment</span>
                  <span className="item-value">
                    {selectedDate && formatDate(selectedDate)} at {selectedTime}
                  </span>
                </div>
              </div>

              <div className="payment-breakdown">
                <div className="breakdown-header">
                  <h4>Payment Breakdown</h4>
                </div>

                {paymentOption === "full" ? (
                  <div className="breakdown-full">
                    <div className="breakdown-item total">
                      <span>Total Amount</span>
                      <span className="amount">{formatPrice(totalAmount)}</span>
                    </div>
                    <div className="breakdown-note">
                      <i className="fas fa-info-circle"></i>
                      <span>Full amount due now</span>
                    </div>
                  </div>
                ) : (
                  <div className="breakdown-split">
                    <div className="breakdown-item">
                      <span>Deposit (30%)</span>
                      <span className="amount now">
                        {formatPrice(downpaymentAmount)}
                      </span>
                    </div>
                    <div className="breakdown-item">
                      <span>Remaining Balance</span>
                      <span className="amount later">
                        {formatPrice(remainingAmount)}
                      </span>
                    </div>
                    <div className="breakdown-divider"></div>
                    <div className="breakdown-item total">
                      <span>Total Service Cost</span>
                      <span className="amount">{formatPrice(totalAmount)}</span>
                    </div>
                    <div className="breakdown-note">
                      <i className="fas fa-clock"></i>
                      <span>Balance due at appointment</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            className="continue-button primary"
            onClick={() => setCurrentScreen("payment")}
            disabled={!paymentOption}>
            Continue to Payment Method
          </button>
        </div>
      )}

      {isMobile && (
        <div className="mobile-bottom-bar">
          <div className="mobile-payment-summary">
            <div className="mobile-summary-content">
              <div className="payment-option-info">
                <div className="option-type">
                  <span className="option-name">
                    {paymentOption === "full" ? "Full Payment" : "Pay Later"}
                  </span>
                  <span className="option-status">
                    {paymentOption === "full" ? "Pay Now" : "Pay Deposit"}
                  </span>
                </div>
                <div className="payment-amount-mobile">
                  {paymentOption === "full" ? (
                    <span className="amount-full">
                      {formatPrice(totalAmount)}
                    </span>
                  ) : (
                    <div className="amount-split">
                      <span className="amount-now">
                        {formatPrice(downpaymentAmount)}
                      </span>
                      <span className="amount-later">
                        + {formatPrice(remainingAmount)} later
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <button
            className="mobile-continue-button primary"
            onClick={() => setCurrentScreen("payment")}
            disabled={!paymentOption}>
            Continue to Payment
          </button>
        </div>
      )}
    </div>
  );

  const PaymentMethodScreen = () => (
    <div className={`booking-container ${isMobile ? "mobile" : ""}`}>
      <div className="booking-header">
        <button className="back-button" onClick={handleBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1>Payment Method</h1>
        <ProgressIndicator currentScreen={currentScreen} />
      </div>

      <div className="booking-content">
        <div className="payment-wrapper">
          <h2 className="payment-title">Choose Payment Method</h2>

          <div className="payment-type-selection">
            <div className="payment-options">
              <div className="payment-option">
                <input
                  type="radio"
                  id="online"
                  name="paymentType"
                  checked={paymentType === "online"}
                  onChange={() => setPaymentType("online")}
                />
                <label htmlFor="online" className="payment-label">
                  <div className="payment-type-icon">
                    <i className="fas fa-mobile-alt"></i>
                  </div>
                  <div className="payment-type-info">
                    <h3>Pay Online</h3>
                    <p>Secure online payment via digital wallets</p>
                    <span className="payment-benefit">
                      Instant confirmation
                    </span>
                  </div>
                </label>
              </div>

              <div className="payment-option">
                <input
                  type="radio"
                  id="salon"
                  name="paymentType"
                  checked={paymentType === "salon"}
                  onChange={() => setPaymentType("salon")}
                />
                <label htmlFor="salon" className="payment-label">
                  <div className="payment-type-icon">
                    <i className="fas fa-store"></i>
                  </div>
                  <div className="payment-type-info">
                    <h3>Pay at Salon</h3>
                    <p>Pay in person when you visit</p>
                    <span className="payment-benefit">No upfront payment</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {paymentType === "online" && (
            <div className="payment-methods-section">
              <h3>Select Payment Method</h3>

              <PaymentMethodIcons />

              {paymentMethod !== "card" && (
                <div className="qr-code-section enhanced">
                  <QRCodeDisplay paymentMethod={paymentMethod} />
                </div>
              )}

              {paymentMethod === "card" && (
                <div className="card-payment-info enhanced">
                  <div className="card-info-box">
                    <div className="card-header">
                      <i className="fas fa-credit-card"></i>
                      <h4>Credit/Debit Card Payment</h4>
                    </div>
                    <p>
                      You will be redirected to our secure payment gateway to
                      complete your card payment.
                    </p>
                    <div className="accepted-cards">
                      <span>Accepted Cards:</span>
                      <div className="card-icons">
                        <i className="fab fa-cc-visa"></i>
                        <i className="fab fa-cc-mastercard"></i>
                        <i className="fab fa-cc-amex"></i>
                        <i className="fab fa-cc-discover"></i>
                      </div>
                    </div>
                    <div className="security-badge">
                      <i className="fas fa-lock"></i>
                      <span>256-bit SSL Secure Payment</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {!isMobile && (
        <div className="booking-sidebar">
          <div className="service-summary">
            <h3>Payment Summary</h3>
            <div className="summary-info">
              <div className="info-row">
                <span className="label">Service:</span>
                <span>{selectedService?.name}</span>
              </div>
              <div className="info-row">
                <span className="label">Professional:</span>
                <span>{getSelectedStylistFullInfo()}</span>
              </div>
              <div className="info-row highlight">
                <span className="label">Payment Option:</span>
                <span>
                  {paymentOption === "full" ? "Full Payment" : "Down Payment"}
                </span>
              </div>
              <div className="info-row">
                <span className="label">Amount:</span>
                <span className="amount">
                  {paymentOption === "full"
                    ? formatPrice(totalAmount)
                    : formatPrice(downpaymentAmount)}
                </span>
              </div>
              <div className="info-row">
                <span className="label">Payment Type:</span>
                <span>
                  {paymentType === "online" ? "Online" : "Pay at Salon"}
                </span>
              </div>
              {paymentType === "online" && (
                <div className="info-row">
                  <span className="label">Method:</span>
                  <span className="payment-method-badge">
                    {paymentMethod === "gcash" && "GCash"}
                    {paymentMethod === "paymaya" && "Maya"}
                    {paymentMethod === "paypal" && "PayPal"}
                    {paymentMethod === "card" && "Credit/Debit Card"}
                  </span>
                </div>
              )}
              {paymentOption === "downpayment" && (
                <div className="info-row reminder">
                  <span className="label">Remaining Balance:</span>
                  <span>{formatPrice(remainingAmount)}</span>
                </div>
              )}
              <div className="divider"></div>
              <div className="info-row total">
                <span className="label">
                  {paymentType === "salon"
                    ? "Total Due at Salon:"
                    : "Payment Due:"}
                </span>
                <span className="total-amount">
                  {paymentType === "salon"
                    ? formatPrice(totalAmount)
                    : paymentOption === "full"
                      ? formatPrice(totalAmount)
                      : formatPrice(downpaymentAmount)}
                </span>
              </div>
            </div>
          </div>
          <button
            className="continue-button"
            onClick={
              paymentType === "salon"
                ? handleProceedToPaymentOption
                : handlePayNow
            }
            disabled={loading}>
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                Processing...
              </>
            ) : paymentType === "salon" ? (
              "Complete Booking"
            ) : (
              `Pay ${
                paymentOption === "full"
                  ? formatPrice(totalAmount)
                  : formatPrice(downpaymentAmount)
              }`
            )}
          </button>
        </div>
      )}

      {isMobile && (
        <div className="mobile-bottom-bar">
          <div className="mobile-summary">
            <div className="mobile-summary-content">
              <div className="mobile-service-info">
                <span className="service-name">{selectedService?.name}</span>
                <span className="service-price">
                  {paymentOption === "full"
                    ? formatPrice(totalAmount)
                    : formatPrice(downpaymentAmount)}
                </span>
              </div>
              <div className="mobile-payment-info">
                <span>
                  {paymentType === "online" ? "Online" : "Pay at Salon"} -{" "}
                  {paymentMethod === "gcash" && "GCash"}
                  {paymentMethod === "paymaya" && "Maya"}
                  {paymentMethod === "paypal" && "PayPal"}
                  {paymentMethod === "card" && "Credit/Debit Card"}
                </span>
              </div>
            </div>
          </div>
          <button
            className="mobile-continue-button"
            onClick={
              paymentType === "salon"
                ? handleProceedToPaymentOption
                : handlePayNow
            }
            disabled={loading}>
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                Processing...
              </>
            ) : paymentType === "salon" ? (
              "Complete Booking"
            ) : (
              `Pay ${
                paymentOption === "full"
                  ? formatPrice(totalAmount)
                  : formatPrice(downpaymentAmount)
              }`
            )}
          </button>
        </div>
      )}
    </div>
  );

  const ReceiptScreen = () => (
    <div className={`booking-container ${isMobile ? "mobile" : ""}`}>
      <div className="booking-header">
        <button className="back-button" onClick={handleBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1>Upload Payment Proof</h1>
        <ProgressIndicator currentScreen={currentScreen} />
      </div>

      <div className="booking-content">
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

          {paymentMethod !== "card" && (
            <div className="qr-code-section enhanced">
              <QRCodeDisplay paymentMethod={paymentMethod} />
            </div>
          )}

          {paymentMethod === "card" && (
            <div className="card-payment-reminder">
              <div className="reminder-card">
                <i className="fas fa-credit-card"></i>
                <div className="reminder-content">
                  <h4>Card Payment Submitted</h4>
                  <p>
                    Your card payment has been processed. Please wait for
                    payment confirmation.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {!isMobile && (
        <div className="booking-sidebar">
          <div className="service-summary">
            <h3>Payment Details</h3>
            <div className="summary-info">
              <div className="info-row">
                <span className="label">Service:</span>
                <span>{selectedService?.name}</span>
              </div>
              <div className="info-row">
                <span className="label">Professional:</span>
                <span>{getSelectedStylistFullInfo()}</span>
              </div>
              <div className="info-row highlight">
                <span className="label">Payment Option:</span>
                <span>
                  {paymentOption === "full" ? "Full Payment" : "Down Payment"}
                </span>
              </div>
              <div className="info-row">
                <span className="label">Amount:</span>
                <span className="amount">
                  {paymentOption === "full"
                    ? formatPrice(totalAmount)
                    : formatPrice(downpaymentAmount)}
                </span>
              </div>
              <div className="info-row">
                <span className="label">Payment Method:</span>
                <span className="payment-method-badge">
                  {paymentMethod === "gcash" && "GCash"}
                  {paymentMethod === "paymaya" && "Maya"}
                  {paymentMethod === "paypal" && "PayPal"}
                  {paymentMethod === "card" && "Credit/Debit Card"}
                </span>
              </div>
              {paymentOption === "downpayment" && (
                <div className="info-row reminder">
                  <span className="label">Remaining Balance:</span>
                  <span>{formatPrice(remainingAmount)}</span>
                </div>
              )}
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
                <span className="total-amount">
                  {paymentOption === "full"
                    ? formatPrice(totalAmount)
                    : formatPrice(downpaymentAmount)}
                </span>
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

  const ReceiptInfoScreen = () => {
    const paymentAmount =
      paymentOption === "full" ? totalAmount : downpaymentAmount;

    return (
      <div className={`booking-container ${isMobile ? "mobile" : ""}`}>
        <div className="booking-header">
          <button className="back-button" onClick={handleBack}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1>Payment Confirmation</h1>
          <ProgressIndicator currentScreen={currentScreen} />
        </div>

        <div className="booking-content">
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
                        {formatPrice(paymentAmount)}
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
                          {paymentMethod === "card" && (
                            <>
                              <img src={paymentMethodImages.card} alt="Card" />
                              <span>Credit/Debit Card</span>
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
                        {new Date(receiptData.dateOfTransaction).toLocaleString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    </div>
                    <div className="info-item enhanced highlight">
                      <div className="info-label">
                        <i className="fas fa-tag"></i>
                        <span>Payment Option</span>
                      </div>
                      <span className="info-value payment-option-badge">
                        {paymentOption === "full"
                          ? "Full Payment"
                          : "Down Payment"}
                      </span>
                    </div>
                    {paymentOption === "downpayment" && (
                      <div className="info-item enhanced reminder">
                        <div className="info-label">
                          <i className="fas fa-exclamation-circle"></i>
                          <span>Remaining Balance</span>
                        </div>
                        <span className="info-value remaining-balance">
                          {formatPrice(remainingAmount)} (Due at appointment)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="info-card service-info-card enhanced">
                <div className="card-header enhanced">
                  <div className="header-icon">
                    <i className="fas fa-scissors"></i>
                  </div>
                  <div className="header-content">
                    <h4>Service Details</h4>
                    <span>Appointment information</span>
                  </div>
                </div>
                <div className="card-content enhanced">
                  <div className="info-grid enhanced">
                    <div className="info-item enhanced">
                      <div className="info-label">
                        <i className="fas fa-spa"></i>
                        <span>Service</span>
                      </div>
                      <span className="info-value">
                        {selectedService?.name}
                      </span>
                    </div>
                    <div className="info-item enhanced">
                      <div className="info-label">
                        <i className="fas fa-user-tie"></i>
                        <span>Assigned Professional</span>
                      </div>
                      <span className="info-value professional-name">
                        {getSelectedStylistFullInfo()}
                      </span>
                    </div>
                    <div className="info-item enhanced">
                      <div className="info-label">
                        <i className="fas fa-clock"></i>
                        <span>Appointment Date & Time</span>
                      </div>
                      <span className="info-value appointment-time">
                        {selectedDate && formatDate(selectedDate)} at{" "}
                        {selectedTime}
                      </span>
                    </div>
                    <div className="info-item enhanced">
                      <div className="info-label">
                        <i className="fas fa-hourglass-half"></i>
                        <span>Service Duration</span>
                      </div>
                      <span className="info-value">
                        {selectedService?.duration}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

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
                {paymentOption === "downpayment" && (
                  <p className="balance-reminder">
                    <strong>Note:</strong> Your remaining balance of{" "}
                    {formatPrice(remainingAmount)} will be due at your
                    appointment.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {!isMobile && (
          <div className="booking-sidebar">
            <div className="service-summary enhanced">
              <div className="summary-header">
                <i className="fas fa-clipboard-check"></i>
                <h3>Ready to Submit</h3>
              </div>
              <div className="summary-info enhanced">
                <div className="summary-item">
                  <div className="item-icon">
                    <i className="fas fa-scissors"></i>
                  </div>
                  <div className="item-content">
                    <span className="item-label">Service</span>
                    <span className="item-value">{selectedService?.name}</span>
                  </div>
                </div>
                <div className="summary-item">
                  <div className="item-icon">
                    <i className="fas fa-user-tie"></i>
                  </div>
                  <div className="item-content">
                    <span className="item-label">Professional</span>
                    <span className="item-value">
                      {getSelectedStylistFullInfo()}
                    </span>
                  </div>
                </div>
                <div className="summary-item highlight">
                  <div className="item-icon">
                    <i className="fas fa-tag"></i>
                  </div>
                  <div className="item-content">
                    <span className="item-label">Payment Option</span>
                    <span className="item-value">
                      {paymentOption === "full"
                        ? "Full Payment"
                        : "Down Payment"}
                    </span>
                  </div>
                </div>
                <div className="summary-item">
                  <div className="item-icon">
                    <i className="fas fa-money-bill"></i>
                  </div>
                  <div className="item-content">
                    <span className="item-label">Amount Paid</span>
                    <span className="item-value">
                      {formatPrice(paymentAmount)}
                    </span>
                  </div>
                </div>
                {paymentOption === "downpayment" && (
                  <div className="summary-item reminder">
                    <div className="item-icon">
                      <i className="fas fa-exclamation-circle"></i>
                    </div>
                    <div className="item-content">
                      <span className="item-label">Remaining Balance</span>
                      <span className="item-value">
                        {formatPrice(remainingAmount)}
                      </span>
                    </div>
                  </div>
                )}
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

  const PaymentStatusScreen = () => {
    const paymentAmount =
      paymentOption === "full" ? totalAmount : downpaymentAmount;

    return (
      <div className={`booking-container ${isMobile ? "mobile" : ""}`}>
        <div className="booking-header">
          <button className="back-button" onClick={handleBackToServices}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1>Payment Status</h1>
          <ProgressIndicator currentScreen={currentScreen} />
        </div>

        <div className="booking-content">
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
                    <span className="detail-label">Payment Option</span>
                    <span className="detail-value">
                      {paymentOption === "full"
                        ? "Full Payment"
                        : "Down Payment"}
                    </span>
                  </div>
                  <div className="status-detail-item">
                    <span className="detail-label">Amount</span>
                    <span className="detail-value">
                      {formatPrice(paymentAmount)}
                    </span>
                  </div>
                  {paymentOption === "downpayment" && (
                    <div className="status-detail-item reminder">
                      <span className="detail-label">Remaining Balance</span>
                      <span className="detail-value">
                        {formatPrice(remainingAmount)}
                      </span>
                    </div>
                  )}
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
                      <span className="detail-label">Booking ID</span>
                      <span className="detail-value">{currentBookingId}</span>
                    </div>
                    <div className="status-detail-item">
                      <span className="detail-label">Service</span>
                      <span className="detail-value">
                        {selectedService?.name}
                      </span>
                    </div>
                    <div className="status-detail-item">
                      <span className="detail-label">Professional</span>
                      <span className="detail-value">
                        {getSelectedStylistFullInfo()}
                      </span>
                    </div>
                    <div className="status-detail-item">
                      <span className="detail-label">Date & Time</span>
                      <span className="detail-value">
                        {selectedDate && formatDate(selectedDate)} at{" "}
                        {selectedTime}
                      </span>
                    </div>
                    <div className="status-detail-item highlight">
                      <span className="detail-label">Payment Option</span>
                      <span className="detail-value">
                        {paymentOption === "full"
                          ? "Full Payment"
                          : "Down Payment"}
                      </span>
                    </div>
                    <div className="status-detail-item">
                      <span className="detail-label">Amount Paid</span>
                      <span className="detail-value">
                        {formatPrice(paymentAmount)}
                      </span>
                    </div>
                    {paymentOption === "downpayment" && (
                      <div className="status-detail-item reminder">
                        <span className="detail-label">Remaining Balance</span>
                        <span className="detail-value">
                          {formatPrice(remainingAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    className="continue-button"
                    onClick={handleBackToServices}
                    style={{ marginTop: "1.5rem" }}>
                    Back to Services
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
                  <button
                    className="continue-button"
                    onClick={handleRetryPayment}
                    style={{ marginTop: "1.5rem" }}>
                    Retry Payment
                  </button>
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

    if (!selectedService) {
      return (
        <div className="no-service">
          <i className="fas fa-exclamation-triangle"></i>
          <h2>No Service Selected</h2>
          <p>Please select a service to continue with booking</p>
          <button onClick={handleBackToServices} className="continue-button">
            Back to Services
          </button>
        </div>
      );
    }

    switch (currentScreen) {
      case "stylist":
        return <StylistSelectionScreen />;
      case "datetime":
        return <DateTimeSelectionScreen />;
      case "summary":
        return <BookingSummaryScreen />;
      case "payment-option":
        return <PaymentOptionScreen />;
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
    <div className="booking-page">
      {renderCurrentScreen()}
      <ToastContainer position="bottom-right" theme="dark" />
    </div>
  );
};

export default Booking;
