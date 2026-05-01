// pages/Services.jsx - COMPLETELY UPDATED AND ENHANCED
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import salonLogo from "../assets/SandreaLeeSalonLogoCapstone.png";
import "../styles/services.css";
import "../styles/landingAnimations.css";
import { servicesAPI, serviceUtils } from "../services/api";

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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Services states
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All Services");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("name");
  const [selectedService, setSelectedService] = useState(null);

  // Refs for horizontal scrolling
  const categoriesScrollRef = useRef(null);
  const serviceSectionRef = useRef(null);
  const mapSectionRef = useRef(null);
  const footerRef = useRef(null);
  const observerRef = useRef(null);

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

  // REAL-TIME Salon schedule data
  const [salonSchedule, setSalonSchedule] = useState([]);
  const [currentStatus, setCurrentStatus] = useState({
    isOpen: false,
    today: "",
    nextOpening: "",
    currentTime: "",
    timeUntilClose: "",
    currentDate: "",
  });

  // ============================================================================
  // ENHANCED: Star Rating Component
  // ============================================================================
  const StarRating = ({
    rating,
    totalRaters,
    showCount = true,
    size = "sm",
  }) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    const sizeClasses = {
      sm: "w-3 h-3",
      md: "w-4 h-4",
      lg: "w-5 h-5",
    };

    return (
      <div className="flex items-center space-x-1">
        <div className="flex items-center space-x-0.5">
          {/* Full Stars */}
          {[...Array(fullStars)].map((_, i) => (
            <svg
              key={`full-${i}`}
              className={`${sizeClasses[size]} text-yellow-400 fill-current`}
              viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}

          {/* Half Star */}
          {hasHalfStar && (
            <svg
              className={`${sizeClasses[size]} text-yellow-400 fill-current`}
              viewBox="0 0 20 20">
              <defs>
                <linearGradient id="half-star">
                  <stop offset="50%" stopColor="currentColor" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
              <path
                fill="url(#half-star)"
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </svg>
          )}

          {/* Empty Stars */}
          {[...Array(emptyStars)].map((_, i) => (
            <svg
              key={`empty-${i}`}
              className={`${sizeClasses[size]} text-gray-300 fill-current`}
              viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>

        {/* Rating Text */}
        <div className="flex items-center space-x-1">
          <span
            className={`text-white font-medium ${
              size === "sm"
                ? "text-xs"
                : size === "md"
                ? "text-sm"
                : "text-base"
            }`}>
            {rating?.toFixed(1) || "0.0"}
          </span>
          {showCount && totalRaters && (
            <span
              className={`text-gray-400 ${
                size === "sm"
                  ? "text-xs"
                  : size === "md"
                  ? "text-sm"
                  : "text-base"
              }`}>
              ({totalRaters})
            </span>
          )}
        </div>
      </div>
    );
  };

  // ============================================================================
  // ENHANCED: Service Popularity Badge
  // ============================================================================
  const PopularityBadge = ({ totalBookings }) => {
    if (!totalBookings || totalBookings < 10) return null;

    const getPopularityLevel = (bookings) => {
      if (bookings >= 100) return { text: "Very Popular", color: "bg-red-500" };
      if (bookings >= 50) return { text: "Popular", color: "bg-orange-500" };
      if (bookings >= 25) return { text: "Trending", color: "bg-blue-500" };
      return { text: "New", color: "bg-green-500" };
    };

    const { text, color } = getPopularityLevel(totalBookings);

    return (
      <span
        className={`${color} text-white text-xs font-bold px-2 py-1 rounded-full ml-2`}>
        {text}
      </span>
    );
  };

  // ============================================================================
  // NEW: Quick Book Modal
  // ============================================================================
  const QuickBookModal = ({ service, onClose, onBookNow }) => {
    if (!service) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 max-w-md w-full border border-white/10 shadow-2xl transform transition-all duration-300 scale-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Book Service</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
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

          <div className="space-y-4">
            <div className="bg-white/5 rounded-2xl p-4">
              <h4 className="text-lg font-semibold text-white mb-2">
                {service.name}
              </h4>
              <div className="flex justify-between text-sm text-gray-300">
                <span>{service.duration}</span>
                <span className="text-cyan-400 font-semibold">
                  {service.priceRange}
                </span>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4">
              <h5 className="text-sm font-medium text-gray-300 mb-2">
                Service Details
              </h5>
              <p className="text-white text-sm">
                {service.description || "Professional salon service"}
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 transition-all duration-200 font-medium">
              Cancel
            </button>
            <button
              onClick={() => onBookNow(service)}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg">
              Continue to Book
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // SIMPLIFIED: Intersection Observer - More Reliable
  // ============================================================================
  useEffect(() => {
    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("scroll-reveal-visible");
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

  // ============================================================================
  // ELEMENT OBSERVATION SETUP
  // ============================================================================
  useEffect(() => {
    if (!observerRef.current) return;

    const setupObservation = () => {
      const elementsToAnimate = document.querySelectorAll(".scroll-reveal");
      if (elementsToAnimate.length === 0) return;

      elementsToAnimate.forEach((element, index) => {
        if (element.classList.contains("scroll-reveal-visible")) return;

        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const isInViewport =
          rect.top < windowHeight + 300 && rect.bottom > -300;

        if (isInViewport || index < 15) {
          element.classList.add("scroll-reveal-visible");
        } else {
          observerRef.current.observe(element);
        }
      });
    };

    setupObservation();
    const timeoutId1 = setTimeout(setupObservation, 100);
    const timeoutId2 = setTimeout(setupObservation, 500);

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
    };
  }, [filteredServices, activeCategory, searchQuery, loading]);

  // ENHANCED: Real-time schedule with better time tracking and date
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

      // ENHANCED: Get current date
      const currentDateString = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
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
        currentDate: currentDateString, // ADDED: Current date
      });
      setSalonSchedule(schedule);
    };

    updateSchedule();
    const interval = setInterval(updateSchedule, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

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

  // ENHANCED: Sort functions with better rating support
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

      case "rating":
        return sortedServices.sort((a, b) => {
          const ratingA = a.rating?.average || 0;
          const ratingB = b.rating?.average || 0;
          return ratingB - ratingA;
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
      "https://www.google.com/maps/place/SandreaLee+Salon/@14.6041347,120.9869412,17z/data=!3m1!4b1!4m6!3m5!1s0x3397c9ff34a4466d:0xed2c3ba078d8b423!8m2!3d14.6041295!4d120.9895161!16s%2Fg%2F11bywwczw8?entry=ttu&g_ep=EgoyMDI1MDUxNS4wIKXMDSoASAFQAw%3D%3D";
    window.open(url, "_blank");
  };

  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMobileMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setScrolled(scrollTop > 50);
      setLastScrollY(scrollTop);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // ENHANCED: Fetch services with better error handling and rating support
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      console.log("🔧 Fetching services...");

      const response = await servicesAPI.getAll();

      let servicesData = [];

      if (response.data && response.data.success) {
        servicesData = response.data.data || [];
      } else if (response.data) {
        servicesData = response.data || [];
      } else if (response.success) {
        servicesData = response.data || [];
      }

      console.log("✅ Services fetched:", servicesData.length);

      // ENHANCED: Ensure services have proper rating structure
      const servicesWithRatings = servicesData.map((service) => ({
        ...service,
        rating: service.rating || { average: 0, totalRaters: 0 },
        totalBookings: service.totalBookings || 0,
      }));

      if (servicesWithRatings.length > 0) {
        const sortedServices = sortServices(servicesWithRatings, sortOption);
        setServices(sortedServices);
        setFilteredServices(sortedServices);
      } else {
        console.warn("No services data received");
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

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLoginSignup = (e) => {
    if (e) e.stopPropagation();
    closeMobileMenu();
    navigate("/role-selection");
  };

  const handleCustomerLogin = (e) => {
    if (e) e.stopPropagation();
    closeMobileMenu();
    navigate("/role-selection", { state: { preSelectedRole: "customer" } });
  };

  const handleStaffLogin = (e) => {
    if (e) e.stopPropagation();
    closeMobileMenu();
    navigate("/role-selection", { state: { preSelectedRole: "salon_staff" } });
  };

  const handleDownloadApp = (type, e) => {
    if (e) e.stopPropagation();
    console.log(`Download ${type} app clicked`);
    closeMobileMenu();
    alert(`Download ${type} app - Add your download logic here`);
  };

  const handleHelpSupport = (type, e) => {
    if (e) e.stopPropagation();
    console.log(`Help and Support for ${type} clicked`);
    closeMobileMenu();
    alert(`Help and Support for ${type} - Add your help logic here`);
  };

  // ============================================================================
  // ENHANCED: Book Now Function - Redirect to RoleSelection
  // ============================================================================
  const handleBookNow = (e) => {
    if (e) e.stopPropagation();
    console.log("Book Now clicked - Redirecting to Role Selection");
    closeMobileMenu();

    // Redirect to RoleSelection page
    navigate("/role-selection", {
      state: {
        redirectTo: "booking",
        message: "Please select your role to continue with booking",
        bookingType: "general",
      },
    });
  };

  const handleBookService = (service) => {
    console.log("Booking service:", service.name);
    setSelectedService(null); // Close modal

    // Redirect to RoleSelection with service details
    navigate("/role-selection", {
      state: {
        redirectTo: "booking",
        service: {
          id: service._id || service.id,
          name: service.name,
          duration: service.duration,
          price: service.priceRange,
          category: service.category,
          description: service.description,
          rating: service.rating,
        },
        message: `Please select your role to book: ${service.name}`,
        bookingType: "specific_service",
      },
    });
  };

  // ============================================================================
  // ENHANCED: Service Card Component with Better Layout
  // ============================================================================
  const ServiceCard = ({ service, index }) => {
    return (
      <div
        className={`service-card scroll-reveal ${
          service.isPromo ? "promo" : ""
        }`}
        style={{ animationDelay: `${index * 0.05}s` }}
        key={service._id || service.id || `service-${index}`}>
        {/* Service Header with Rating */}
        <div className="service-header">
          <div className="flex items-start justify-between w-full">
            <div className="flex-1">
              <h3 className="service-title">{service.name}</h3>
              <div className="flex items-center mt-1 space-x-2">
                <StarRating
                  rating={service.rating?.average || 0}
                  totalRaters={service.rating?.totalRaters || 0}
                  size="sm"
                />
                <PopularityBadge totalBookings={service.totalBookings} />
              </div>
            </div>
            {service.isPromo && <span className="promo-badge">PROMO</span>}
          </div>
        </div>

        {service.description && (
          <p className="service-description">{service.description}</p>
        )}

        <div className="service-details">
          <div className="service-detail">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{service.duration}</span>
          </div>

          <div className="service-detail">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
            <span className="service-price">{service.priceRange}</span>
          </div>
        </div>

        <div className="service-footer">
          <span className="service-category">{service.category}</span>
          <button
            onClick={() => setSelectedService(service)}
            className="book-button">
            Book Now
          </button>
        </div>
      </div>
    );
  };

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

  const CategoryItem = ({ category, index }) => {
    const isActive = activeCategory === category;
    const hasImage = categoryImages[category];

    return (
      <button
        onClick={() => setActiveCategory(category)}
        className={`category-item scroll-reveal group ${
          isActive ? "active" : ""
        }`}
        style={{ animationDelay: `${index * 0.03}s` }}
        key={category}>
        {hasImage && (
          <div className="relative">
            <img
              src={categoryImages[category]}
              alt={category}
              className="category-image transform group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
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
      {/* Background Circles */}
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
                  className="h-10 sm:h-12 w-auto object-contain"
                />
                <span className="relative top-1.5 -left-3 text-xl sm:text-3xl font-semi-bold text-white font-['Tenali_Ramakrishna'] tracking-wide leading-none">
                  SALON
                </span>
              </div>

              {/* NAVBAR COMPONENT */}
              <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2">
                <Navbar />
              </div>

              {/* Menu Button */}
              <button
                ref={menuButtonRef}
                onClick={toggleMobileMenu}
                className="relative px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 overflow-hidden flex items-center space-x-2 z-50 flex-shrink-0"
                style={{
                  background: "linear-gradient(to bottom, #76C4FF, #3352E8)",
                  color: "#000",
                }}>
                <span className="relative z-10">Menu</span>
                <div className="relative w-4 h-4 flex items-center justify-center">
                  <span className="relative flex flex-col items-center justify-center w-full h-full">
                    <span
                      className={`absolute h-0.5 w-4 bg-black transition-all duration-300 ${
                        isMobileMenuOpen
                          ? "rotate-45 translate-y-0"
                          : "-translate-y-1.5"
                      }`}
                    />
                    <span
                      className={`absolute h-0.5 w-4 bg-black transition-all duration-300 ${
                        isMobileMenuOpen ? "opacity-0" : "opacity-100"
                      }`}
                    />
                    <span
                      className={`absolute h-0.5 w-4 bg-black transition-all duration-300 ${
                        isMobileMenuOpen
                          ? "-rotate-45 translate-y-0"
                          : "translate-y-1.5"
                      }`}
                    />
                  </span>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Menu */}
        <div
          ref={menuRef}
          className={`fixed z-[60] rounded-2xl sm:rounded-3xl shadow-2xl transform transition-all duration-500 ease-out
            top-20 sm:top-24 
            left-4 right-4 sm:left-auto sm:right-4 md:right-6 
            sm:w-80 md:w-96 
            bg-gradient-to-br from-gray-900/95 via-gray-900/95 to-black/95 border border-white/10 backdrop-blur-xl
            ${
              isMobileMenuOpen
                ? "translate-x-0 opacity-100 scale-100 pointer-events-auto"
                : "sm:translate-x-[120%] translate-y-[-120%] sm:translate-y-0 opacity-0 scale-95 pointer-events-none"
            }`}>
          <div className="p-5 sm:p-6 md:p-8">
            {/* For Customers Section */}
            <div className="mb-5 sm:mb-6">
              <h3 className="text-white text-lg sm:text-xl font-bold mb-3 sm:mb-4">
                For Customers
              </h3>
              <div className="space-y-2 sm:space-y-2.5">
                <button
                  onClick={handleCustomerLogin}
                  className="block text-blue-400 hover:text-blue-300 transition-colors font-medium text-sm sm:text-base rounded-lg px-3 py-2 hover:bg-white/5 cursor-pointer text-left w-full hover:scale-105 transform transition-transform duration-200">
                  Log in or Sign up
                </button>

                <button
                  onClick={(e) => handleDownloadApp("customer", e)}
                  className="block text-white hover:text-gray-300 transition-colors text-sm sm:text-base rounded-lg px-3 py-2 hover:bg-white/5 cursor-pointer text-left w-full hover:scale-105 transform transition-transform duration-200">
                  Download the app
                </button>

                <button
                  onClick={(e) => handleHelpSupport("customers", e)}
                  className="block text-white hover:text-gray-300 transition-colors text-sm sm:text-base rounded-lg px-3 py-2 hover:bg-white/5 cursor-pointer text-left w-full hover:scale-105 transform transition-transform duration-200">
                  Help and Support
                </button>
              </div>
            </div>

            <div className="border-t border-gray-700 my-4 sm:my-5"></div>

            {/* For Salon Staff Section */}
            <div className="mb-5 sm:mb-6">
              <h3 className="text-white text-lg sm:text-xl font-bold mb-3 sm:mb-4">
                For Salon Staff
              </h3>
              <div className="space-y-2 sm:space-y-2.5">
                <button
                  onClick={handleStaffLogin}
                  className="block text-blue-400 hover:text-blue-300 transition-colors font-medium text-sm sm:text-base rounded-lg px-3 py-2 hover:bg-white/5 cursor-pointer text-left w-full hover:scale-105 transform transition-transform duration-200">
                  Log in or Sign up
                </button>

                <button
                  onClick={(e) => handleDownloadApp("staff", e)}
                  className="block text-white hover:text-gray-300 transition-colors text-sm sm:text-base rounded-lg px-3 py-2 hover:bg-white/5 cursor-pointer text-left w-full hover:scale-105 transform transition-transform duration-200">
                  Download the app
                </button>

                <button
                  onClick={(e) => handleHelpSupport("staff", e)}
                  className="block text-white hover:text-gray-300 transition-colors text-sm sm:text-base rounded-lg px-3 py-2 hover:bg-white/5 cursor-pointer text-left w-full hover:scale-105 transform transition-transform duration-200">
                  Help and Support
                </button>
              </div>
            </div>

            <div className="flex justify-center pt-2 sm:pt-3">
              <button
                onClick={handleBookNow}
                className="w-full px-8 py-3 rounded-full font-semibold text-sm transition-all border-2 border-white/50 hover:border-white hover:bg-white/10 hover:scale-105 cursor-pointer transform transition-transform duration-300"
                style={{ background: "transparent", color: "#fff" }}>
                Book Now
              </button>
            </div>
          </div>
        </div>

        {/* Quick Book Modal */}
        <QuickBookModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onBookNow={handleBookService}
        />

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

              {/* ENHANCED: Search with better styling */}
              <div className="max-w-2xl mx-auto mb-8">
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Search services, categories, or descriptions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400/50 transition-all duration-300 group-hover:border-white/30"
                  />
                  <svg
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors"
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

              {/* NEW: Quick Stats */}
              <div className="flex flex-wrap justify-center gap-6 text-center">
                <div className="quick-stats-card bg-white/5 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
                  <div className="text-2xl font-bold text-cyan-400">
                    {services.length}+
                  </div>
                  <div className="text-sm text-gray-300">Services</div>
                </div>
                <div className="quick-stats-card bg-white/5 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
                  <div className="text-2xl font-bold text-cyan-400">
                    {categories.length}
                  </div>
                  <div className="text-sm text-gray-300">Categories</div>
                </div>
                <div className="quick-stats-card bg-white/5 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
                  <div className="text-2xl font-bold text-cyan-400">24/7</div>
                  <div className="text-sm text-gray-300">Booking</div>
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
            {/* ENHANCED: Sort Controls with better layout */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
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
                  <option value="rating" className="sort-option">
                    Highest Rating
                  </option>
                </select>
              </div>

              {/* NEW: Results Counter */}
              <div className="text-sm text-gray-400 scroll-reveal">
                Showing {filteredServices.length} of {services.length} services
                {searchQuery && ` for "${searchQuery}"`}
                {activeCategory !== "All Services" && ` in ${activeCategory}`}
              </div>
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
                <p className="text-gray-400 mt-4">Loading services...</p>
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
                <div className="text-center">
                  <svg
                    className="w-16 h-16 text-gray-500 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No services found
                  </h3>
                  <p className="text-gray-400">
                    Try adjusting your search or filter criteria
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setActiveCategory("All Services");
                    }}
                    className="mt-4 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors">
                    Clear Filters
                  </button>
                </div>
              </div>
            )}

            {/* Map and Schedule Section */}
            <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <div ref={mapSectionRef} className="scroll-reveal">
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/10 h-full">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Sandrealee Salon
                      </h2>
                      {/* ENHANCED: Real-time status with current date */}
                      <div className="mt-2 space-y-1">
                        <StatusBadge
                          isOpen={currentStatus.isOpen}
                          timeUntilClose={currentStatus.timeUntilClose}
                        />
                        <p className="text-gray-300 text-sm">
                          {currentStatus.currentDate}
                        </p>
                        <p className="text-gray-400 text-xs">
                          Current time: {currentStatus.currentTime}
                        </p>
                      </div>
                    </div>
                    {/* ENHANCED: Using StarRating component */}
                    <StarRating
                      rating={4.2}
                      totalRaters={125}
                      showCount={true}
                      size="md"
                    />
                  </div>

                  <div
                    className="relative rounded-2xl overflow-hidden cursor-pointer bg-gray-800 h-64 w-full mb-6 group"
                    onClick={openGoogleMaps}>
                    <img
                      src={mapImage}
                      alt="Sandrea Lee Salon Location Map"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <div className="text-center p-4">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg group-hover:scale-110 transition-transform">
                          <svg
                            className="w-6 h-6 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-white font-medium">Get Directions</p>
                        <p className="text-white/70 text-sm">
                          Click to open in Google Maps
                        </p>
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
                      <svg
                        className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
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
                          className={`flex justify-between items-center p-4 rounded-xl transition-all duration-200 backdrop-blur-sm ${
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
                                <span className="today-indicator">• TODAY</span>
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
                    {/* ENHANCED: Show next opening info */}
                    {!currentStatus.isOpen && currentStatus.nextOpening && (
                      <p className="text-gray-300 text-xs mt-2">
                        {currentStatus.nextOpening}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER SECTION */}
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
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                      </svg>
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
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 24 24">
                        <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                      </svg>
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

                <div className="scroll-reveal">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-4 pb-2">
                    Quick links
                  </h3>
                  <ul className="space-y-2.5">
                    <li>
                      <button
                        onClick={() => navigate("/")}
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-sm">
                        Home
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigate("/services")}
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-sm">
                        Services
                      </button>
                    </li>
                    <li>
                      <a
                        href="#products"
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-sm">
                        Products
                      </a>
                    </li>
                    <li>
                      <a
                        href="#about"
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-sm">
                        About Us
                      </a>
                    </li>
                    <li>
                      <a
                        href="#contact"
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-sm">
                        Contact Us
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="scroll-reveal">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-4 pb-2">
                    Contact Us
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <svg
                        className="w-5 h-5 text-white flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <p className="text-gray-300 text-xs leading-relaxed">
                        2184 Loyola St, Sampaloc,
                        <br />
                        Manila, 1008 Metro Manila
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-5 h-5 text-white flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <a
                        href="tel:09998081357"
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-sm">
                        0999 808 1357
                      </a>
                    </div>

                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-5 h-5 text-white flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                      <a
                        href="https://wa.me/639175350244"
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-sm">
                        +63 917 535 0244
                      </a>
                    </div>

                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-5 h-5 text-white flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 01118 0z"
                        />
                      </svg>
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

                  <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full overflow-hidden shadow-lg border border-white/20">
                    <input
                      type="email"
                      placeholder="Get updates"
                      className="flex-1 px-4 py-2.5 text-white text-sm outline-none bg-transparent placeholder-gray-400"
                    />
                    <button className="bg-cyan-500 hover:bg-cyan-600 text-white p-2.5 transition-colors duration-300">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center py-6 border-t border-white/20">
                <h4 className="text-white text-base font-medium mb-4">
                  Social Media
                </h4>
                <div className="flex items-center space-x-4">
                  <a
                    href="#"
                    className="w-11 h-11 rounded-full border-2 border-gray-500 hover:border-white flex items-center justify-center transition-all duration-300 hover:scale-110 backdrop-blur-sm"
                    aria-label="Facebook">
                    <svg
                      className="w-5 h-5 text-gray-300 hover:text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>

                  <a
                    href="#"
                    className="w-11 h-11 rounded-full border-2 border-gray-500 hover:border-white flex items-center justify-center transition-all duration-300 hover:scale-110 backdrop-blur-sm"
                    aria-label="Instagram">
                    <svg
                      className="w-5 h-5 text-gray-300 hover:text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z" />
                    </svg>
                  </a>

                  <a
                    href="#"
                    className="w-11 h-11 rounded-full border-2 border-gray-500 hover:border-white flex items-center justify-center transition-all duration-300 hover:scale-110 backdrop-blur-sm"
                    aria-label="Twitter">
                    <svg
                      className="w-5 h-5 text-gray-300 hover:text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  </a>
                </div>
              </div>

              <div className="border-t border-white/20 pt-5 mt-2">
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
