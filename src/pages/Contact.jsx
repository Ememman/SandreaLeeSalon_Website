// pages/Contact.jsx - FIXED VERSION with Visible Footer
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import salonLogo from "../assets/SandreaLeeSalonLogoCapstone.png";
import mapImage from "../assets/map.png";
import "../styles/Contact.css";

const Contact = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState({ type: "", message: "" });
  const [activeField, setActiveField] = useState("");
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);
  const formRef = useRef(null);

  // Memoized toggle function
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMobileMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target)
      ) {
        closeMobileMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen, closeMobileMenu]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && isMobileMenuOpen) {
        closeMobileMenu();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileMenuOpen, closeMobileMenu]);

  // Detect scroll to change header color
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setScrolled(scrollTop > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Navigation handlers
  const handleNavigation = useCallback(
    (path, options = {}) => {
      closeMobileMenu();
      navigate(path, options);
    },
    [navigate, closeMobileMenu]
  );

  const handleLoginSignup = () => handleNavigation("/role-selection");
  const handleCustomerLogin = () =>
    handleNavigation("/role-selection", {
      state: { preSelectedRole: "customer" },
    });
  const handleStaffLogin = () =>
    handleNavigation("/role-selection", {
      state: { preSelectedRole: "salon_staff" },
    });

  const handleDownloadApp = useCallback(
    (type) => {
      console.log(`Download ${type} app clicked`);
      closeMobileMenu();

      const downloadLinks = {
        customer: {
          ios: "https://apps.apple.com/your-app",
          android: "https://play.google.com/store/apps/details?id=your.app",
        },
        staff: {
          ios: "https://apps.apple.com/your-staff-app",
          android:
            "https://play.google.com/store/apps/details?id=your.staff.app",
        },
      };

      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
      const link = isIOS
        ? downloadLinks[type].ios
        : downloadLinks[type].android;

      window.open(link, "_blank", "noopener,noreferrer");
    },
    [closeMobileMenu]
  );

  const handleHelpSupport = useCallback(
    (type) => {
      console.log(`Help and Support for ${type} clicked`);
      closeMobileMenu();
      navigate("/support", { state: { userType: type } });
    },
    [navigate, closeMobileMenu]
  );

  const handleBookNow = useCallback(() => {
    console.log("Book Now clicked");
    closeMobileMenu();
    const isLoggedIn = localStorage.getItem("token");
    if (isLoggedIn) {
      navigate("/booking");
    } else {
      navigate("/role-selection", { state: { redirectTo: "booking" } });
    }
  }, [navigate, closeMobileMenu]);

  // Form state and handlers
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });

  const handleInputFocus = (fieldName) => {
    setActiveField(fieldName);
  };

  const handleInputBlur = () => {
    setActiveField("");
  };

  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }));

      if (formStatus.message) {
        setFormStatus({ type: "", message: "" });
      }
    },
    [formStatus.message]
  );

  // Form validation
  const validateForm = useCallback(() => {
    const errors = [];

    if (!formData.fullName.trim()) {
      errors.push("Full name is required");
    }

    if (!formData.email.trim()) {
      errors.push("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("Please enter a valid email address");
    }

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      errors.push("Please enter a valid phone number");
    }

    if (!formData.message.trim()) {
      errors.push("Message is required");
    } else if (formData.message.trim().length < 10) {
      errors.push("Message should be at least 10 characters long");
    }

    return errors;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      setFormStatus({ type: "error", message: errors.join(", ") });
      return;
    }

    setIsSubmitting(true);
    setFormStatus({ type: "loading", message: "Sending your message..." });

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("Form submitted:", formData);

      setFormStatus({
        type: "success",
        message:
          "Thank you! Your message has been sent. We'll get back to you within 24 hours.",
      });

      setFormData({
        fullName: "",
        email: "",
        phone: "",
        service: "",
        message: "",
      });

      const firstInput = formRef.current?.querySelector(
        "input, textarea, select"
      );
      if (firstInput) firstInput.focus();
    } catch (error) {
      console.error("Form submission error:", error);
      setFormStatus({
        type: "error",
        message:
          "Sorry, there was an error sending your message. Please try again or contact us directly.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);

    // Force footer visibility on mount
    setTimeout(() => {
      const footerElements = document.querySelectorAll("footer *");
      footerElements.forEach((el) => {
        el.style.opacity = "1";
        el.style.visibility = "visible";
        el.style.transform = "none";
      });
    }, 100);
  }, []);

  // Contact information data
  const contactInfo = [
    {
      title: "Visit Us",
      content: "2184 Loyola St, Sampaloc, Manila. 1008 Metro Manila",
      icon: "📍",
      description: "Easy to find location with ample parking space",
    },
    {
      title: "Email Us",
      content: "sandrediessalon@gmail.com",
      href: "mailto:sandrediessalon@gmail.com",
      icon: "✉️",
      description: "We typically respond within 2-4 hours",
    },
    {
      title: "Call Us",
      content: ["09998081357", "+639175350244"],
      hrefs: ["tel:09998081357", "tel:+639175350244"],
      icon: "📞",
      description: "Available during business hours",
    },
    {
      title: "Opening Hours",
      content: "Mon-Sun 9:00AM - 9:00PM",
      icon: "🕘",
      description: "Extended hours for your convenience",
    },
  ];

  // Social media links
  const socialMedia = [
    {
      name: "Facebook",
      url: "https://facebook.com/sandrealeesalon",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: "Instagram",
      url: "https://instagram.com/sandrealeesalon",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z" />
        </svg>
      ),
    },
    {
      name: "Twitter",
      url: "https://twitter.com/sandrealeesalon",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="contact-page relative overflow-x-hidden min-h-screen bg-[#0a0e27]">
      {/* Enhanced Background with More Dynamic Glowing Circles */}
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
          aria-hidden="true"
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
          aria-hidden="true"
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
          aria-hidden="true"
        />

        {/* Additional floating particles */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/5"
              style={{
                width: `${Math.random() * 6 + 2}px`,
                height: `${Math.random() * 6 + 2}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${Math.random() * 20 + 10}s linear infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Enhanced Header / Navigation */}
        <header
          className={`fixed w-full z-50 transition-all duration-500 ${
            scrolled
              ? "bg-[#0a0e27]/90 backdrop-blur-xl shadow-2xl shadow-blue-900/20"
              : "bg-transparent"
          }`}>
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <img
                  src={salonLogo}
                  alt="Sandrea Lee Salon"
                  className="h-10 sm:h-12 w-auto object-contain transition-transform duration-300 hover:scale-105"
                  loading="eager"
                />
                <span className="relative top-1.5 -left-3 text-xl sm:text-3xl font-semi-bold text-white font-['Tenali_Ramakrishna'] tracking-wide leading-none">
                  SALON
                </span>
              </div>

              {/* NAVBAR COMPONENT */}
              <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2">
                <Navbar />
              </div>

              {/* Enhanced Menu Button */}
              <button
                ref={menuButtonRef}
                onClick={toggleMobileMenu}
                className="relative px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 overflow-hidden flex items-center space-x-2 z-50 flex-shrink-0 group"
                style={{
                  background: "linear-gradient(to bottom, #76C4FF, #3352E8)",
                  color: "#000",
                }}
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}>
                <span className="relative z-10 group-hover:scale-105 transition-transform duration-200">
                  Menu
                </span>
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
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -skew-x-12 transform"></div>
              </button>
            </div>
          </div>
        </header>

        {/* Enhanced Floating Menu Container */}
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
            }`}
          aria-hidden={!isMobileMenuOpen}>
          <div className="p-5 sm:p-6 md:p-8">
            {/* For Customers Section */}
            <div className="mb-5 sm:mb-6">
              <h3 className="text-white text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                For Customers
              </h3>
              <div className="space-y-2 sm:space-y-2.5">
                <button
                  onClick={handleCustomerLogin}
                  className="group flex items-center w-full text-blue-400 hover:text-blue-300 transition-all font-medium text-sm sm:text-base rounded-lg px-3 py-2 hover:bg-white/5 cursor-pointer text-left hover:scale-105 transform transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900">
                  <span className="flex-1">Log in or Sign up</span>
                  <svg
                    className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => handleDownloadApp("customer")}
                  className="group flex items-center w-full text-white hover:text-gray-300 transition-all text-sm sm:text-base rounded-lg px-3 py-2 hover:bg-white/5 cursor-pointer text-left hover:scale-105 transform transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900">
                  <span className="flex-1">Download the app</span>
                  <svg
                    className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => handleHelpSupport("customers")}
                  className="group flex items-center w-full text-white hover:text-gray-300 transition-all text-sm sm:text-base rounded-lg px-3 py-2 hover:bg-white/5 cursor-pointer text-left hover:scale-105 transform transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900">
                  <span className="flex-1">Help and Support</span>
                  <svg
                    className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
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

            <div className="border-t border-gray-700/50 my-4 sm:my-5"></div>

            {/* For Salon Staff Section */}
            <div className="mb-5 sm:mb-6">
              <h3 className="text-white text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                For Salon Staff
              </h3>
              <div className="space-y-2 sm:space-y-2.5">
                <button
                  onClick={handleStaffLogin}
                  className="group flex items-center w-full text-purple-400 hover:text-purple-300 transition-all font-medium text-sm sm:text-base rounded-lg px-3 py-2 hover:bg-white/5 cursor-pointer text-left hover:scale-105 transform transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900">
                  <span className="flex-1">Log in or Sign up</span>
                  <svg
                    className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => handleDownloadApp("staff")}
                  className="group flex items-center w-full text-white hover:text-gray-300 transition-all text-sm sm:text-base rounded-lg px-3 py-2 hover:bg-white/5 cursor-pointer text-left hover:scale-105 transform transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900">
                  <span className="flex-1">Download the app</span>
                  <svg
                    className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => handleHelpSupport("staff")}
                  className="group flex items-center w-full text-white hover:text-gray-300 transition-all text-sm sm:text-base rounded-lg px-3 py-2 hover:bg-white/5 cursor-pointer text-left hover:scale-105 transform transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900">
                  <span className="flex-1">Help and Support</span>
                  <svg
                    className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
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

            <div className="flex justify-center pt-2 sm:pt-3">
              <button
                onClick={handleBookNow}
                className="w-full px-8 py-3 rounded-full font-semibold text-sm transition-all border-2 border-white/50 hover:border-white hover:bg-white/10 hover:scale-105 cursor-pointer transform transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 group"
                style={{ background: "transparent", color: "#fff" }}>
                <span className="flex items-center justify-center space-x-2">
                  <span>Book Now</span>
                  <svg
                    className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Contact Hero Section */}
        <section className="contact-hero relative min-h-[70vh] flex items-center px-4 sm:px-6 overflow-hidden pt-24">
          <div className="container mx-auto relative z-10 text-center">
            <div className="max-w-4xl mx-auto">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                <span className="text-blue-300 text-sm font-medium">
                  Get In Touch With Us
                </span>
              </div>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Let's{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                  Connect
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                We're here to help you achieve your perfect look. Reach out to
                our team for consultations, appointments, or any questions about
                our services.
              </p>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <button
                  onClick={handleBookNow}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#0a0e27]">
                  Book Appointment
                </button>
                <a
                  href="tel:09998081357"
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-full hover:bg-white/20 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0a0e27]">
                  Call Now
                </a>
              </div>
            </div>
          </div>

          {/* Floating decorative elements */}
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/50 rounded-full mt-2"></div>
            </div>
          </div>
        </section>

        {/* Enhanced Contact Content Section */}
        <section className="contact-content py-16 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 max-w-6xl mx-auto">
              {/* Enhanced Contact Information */}
              <div className="contact-info">
                <div className="mb-10">
                  <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                    Get in{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                      Touch
                    </span>
                  </h2>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    We're committed to providing you with the best salon
                    experience. Reach out through any of these channels.
                  </p>
                </div>

                <div className="space-y-6">
                  {contactInfo.map((item, index) => (
                    <div
                      key={index}
                      className="contact-item group cursor-pointer transform transition-all duration-300 hover:scale-105"
                      onClick={() => {
                        if (item.href) window.open(item.href, "_self");
                        else if (item.hrefs && item.hrefs[0])
                          window.open(item.hrefs[0], "_self");
                      }}>
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                          <span className="text-xl" aria-hidden="true">
                            {item.icon}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors duration-300">
                            {item.title}
                          </h3>
                          {Array.isArray(item.content) ? (
                            <div className="space-y-1">
                              {item.content.map((content, contentIndex) =>
                                item.hrefs ? (
                                  <a
                                    key={contentIndex}
                                    href={item.hrefs[contentIndex]}
                                    className="block text-gray-300 text-lg hover:text-white transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 rounded">
                                    {content}
                                  </a>
                                ) : (
                                  <p
                                    key={contentIndex}
                                    className="text-gray-300 text-lg">
                                    {content}
                                  </p>
                                )
                              )}
                            </div>
                          ) : item.href ? (
                            <a
                              href={item.href}
                              className="text-gray-300 text-lg hover:text-white transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 rounded">
                              {item.content}
                            </a>
                          ) : (
                            <p className="text-gray-300 text-lg">
                              {item.content}
                            </p>
                          )}
                          {item.description && (
                            <p className="text-gray-400 text-sm mt-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Enhanced Social Media Links */}
                <div className="mt-12">
                  <h3 className="text-2xl font-semibold text-white mb-6">
                    Follow Our Journey
                  </h3>
                  <div className="flex space-x-4">
                    {socialMedia.map((social, index) => (
                      <a
                        key={index}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/30 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 group"
                        aria-label={`Follow us on ${social.name}`}>
                        <div className="transform group-hover:scale-110 transition-transform duration-300 text-white">
                          {social.icon}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Enhanced Contact Form */}
              <div className="contact-form-container">
                <div className="mb-8">
                  <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                    Send us a{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                      Message
                    </span>
                  </h2>
                  <p className="text-gray-300 text-lg">
                    Fill out the form below and we'll get back to you within 24
                    hours.
                  </p>
                </div>

                {/* Enhanced Form Status Message */}
                {formStatus.message && (
                  <div
                    className={`mb-6 p-4 rounded-xl border backdrop-blur-sm ${
                      formStatus.type === "success"
                        ? "bg-green-500/10 border-green-500/50 text-green-300"
                        : formStatus.type === "error"
                        ? "bg-red-500/10 border-red-500/50 text-red-300"
                        : "bg-blue-500/10 border-blue-500/50 text-blue-300"
                    } transform transition-all duration-300`}
                    role="alert"
                    aria-live="polite">
                    <div className="flex items-center">
                      {formStatus.type === "success" && (
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {formStatus.type === "error" && (
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {formStatus.type === "loading" && (
                        <svg
                          className="animate-spin w-5 h-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {formStatus.message}
                    </div>
                  </div>
                )}

                <form
                  ref={formRef}
                  onSubmit={handleSubmit}
                  className={`space-y-6 ${
                    isSubmitting ? "form-submitting" : ""
                  }`}
                  noValidate>
                  <div className="form-group">
                    <label
                      htmlFor="fullName"
                      className="block text-white text-sm font-medium mb-3">
                      Full Name *
                    </label>
                    <div
                      className={`relative transition-all duration-300 ${
                        activeField === "fullName" ? "transform scale-105" : ""
                      }`}>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        onFocus={() => handleInputFocus("fullName")}
                        onBlur={handleInputBlur}
                        placeholder="Your Full Name"
                        className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition-all duration-300 backdrop-blur-sm"
                        required
                        disabled={isSubmitting}
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-purple-600/0 group-hover:from-blue-500/10 group-hover:to-purple-600/10 transition-all duration-300 pointer-events-none"></div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label
                      htmlFor="email"
                      className="block text-white text-sm font-medium mb-3">
                      Email Address *
                    </label>
                    <div
                      className={`relative transition-all duration-300 ${
                        activeField === "email" ? "transform scale-105" : ""
                      }`}>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onFocus={() => handleInputFocus("email")}
                        onBlur={handleInputBlur}
                        placeholder="your.email@example.com"
                        className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition-all duration-300 backdrop-blur-sm"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label
                      htmlFor="phone"
                      className="block text-white text-sm font-medium mb-3">
                      Phone Number
                    </label>
                    <div
                      className={`relative transition-all duration-300 ${
                        activeField === "phone" ? "transform scale-105" : ""
                      }`}>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        onFocus={() => handleInputFocus("phone")}
                        onBlur={handleInputBlur}
                        placeholder="+63 912 345 6789"
                        className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition-all duration-300 backdrop-blur-sm"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label
                      htmlFor="service"
                      className="block text-white text-sm font-medium mb-3">
                      Service of Interest
                    </label>
                    <div
                      className={`relative transition-all duration-300 ${
                        activeField === "service" ? "transform scale-105" : ""
                      }`}>
                      <select
                        id="service"
                        name="service"
                        value={formData.service}
                        onChange={handleInputChange}
                        onFocus={() => handleInputFocus("service")}
                        onBlur={handleInputBlur}
                        className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400 focus:bg-white/20 transition-all duration-300 backdrop-blur-sm appearance-none"
                        style={{
                          backgroundImage:
                            "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")",
                          backgroundPosition: "right 1rem center",
                          backgroundRepeat: "no-repeat",
                          backgroundSize: "1.5em 1.5em",
                          paddingRight: "3rem",
                        }}
                        disabled={isSubmitting}>
                        <option value="">Select a service</option>
                        <option value="haircut">Haircut & Styling</option>
                        <option value="coloring">Hair Coloring</option>
                        <option value="treatment">Hair Treatment</option>
                        <option value="extension">Hair Extension</option>
                        <option value="bridal">Bridal Services</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label
                      htmlFor="message"
                      className="block text-white text-sm font-medium mb-3">
                      Your Message *
                    </label>
                    <div
                      className={`relative transition-all duration-300 ${
                        activeField === "message" ? "transform scale-105" : ""
                      }`}>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        onFocus={() => handleInputFocus("message")}
                        onBlur={handleInputBlur}
                        placeholder="Tell us about your hair goals, specific requirements, or any questions you have..."
                        rows="6"
                        className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition-all duration-300 backdrop-blur-sm resize-vertical min-h-[150px]"
                        required
                        disabled={isSubmitting}></textarea>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-blue-500/25 group">
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending Message...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center space-x-2">
                        <span>Send Message</span>
                        <svg
                          className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </span>
                    )}
                  </button>

                  <p className="text-gray-400 text-sm text-center">
                    * Required fields. We respect your privacy and will never
                    share your information.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Map Section */}
        <section className="map-section py-16 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                  Visit Our{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                    Salon
                  </span>
                </h2>
                <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                  Located in the heart of Manila, our salon offers a comfortable
                  and luxurious environment for your beauty transformation.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl border border-white/10 p-6 sm:p-8 transform hover:scale-[1.02] transition-all duration-500">
                <div className="map-container rounded-2xl overflow-hidden shadow-2xl">
                  {mapImage ? (
                    <img
                      src={mapImage}
                      alt="SandreaLee Salon Location Map - 2184 Loyola St, Sampaloc, Manila, 1008 Metro Manila"
                      className="w-full h-64 sm:h-80 md:h-96 object-cover transform hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-64 sm:h-80 md:h-96 bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center rounded-2xl">
                      <div className="text-center p-8">
                        <div className="w-16 h-16 bg-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg
                            className="w-8 h-8 text-blue-300"
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
                        <p className="text-blue-300 text-lg mb-2 font-semibold">
                          Interactive Map Coming Soon
                        </p>
                        <p className="text-gray-400 text-sm max-w-md">
                          We're located at 2184 Loyola St, Sampaloc, Manila.
                          Easy to find with plenty of parking available.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-6 text-center">
                  <a
                    href="https://maps.google.com/?q=2184+Loyola+St,+Sampaloc,+Manila,+1008+Metro+Manila"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl px-8 py-4 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900 shadow-lg shadow-blue-500/25 group">
                    <span>Get Directions</span>
                    <svg
                      className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced FAQ Section */}
        <section className="faq-section py-16 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                  Frequently Asked{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                    Questions
                  </span>
                </h2>
                <p className="text-gray-300 text-lg">
                  Quick answers to common questions about our services and
                  policies.
                </p>
              </div>
              <div className="space-y-4">
                {[
                  {
                    question: "What are your operating hours?",
                    answer:
                      "We're open Monday through Sunday from 9:00 AM to 9:00 PM to accommodate your busy schedule. We recommend booking appointments in advance for weekends and evenings.",
                  },
                  {
                    question: "Do I need to book an appointment in advance?",
                    answer:
                      "While walk-ins are welcome, we highly recommend booking in advance to ensure availability and minimize waiting time. You can book through our website, app, or by calling us directly.",
                  },
                  {
                    question: "What payment methods do you accept?",
                    answer:
                      "We accept cash, credit/debit cards, GCash, Maya, and bank transfers for your convenience. All major credit cards are accepted including Visa, MasterCard, and American Express.",
                  },
                  {
                    question:
                      "Do you offer bridal and special occasion packages?",
                    answer:
                      "Yes! We offer comprehensive bridal packages and special occasion styling that include hair, makeup, and trial sessions. Contact us for custom package details, pricing, and availability.",
                  },
                  {
                    question: "What is your cancellation policy?",
                    answer:
                      "We require at least 24 hours notice for cancellations or rescheduling. Late cancellations may be subject to a fee. We understand emergencies happen and will work with you whenever possible.",
                  },
                  {
                    question: "Do you use professional hair products?",
                    answer:
                      "Absolutely! We use only premium, professional-grade hair products from trusted brands to ensure the best results and maintain the health of your hair. Our stylists are trained in the latest techniques.",
                  },
                ].map((faq, index) => (
                  <div
                    key={index}
                    className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 transform hover:scale-[1.02] group cursor-pointer">
                    <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-300 transition-colors duration-300 flex items-center">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 group-hover:scale-125 transition-transform duration-300"></span>
                      {faq.question}
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>

              {/* Additional Help CTA */}
              <div className="text-center mt-12">
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Still have questions?
                  </h3>
                  <p className="text-gray-300 mb-6">
                    We're here to help! Contact us directly for personalized
                    assistance.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <a
                      href="tel:09998081357"
                      className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900">
                      Call Us Now
                    </a>
                    <a
                      href="mailto:sandrediessalon@gmail.com"
                      className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-full hover:bg-white/20 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900">
                      Email Us
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FIXED Footer Section - Matching Landing.jsx structure */}
        <footer
          className="relative overflow-hidden pt-20 sm:pt-24 md:pt-32"
          style={{ background: "transparent" }}>
          <div
            style={{
              backgroundColor: "#0A142F",
              position: "relative",
              zIndex: 10,
            }}
            className="rounded-t-[100px] sm:rounded-t-[140px] md:rounded-t-[180px] lg:rounded-t-[220px]">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-10"
                style={{ visibility: "visible", opacity: 1 }}>
                {/* Logo and App Downloads */}
                <div
                  style={{
                    visibility: "visible",
                    opacity: 1,
                    position: "relative",
                    zIndex: 10,
                  }}>
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

                {/* Quick Links */}
                <div
                  style={{
                    visibility: "visible",
                    opacity: 1,
                    position: "relative",
                    zIndex: 10,
                  }}>
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
                      <button
                        onClick={() => navigate("/about")}
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-sm">
                        About Us
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigate("/contact")}
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-sm">
                        Contact Us
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Contact Us */}
                <div
                  style={{
                    visibility: "visible",
                    opacity: 1,
                    position: "relative",
                    zIndex: 10,
                  }}>
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
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-gray-300 text-sm">
                        Mon-Sun | 9:00 AM - 9:00 PM
                      </p>
                    </div>
                  </div>
                </div>

                {/* Newsletter */}
                <div
                  style={{
                    visibility: "visible",
                    opacity: 1,
                    position: "relative",
                    zIndex: 10,
                  }}>
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

              {/* Social Media */}
              <div className="flex flex-col items-center justify-center py-6 border-t border-gray-700/50">
                <h4 className="text-white text-base font-medium mb-4">
                  Social Media
                </h4>
                <div className="flex items-center space-x-4">
                  <a
                    href="https://facebook.com/sandrealeesalon"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full border-2 border-gray-500 hover:border-white flex items-center justify-center transition-all duration-300 hover:scale-110"
                    aria-label="Facebook">
                    <svg
                      className="w-5 h-5 text-gray-300 hover:text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>

                  <a
                    href="https://instagram.com/sandrealeesalon"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full border-2 border-gray-500 hover:border-white flex items-center justify-center transition-all duration-300 hover:scale-110"
                    aria-label="Instagram">
                    <svg
                      className="w-5 h-5 text-gray-300 hover:text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>

                  <a
                    href="https://twitter.com/sandrealeesalon"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-11 h-11 rounded-full border-2 border-gray-500 hover:border-white flex items-center justify-center transition-all duration-300 hover:scale-110"
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

export default Contact;
