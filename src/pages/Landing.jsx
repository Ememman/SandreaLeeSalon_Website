// pages/Landing.jsx - COMPLETE AND READY TO USE
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import salonLogo from "../assets/SandreaLeeSalonLogoCapstone.png";
import banner1 from "../assets/banner1.png";
import banner2 from "../assets/banner2.png";
import gallery1 from "../assets/gallery1.png";
import gallery2 from "../assets/gallery2.png";
import gallery3 from "../assets/gallery3.png";
import gallery4 from "../assets/gallery4.png";
import gallery5 from "../assets/gallery5.png";
import rebondImage from "../assets/rebond.png";
import testimonial1 from "../assets/testimonial1.jpg";
import testimonial2 from "../assets/testimonial2.jpg";
import testimonial3 from "../assets/testimonial3.jpg";
import "../styles/landingAnimations.css";

const LandingPage = () => {
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Carousel states
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(5);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  // Testimonials carousel states
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isTestimonialAutoPlaying, setIsTestimonialAutoPlaying] =
    useState(true);
  const [testimonialTimeRemaining, setTestimonialTimeRemaining] = useState(5);
  const testimonialIntervalRef = useRef(null);
  const testimonialTimeoutRef = useRef(null);

  // Refs for the menu and button
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

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
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileMenuOpen]);

  // Detect scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setScrolled(scrollTop > 50);
      setLastScrollY(scrollTop);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Scroll reveal animation
  useEffect(() => {
    const observerOptions = {
      threshold: 0.15,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-active");
          entry.target.classList.remove("reveal-fade-out");
        } else {
          if (entry.boundingClientRect.top > 0) {
            entry.target.classList.remove("reveal-active");
            entry.target.classList.add("reveal-fade-out");
          }
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll(
      ".scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-fade-up, .scroll-zoom, .scroll-rotate, .scroll-blur"
    );
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying) {
      clearInterval(intervalRef.current);
      return;
    }

    setTimeRemaining(5);

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setCurrentSlide(
            (prevSlide) => (prevSlide + 1) % galleryImages.length
          );
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isAutoPlaying]);

  // Auto-play testimonials carousel
  useEffect(() => {
    if (!isTestimonialAutoPlaying) {
      clearInterval(testimonialIntervalRef.current);
      return;
    }

    setTestimonialTimeRemaining(5);

    testimonialIntervalRef.current = setInterval(() => {
      setTestimonialTimeRemaining((prev) => {
        if (prev <= 1) {
          setCurrentTestimonial(
            (prevTestimonial) => (prevTestimonial + 1) % testimonials.length
          );
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(testimonialIntervalRef.current);
  }, [isTestimonialAutoPlaying]);

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
    closeMobileMenu();
    alert(`Download ${type} app - Add your download logic here`);
  };

  const handleHelpSupport = (type, e) => {
    if (e) e.stopPropagation();
    closeMobileMenu();
    alert(`Help and Support for ${type} - Add your help logic here`);
  };

  const handleBookNow = (e) => {
    if (e) e.stopPropagation();
    closeMobileMenu();

    const isLoggedIn = localStorage.getItem("token");
    if (isLoggedIn) {
      alert("Book Now - Add your booking logic here");
    } else {
      navigate("/role-selection", { state: { redirectTo: "booking" } });
    }
  };

  // Gallery images array
  const galleryImages = [
    { src: gallery1, alt: "Salon Interior View 1" },
    { src: gallery2, alt: "Salon Interior View 2" },
    { src: gallery3, alt: "Salon Services" },
    { src: gallery4, alt: "Salon Styling" },
    { src: gallery5, alt: "Salon Experience" },
  ];

  // Testimonials data
  const testimonials = [
    {
      id: 1,
      name: "DJ Augustin",
      location: "Montalban Rizal",
      service: "HAIRCUT W/ SHAM/CONDI AND BLOW",
      rating: 5.0,
      testimonial:
        "I walked in for a quick trim, but my stylist turned it into a full pampering session! The shampoo/conditioner treatment left my hair so soft, and the blowout gave me salon-worthy volume. Best haircut experience ever!",
      image: testimonial1,
    },
    {
      id: 2,
      name: "Joey Xenon",
      location: "Caloocan City",
      service: "SHAVING (EYEBROWS)",
      rating: 5.0,
      testimonial:
        "I was nervous about eyebrow shaping, but the technician nailed it! Clean, symmetrical arches that frame my face perfectly. Now I won't trust anyone else!",
      image: testimonial2,
    },
    {
      id: 3,
      name: "Ralph Zolido",
      location: "Imus Cavite",
      service: "HAIR IRON",
      rating: 5.0,
      testimonial:
        "My frizzy hair was a mess before my event. The stylist used a professional iron to give me sleek, smooth locks that lasted all night. Zero damage—I'm obsessed!",
      image: testimonial3,
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % galleryImages.length);
    setTimeRemaining(5);
    pauseAutoPlay();
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + galleryImages.length) % galleryImages.length
    );
    setTimeRemaining(5);
    pauseAutoPlay();
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setTimeRemaining(5);
    pauseAutoPlay();
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
    if (!isAutoPlaying) {
      setTimeRemaining(5);
    }
  };

  const pauseAutoPlay = () => {
    setIsAutoPlaying(false);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsAutoPlaying(true);
    }, 8000);
  };

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    setTestimonialTimeRemaining(5);
    pauseTestimonialAutoPlay();
  };

  const prevTestimonial = () => {
    setCurrentTestimonial(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
    setTestimonialTimeRemaining(5);
    pauseTestimonialAutoPlay();
  };

  const goToTestimonial = (index) => {
    setCurrentTestimonial(index);
    setTestimonialTimeRemaining(5);
    pauseTestimonialAutoPlay();
  };

  const pauseTestimonialAutoPlay = () => {
    setIsTestimonialAutoPlaying(false);
    clearTimeout(testimonialTimeoutRef.current);
    testimonialTimeoutRef.current = setTimeout(() => {
      setIsTestimonialAutoPlaying(true);
    }, 8000);
  };

  useEffect(() => () => clearTimeout(timeoutRef.current), []);
  useEffect(() => () => clearTimeout(testimonialTimeoutRef.current), []);

  return (
    <div className="relative overflow-x-hidden min-h-screen bg-[#0a0e27]">
      {/* Background Effects */}
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
            scrolled
              ? "bg-[#0a0e27]/90 backdrop-blur-xl shadow-2xl"
              : "bg-transparent"
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
          className={`fixed z-[60] rounded-2xl sm:rounded-3xl shadow-2xl transform transition-all duration-500 ease-out top-20 sm:top-24 left-4 right-4 sm:left-auto sm:right-4 md:right-6 sm:w-80 md:w-96 bg-gradient-to-br from-gray-900/95 via-gray-900/95 to-black/95 border border-white/10 backdrop-blur-xl ${
            isMobileMenuOpen
              ? "translate-x-0 opacity-100 scale-100 pointer-events-auto"
              : "sm:translate-x-[120%] translate-y-[-120%] sm:translate-y-0 opacity-0 scale-95 pointer-events-none"
          }`}>
          <div className="p-5 sm:p-6 md:p-8">
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

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center px-4 sm:px-6 overflow-hidden">
          <div className="container mx-auto relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-[70px] max-w-[1500px] font-[500] tracking-tight sm:tracking-[-2px] md:tracking-[-3px] lg:tracking-[-4px] text-center leading-tight z-10 mb-6 md:mb-8 break-words">
                <div className="max-w-[1100px] mx-auto">
                  <span className="block sm:inline-block text-white">
                    Experience Luxury
                    <br />
                    <span className="glow-sweep-multi inline-block">
                      & Glow with Confidence
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={handleBookNow}
                  className="cta-glow-button scroll-zoom group relative rounded-full font-semibold transition-all duration-500 overflow-hidden transform hover:scale-105 px-8 py-4 text-base sm:px-10 sm:py-4 sm:text-lg md:px-12 md:py-5"
                  style={{
                    background: "linear-gradient(to right, #76C4FF, #0348D3)",
                    color: "#000",
                  }}>
                  <span className="absolute inset-0 rounded-full animate-ping-slow opacity-75 bg-blue-400 blur-xl"></span>
                  <span className="absolute inset-0 rounded-full animate-pulse-glow opacity-50 bg-cyan-300 blur-lg"></span>
                  <span className="absolute inset-0 rounded-full overflow-hidden">
                    <span className="absolute inset-0 shimmer-effect"></span>
                  </span>
                  <span className="relative z-10 font-bold tracking-wide">
                    Book Your Appointment Today!
                  </span>
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: "linear-gradient(to left, #76C4FF, #0348D3)",
                    }}
                  />
                </button>

                <button
                  onClick={handleLoginSignup}
                  className="group relative rounded-full font-semibold transition-all duration-500 overflow-hidden transform hover:scale-105 px-8 py-4 text-base border-2 border-white/50 sm:px-10 sm:py-4 sm:text-lg md:px-12 md:py-5 hover:border-white hover:bg-white/10"
                  style={{ background: "transparent", color: "#fff" }}>
                  <span className="relative z-10 font-bold tracking-wide">
                    Login / Sign Up
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Download Mobile Apps Section */}
        <section className="relative py-16 sm:py-20 md:py-24 overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-7xl mx-auto bg-gradient-to-br from-indigo-950/40 via-slate-900/40 to-blue-950/40 backdrop-blur-sm rounded-3xl sm:rounded-[40px] p-8 sm:p-12 md:p-16 shadow-2xl border border-white/10">
              <div className="text-center mb-10 sm:mb-14 scroll-fade-up">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                  Download our mobile apps
                </h2>
                <p className="text-base sm:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
                  Book beauty services with SandreaLee Salon's mobile app, or
                  manage salon operations with our easy-to-use iOS and Android
                  platform—perfect for both clients and staff.
                </p>
              </div>

              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  <div className="scroll-reveal-left scroll-stagger-1">
                    <div
                      className="rounded-3xl p-8 sm:p-10 h-full flex flex-col justify-between shadow-2xl transform transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl"
                      style={{
                        background:
                          "linear-gradient(135deg, #5B9FED 0%, #4A7FD9 100%)",
                      }}>
                      <div className="flex items-center space-x-3 mb-6">
                        <span className="text-sm font-medium text-black/70">
                          Available on
                        </span>
                        <svg
                          className="w-5 h-5 text-black"
                          fill="currentColor"
                          viewBox="0 0 24 24">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                        </svg>
                        <svg
                          className="w-5 h-5 text-black"
                          fill="currentColor"
                          viewBox="0 0 24 24">
                          <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                        </svg>
                      </div>

                      <div className="mb-6">
                        <h3 className="text-2xl sm:text-3xl font-bold text-black mb-4">
                          Booking app for customers
                        </h3>
                        <p className="text-black/80 text-base sm:text-lg leading-relaxed">
                          Book unforgettable beauty and wellness experiences
                          with the SandreaLee mobile app – the best way to
                          discover{" "}
                          <span className="font-semibold">
                            top-rated services
                          </span>{" "}
                          and premium beauty products.
                        </p>
                      </div>

                      <div>
                        <button
                          onClick={() => handleDownloadApp("customer")}
                          className="bg-black text-white px-8 py-3.5 rounded-full font-semibold text-base hover:bg-black/90 transition-all duration-300 transform hover:scale-105 shadow-lg">
                          Download Now
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="scroll-reveal-right scroll-stagger-2">
                    <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-6 sm:p-8 h-full shadow-2xl border border-white/10 transform transition-all duration-500 hover:scale-[1.02] hover:border-cyan-400/30">
                      <div className="relative overflow-hidden rounded-2xl mb-6">
                        <img
                          src={rebondImage}
                          alt="Rebond + Basic Color Service"
                          className="w-full h-64 sm:h-80 object-cover"
                        />
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-xl sm:text-2xl font-bold text-white">
                          REBOND + BASIC COLOR
                        </h4>

                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className="w-5 h-5 text-yellow-400"
                                fill="currentColor"
                                viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-gray-400 text-sm">
                            1,282 views
                          </span>
                        </div>

                        <div className="flex items-start space-x-3 text-gray-300">
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
                          <div className="text-sm">
                            <p>2184 Loyola St, Sampaloc, Manila,</p>
                            <p>1008 Metro Manila</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 text-gray-300">
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
                          <span className="text-sm">
                            Mon-Sun | 9:00 AM - 9:00 PM
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section className="relative py-16 sm:py-20 md:py-24 lg:py-28 overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 mb-12 lg:mb-16">
              <div className="flex-1 lg:flex-[1.4] scroll-reveal-left">
                <div className="group relative overflow-hidden rounded-3xl shadow-2xl transition-all duration-500 hover:scale-[1.02] bg-gray-800/50 backdrop-blur-sm">
                  <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[400px]">
                    <img
                      src={banner1}
                      alt="SandreaLee Salon Interior"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </div>
              </div>

              <div className="flex-1 lg:flex-[0.85] scroll-reveal-right">
                <div className="group relative overflow-hidden rounded-3xl shadow-2xl transition-all duration-500 hover:scale-[1.02] bg-gray-800/50 backdrop-blur-sm">
                  <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[400px]">
                    <img
                      src={banner2}
                      alt="SandreaLee Salon Reception"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-5xl mx-auto text-center space-y-6 sm:space-y-8">
              <h2 className="scroll-fade-up text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Welcome to SandreaLee Salon -{" "}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Where beauty meets artistry
                </span>
              </h2>

              <div className="space-y-4 sm:space-y-5 text-base sm:text-lg md:text-xl text-gray-200 leading-relaxed">
                <p className="scroll-reveal scroll-stagger-1">
                  At SandreaLee Salon, we believe every strand of hair, every
                  stroke of color, and every moment of self-care is a
                  masterpiece in the making.
                </p>

                <p className="scroll-reveal scroll-stagger-2">
                  Nestled in the heart of Sampaloc, Manila, our salon is your
                  sanctuary for transformation, blending cutting-edge techniques
                  with timeless elegance.
                </p>

                <p className="scroll-reveal scroll-stagger-3">
                  Whether you're craving a bold new look, a rejuvenating
                  treatment, or simply a moment of pampering, our team of
                  certified stylists and beauty artisans is here to craft an
                  experience as unique as you are.
                </p>
              </div>

              <div className="pt-6 sm:pt-8 scroll-zoom scroll-stagger-4">
                <button
                  onClick={() => navigate("/services")}
                  className="group relative overflow-hidden rounded-full font-semibold transition-all duration-500 shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105 px-8 py-3 text-base sm:px-10 sm:py-3.5 sm:text-lg md:px-12 md:py-4"
                  style={{
                    background: "linear-gradient(to right, #76C4FF, #0348D3)",
                    color: "#000",
                  }}>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Discover Our Services
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </span>
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: "linear-gradient(to left, #76C4FF, #0348D3)",
                    }}
                  />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery Carousel Section */}
        <section className="relative py-20 sm:py-24 md:py-28 overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-center mb-12 sm:mb-16 scroll-fade-up">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Our{" "}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Salon Gallery
                </span>
              </h2>
              <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
                Step into our world of beauty and elegance. Explore our stunning
                salon environment and exceptional work.
              </p>
            </div>

            <div className="max-w-6xl mx-auto scroll-zoom">
              <div className="relative bg-slate-900/40 backdrop-blur-sm rounded-3xl border border-white/10 p-4 sm:p-6 shadow-2xl">
                <div className="relative overflow-hidden rounded-2xl aspect-video bg-gray-800/50">
                  {galleryImages.map((image, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                        index === currentSlide
                          ? "opacity-100 transform scale-100"
                          : "opacity-0 transform scale-105"
                      }`}>
                      <img
                        src={image.src}
                        alt={image.alt}
                        className="w-full h-full object-cover"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute bottom-6 left-6 text-white">
                          <h3 className="text-xl font-semibold mb-1">
                            {image.alt}
                          </h3>
                          <p className="text-sm text-gray-300">
                            Experience the excellence
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 group hover:scale-110 border border-white/20"
                    aria-label="Previous image">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:text-cyan-300 transition-colors"
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

                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 group hover:scale-110 border border-white/20"
                    aria-label="Next image">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:text-cyan-300 transition-colors"
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

                  <div className="absolute top-4 left-4 flex items-center space-x-3 bg-black/50 backdrop-blur-sm rounded-full px-3 py-2 border border-white/20">
                    <button
                      onClick={toggleAutoPlay}
                      className="w-6 h-6 flex items-center justify-center text-white hover:text-cyan-300 transition-colors"
                      aria-label={
                        isAutoPlaying ? "Pause slideshow" : "Play slideshow"
                      }>
                      {isAutoPlaying ? (
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>

                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-1 bg-white/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 transition-all duration-1000 ease-linear"
                          style={{
                            width: `${(timeRemaining / 5) * 100}%`,
                            transition: "width 1s linear",
                          }}
                        />
                      </div>
                      <span className="text-xs text-white min-w-[20px]">
                        {timeRemaining}s
                      </span>
                    </div>
                  </div>

                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 text-sm text-white border border-white/20">
                    {currentSlide + 1} / {galleryImages.length}
                  </div>
                </div>

                <div className="mt-8 flex justify-center">
                  <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide max-w-full">
                    {galleryImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`flex-shrink-0 relative overflow-hidden rounded-xl transition-all duration-300 group thumbnail-hover ${
                          index === currentSlide
                            ? "ring-2 ring-cyan-400 scale-105 shadow-lg shadow-cyan-400/25"
                            : "ring-1 ring-white/20 hover:ring-white/40"
                        }`}>
                        <img
                          src={image.src}
                          alt={image.alt}
                          className="w-20 h-14 sm:w-24 sm:h-16 md:w-28 md:h-20 object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div
                          className={`absolute inset-0 bg-cyan-400/20 transition-opacity duration-300 ${
                            index === currentSlide
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100"
                          }`}
                        />
                        <div
                          className={`absolute -top-1 -right-1 w-3 h-3 rounded-full transition-all duration-300 ${
                            index === currentSlide
                              ? "bg-cyan-400 scale-100"
                              : "bg-white/50 scale-0"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-center mt-6 text-sm text-gray-400 scroll-fade-up">
                <p>
                  Click on thumbnails or use arrow keys to navigate through our
                  gallery
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        <section className="relative py-20 sm:py-24 md:py-28 overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-left mb-12 sm:mb-16 scroll-fade-up">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                Testimonials
              </h2>
            </div>

            <div className="max-w-5xl mx-auto scroll-zoom">
              <div className="relative bg-slate-900/40 backdrop-blur-sm rounded-3xl border border-white/10 px-8 py-12 sm:p-16 shadow-2xl">
                <div className="flex justify-center mb-10">
                  <div className="relative flex items-center justify-center">
                    {testimonials.map((testimonial, index) => {
                      const isCenter = index === currentTestimonial;
                      const isLeft =
                        index ===
                        (currentTestimonial - 1 + testimonials.length) %
                          testimonials.length;
                      const isRight =
                        index ===
                        (currentTestimonial + 1) % testimonials.length;

                      let positionClass = "opacity-0 scale-0";
                      let zIndex = 0;
                      let size = "w-20 h-20 sm:w-24 sm:h-24";

                      if (isCenter) {
                        positionClass = "opacity-100 scale-100";
                        zIndex = 30;
                        size = "w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40";
                      } else if (isLeft) {
                        positionClass = "opacity-70 scale-90";
                        zIndex = 20;
                      } else if (isRight) {
                        positionClass = "opacity-70 scale-90";
                        zIndex = 20;
                      }

                      return (
                        <div
                          key={testimonial.id}
                          className={`absolute transition-all duration-700 ease-in-out ${positionClass} ${size}`}
                          style={{
                            zIndex: zIndex,
                            transform: isLeft
                              ? "translateX(-120px)"
                              : isRight
                              ? "translateX(120px)"
                              : "translateX(0)",
                          }}>
                          <div
                            className={`w-full h-full rounded-full border-4 overflow-hidden ${
                              isCenter ? "border-white" : "border-gray-600"
                            }`}>
                            {testimonial.image ? (
                              <img
                                src={testimonial.image}
                                alt={testimonial.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
                                {testimonial.name.charAt(0)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div className="w-40 h-40 opacity-0"></div>
                  </div>
                </div>

                <div className="relative min-h-[340px] sm:min-h-[300px]">
                  {testimonials.map((testimonial, index) => (
                    <div
                      key={testimonial.id}
                      className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                        index === currentTestimonial
                          ? "opacity-100 transform translate-x-0"
                          : "opacity-0 transform translate-x-8"
                      }`}>
                      <div className="text-center mb-8">
                        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-wider">
                          {testimonial.service}
                        </h3>
                      </div>

                      <div className="mb-8 px-4 sm:px-8">
                        <p className="text-gray-300 text-base sm:text-lg lg:text-xl leading-relaxed text-center">
                          "{testimonial.testimonial}"
                        </p>
                      </div>

                      <div className="text-center space-y-4">
                        <p className="text-white font-semibold text-lg sm:text-xl">
                          -{testimonial.name}, {testimonial.location}
                        </p>

                        <div className="flex items-center justify-center space-x-3">
                          <span className="text-white font-bold text-2xl">
                            {testimonial.rating.toFixed(1)}
                          </span>
                          <span className="text-gray-400 text-sm">
                            /{testimonial.rating.toFixed(1)} rating
                          </span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className="w-5 h-5 text-yellow-400"
                                fill="currentColor"
                                viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={prevTestimonial}
                  className="absolute left-4 sm:left-8 top-1/2 transform -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-transparent hover:bg-cyan-500/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 group border-2 border-cyan-400"
                  aria-label="Previous testimonial">
                  <svg
                    className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                <button
                  onClick={nextTestimonial}
                  className="absolute right-4 sm:right-8 top-1/2 transform -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-transparent hover:bg-cyan-500/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 group border-2 border-cyan-400"
                  aria-label="Next testimonial">
                  <svg
                    className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                <div className="flex justify-center space-x-2 mt-8">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToTestimonial(index)}
                      className={`transition-all duration-300 rounded-full ${
                        index === currentTestimonial
                          ? "w-3 h-3 bg-cyan-400"
                          : "w-3 h-3 bg-gray-600 hover:bg-gray-500"
                      }`}
                      aria-label={`Go to testimonial ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Section */}
        <footer className="relative overflow-hidden bg-transparent pt-24 sm:pt-32 md:pt-40">
          <div className="bg-[#0A142F] rounded-t-[120px] sm:rounded-t-[160px] md:rounded-t-[200px] lg:rounded-t-[240px]">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-10">
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

                <div className="scroll-reveal scroll-stagger-1">
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

                <div className="scroll-reveal scroll-stagger-2">
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

                <div className="scroll-reveal scroll-stagger-3">
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

              <div className="flex flex-col items-center justify-center py-6 border-t border-gray-700/50">
                <h4 className="text-white text-base font-medium mb-4">
                  Social Media
                </h4>
                <div className="flex items-center space-x-4">
                  <a
                    href="#"
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
                    href="#"
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
                    href="#"
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

export default LandingPage;
