// pages/Services.jsx - UPDATED WITH MENU OVERLAYS AND QUICK LINKS
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  IoMenu,
  IoClose,
} from "react-icons/io5";
import salonLogo from "../assets/SandreaLeeSalonLogoCapstone.png";
import "../styles/services.css";
import "../styles/landingAnimations.css";
import {
  servicesAPI,
  serviceUtils,
  getCurrentUser,
  logout,
  customerProfile,
  customerUtils,
} from "../services/api";

// Import menu overlay components
import Profile from "../menu/Profile.jsx";
import Bookings from "../menu/Bookings.jsx";
import Cart from "../menu/Cart.jsx";
import Favorites from "../menu/Favorites.jsx";
import Payment from "../menu/Payment.jsx";
import Order from "../menu/Order.jsx";

// Import your category images
import HairColoring from "../assets/Hair Coloring.png";
import ShairColoring from "../assets/Shair Coloring.png";
import PermingTexture from "../assets/Perming & Texture Services.png";
import RebondingStraightening from "../assets/Rebonding Straightening.png";
import HairTreatments from "../assets/Hair Treatments.png";
import CombinationServices from "../assets/Combination Services.png";
import HairExtensions from "../assets/Hair Extensions.png";
import StylingSpecial from "../assets/Styling & Special Services.png";
import PackageSets from "../assets/Package Sets.png";

// Import your map image
import mapImage from "../assets/map.png";

const ServicesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // UPDATED: Added mobile menu state
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState("Services");
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState("right");
  const [lastScrollY, setLastScrollY] = useState(0);

  // UPDATED: User state for logged-in users
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfileImage, setUserProfileImage] = useState(null);

  // UPDATED: Overlay states from Home.jsx
  const [isProfileOverlayOpen, setIsProfileOverlayOpen] = useState(false);
  const [isBookingsOverlayOpen, setIsBookingsOverlayOpen] = useState(false);
  const [isCartOverlayOpen, setIsCartOverlayOpen] = useState(false);
  const [isFavoritesOverlayOpen, setIsFavoritesOverlayOpen] = useState(false);
  const [isPaymentOverlayOpen, setIsPaymentOverlayOpen] = useState(false);
  const [isOrderOverlayOpen, setIsOrderOverlayOpen] = useState(false);

  // Services states
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All Services");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("name");

  // Refs for horizontal scrolling
  const categoriesScrollRef = useRef(null);
  const serviceSectionRef = useRef(null);
  const mapSectionRef = useRef(null);
  const footerRef = useRef(null);
  const observerRef = useRef(null);

  // UPDATED: Refs for profile menu and mobile menu
  const profileMenuRef = useRef(null);
  const profileButtonRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Category images mapping
  const categoryImages = {
    "Haircuts & Basic Services": HairColoring,
    "Hair Coloring": ShairColoring,
    "Perming & Texture Services": PermingTexture,
    "Rebonding/Straightening": RebondingStraightening,
    "Hair Treatments": HairTreatments,
    "Combination Services": CombinationServices,
    "Hair Extensions": HairExtensions,
    "Styling & Special Services": StylingSpecial,
    "Package Sets/Codes": PackageSets,
  };

  // UPDATED: Profile menu items with icons
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

  const navItems = ["Home", "Services", "Products", "Appointments"];

  // REAL-TIME Salon schedule data
  const [salonSchedule, setSalonSchedule] = useState([]);
  const [currentStatus, setCurrentStatus] = useState({
    isOpen: false,
    today: "",
    nextOpening: "",
    currentTime: "",
    timeUntilClose: "",
  });

  // UPDATED: Check if user is logged in and load profile
  useEffect(() => {
    const user = getCurrentUser();
    console.log("👤 Current User:", user);
    setCurrentUser(user);

    const loadUserProfile = async () => {
      if (user) {
        try {
          console.log("🔄 Loading user profile...");
          const profileResult = await customerProfile.loadProfile();
          console.log("📊 Profile Result:", profileResult);

          if (profileResult.success && profileResult.profile) {
            const profileImage = customerUtils.validateProfileImage(
              profileResult.profile.profileImage
            );
            console.log("🖼️ Profile Image:", profileImage);
            setUserProfileImage(profileImage);

            setCurrentUser((prev) => ({
              ...prev,
              ...profileResult.profile,
            }));
          }
        } catch (error) {
          console.error("❌ Error loading user profile:", error);
          const profilePic = localStorage.getItem("userProfileImage");
          if (profilePic) {
            setUserProfileImage(profilePic);
          }
        }
      }
    };

    loadUserProfile();
  }, []);

  // UPDATED: Get user profile image or initials
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

  // UPDATED: Toggle profile menu function
  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  // UPDATED: Toggle mobile menu function
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // UPDATED: Close menu when clicking outside - IMPROVED VERSION
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close profile menu
      if (
        isProfileMenuOpen &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }

      // Close mobile menu
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

  // UPDATED: Close menu on escape key
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

  // UPDATED: Prevent body scroll when mobile menu is open
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
      setLastScrollY(scrollTop);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // SIMPLIFIED: Intersection Observer - More Reliable
  useEffect(() => {
    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("scroll-reveal-visible");
          // Stop observing once visible
          if (observerRef.current) {
            observerRef.current.unobserve(entry.target);
          }
        }
      });
    };

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: "50px 0px 50px 0px",
    });

    // Observe elements after a short delay to ensure DOM is ready
    setTimeout(() => {
      const elements = document.querySelectorAll(".scroll-reveal");
      elements.forEach((el) => {
        if (!el.classList.contains("scroll-reveal-visible")) {
          observerRef.current.observe(el);
        }
      });
    }, 100);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // ELEMENT OBSERVATION SETUP
  useEffect(() => {
    if (!observerRef.current) return;

    const setupObservation = () => {
      const elementsToAnimate = document.querySelectorAll(".scroll-reveal");

      if (elementsToAnimate.length === 0) {
        console.log("⚠️ No scroll-reveal elements found");
        return;
      }

      console.log(`🔍 Found ${elementsToAnimate.length} elements to animate`);

      let revealedCount = 0;
      let observedCount = 0;

      elementsToAnimate.forEach((element, index) => {
        // Skip if already visible
        if (element.classList.contains("scroll-reveal-visible")) {
          revealedCount++;
          return;
        }

        // Check if element is in or near viewport
        const rect = element.getBoundingClientRect();
        const windowHeight =
          window.innerHeight || document.documentElement.clientHeight;
        const windowWidth =
          window.innerWidth || document.documentElement.clientWidth;

        const isInViewport =
          rect.top < windowHeight + 300 && rect.bottom > -300;

        if (isInViewport || index < 15) {
          // Reveal elements that are in viewport or first 15 elements
          element.classList.add("scroll-reveal-visible");
          revealedCount++;
        } else {
          // Observe for future reveal
          observerRef.current.observe(element);
          observedCount++;
        }
      });

      console.log(`✅ Initially revealed: ${revealedCount}`);
      console.log(`👁️ Observing: ${observedCount}`);
    };

    // Run immediately and after delays
    setupObservation();
    const timeoutId1 = setTimeout(setupObservation, 100);
    const timeoutId2 = setTimeout(setupObservation, 500);

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
    };
  }, [filteredServices, activeCategory, searchQuery, loading]);

  // ENHANCED: Real-time schedule with better time tracking
  useEffect(() => {
    const updateSchedule = () => {
      const now = new Date();
      const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const currentTimeString = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      const schedule = [
        {
          day: "Monday",
          hours: "9:00 AM - 9:00 PM",
          open: true,
          start: 540,
          end: 1260,
        },
        {
          day: "Tuesday",
          hours: "9:00 AM - 9:00 PM",
          open: true,
          start: 540,
          end: 1260,
        },
        {
          day: "Wednesday",
          hours: "9:00 AM - 9:00 PM",
          open: true,
          start: 540,
          end: 1260,
        },
        {
          day: "Thursday",
          hours: "9:00 AM - 9:00 PM",
          open: true,
          start: 540,
          end: 1260,
        },
        {
          day: "Friday",
          hours: "9:00 AM - 9:00 PM",
          open: true,
          start: 540,
          end: 1260,
        },
        {
          day: "Saturday",
          hours: "9:00 AM - 9:00 PM",
          open: true,
          start: 540,
          end: 1260,
        },
        {
          day: "Sunday",
          hours: "9:00 AM - 9:00 PM",
          open: true,
          start: 540,
          end: 1260,
        },
      ];

      const todaySchedule = schedule.find((s) => s.day === currentDay);
      const isCurrentlyOpen =
        todaySchedule &&
        currentTime >= todaySchedule.start &&
        currentTime < todaySchedule.end;

      let timeUntilClose = "";
      if (isCurrentlyOpen && todaySchedule) {
        const minutesUntilClose = todaySchedule.end - currentTime;
        if (minutesUntilClose <= 60) {
          timeUntilClose = `Closes in ${minutesUntilClose} minutes`;
        } else {
          const hours = Math.floor(minutesUntilClose / 60);
          const minutes = minutesUntilClose % 60;
          timeUntilClose = `Closes in ${hours}h ${minutes}m`;
        }
      }

      let nextOpenDay = "";
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const currentDayIndex = days.indexOf(currentDay);

      for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (currentDayIndex + i) % 7;
        const nextDay = days[nextDayIndex];
        const nextDaySchedule = schedule.find((s) => s.day === nextDay);

        if (nextDaySchedule && nextDaySchedule.open) {
          nextOpenDay = `Opens ${nextDay} at 9:00 AM`;
          break;
        }
      }

      setCurrentStatus({
        isOpen: isCurrentlyOpen,
        today: currentDay,
        nextOpening: nextOpenDay,
        currentTime: currentTimeString,
        timeUntilClose: timeUntilClose,
      });
      setSalonSchedule(schedule);
    };

    updateSchedule();
    const interval = setInterval(updateSchedule, 30000);
    return () => clearInterval(interval);
  }, []);

  // UPDATED: Overlay functions from Home.jsx
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

  // Category scroll functions
  const scrollCategories = (direction) => {
    if (categoriesScrollRef.current) {
      const scrollAmount = 300;
      categoriesScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Sort functions
  const sortServices = (services, option) => {
    const sortedServices = [...services];

    switch (option) {
      case "name":
        return sortedServices.sort((a, b) => a.name.localeCompare(b.name));

      case "price-low-high":
        return sortedServices.sort((a, b) => {
          const priceA = extractPrice(a.priceRange);
          const priceB = extractPrice(b.priceRange);
          return priceA - priceB;
        });

      case "price-high-low":
        return sortedServices.sort((a, b) => {
          const priceA = extractPrice(a.priceRange);
          const priceB = extractPrice(b.priceRange);
          return priceB - priceA;
        });

      case "duration":
        return sortedServices.sort((a, b) => {
          const durationA = extractDuration(a.duration);
          const durationB = extractDuration(b.duration);
          return durationA - durationB;
        });

      case "popularity":
        return sortedServices.sort((a, b) => {
          const popularityA = a.totalBookings || 0;
          const popularityB = b.totalBookings || 0;
          return popularityB - popularityA;
        });

      default:
        return sortedServices;
    }
  };

  const extractPrice = (priceRange) => {
    if (!priceRange) return 0;
    const price = priceRange.replace(/[^0-9]/g, "");
    return parseInt(price) || 0;
  };

  const extractDuration = (duration) => {
    if (!duration) return 0;
    const hours = duration.match(/(\d+)\s*hr/);
    const minutes = duration.match(/(\d+)\s*min/);

    let totalMinutes = 0;
    if (hours) totalMinutes += parseInt(hours[1]) * 60;
    if (minutes) totalMinutes += parseInt(minutes[1]);

    return totalMinutes;
  };

  const openGoogleMaps = () => {
    const url =
      "https://www.google.com/maps/place/SandreaLee+Salon/@14.6041347,120.9869412,17z/data=!3m1!4b1!4m6!3m5!1s0x3397c9ff34a4466d:0xed2c3ba078d8b423!8m2!3d14.6041295!4d120.9895161!16s%2Fg%2F11bywwczw8?entry=ttu&g_ep=EgoyMDI5MDUxNS4wIKXMDSoASAFQAw%3D%3D";
    window.open(url, "_blank");
  };

  // UPDATED: Close profile menu function
  const closeProfileMenu = () => {
    setIsProfileMenuOpen(false);
  };

  // UPDATED: Close mobile menu function
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // UPDATED: Handle login/signup navigation to role selection
  const handleLoginSignup = (e) => {
    if (e) e.stopPropagation();
    closeProfileMenu();
    closeMobileMenu();
    navigate("/role-selection");
  };

  // UPDATED: Handle tab change with mobile menu support
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

  // UPDATED: Enhanced service booking to redirect to Booking.jsx with complete data
  const handleBookService = (service) => {
    console.log("📅 Booking service:", service);

    const isLoggedIn = localStorage.getItem("token");
    const serviceData = {
      id: service._id || service.id,
      name: service.name,
      duration: service.duration,
      price: service.priceRange,
      category: service.category,
      description: service.description,
      // Add rating data if available
      rating: service.rating || { average: 0, totalRaters: 0 },
      totalBookings: service.totalBookings || 0,
      isPromo: service.isPromo || false,
    };

    if (isLoggedIn) {
      // Navigate to customer booking page with service data
      navigate("/customer/booking", {
        state: {
          service: serviceData,
          // Include additional context for the booking page
          bookingContext: {
            from: "services",
            timestamp: new Date().toISOString(),
          },
        },
      });
    } else {
      navigate("/role-selection", {
        state: {
          redirectTo: "customer/booking",
          service: serviceData,
          bookingContext: {
            from: "services",
            timestamp: new Date().toISOString(),
          },
        },
      });
    }
  };

  // UPDATED: Handle book now navigation to Bookings.jsx (for main Book Now button)
  const handleBookNow = (e) => {
    if (e) e.stopPropagation();
    console.log("Book Now clicked");
    closeProfileMenu();
    closeMobileMenu();

    // Check if user is logged in, if not, redirect to role selection
    const isLoggedIn = localStorage.getItem("token");
    if (isLoggedIn) {
      // User is logged in, proceed to bookings with no specific service
      navigate("/customer/booking");
    } else {
      // User not logged in, redirect to role selection
      navigate("/role-selection", {
        state: { redirectTo: "customer/booking" },
      });
    }
  };

  // UPDATED: Profile menu actions with overlay routing
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

  // UPDATED: Handle logout
  const handleLogout = () => {
    logout();
    navigate("/role-selection");
  };

  // UPDATED: Quick links navigation functions
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

  // ENHANCED: Fetch services with better data handling
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      console.log("🔧 Fetching services...");

      const response = await servicesAPI.getAll();
      console.log("📊 API Response:", response);

      let servicesData = [];

      if (response.data && response.data.success) {
        servicesData = response.data.data || [];
      } else if (response.data) {
        servicesData = response.data || [];
      } else if (response.success) {
        servicesData = response.data || [];
      }

      console.log("✅ Services fetched:", servicesData.length);

      // Enhanced data processing with ratings
      const processedServices = servicesData.map((service) => ({
        ...service,
        // Ensure rating object exists with proper structure
        rating: service.rating || { average: 0, totalRaters: 0 },
        totalBookings: service.totalBookings || 0,
        isPromo: service.isPromo || false,
      }));

      if (processedServices.length > 0) {
        const sortedServices = sortServices(processedServices, sortOption);
        setServices(sortedServices);
        setFilteredServices(sortedServices);
      } else {
        console.warn("No services data received");
        // Enhanced sample data with ratings
        const sampleServices = [
          {
            id: 1,
            name: "TRIAL",
            duration: "1 hr",
            priceRange: "P150",
            category: "Haircuts & Basic Services",
            description: "Basic haircut trial service",
            rating: { average: 4.5, totalRaters: 23 },
            totalBookings: 156,
            isPromo: false,
          },
          {
            id: 2,
            name: "HAIRCUT",
            duration: "1 hr",
            priceRange: "P150",
            category: "Haircuts & Basic Services",
            description: "Standard haircut service",
            rating: { average: 4.3, totalRaters: 45 },
            totalBookings: 289,
            isPromo: false,
          },
        ];
        const sortedSample = sortServices(sampleServices, sortOption);
        setServices(sortedSample);
        setFilteredServices(sortedSample);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      // Enhanced error handling with sample data
      const sampleServices = [
        {
          id: 1,
          name: "TRIAL",
          duration: "1 hr",
          priceRange: "P150",
          category: "Haircuts & Basic Services",
          description: "Basic haircut trial service",
          rating: { average: 4.5, totalRaters: 23 },
          totalBookings: 156,
          isPromo: false,
        },
        {
          id: 2,
          name: "HAIRCUT",
          duration: "1 hr",
          priceRange: "P150",
          category: "Haircuts & Basic Services",
          description: "Standard haircut service",
          rating: { average: 4.3, totalRaters: 45 },
          totalBookings: 289,
          isPromo: false,
        },
      ];
      const sortedSample = sortServices(sampleServices, sortOption);
      setServices(sortedSample);
      setFilteredServices(sortedSample);
    } finally {
      setLoading(false);
    }
  }, [sortOption]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    let filtered = [...services];

    if (activeCategory !== "All Services") {
      filtered = filtered.filter(
        (service) => service.category === activeCategory
      );
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (service) =>
          service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          service.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const sortedFiltered = sortServices(filtered, sortOption);
    setFilteredServices(sortedFiltered);
  }, [services, activeCategory, searchQuery, sortOption]);

  const categories = [
    "All Services",
    "Haircuts & Basic Services",
    "Hair Coloring",
    "Perming & Texture Services",
    "Rebonding/Straightening",
    "Hair Treatments",
    "Combination Services",
    "Hair Extensions",
    "Styling & Special Services",
    "Package Sets/Codes",
  ];

  // URGENT FIX: ServiceCard with GUARANTEED clickable buttons
  const ServiceCard = ({ service, index }) => {
    // Extract rating data
    const rating = service.rating || { average: 0, totalRaters: 0 };
    const averageRating = rating.average || 0;
    const totalRaters = rating.totalRaters || 0;

    // Generate star display
    const renderStars = (rating) => {
      const stars = [];
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 >= 0.5;

      for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
          stars.push(
            <IoStar
              key={i}
              className="w-4 h-4 text-yellow-400"
              fill="currentColor"
            />
          );
        } else if (i === fullStars + 1 && hasHalfStar) {
          stars.push(
            <IoStarHalf
              key={i}
              className="w-4 h-4 text-yellow-400"
              fill="currentColor"
            />
          );
        } else {
          stars.push(
            <IoStarOutline key={i} className="w-4 h-4 text-yellow-400" />
          );
        }
      }
      return stars;
    };

    // URGENT FIX: Direct booking function
    const handleDirectBook = (e) => {
      e.preventDefault();
      e.stopPropagation();

      console.log("🟢🟢🟢 DIRECT BOOKING CLICKED:", service.name);

      const serviceData = {
        id: service._id || service.id,
        name: service.name,
        duration: service.duration,
        price: service.priceRange,
        category: service.category,
        description: service.description,
      };

      const isLoggedIn = localStorage.getItem("token");

      if (isLoggedIn) {
        navigate("/customer/booking", {
          state: {
            service: serviceData,
            bookingContext: {
              from: "services",
              timestamp: new Date().toISOString(),
            },
          },
        });
      } else {
        navigate("/role-selection", {
          state: {
            redirectTo: "customer/booking",
            service: serviceData,
            bookingContext: {
              from: "services",
              timestamp: new Date().toISOString(),
            },
          },
        });
      }
    };

    return (
      <div
        className={`service-card scroll-reveal ${
          service.isPromo ? "promo" : ""
        }`}
        style={{ animationDelay: `${index * 0.05}s` }}
        key={service._id || service.id || `service-${index}`}>
        <div className="service-header">
          <h3 className="service-title">{service.name}</h3>
          {service.isPromo && <span className="promo-badge">PROMO</span>}
        </div>

        {service.description && (
          <p className="service-description">{service.description}</p>
        )}

        {/* Rating Display */}
        <div className="service-rating">
          <div className="flex items-center space-x-1">
            {renderStars(averageRating)}
            <span className="text-sm text-gray-300 ml-1">
              {averageRating > 0 ? averageRating.toFixed(1) : "No ratings"}
              {totalRaters > 0 && ` (${totalRaters})`}
            </span>
          </div>
          {service.totalBookings > 0 && (
            <span className="text-xs text-gray-400">
              {service.totalBookings} bookings
            </span>
          )}
        </div>

        <div className="service-details">
          <div className="service-detail">
            <IoTime className="w-4 h-4" />
            <span>{service.duration}</span>
          </div>

          <div className="service-detail">
            <IoCash className="w-4 h-4" />
            <span className="service-price">{service.priceRange}</span>
          </div>
        </div>

        {/* URGENT FIX: GUARANTEED CLICKABLE BOOK NOW BUTTON */}
        <div className="service-footer">
          <span className="service-category">{service.category}</span>
          <button
            onClick={handleDirectBook}
            className="book-button test-clickable"
            style={{
              cursor: "pointer",
              position: "relative",
              zIndex: 1000,
              pointerEvents: "auto",
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}>
            📅 BOOK NOW
          </button>
        </div>
      </div>
    );
  };

  const CategoryItem = ({ category, index }) => {
    const isActive = activeCategory === category;
    const hasImage = categoryImages[category];

    return (
      <button
        onClick={() => setActiveCategory(category)}
        className={`category-item scroll-reveal ${isActive ? "active" : ""}`}
        style={{ animationDelay: `${index * 0.03}s` }}
        key={category}>
        {hasImage && (
          <img
            src={categoryImages[category]}
            alt={category}
            className="category-image"
            loading="lazy"
          />
        )}
        <span className="category-name">{category}</span>
      </button>
    );
  };

  const StatusBadge = ({ isOpen, timeUntilClose }) => {
    return (
      <div className={`status-badge ${isOpen ? "open" : "closed"}`}>
        <div className="status-dot"></div>
        <span className="status-text">
          {isOpen ? `Open • ${timeUntilClose}` : "Closed"}
        </span>
      </div>
    );
  };

  return (
    <div className="relative overflow-x-hidden min-h-screen bg-[#0a0e27]">
      {/* UNIFIED BACKGROUND WITH GLOWING CIRCLES */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[700px] h-[700px] md:w-[1000px] md:h-[1000px] lg:w-[1200px] lg:h-[1200px] rounded-full blur-3xl opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(99, 102, 241, 0.25) 40%, transparent 70%)",
            animation: "circularMotion1 35s ease-in-out infinite",
            top: "5%",
            left: "0%",
          }}
        />
        <div
          className="absolute w-[750px] h-[750px] md:w-[1050px] md:h-[1050px] lg:w-[1250px] lg:h-[1250px] rounded-full blur-3xl opacity-18"
          style={{
            background:
              "radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, rgba(14, 165, 233, 0.2) 40%, transparent 70%)",
            animation: "circularMotion2 40s ease-in-out infinite",
            top: "30%",
            right: "0%",
          }}
        />
        <div
          className="absolute w-[700px] h-[700px] md:w-[1000px] md:h-[1000px] lg:w-[1200px] lg:h-[1200px] rounded-full blur-3xl opacity-16"
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
        {/* Header / Navigation - UPDATED WITH HAMBURGER MENU */}
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
                  className="h-10 sm:h-12 w-auto object-contain"
                />
                <span className="relative top-1.5 -left-3 text-xl sm:text-3xl font-semi-bold text-white font-['Tenali_Ramakrishna'] tracking-wide leading-none">
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

              {/* UPDATED: Hamburger Menu Button - RIGHT SIDE */}
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

        {/* UPDATED: Mobile Menu Overlay - RIGHT SIDE with Scroll */}
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

        {/* UPDATED: Menu Overlays from Home.jsx */}
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

        {/* Services Hero Section */}
        <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
          <div className="container mx-auto relative z-10">
            <div className="max-w-4xl mx-auto text-center scroll-reveal">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
                Our{" "}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Services
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Discover our comprehensive range of professional salon services
                designed to bring out your best look.
              </p>

              <div className="max-w-2xl mx-auto mb-8">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400/50 transition-all duration-300 search-input"
                  />
                  <svg
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Content Section */}
        <section
          ref={serviceSectionRef}
          className="relative py-16 px-4 sm:px-6">
          <div className="container mx-auto relative z-10">
            {/* Sort Controls */}
            <div className="sort-controls scroll-reveal">
              <span className="sort-label">Sort by:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="sort-select">
                <option value="name" className="sort-option">
                  Name (A-Z)
                </option>
                <option value="price-low-high" className="sort-option">
                  Price (Low to High)
                </option>
                <option value="price-high-low" className="sort-option">
                  Price (High to Low)
                </option>
                <option value="duration" className="sort-option">
                  Duration
                </option>
                <option value="popularity" className="sort-option">
                  Popularity
                </option>
              </select>
            </div>

            {/* Horizontal Scrolling Category Filter */}
            <div className="services-container mb-12 scroll-reveal">
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-6 text-center">
                  Browse Categories
                </h3>

                <div className="relative">
                  <button
                    onClick={() => scrollCategories("left")}
                    className="scroll-button left"
                    aria-label="Scroll left">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  <div
                    ref={categoriesScrollRef}
                    className="category-scroll-container">
                    {categories.map((category, index) => (
                      <CategoryItem
                        key={category}
                        category={category}
                        index={index}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => scrollCategories("right")}
                    className="scroll-button right"
                    aria-label="Scroll right">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Services Grid */}
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
              </div>
            ) : filteredServices.length > 0 ? (
              <div className="services-grid">
                {filteredServices.map((service, index) => (
                  <ServiceCard
                    key={service._id || service.id || `service-${index}`}
                    service={service}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state scroll-reveal">
                <h3>No services found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            )}

            {/* Map and Schedule Section */}
            <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto map-schedule-container">
              <div ref={mapSectionRef} className="scroll-reveal">
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/10 h-full">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Sandrealee Salon
                      </h2>
                      <StatusBadge
                        isOpen={currentStatus.isOpen}
                        timeUntilClose={currentStatus.timeUntilClose}
                      />
                    </div>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <IoStar
                          key={i}
                          className="w-5 h-5 text-yellow-400"
                          fill="currentColor"
                        />
                      ))}
                      <span className="text-gray-300 text-sm ml-1">3.8</span>
                    </div>
                  </div>

                  <div
                    className="relative rounded-2xl overflow-hidden cursor-pointer bg-gray-800 h-64 w-full mb-6"
                    onClick={openGoogleMaps}>
                    <img
                      src={mapImage}
                      alt="Sandrea Lee Salon Location Map"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                      <div className="text-center p-4">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                          <IoLocation className="w-6 h-6 text-blue-600" />
                        </div>
                        <p className="text-white font-medium">Get Direction</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          currentStatus.isOpen
                            ? "bg-green-500 animate-pulse"
                            : "bg-red-500"
                        }`}></div>
                      <div>
                        <p className="text-white font-semibold">
                          {currentStatus.isOpen ? "Open now" : "Closed"}
                        </p>
                        <p className="text-gray-300 text-sm">
                          {currentStatus.isOpen
                            ? currentStatus.timeUntilClose ||
                              "Closes at 9:00 PM"
                            : currentStatus.nextOpening}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          Current time: {currentStatus.currentTime}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 bg-white/5 rounded-xl">
                      <IoLocation className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-white font-semibold">
                          Sandrealee Salon
                        </p>
                        <p className="text-gray-300 text-sm">
                          2184 Loyola St. Sampaloc. Manila, 1008 Metro Manila
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* UPDATED: Book Now button redirects to Booking.jsx */}
                  <button
                    onClick={handleBookNow}
                    className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg backdrop-blur-sm">
                    Book Now
                  </button>
                </div>
              </div>

              <div className="scroll-reveal">
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/10 h-full">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      Opening Times
                    </h2>
                    <div className="text-sm text-gray-400">
                      Local time: {currentStatus.currentTime}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {salonSchedule.map((schedule) => {
                      const isToday = schedule.day === currentStatus.today;
                      const isOpenNow = isToday && currentStatus.isOpen;

                      return (
                        <div
                          key={schedule.day}
                          className={`flex justify-between items-center p-4 rounded-xl transition-all duration-200 backdrop-blur-sm schedule-day ${
                            isToday
                              ? "bg-cyan-500/20 border border-cyan-400/30"
                              : "bg-white/5"
                          }`}>
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  isToday
                                    ? isOpenNow
                                      ? "bg-green-500 animate-pulse"
                                      : "bg-red-500"
                                    : "bg-gray-400"
                                }`}></div>
                              {isToday && (
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
                              )}
                            </div>
                            <span
                              className={`font-medium ${
                                isToday ? "text-cyan-400" : "text-gray-300"
                              }`}>
                              {schedule.day}
                              {isToday && (
                                <span className="text-cyan-300 text-xs ml-2 today-indicator">
                                  • TODAY
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="text-right">
                            <span
                              className={`font-semibold ${
                                isToday ? "text-cyan-400" : "text-white"
                              }`}>
                              {schedule.hours}
                            </span>
                            {isToday && isOpenNow && (
                              <p className="text-green-400 text-xs mt-1">
                                Open now
                              </p>
                            )}
                            {isToday && !isOpenNow && (
                              <p className="text-red-400 text-xs mt-1">
                                Closed now
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">
                        Current Status:
                      </span>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            currentStatus.isOpen
                              ? "bg-green-500 animate-pulse"
                              : "bg-red-500"
                          }`}></div>
                        <span
                          className={`font-semibold text-sm ${
                            currentStatus.isOpen
                              ? "text-green-400"
                              : "text-red-400"
                          }`}>
                          {currentStatus.isOpen ? "OPEN" : "CLOSED"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ADDITIONAL Book Now button in schedule section */}
                  <button
                    onClick={handleBookNow}
                    className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg backdrop-blur-sm">
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER SECTION - UPDATED WITH FUNCTIONAL QUICK LINKS */}
        <footer
          ref={footerRef}
          className="relative overflow-hidden bg-transparent pt-20">
          <div className="bg-[#0A142F] rounded-t-[120px] sm:rounded-t-[160px] md:rounded-t-[200px] lg:rounded-t-[240px]">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-10">
                <div className="scroll-reveal">
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

                {/* UPDATED: Quick Links with Functional Navigation */}
                <div className="scroll-reveal">
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

                <div className="scroll-reveal">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-4 pb-2">
                    Contact Us
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <IoLocation className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                      <p className="text-gray-300 text-xs leading-relaxed">
                        2184 Loyola St, Sampaloc,
                        <br />
                        Manila, 1008 Metro Manila
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <IoCall className="w-5 h-5 text-white flex-shrink-0" />
                      <a
                        href="tel:09998081357"
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-sm">
                        0999 808 1357
                      </a>
                    </div>

                    <div className="flex items-center space-x-2">
                      <IoLogoWhatsapp className="w-5 h-5 text-white flex-shrink-0" />
                      <a
                        href="https://wa.me/639175350244"
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-sm">
                        +63 917 535 0244
                      </a>
                    </div>

                    <div className="flex items-center space-x-2">
                      <IoTimeOutline className="w-5 h-5 text-white flex-shrink-0" />
                      <p className="text-gray-300 text-sm">
                        Mon-Sun | 9:00 AM - 9:00 PM
                      </p>
                    </div>
                  </div>
                </div>

                <div className="scroll-reveal">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2 pb-2">
                    Join our Newsletter
                  </h3>
                  <p className="text-gray-300 text-xs mb-4">
                    Subscribe for special offers,
                    <br />
                    beauty tips, and updates!
                  </p>

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

              <div className="flex flex-col items-center justify-center py-6 border-t border-gray-700/50">
                <h4 className="text-white text-base font-medium mb-4">
                  Social Media
                </h4>
                <div className="flex items-center space-x-4">
                  <a
                    href="#"
                    className="w-11 h-11 rounded-full border-2 border-gray-500 hover:border-white flex items-center justify-center transition-all duration-300 hover:scale-110"
                    aria-label="Facebook">
                    <IoLogoFacebook className="w-5 h-5 text-gray-300 hover:text-white" />
                  </a>

                  <a
                    href="#"
                    className="w-11 h-11 rounded-full border-2 border-gray-500 hover:border-white flex items-center justify-center transition-all duration-300 hover:scale-110"
                    aria-label="Instagram">
                    <IoLogoInstagram className="w-5 h-5 text-gray-300 hover:text-white" />
                  </a>

                  <a
                    href="#"
                    className="w-11 h-11 rounded-full border-2 border-gray-500 hover:border-white flex items-center justify-center transition-all duration-300 hover:scale-110"
                    aria-label="Twitter">
                    <IoLogoTwitter className="w-5 h-5 text-gray-300 hover:text-white" />
                  </a>
                </div>
              </div>

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
    </div>
  );
};

export default ServicesPage;
