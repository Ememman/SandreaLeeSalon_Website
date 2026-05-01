import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoPersonCircle,
  IoCalendar,
  IoCart,
  IoHeart,
  IoCash,
  IoBag,
  IoLogOut,
  IoTime,
  IoStar,
  IoStarHalf,
  IoStarOutline,
  IoChevronDown,
  IoChevronForward,
  IoLocation,
  IoCall,
  IoLogoWhatsapp,
  IoTimeOutline,
  IoPeople,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoCut,
  IoColorPalette,
  IoSparkles,
  IoBrush,
  IoHandRight,
  IoFlower,
  IoEye,
  IoWater,
  IoBookmark,
  IoShareSocial,
  IoDownload,
  IoPlay,
  IoLogoApple,
  IoLogoGooglePlaystore,
  IoLogoFacebook,
  IoLogoInstagram,
  IoLogoTwitter,
  IoMail,
  IoReceipt,
  IoClose,
  IoTrash,
  IoEyeOutline,
  IoPrint,
  IoMenu,
} from "react-icons/io5";
import salonLogo from "../assets/SandreaLeeSalonLogoCapstone.png";
import customerAPI, {
  bookingsAPI,
  ratingsAPI,
  getCurrentUser,
  logout,
  customerProfile,
  customerUtils,
} from "../services/api";
import "../styles/Home.css";
import "../styles/Appointment.css";

// Import the Profile, Bookings, Cart, Favorites, Payment, and Order components
import Profile from "../menu/Profile.jsx";
import Bookings from "../menu/Bookings.jsx";
import Cart from "../menu/Cart.jsx";
import Favorites from "../menu/Favorites.jsx";
import Payment from "../menu/Payment.jsx";
import Order from "../menu/Order.jsx";

const Appointments = () => {
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [slideDirection, setSlideDirection] = useState("right");
  const [isAnimating, setIsAnimating] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfileImage, setUserProfileImage] = useState(null);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Overlay states
  const [isProfileOverlayOpen, setIsProfileOverlayOpen] = useState(false);
  const [isBookingsOverlayOpen, setIsBookingsOverlayOpen] = useState(false);
  const [isCartOverlayOpen, setIsCartOverlayOpen] = useState(false);
  const [isFavoritesOverlayOpen, setIsFavoritesOverlayOpen] = useState(false);
  const [isPaymentOverlayOpen, setIsPaymentOverlayOpen] = useState(false);
  const [isOrderOverlayOpen, setIsOrderOverlayOpen] = useState(false);

  const navItems = ["Home", "Services", "Products", "Appointments"];

  const profileMenuRef = useRef(null);
  const profileButtonRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Service icons mapping
  const serviceIcons = {
    "Haircuts & Basic Services": <IoCut className="text-cyan-400 text-xl" />,
    "Hair Coloring": <IoColorPalette className="text-pink-400 text-xl" />,
    "Hair Treatments": <IoSparkles className="text-purple-400 text-xl" />,
    "Hair Styling": <IoBrush className="text-blue-400 text-xl" />,
    "Nail Services": <IoHandRight className="text-red-400 text-xl" />,
    "Skin Care": <IoFlower className="text-green-400 text-xl" />,
    Makeup: <IoEye className="text-yellow-400 text-xl" />,
    Spa: <IoWater className="text-teal-400 text-xl" />,
    General: <IoStar className="text-gray-400 text-xl" />,
  };

  // Profile menu items
  const profileMenuItems = [
    {
      key: "profile",
      label: "Profile",
      icon: <IoPersonCircle className="w-5 h-5" />,
    },
    {
      key: "bookings",
      label: "Bookings",
      icon: <IoCalendar className="w-5 h-5" />,
    },
    { key: "cart", label: "Cart", icon: <IoCart className="w-5 h-5" /> },
    {
      key: "favorites",
      label: "Favorites",
      icon: <IoHeart className="w-5 h-5" />,
    },
    {
      key: "payment-history",
      label: "Payment History",
      icon: <IoCash className="w-5 h-5" />,
    },
    { key: "orders", label: "Orders", icon: <IoBag className="w-5 h-5" /> },
  ];

  // Overlay functions
  const openProfileOverlay = () => {
    setIsProfileOverlayOpen(true);
    closeProfileMenu();
    closeMobileMenu();
  };

  const closeProfileOverlay = () => {
    setIsProfileOverlayOpen(false);
  };

  const openBookingsOverlay = () => {
    setIsBookingsOverlayOpen(true);
    closeProfileMenu();
    closeMobileMenu();
  };

  const closeBookingsOverlay = () => {
    setIsBookingsOverlayOpen(false);
  };

  const openCartOverlay = () => {
    setIsCartOverlayOpen(true);
    closeProfileMenu();
    closeMobileMenu();
  };

  const closeCartOverlay = () => {
    setIsCartOverlayOpen(false);
  };

  const openFavoritesOverlay = () => {
    setIsFavoritesOverlayOpen(true);
    closeProfileMenu();
    closeMobileMenu();
  };

  const closeFavoritesOverlay = () => {
    setIsFavoritesOverlayOpen(false);
  };

  const openPaymentOverlay = () => {
    setIsPaymentOverlayOpen(true);
    closeProfileMenu();
    closeMobileMenu();
  };

  const closePaymentOverlay = () => {
    setIsPaymentOverlayOpen(false);
  };

  const openOrderOverlay = () => {
    setIsOrderOverlayOpen(true);
    closeProfileMenu();
    closeMobileMenu();
  };

  const closeOrderOverlay = () => {
    setIsOrderOverlayOpen(false);
  };

  // Handle tab change function
  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;

    const currentIndex = navItems.indexOf(activeTab);
    const newIndex = navItems.indexOf(newTab);
    setSlideDirection(newIndex > currentIndex ? "right" : "left");
    setIsAnimating(true);
    setActiveTab(newTab);

    switch (newTab) {
      case "Home":
        navigate("/customer/home");
        break;
      case "Services":
        navigate("/customer/services");
        break;
      case "Products":
        navigate("/customer/products");
        break;
      case "Appointments":
        const isLoggedIn = localStorage.getItem("token");
        if (isLoggedIn) {
          navigate("/customer/appointments");
        } else {
          navigate("/role-selection", {
            state: { redirectTo: "customer/appointments" },
          });
        }
        break;
      default:
        break;
    }

    setTimeout(() => setIsAnimating(false), 500);
    closeMobileMenu();
  };

  // Check if user is logged in and load profile
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);

    const loadUserProfile = async () => {
      if (user) {
        try {
          const profileResult = await customerProfile.loadProfile();
          if (profileResult.success && profileResult.profile) {
            const profileImage = customerUtils.validateProfileImage(
              profileResult.profile.profileImage
            );
            setUserProfileImage(profileImage);
            setCurrentUser((prev) => ({
              ...prev,
              ...profileResult.profile,
            }));
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
          const profilePic = localStorage.getItem("userProfileImage");
          if (profilePic) {
            setUserProfileImage(profilePic);
          }
        }
      }
    };

    loadUserProfile();
    loadAppointments();
  }, []);

  // Toggle profile menu function
  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  // Toggle mobile menu function
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isProfileMenuOpen &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }

      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest(".mobile-menu-button")
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileMenuOpen, isMobileMenuOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        if (isProfileMenuOpen) {
          setIsProfileMenuOpen(false);
        }
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isProfileMenuOpen, isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add("mobile-menu-open");
    } else {
      document.body.classList.remove("mobile-menu-open");
    }

    return () => {
      document.body.classList.remove("mobile-menu-open");
    };
  }, [isMobileMenuOpen]);

  // Detect scroll to change header color
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setScrolled(scrollTop > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close profile menu function
  const closeProfileMenu = () => {
    setIsProfileMenuOpen(false);
  };

  // Close mobile menu function
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Handle login/signup navigation to role selection
  const handleLoginSignup = (e) => {
    if (e) e.stopPropagation();
    closeProfileMenu();
    closeMobileMenu();
    navigate("/role-selection");
  };

  // Profile menu actions
  const handleProfileAction = (action, e) => {
    if (e) e.stopPropagation();
    closeProfileMenu();
    closeMobileMenu();

    switch (action) {
      case "profile":
        openProfileOverlay();
        break;
      case "bookings":
        openBookingsOverlay();
        break;
      case "cart":
        openCartOverlay();
        break;
      case "favorites":
        openFavoritesOverlay();
        break;
      case "payment-history":
        openPaymentOverlay();
        break;
      case "orders":
        openOrderOverlay();
        break;
      case "logout":
        handleLogout();
        break;
      default:
        break;
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate("/role-selection");
  };

  // Handle book now navigation
  const handleBookNow = (e) => {
    if (e) e.stopPropagation();
    closeProfileMenu();
    closeMobileMenu();
    const isLoggedIn = localStorage.getItem("token");
    if (isLoggedIn) {
      navigate("/customer/booking");
    } else {
      navigate("/role-selection", {
        state: { redirectTo: "customer/booking" },
      });
    }
  };

  // Quick links navigation functions
  const handleQuickLinkNavigation = (page) => {
    switch (page) {
      case "home":
        navigate("/customer/home");
        break;
      case "services":
        navigate("/customer/services");
        break;
      case "products":
        navigate("/customer/products");
        break;
      case "appointments":
        const isLoggedIn = localStorage.getItem("token");
        if (isLoggedIn) {
          navigate("/customer/appointments");
        } else {
          navigate("/role-selection", {
            state: { redirectTo: "customer/appointments" },
          });
        }
        break;
      case "about":
        navigate("/customer/about");
        break;
      case "contact":
        navigate("/customer/contact");
        break;
      default:
        break;
    }
    closeMobileMenu();
  };

  // Handle download app function
  const handleDownloadApp = (userType) => {
    console.log(`Download app for ${userType}`);
    alert(`App download for ${userType} - This feature is coming soon!`);
  };

  // Get user profile image or initials
  const getUserProfileImage = () => {
    if (userProfileImage) {
      return (
        <img
          src={userProfileImage}
          alt="Profile"
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            e.target.style.display = "none";
            if (e.target.nextSibling) {
              e.target.nextSibling.style.display = "flex";
            }
          }}
        />
      );
    }

    const initials = currentUser?.firstName
      ? currentUser.firstName.charAt(0).toUpperCase()
      : currentUser?.username
      ? currentUser.username.charAt(0).toUpperCase()
      : "U";

    return (
      <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
        {initials}
      </div>
    );
  };

  // Helper function for better error handling
  const handleAPIError = (error, defaultMessage) => {
    console.error("API Error:", error);

    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    if (error.message) {
      return error.message;
    }

    return defaultMessage;
  };

  // Load appointments from API
  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the correct API function from your api.js
      const response = await bookingsAPI.getMyBookings();

      console.log("Bookings API Response:", response);

      if (response.data && response.data.success) {
        const bookingsData = response.data.data || response.data.bookings || [];
        console.log("Bookings data:", bookingsData);

        const transformedBookings = bookingsData.map((booking) => {
          const serviceInfo = booking.serviceId || booking.service || {};
          const serviceName = serviceInfo.name || "Service Name Not Available";
          const serviceCategory = serviceInfo.category || "General";
          const serviceDuration = serviceInfo.duration || "N/A";
          const servicePrice =
            serviceInfo.price || serviceInfo.priceRange || "₱0";
          const serviceDescription =
            serviceInfo.description || "No description available";

          const stylistInfo =
            booking.selectedStylistId || booking.stylist || {};
          const stylistName =
            stylistInfo.username || stylistInfo.firstName || "Not assigned";

          return {
            _id: booking._id,
            serviceId: {
              _id: serviceInfo._id || serviceInfo.id,
              name: serviceName,
              category: serviceCategory,
              duration: serviceDuration,
              priceRange: servicePrice,
              description: serviceDescription,
            },
            customerName: booking.customerName || "Customer",
            preferredDate: booking.preferredDate || booking.date,
            preferredTime: formatTimeWithAMPM(
              booking.preferredTime || booking.time
            ),
            status: booking.status,
            selectedStylistId: {
              _id: stylistInfo._id || stylistInfo.id,
              username: stylistName,
            },
            createdAt: booking.createdAt,
            cancelledAt: booking.cancelledAt,
            completedAt: booking.completedAt,
            paymentMethod: booking.paymentMethod || "Cash",
            referenceNumber:
              booking.referenceNumber ||
              `REF-${booking._id?.slice(-8) || "N/A"}`,
            totalAmount: booking.totalAmount || servicePrice || 0,
            isRated: booking.isRated || false,
            rating: booking.rating,
            servicePrice: servicePrice,
            taxAmount: booking.taxAmount || 0,
            discountAmount: booking.discountAmount || 0,
            finalAmount:
              booking.finalAmount || booking.totalAmount || servicePrice || 0,
          };
        });

        setBookings(transformedBookings);
      } else {
        setBookings([]);
        setError("No bookings found");
      }
    } catch (error) {
      console.error("Error loading appointments:", error);
      const errorMessage = handleAPIError(
        error,
        "Failed to load appointments. Please try again."
      );
      setError(errorMessage);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const formatTimeWithAMPM = (timeString) => {
    if (!timeString) return "N/A";
    if (timeString.includes("AM") || timeString.includes("PM")) {
      return timeString;
    }

    try {
      const timeParts = timeString.split(":");
      if (timeParts.length >= 2) {
        let hours = parseInt(timeParts[0]);
        const minutes = timeParts[1];
        const period = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        return `${hours}:${minutes} ${period}`;
      }
    } catch (error) {
      console.error("Error formatting time:", error);
    }
    return timeString;
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date time:", error);
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "#22C55E";
      case "pending":
        return "#F59E0B";
      case "completed":
        return "#3B82F6";
      case "cancelled":
        return "#EF4444";
      default:
        return "#9CA3AF";
    }
  };

  const getStatusText = (status) => {
    return status
      ? status.charAt(0).toUpperCase() + status.slice(1)
      : "Unknown";
  };

  const getServiceIcon = (category) => {
    return serviceIcons[category] || serviceIcons["General"];
  };

  // Handle rate booking
  const handleRateBooking = (booking) => {
    setSelectedBooking(booking);
    setRating(booking.rating || 0);
    setComment("");
    setRatingModalVisible(true);
  };

  // Handle rating submission
  const handleRatingSubmit = async () => {
    if (!selectedBooking || rating === 0) return;

    try {
      setSubmittingRating(true);

      // Use the correct API function from your api.js
      const response = await ratingsAPI.submitBooking(selectedBooking._id, {
        rating: rating,
        comment: comment,
      });

      if (response.data && response.data.success) {
        setBookings((prev) =>
          prev.map((booking) =>
            booking._id === selectedBooking._id
              ? {
                  ...booking,
                  isRated: true,
                  rating: rating,
                }
              : booking
          )
        );
        setRatingModalVisible(false);
        setSelectedBooking(null);
        setRating(0);
        setComment("");
        alert("Rating submitted successfully!");
      } else {
        throw new Error(response.data?.message || "Failed to submit rating");
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      const errorMessage = handleAPIError(
        error,
        "Failed to submit rating. Please try again."
      );
      alert(errorMessage);
    } finally {
      setSubmittingRating(false);
    }
  };

  // Handle cancel booking
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?"))
      return;

    try {
      setActionLoading(bookingId);

      // Use the correct API function from your api.js
      const response = await bookingsAPI.cancel(
        bookingId,
        "Customer cancelled"
      );

      if (response.data && response.data.success) {
        setBookings((prev) =>
          prev.map((booking) =>
            booking._id === bookingId
              ? {
                  ...booking,
                  status: "cancelled",
                  cancelledAt: new Date().toISOString(),
                }
              : booking
          )
        );
        alert("Booking cancelled successfully!");
      } else {
        throw new Error(response.data?.message || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      const errorMessage = handleAPIError(
        error,
        "Failed to cancel booking. Please try again."
      );
      alert(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle delete booking
  const handleDeleteBooking = async (bookingId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this booking? This action cannot be undone."
      )
    )
      return;

    try {
      setActionLoading(`delete-${bookingId}`);

      // Use the correct API function from your api.js
      const response = await bookingsAPI.delete(bookingId);

      if (response.data && response.data.success) {
        setBookings((prev) =>
          prev.filter((booking) => booking._id !== bookingId)
        );
        alert("Booking deleted successfully!");
      } else {
        throw new Error(response.data?.message || "Failed to delete booking");
      }
    } catch (error) {
      console.error("Error deleting booking:", error);

      // If delete endpoint doesn't exist, try cancel instead
      if (error.response?.status === 404) {
        try {
          const cancelResponse = await bookingsAPI.cancel(
            bookingId,
            "Customer deleted"
          );
          if (cancelResponse.data && cancelResponse.data.success) {
            setBookings((prev) =>
              prev.filter((booking) => booking._id !== bookingId)
            );
            alert("Booking deleted successfully!");
            return;
          }
        } catch (cancelError) {
          console.error("Error cancelling instead of deleting:", cancelError);
        }
      }

      const errorMessage = handleAPIError(
        error,
        "Failed to delete booking. Please try again."
      );
      alert(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reschedule booking
  const handleRescheduleBooking = async (bookingId) => {
    navigate("/customer/booking", {
      state: {
        rescheduleBookingId: bookingId,
        action: "reschedule",
      },
    });
  };

  const handleViewReceipt = (booking) => {
    setSelectedReceipt(booking);
    setReceiptModalVisible(true);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const getFilteredBookings = () => {
    switch (activeTab) {
      case "upcoming":
        return bookings.filter(
          (b) => b.status === "pending" || b.status === "confirmed"
        );
      case "completed":
        return bookings.filter((b) => b.status === "completed");
      case "cancelled":
        return bookings.filter((b) => b.status === "cancelled");
      default:
        return bookings;
    }
  };

  // Render star rating function
  const renderStarRating = (currentRating, onRatingChange = null) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => onRatingChange && onRatingChange(i)}
          className={`star-button ${onRatingChange ? "clickable" : ""}`}
          disabled={!onRatingChange || submittingRating}
          style={{
            background: "none",
            border: "none",
            cursor: onRatingChange && !submittingRating ? "pointer" : "default",
          }}>
          {i <= currentRating ? (
            <IoStar className="w-6 h-6 text-yellow-400" />
          ) : i - 0.5 <= currentRating ? (
            <IoStarHalf className="w-6 h-6 text-yellow-400" />
          ) : (
            <IoStarOutline className="w-6 h-6 text-gray-300" />
          )}
        </button>
      );
    }
    return <div className="flex">{stars}</div>;
  };

  const filteredBookings = getFilteredBookings();

  return (
    <div className="customer-home relative overflow-x-hidden min-h-screen bg-[#0a0e27]">
      {/* Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[700px] h-[700px] md:w-[1000px] md:h-[1000px] lg:w-[1200px] lg:h-[1200px] rounded-full blur-3xl opacity-20 parallax-slow"
          style={{
            background:
              "radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(99, 102, 241, 0.25) 40%, transparent 70%)",
            animation: "circularMotion1 35s ease-in-out infinite",
            top: "5%",
            left: "0%",
          }}
        />
        <div
          className="absolute w-[750px] h-[750px] md:w-[1050px] md:h-[1050px] lg:w-[1250px] lg:h-[1250px] rounded-full blur-3xl opacity-18 parallax-medium"
          style={{
            background:
              "radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, rgba(14, 165, 233, 0.2) 40%, transparent 70%)",
            animation: "circularMotion2 40s ease-in-out infinite",
            top: "30%",
            right: "0%",
          }}
        />
        <div
          className="absolute w-[700px] h-[700px] md:w-[1000px] md:h-[1000px] lg:w-[1200px] lg:h-[1200px] rounded-full blur-3xl opacity-16 parallax-fast"
          style={{
            background:
              "radial-gradient(circle, rgba(79, 70, 229, 0.3) 0%, rgba(67, 56, 202, 0.18) 40%, transparent 70%)",
            animation: "circularMotion3 38s ease-in-out infinite",
            bottom: "10%",
            left: "10%",
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header / Navigation */}
        <header
          className={`fixed w-full z-50 transition-all duration-500 ${
            scrolled ? "bg-[#0a0e27]/80 backdrop-blur-xl shadow-lg" : ""
          }`}>
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <img
                  src={salonLogo}
                  alt="Sandrea Lee Salon"
                  className="h-10 sm:h-12 w-auto object-contain cursor-pointer"
                  onClick={() => navigate("/customer/home")}
                />
                <span
                  className="relative top-1.5 -left-3 text-xl sm:text-3xl font-semi-bold text-white font-['Tenali_Ramakrishna'] tracking-wide leading-none cursor-pointer"
                  onClick={() => navigate("/customer/home")}>
                  SALON
                </span>
              </div>

              {/* Navigation Tabs - Hidden on mobile, visible on desktop */}
              <nav className="hidden lg:flex flex-1 justify-center">
                <div className="modern-navbar">
                  <div className="navbar-glass">
                    <div className="navbar-links">
                      {navItems.map((item) => {
                        const isActive = activeTab === item;
                        return (
                          <button
                            key={item}
                            onClick={() => handleTabChange(item)}
                            className={`nav-link ${isActive ? "active" : ""}`}
                            role="tab"
                            aria-selected={isActive}>
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </nav>

              {/* Hamburger Menu Button - RIGHT SIDE */}
              <div className="flex items-center space-x-4">
                {/* Profile Menu Button - Hidden on mobile when hamburger is shown */}
                {currentUser ? (
                  <div className="hidden lg:block">
                    <button
                      ref={profileButtonRef}
                      onClick={toggleProfileMenu}
                      className="relative px-4 py-2 rounded-full font-bold text-sm transition-all duration-300 overflow-hidden flex items-center space-x-2 z-50 flex-shrink-0 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20"
                      style={{ color: "#fff" }}>
                      <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
                        {getUserProfileImage()}
                      </div>
                      <span className="relative z-10 text-white">
                        {currentUser.firstName ||
                          currentUser.username ||
                          "User"}
                      </span>
                      <div className="relative w-4 h-4 flex items-center justify-center">
                        <IoChevronDown
                          className={`w-4 h-4 text-white transition-transform duration-300 ${
                            isProfileMenuOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="hidden lg:block">
                    <button
                      onClick={handleLoginSignup}
                      className="relative px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 overflow-hidden flex items-center space-x-2 z-50 flex-shrink-0"
                      style={{
                        background:
                          "linear-gradient(to bottom, #76C4FF, #3352E8)",
                        color: "#000",
                      }}>
                      <span className="relative z-10">Login/Signup</span>
                    </button>
                  </div>
                )}

                {/* Hamburger Menu Button - Visible on mobile */}
                <button
                  className="lg:hidden mobile-menu-button relative p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300"
                  onClick={toggleMobileMenu}
                  aria-label="Toggle menu">
                  {isMobileMenuOpen ? (
                    <IoClose className="w-6 h-6 text-white" />
                  ) : (
                    <IoMenu className="w-6 h-6 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Menu Overlay - RIGHT SIDE with Scroll */}
        <div
          ref={mobileMenuRef}
          className={`lg:hidden fixed z-[55] top-0 right-0 h-full w-80 max-w-full bg-gradient-to-b from-gray-900/95 via-gray-900/95 to-black/95 backdrop-blur-xl border-l border-white/10 transform transition-transform duration-500 ease-in-out ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}>
          <div className="h-full flex flex-col">
            {/* Mobile Menu Header - Fixed */}
            <div className="flex-shrink-0 p-6 pb-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-xl font-semi-bold text-white">
                    Menu
                  </span>
                </div>
                <button
                  onClick={toggleMobileMenu}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Close menu">
                  <IoClose className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* User Info */}
              {currentUser && (
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                    {getUserProfileImage()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium text-sm">
                      {currentUser.firstName || currentUser.username || "User"}
                    </h3>
                    <p className="text-gray-400 text-xs">
                      {currentUser.email || "Customer"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto mobile-menu-scrollable">
              <div className="p-6 pt-4">
                {/* Mobile Navigation Links */}
                <nav className="mb-8">
                  <div className="space-y-2">
                    {["Home", "Services", "Products", "Appointments"].map(
                      (item) => (
                        <button
                          key={item}
                          onClick={() => handleTabChange(item)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 ${
                            activeTab === item
                              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400/30"
                              : "text-gray-300 hover:text-white hover:bg-white/5"
                          }`}>
                          <span className="font-medium">{item}</span>
                        </button>
                      )
                    )}
                  </div>
                </nav>

                {/* Mobile Profile Menu Items */}
                <div className="mb-8">
                  <div className="space-y-2">
                    {profileMenuItems.map((item) => (
                      <button
                        key={item.key}
                        onClick={(e) => handleProfileAction(item.key, e)}
                        className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200 text-left">
                        <span className="text-gray-400">{item.icon}</span>
                        <span className="flex-1 font-medium">{item.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Mobile Logout Button */}
                  {currentUser && (
                    <button
                      onClick={(e) => handleProfileAction("logout", e)}
                      className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-red-400 hover:bg-red-400/10 transition-all duration-200 text-left border border-red-400/20 hover:border-red-400/40 mt-4">
                      <IoLogOut className="w-5 h-5" />
                      <span className="flex-1 font-medium">Logout</span>
                    </button>
                  )}

                  {/* Mobile Login/Signup Button */}
                  {!currentUser && (
                    <button
                      onClick={handleLoginSignup}
                      className="w-full mt-4 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium transition-all duration-200 hover:from-blue-600 hover:to-purple-700">
                      Login/Signup
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Book Now Button - Fixed at bottom */}
            <div className="flex-shrink-0 p-6 border-t border-gray-700">
              <button
                onClick={handleBookNow}
                className="w-full px-6 py-3 rounded-full font-semibold text-white border-2 border-white/50 hover:border-white hover:bg-white/10 transition-all duration-300">
                Book Now
              </button>
            </div>
          </div>
        </div>

        {/* Profile Menu Dropdown */}
        {currentUser && (
          <div
            ref={profileMenuRef}
            className={`fixed z-[60] rounded-2xl sm:rounded-3xl shadow-2xl transform transition-all duration-500 ease-out
              top-20 sm:top-24 
              left-4 right-4 sm:left-auto sm:right-4 md:right-6 
              sm:w-80 md:w-96 
              bg-gradient-to-br from-gray-900/95 via-gray-900/95 to-black/95 border border-white/10 backdrop-blur-xl
              ${
                isProfileMenuOpen
                  ? "translate-x-0 opacity-100 scale-100 pointer-events-auto"
                  : "sm:translate-x-[120%] translate-y-[-120%] sm:translate-y-0 opacity-0 scale-95 pointer-events-none"
              }`}>
            <div className="p-5 sm:p-6 md:p-8">
              {/* User Profile Header */}
              <div className="flex items-center space-x-4 mb-6 pb-4 border-b border-gray-700">
                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center">
                  {getUserProfileImage()}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">
                    {currentUser.firstName || currentUser.username || "User"}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {currentUser.email || "Customer"}
                  </p>
                </div>
              </div>

              {/* Menu Options */}
              <div className="space-y-2">
                {profileMenuItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={(e) => handleProfileAction(item.key, e)}
                    className="flex items-center space-x-3 w-full px-3 py-3 rounded-lg text-white hover:bg-white/5 transition-all duration-200 hover:scale-105 transform text-left">
                    <span className="text-gray-300">{item.icon}</span>
                    <span className="flex-1 font-medium">{item.label}</span>
                    <IoChevronForward className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>

              {/* Logout Button */}
              <div className="mt-6 pt-4 border-t border-gray-700">
                <button
                  onClick={(e) => handleProfileAction("logout", e)}
                  className="flex items-center space-x-3 w-full px-3 py-3 rounded-lg text-red-400 hover:bg-red-400/10 transition-all duration-200 hover:scale-105 transform text-left border border-red-400/20 hover:border-red-400/40">
                  <IoLogOut className="w-5 h-5" />
                  <span className="flex-1 font-medium">Logout</span>
                </button>
              </div>

              {/* Quick Action - Book Now */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleBookNow}
                  className="w-full px-8 py-3 rounded-full font-semibold text-sm transition-all border-2 border-white/50 hover:border-white hover:bg-white/10 hover:scale-105 cursor-pointer transform transition-transform duration-300"
                  style={{ background: "transparent", color: "#fff" }}>
                  Book Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Overlay Components */}
        <Profile isOpen={isProfileOverlayOpen} onClose={closeProfileOverlay} />
        <Bookings
          isOpen={isBookingsOverlayOpen}
          onClose={closeBookingsOverlay}
        />
        <Cart isOpen={isCartOverlayOpen} onClose={closeCartOverlay} />
        <Favorites
          isOpen={isFavoritesOverlayOpen}
          onClose={closeFavoritesOverlay}
        />
        <Payment isOpen={isPaymentOverlayOpen} onClose={closePaymentOverlay} />
        <Order isOpen={isOrderOverlayOpen} onClose={closeOrderOverlay} />

        {/* Main Content Area */}
        <div className="pt-32 pb-20">
          <div className="container mx-auto px-4 sm:px-6">
            {/* Page Header */}
            <div className="text-center mb-16 scroll-reveal">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6">
                Your{" "}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Appointments
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Manage your upcoming, completed, and cancelled appointments with
                ease
              </p>
            </div>

            {/* Tabs */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="tabs-container">
                <div className="tabs-wrapper">
                  {["upcoming", "completed", "cancelled"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`tab ${activeTab === tab ? "active" : ""}`}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bookings List */}
            <div className="max-w-6xl mx-auto">
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
                  <span className="ml-4 text-white text-lg">
                    Loading appointments...
                  </span>
                </div>
              ) : error ? (
                <div className="text-center py-16">
                  <p className="text-yellow-400 text-xl mb-6">{error}</p>
                  <button
                    onClick={loadAppointments}
                    className="mt-6 px-8 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-full text-white transition-colors text-lg font-semibold">
                    Try Again
                  </button>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-20">
                  <IoCalendar className="w-24 h-24 text-gray-400 mx-auto mb-6" />
                  <p className="text-gray-400 text-xl mb-4">
                    No {activeTab} appointments
                  </p>
                  <p className="text-gray-500 text-lg mb-8">
                    {activeTab === "upcoming"
                      ? "Book a service to see your upcoming appointments"
                      : `You don't have any ${activeTab} appointments yet`}
                  </p>
                  {activeTab === "upcoming" && (
                    <button
                      onClick={() => navigate("/customer/services")}
                      className="mt-6 px-8 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-full text-white transition-colors text-lg font-semibold">
                      Book Now
                    </button>
                  )}
                </div>
              ) : (
                <div className="bookings-grid">
                  {filteredBookings.map((booking) => (
                    <div key={booking._id} className="booking-card">
                      <div className="booking-header">
                        <div className="service-icon">
                          {getServiceIcon(booking.serviceId.category)}
                        </div>
                        <div className="booking-info">
                          <div className="date-status-row">
                            <h3 className="booking-date">
                              {formatDate(booking.preferredDate)} •{" "}
                              {booking.preferredTime}
                            </h3>
                            <span
                              className="status-badge"
                              style={{
                                backgroundColor: `${getStatusColor(
                                  booking.status
                                )}20`,
                                color: getStatusColor(booking.status),
                              }}>
                              {getStatusText(booking.status)}
                            </span>
                          </div>
                          <p className="salon-name">SandreaLee Salon</p>
                          <p className="salon-address">
                            SandreaLee Salon, 2184 Loyola St. Sampaloc, Manila
                          </p>

                          <div className="service-details">
                            <p className="service-info">
                              <strong>Service:</strong> {booking.serviceId.name}
                            </p>
                            <p className="service-category">
                              <strong>Category:</strong>{" "}
                              {booking.serviceId.category}
                            </p>
                            <p className="service-duration">
                              <strong>Duration:</strong>{" "}
                              {booking.serviceId.duration}
                            </p>
                            <p className="service-price">
                              <strong>Price:</strong>{" "}
                              {typeof booking.serviceId.priceRange === "string"
                                ? booking.serviceId.priceRange
                                : `₱${booking.serviceId.priceRange || 0}`}
                            </p>
                            {booking.serviceId.description && (
                              <p className="service-description">
                                <strong>Description:</strong>{" "}
                                {booking.serviceId.description}
                              </p>
                            )}
                          </div>

                          {booking.selectedStylistId &&
                            booking.selectedStylistId.username && (
                              <p className="stylist-info">
                                <strong>Stylist:</strong>{" "}
                                {booking.selectedStylistId.username}
                              </p>
                            )}

                          <div className="booking-meta">
                            <p className="booking-reference">
                              <strong>Reference #:</strong>{" "}
                              {booking.referenceNumber}
                            </p>
                            <p className="booking-amount">
                              <strong>Total Amount:</strong> ₱
                              {booking.totalAmount || booking.finalAmount || 0}
                            </p>
                            <p className="booking-created">
                              <strong>Booked on:</strong>{" "}
                              {formatDateTime(booking.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="booking-actions">
                        {activeTab === "upcoming" && (
                          <>
                            <button
                              onClick={() => handleCancelBooking(booking._id)}
                              disabled={actionLoading === booking._id}
                              className="cancel-button">
                              {actionLoading === booking._id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Cancelling...
                                </>
                              ) : (
                                <>
                                  <IoCloseCircle className="w-5 h-5 mr-2" />
                                  Cancel Booking
                                </>
                              )}
                            </button>
                            <button
                              onClick={() =>
                                handleRescheduleBooking(booking._id)
                              }
                              className="reschedule-button">
                              <IoTime className="w-5 h-5 mr-2" />
                              Reschedule
                            </button>
                            <button
                              onClick={() => handleViewReceipt(booking)}
                              className="view-receipt-button">
                              <IoReceipt className="w-5 h-5 mr-2" />
                              View Receipt
                            </button>
                          </>
                        )}
                        {activeTab === "completed" && !booking.isRated && (
                          <button
                            onClick={() => handleRateBooking(booking)}
                            className="rate-button">
                            <IoStar className="w-5 h-5 mr-2" />
                            Rate Service
                          </button>
                        )}
                        {activeTab === "completed" && booking.isRated && (
                          <div className="flex items-center space-x-2">
                            <span className="rated-badge">
                              <IoStar className="w-5 h-5 mr-2 text-yellow-400" />
                              Rated {booking.rating}/5
                            </span>
                            <button
                              onClick={() => handleRateBooking(booking)}
                              className="edit-rating-button">
                              Edit Rating
                            </button>
                          </div>
                        )}
                        {(activeTab === "cancelled" ||
                          activeTab === "completed") && (
                          <>
                            <button
                              onClick={() => handleViewReceipt(booking)}
                              className="view-receipt-button">
                              <IoEyeOutline className="w-5 h-5 mr-2" />
                              View Details
                            </button>
                            <button
                              onClick={() => handleDeleteBooking(booking._id)}
                              disabled={
                                actionLoading === `delete-${booking._id}`
                              }
                              className="delete-button">
                              {actionLoading === `delete-${booking._id}` ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <IoTrash className="w-5 h-5 mr-2" />
                                  Delete
                                </>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <footer className="relative overflow-hidden bg-transparent pt-24 sm:pt-32 md:pt-40">
          <div className="bg-[#0A142F] rounded-t-[120px] sm:rounded-t-[160px] md:rounded-t-[200px] lg:rounded-t-[240px]">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
              {/* Main Footer Content */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-10">
                {/* Logo and App Downloads */}
                <div className="scroll-reveal-left">
                  <div className="flex items-center space-x-2 mb-6">
                    <img
                      src={salonLogo}
                      alt="Sandrea Lee Salon"
                      className="h-10 sm:h-12 w-auto object-contain"
                    />
                    <span className="relative top-1.5 -left-3 text-2xl sm:text-3xl font-semi-bold text-white font-['Tenali_Ramakrishna'] tracking-wide leading-none">
                      SALON
                    </span>
                  </div>

                  {/* App Store Buttons */}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => handleDownloadApp("customer")}
                      className="flex items-center justify-center space-x-3 bg-white hover:bg-gray-100 text-black rounded-xl px-5 py-3 transition-all duration-300 transform hover:scale-105 shadow-lg w-full max-w-[200px]">
                      <IoLogoApple className="w-6 h-6" />
                      <div className="text-left">
                        <div className="text-[9px] text-gray-600 leading-tight">
                          Download on the
                        </div>
                        <div className="text-sm font-semibold leading-tight">
                          App Store
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleDownloadApp("customer")}
                      className="flex items-center justify-center space-x-3 bg-white hover:bg-gray-100 text-black rounded-xl px-5 py-3 transition-all duration-300 transform hover:scale-105 shadow-lg w-full max-w-[200px]">
                      <IoLogoGooglePlaystore className="w-6 h-6" />
                      <div className="text-left">
                        <div className="text-[9px] text-gray-600 leading-tight">
                          Get it on
                        </div>
                        <div className="text-sm font-semibold leading-tight">
                          Google Play
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Quick Links with Functional Navigation */}
                <div className="scroll-reveal scroll-stagger-1">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-4 pb-2">
                    Quick links
                  </h3>
                  <ul className="space-y-2.5">
                    <li>
                      <button
                        onClick={() => handleQuickLinkNavigation("home")}
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-sm text-left">
                        Home
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleQuickLinkNavigation("services")}
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-sm text-left">
                        Services
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleQuickLinkNavigation("products")}
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-sm text-left">
                        Products
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() =>
                          handleQuickLinkNavigation("appointments")
                        }
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-sm text-left">
                        Appointments
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleQuickLinkNavigation("about")}
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-sm text-left">
                        About
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleQuickLinkNavigation("contact")}
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-sm text-left">
                        Contact
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Contact Us */}
                <div className="scroll-reveal scroll-stagger-2">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-4 pb-2">
                    Contact Us
                  </h3>
                  <div className="space-y-3">
                    {/* Address */}
                    <div className="flex items-start space-x-2">
                      <IoLocation className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                      <p className="text-gray-300 text-xs leading-relaxed">
                        2184 Loyola St, Sampaloc,
                        <br />
                        Manila, 1008 Metro Manila
                      </p>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center space-x-2">
                      <IoCall className="w-5 h-5 text-white flex-shrink-0" />
                      <a
                        href="tel:09998081357"
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-sm">
                        0999 808 1357
                      </a>
                    </div>

                    {/* WhatsApp */}
                    <div className="flex items-center space-x-2">
                      <IoLogoWhatsapp className="w-5 h-5 text-white flex-shrink-0" />
                      <a
                        href="https://wa.me/639175350244"
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-sm">
                        +63 917 535 0244
                      </a>
                    </div>

                    {/* Hours */}
                    <div className="flex items-center space-x-2">
                      <IoTimeOutline className="w-5 h-5 text-white flex-shrink-0" />
                      <p className="text-gray-300 text-sm">
                        Mon-Sun | 9:00 AM - 9:00 PM
                      </p>
                    </div>
                  </div>
                </div>

                {/* Newsletter */}
                <div className="scroll-reveal scroll-stagger-3">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2 pb-2">
                    Join our Newsletter
                  </h3>
                  <p className="text-gray-300 text-xs mb-4">
                    Subscribe for special offers,
                    <br />
                    beauty tips, and updates!
                  </p>

                  {/* Email Input */}
                  <div className="flex items-center bg-white rounded-full overflow-hidden shadow-lg">
                    <input
                      type="email"
                      placeholder="Get updates"
                      className="flex-1 px-4 py-2.5 text-gray-800 text-sm outline-none bg-transparent"
                    />
                    <button className="bg-blue-500 hover:bg-blue-600 text-white p-2.5 transition-colors duration-300">
                      <IoMail className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Social Media - Centered at Bottom */}
              <div className="flex flex-col items-center justify-center py-6 border-t border-gray-700/50">
                <h4 className="text-white text-base font-medium mb-4">
                  Social Media
                </h4>
                <div className="flex items-center space-x-4">
                  {/* Facebook */}
                  <a
                    href="#"
                    className="w-11 h-11 rounded-full border-2 border-gray-500 hover:border-white flex items-center justify-center transition-all duration-300 hover:scale-110"
                    aria-label="Facebook">
                    <IoLogoFacebook className="w-5 h-5 text-gray-300 hover:text-white" />
                  </a>

                  {/* Instagram */}
                  <a
                    href="#"
                    className="w-11 h-11 rounded-full border-2 border-gray-500 hover:border-white flex items-center justify-center transition-all duration-300 hover:scale-110"
                    aria-label="Instagram">
                    <IoLogoInstagram className="w-5 h-5 text-gray-300 hover:text-white" />
                  </a>

                  {/* Twitter */}
                  <a
                    href="#"
                    className="w-11 h-11 rounded-full border-2 border-gray-500 hover:border-white flex items-center justify-center transition-all duration-300 hover:scale-110"
                    aria-label="Twitter">
                    <IoLogoTwitter className="w-5 h-5 text-gray-300 hover:text-white" />
                  </a>
                </div>
              </div>

              {/* Bottom Bar */}
              <div className="border-t border-gray-700/50 pt-5 mt-2">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
                  <p>© 2025 SALON. All Rights Reserved</p>
                  <div className="flex items-center space-x-3">
                    <a
                      href="#"
                      className="hover:text-white transition-colors duration-300">
                      Privacy Policy
                    </a>
                    <span className="text-gray-600">|</span>
                    <a
                      href="#"
                      className="hover:text-white transition-colors duration-300">
                      Terms of Service
                    </a>
                    <span className="text-gray-600">|</span>
                    <a
                      href="#"
                      className="hover:text-white transition-colors duration-300">
                      Cookie Policy
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Rating Modal */}
      {ratingModalVisible && (
        <div className="rating-modal-overlay">
          <div className="rating-modal">
            <div className="rating-modal-header">
              <h3>Rate Your Experience</h3>
              <button
                onClick={() => {
                  setRatingModalVisible(false);
                  setRating(0);
                  setComment("");
                }}
                className="close-button">
                <IoClose className="w-6 h-6" />
              </button>
            </div>

            <div className="rating-modal-content">
              {selectedBooking && (
                <div className="booking-info">
                  <h4>{selectedBooking.serviceId.name}</h4>
                  <p>
                    {formatDate(selectedBooking.preferredDate)} •{" "}
                    {selectedBooking.preferredTime}
                  </p>
                  {selectedBooking.selectedStylistId && (
                    <p>Stylist: {selectedBooking.selectedStylistId.username}</p>
                  )}
                </div>
              )}

              <div className="rating-section">
                <label>Overall Rating</label>
                <div className="star-rating">
                  {renderStarRating(rating, setRating)}
                </div>
                <p className="rating-text">
                  {rating === 0
                    ? "Select your rating"
                    : `${rating} out of 5 stars`}
                </p>
              </div>

              <div className="comment-section">
                <label>Additional Comments (Optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience..."
                  rows={4}
                  disabled={submittingRating}
                />
              </div>
            </div>

            <div className="rating-modal-actions">
              <button
                onClick={() => {
                  setRatingModalVisible(false);
                  setRating(0);
                  setComment("");
                }}
                disabled={submittingRating}
                className="cancel-button">
                Cancel
              </button>
              <button
                onClick={handleRatingSubmit}
                disabled={rating === 0 || submittingRating}
                className="submit-button">
                {submittingRating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  "Submit Rating"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptModalVisible && selectedReceipt && (
        <div className="rating-modal-overlay">
          <div className="rating-modal receipt-modal">
            <div className="rating-modal-header">
              <h3>Booking Receipt</h3>
              <button
                onClick={() => setReceiptModalVisible(false)}
                className="close-button">
                <IoClose className="w-6 h-6" />
              </button>
            </div>

            <div className="rating-modal-content">
              <div className="receipt-content">
                {/* Salon Header */}
                <div className="receipt-header text-center mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    SandreaLee Salon
                  </h2>
                  <p className="text-gray-300">
                    2184 Loyola St. Sampaloc, Manila
                  </p>
                  <p className="text-gray-300">0999 808 1357</p>
                </div>

                {/* Booking Details */}
                <div className="receipt-details space-y-4">
                  <div className="detail-row">
                    <span className="label">Reference Number:</span>
                    <span className="value">
                      {selectedReceipt.referenceNumber}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Booking Date:</span>
                    <span className="value">
                      {formatDateTime(selectedReceipt.createdAt)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Service Date:</span>
                    <span className="value">
                      {formatDate(selectedReceipt.preferredDate)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Service Time:</span>
                    <span className="value">
                      {selectedReceipt.preferredTime}
                    </span>
                  </div>

                  {/* Service Information */}
                  <div className="service-section border-t border-gray-600 pt-4 mt-4">
                    <h4 className="text-lg font-semibold text-white mb-3">
                      Service Details
                    </h4>
                    <div className="detail-row">
                      <span className="label">Service:</span>
                      <span className="value">
                        {selectedReceipt.serviceId.name}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Category:</span>
                      <span className="value">
                        {selectedReceipt.serviceId.category}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Duration:</span>
                      <span className="value">
                        {selectedReceipt.serviceId.duration}
                      </span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="pricing-section border-t border-gray-600 pt-4 mt-4">
                    <h4 className="text-lg font-semibold text-white mb-3">
                      Pricing
                    </h4>
                    <div className="detail-row">
                      <span className="label">Service Price:</span>
                      <span className="value">
                        {selectedReceipt.serviceId.priceRange}
                      </span>
                    </div>
                    {selectedReceipt.taxAmount > 0 && (
                      <div className="detail-row">
                        <span className="label">Tax:</span>
                        <span className="value">
                          ₱{selectedReceipt.taxAmount}
                        </span>
                      </div>
                    )}
                    {selectedReceipt.discountAmount > 0 && (
                      <div className="detail-row">
                        <span className="label">Discount:</span>
                        <span className="value">
                          -₱{selectedReceipt.discountAmount}
                        </span>
                      </div>
                    )}
                    <div className="detail-row total-row">
                      <span className="label font-bold">Total Amount:</span>
                      <span className="value font-bold">
                        ₱{selectedReceipt.finalAmount}
                      </span>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="additional-info border-t border-gray-600 pt-4 mt-4">
                    <div className="detail-row">
                      <span className="label">Payment Method:</span>
                      <span className="value">
                        {selectedReceipt.paymentMethod}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Status:</span>
                      <span
                        className="value status-badge"
                        style={{
                          backgroundColor: `${getStatusColor(
                            selectedReceipt.status
                          )}20`,
                          color: getStatusColor(selectedReceipt.status),
                        }}>
                        {getStatusText(selectedReceipt.status)}
                      </span>
                    </div>
                    {selectedReceipt.selectedStylistId && (
                      <div className="detail-row">
                        <span className="label">Assigned Stylist:</span>
                        <span className="value">
                          {selectedReceipt.selectedStylistId.username}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rating-modal-actions">
              <button
                onClick={() => setReceiptModalVisible(false)}
                className="cancel-button">
                Close
              </button>
              <button
                onClick={handlePrintReceipt}
                className="submit-button print-button">
                <IoPrint className="w-4 h-4 mr-2" />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
