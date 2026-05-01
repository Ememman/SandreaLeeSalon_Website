// src/CustomerPage/Home.jsx
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
  IoColorPaletteOutline,
  IoSparklesOutline,
  IoBrushOutline,
  IoHandLeftOutline,
  IoFlowerOutline,
  IoEyeOutline,
  IoWaterOutline,
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
import productMask from "../assets/Tressfinity Purple Mask.png";
import productShampoo from "../assets/Tressfinity Purple Shampoo & Conditioner.png";
import productSulfateFree from "../assets/Tressfinity Sulfate Free Shampoo & Conditioner.png";
import productKeratin from "../assets/TressfinityKeratinArganMorocco.png";
import {
  enhancedAPI,
  productUtils,
  serviceUtils,
  getCurrentUser,
  logout,
  customerProfile,
  customerUtils,
  checkAPIHealth,
} from "../services/api";
import "../styles/Home.css";

// Import the Profile, Bookings, Cart, Favorites, Payment, and Order components
import Profile from "../menu/Profile.jsx";
import Bookings from "../menu/Bookings.jsx";
import Cart from "../menu/Cart.jsx";
import Favorites from "../menu/Favorites.jsx";
import Payment from "../menu/Payment.jsx";
import Order from "../menu/Order.jsx";

const CustomerHome = () => {
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");
  const [slideDirection, setSlideDirection] = useState("right");
  const [isAnimating, setIsAnimating] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [scrollDirection, setScrollDirection] = useState("down");
  const [lastScrollY, setLastScrollY] = useState(0);

  // Featured data states
  const [featuredServices, setFeaturedServices] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User state
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfileImage, setUserProfileImage] = useState(null);

  // Overlay states
  const [isProfileOverlayOpen, setIsProfileOverlayOpen] = useState(false);
  const [isBookingsOverlayOpen, setIsBookingsOverlayOpen] = useState(false);
  const [isCartOverlayOpen, setIsCartOverlayOpen] = useState(false);
  const [isFavoritesOverlayOpen, setIsFavoritesOverlayOpen] = useState(false);
  const [isPaymentOverlayOpen, setIsPaymentOverlayOpen] = useState(false);
  const [isOrderOverlayOpen, setIsOrderOverlayOpen] = useState(false);

  // Refs for the menu and button to detect clicks outside
  const profileMenuRef = useRef(null);
  const profileButtonRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Enhanced Service icons mapping with Ionicons React
  const serviceIcons = {
    "Haircuts & Basic Services": (
      <IoCut className="text-cyan-400 text-xl sm:text-2xl" />
    ),
    "Hair Coloring": (
      <IoColorPaletteOutline className="text-pink-400 text-xl sm:text-2xl" />
    ),
    "Hair Treatments": (
      <IoSparklesOutline className="text-purple-400 text-xl sm:text-2xl" />
    ),
    "Hair Styling": (
      <IoBrushOutline className="text-blue-400 text-xl sm:text-2xl" />
    ),
    "Nail Services": (
      <IoHandLeftOutline className="text-red-400 text-xl sm:text-2xl" />
    ),
    "Skin Care": (
      <IoFlowerOutline className="text-green-400 text-xl sm:text-2xl" />
    ),
    Makeup: <IoEyeOutline className="text-yellow-400 text-xl sm:text-2xl" />,
    Spa: <IoWaterOutline className="text-teal-400 text-xl sm:text-2xl" />,
    General: <IoStarOutline className="text-gray-400 text-xl sm:text-2xl" />,
  };

  // Product images mapping with all 4 images
  const productImages = {
    "Tressfinity Keratin Argan Morocco": productKeratin,
    "Tressfinity Sulfate Free Shampoo & Conditioner": productSulfateFree,
    "Tressfinity Purple Mask": productMask,
    "Tressfinity Purple Shampoo & Conditioner": productShampoo,
    default: productKeratin,
  };

  // Product name to image mapping
  const productNameToImage = {
    "Tressfinity Keratin Argan Morocco": "Tressfinity Keratin Argan Morocco",
    "Tressfinity Sulfate Free Shampoo & Conditioner":
      "Tressfinity Sulfate Free Shampoo & Conditioner",
    "Tressfinity Purple Mask": "Tressfinity Purple Mask",
    "Tressfinity Purple Shampoo & Conditioner":
      "Tressfinity Purple Shampoo & Conditioner",
  };

  const navItems = ["Home", "Services", "Products", "Appointments"];

  // Enhanced debug logging
  useEffect(() => {
    console.log("=== HOME COMPONENT DEBUG ===");
    console.log("Featured Services:", featuredServices);
    console.log("Featured Products:", featuredProducts);
    console.log("Services Count:", featuredServices.length);
    console.log("Products Count:", featuredProducts.length);
    console.log("Loading:", loading);
    console.log("Error:", error);
    console.log("Current User:", currentUser);
    console.log("User Profile Image:", userProfileImage);
    console.log("Profile Overlay Open:", isProfileOverlayOpen);
    console.log("Bookings Overlay Open:", isBookingsOverlayOpen);
    console.log("Cart Overlay Open:", isCartOverlayOpen);
    console.log("Favorites Overlay Open:", isFavoritesOverlayOpen);
    console.log("Payment Overlay Open:", isPaymentOverlayOpen);
    console.log("Order Overlay Open:", isOrderOverlayOpen);
    console.log("=== END DEBUG ===");
  }, [
    featuredServices,
    featuredProducts,
    loading,
    error,
    currentUser,
    userProfileImage,
    isProfileOverlayOpen,
    isBookingsOverlayOpen,
    isCartOverlayOpen,
    isFavoritesOverlayOpen,
    isPaymentOverlayOpen,
    isOrderOverlayOpen,
  ]);

  // Check API health
  useEffect(() => {
    const checkAPI = async () => {
      try {
        const health = await checkAPIHealth();
        console.log("🏥 API Health:", health);
      } catch (error) {
        console.error("❌ API Health Check Failed:", error);
      }
    };

    checkAPI();
  }, []);

  // Check if user is logged in and load profile
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

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close menus when clicking outside
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

  // Detect scroll to change header color and parallax effect + scroll direction
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setScrolled(scrollTop > 50);
      setParallaxOffset(scrollTop * 0.5);

      if (scrollTop > lastScrollY) {
        setScrollDirection("down");
      } else if (scrollTop < lastScrollY) {
        setScrollDirection("up");
      }
      setLastScrollY(scrollTop);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Enhanced Scroll reveal animation
  useEffect(() => {
    const observerOptions = {
      threshold: 0.15,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("scroll-reveal-active");
        } else {
          if (entry.boundingClientRect.top > 0) {
            entry.target.classList.remove("scroll-reveal-active");
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

  // Parallax scroll effect
  useEffect(() => {
    const handleParallaxScroll = () => {
      const scrolled = window.scrollY;

      const parallaxElements = document.querySelectorAll(
        ".parallax-slow, .parallax-medium, .parallax-fast"
      );
      parallaxElements.forEach((el) => {
        const speed = el.classList.contains("parallax-slow")
          ? 0.3
          : el.classList.contains("parallax-medium")
          ? 0.5
          : 0.7;
        const yPos = -(scrolled * speed);
        el.style.transform = `translateY(${yPos}px)`;
      });
    };

    window.addEventListener("scroll", handleParallaxScroll);
    return () => window.removeEventListener("scroll", handleParallaxScroll);
  }, []);

  // Fetch featured services and products - ONLY 3 SERVICES & 2 PRODUCTS
  useEffect(() => {
    const fetchFeaturedData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("🔄 Fetching featured data from backend...");

        // Use the enhanced API with proper endpoints - LIMIT TO 3 SERVICES & 2 PRODUCTS
        const [servicesResponse, productsResponse] = await Promise.all([
          enhancedAPI.services.getAll({ limit: 3, featured: true }),
          enhancedAPI.products.getAll({ limit: 2, featured: true }),
        ]);

        console.log("🔍 SERVICES RESPONSE:", servicesResponse);
        console.log("🔍 PRODUCTS RESPONSE:", productsResponse);

        // Process services data - ONLY TAKE FIRST 3
        let servicesData = [];
        if (servicesResponse && servicesResponse.data) {
          if (Array.isArray(servicesResponse.data)) {
            servicesData = servicesResponse.data.slice(0, 3);
          } else if (
            servicesResponse.data.services &&
            Array.isArray(servicesResponse.data.services)
          ) {
            servicesData = servicesResponse.data.services.slice(0, 3);
          } else if (
            servicesResponse.data.data &&
            Array.isArray(servicesResponse.data.data)
          ) {
            servicesData = servicesResponse.data.data.slice(0, 3);
          }
        }

        // Process products data - ONLY TAKE FIRST 2
        let productsData = [];
        if (productsResponse && productsResponse.data) {
          if (Array.isArray(productsResponse.data)) {
            productsData = productsResponse.data.slice(0, 2);
          } else if (
            productsResponse.data.products &&
            Array.isArray(productsResponse.data.products)
          ) {
            productsData = productsResponse.data.products.slice(0, 2);
          } else if (
            productsResponse.data.data &&
            Array.isArray(productsResponse.data.data)
          ) {
            productsData = productsResponse.data.data.slice(0, 2);
          }
        }

        console.log("📊 Processed Services (3 max):", servicesData);
        console.log("📊 Processed Products (2 max):", productsData);

        // Set services data with proper validation - ONLY 3
        if (servicesData.length > 0) {
          const validatedServices = servicesData.map((service) => ({
            _id: service._id || service.id || `service-${Math.random()}`,
            name: service.name || service.serviceName || "Unnamed Service",
            duration: service.duration || service.estimatedDuration || "30min",
            priceRange:
              service.priceRange ||
              serviceUtils.formatPrice(
                service.price || service.startingPrice || service.basePrice || 0
              ),
            description: service.description || "No description available",
            rating: service.rating || { average: 4.0, totalRaters: 0 },
            totalBookings: service.totalBookings || service.bookingsCount || 0,
            isPromo: service.isPromo || service.onPromotion || false,
            category: service.category || service.serviceType || "General",
          }));
          setFeaturedServices(validatedServices);
        } else {
          console.warn("No services data available from backend");
          setFeaturedServices(getFallbackServices());
        }

        // Set products data with proper validation - ONLY 2
        if (productsData.length > 0) {
          const validatedProducts = productsData.map((product) => {
            // Enhanced product image mapping
            let productImage = productImages.default;
            const productName = product.name || product.productName || "";

            // Try to match product name with our image mapping
            if (productName && productNameToImage[productName]) {
              const imageKey = productNameToImage[productName];
              productImage = productImages[imageKey] || productImages.default;
            } else if (product.image) {
              productImage = product.image;
            } else if (product.images && product.images.length > 0) {
              productImage = product.images[0];
            }

            return {
              _id: product._id || product.id || `product-${Math.random()}`,
              name: productName,
              price: product.price || product.unitPrice || 0,
              priceDisplay: productUtils.formatPrice(
                product.price || product.unitPrice || 0
              ),
              description: product.description || "No description available",
              rating: product.rating || { average: 4.0, totalRaters: 0 },
              category: product.category || product.productType || "General",
              inStock: product.inStock !== undefined ? product.inStock : true,
              image: productImage,
            };
          });
          setFeaturedProducts(validatedProducts);
        } else {
          console.warn("No products data available from backend");
          setFeaturedProducts(getFallbackProducts());
        }
      } catch (err) {
        console.error("❌ Error fetching featured data:", err);
        setError("Failed to load data from server. Using sample data.");
        setFeaturedServices(getFallbackServices());
        setFeaturedProducts(getFallbackProducts());
      } finally {
        setLoading(false);
      }
    };

    const getFallbackServices = () => [
      {
        _id: "1",
        name: "Professional Haircut",
        duration: "45min",
        priceRange: "₱350",
        description: "Professional haircut with styling and consultation",
        rating: { average: 4.8, totalRaters: 289 },
        totalBookings: 289,
        isPromo: false,
        category: "Haircuts & Basic Services",
      },
      {
        _id: "2",
        name: "Hair Coloring",
        duration: "2hr",
        priceRange: "₱1,200",
        description: "Professional hair coloring with premium dyes",
        rating: { average: 4.7, totalRaters: 156 },
        totalBookings: 156,
        isPromo: true,
        category: "Hair Coloring",
      },
      {
        _id: "3",
        name: "Hair Treatment",
        duration: "1hr",
        priceRange: "₱800",
        description: "Deep conditioning hair treatment for damaged hair",
        rating: { average: 4.9, totalRaters: 203 },
        totalBookings: 203,
        isPromo: false,
        category: "Hair Treatments",
      },
    ];

    const getFallbackProducts = () => [
      {
        _id: "1",
        name: "Tressfinity Keratin Argan Morocco",
        price: 1260,
        priceDisplay: "₱1,260",
        description:
          "Professional keratin treatment with argan oil for smooth, shiny hair",
        rating: { average: 4.8, totalRaters: 1829 },
        category: "Hair Treatment",
        inStock: true,
        image: productKeratin,
      },
      {
        _id: "2",
        name: "Tressfinity Sulfate Free Shampoo & Conditioner",
        price: 1260,
        priceDisplay: "₱1,260",
        description:
          "Gentle sulfate-free shampoo for daily use, suitable for all hair types",
        rating: { average: 4.5, totalRaters: 1829 },
        category: "Shampoo & Conditioner",
        inStock: true,
        image: productSulfateFree,
      },
    ];

    fetchFeaturedData();
  }, []);

  const closeProfileMenu = () => {
    setIsProfileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Function to open profile overlay
  const openProfileOverlay = () => {
    setIsProfileOverlayOpen(true);
    closeProfileMenu();
    closeMobileMenu();
  };

  // Function to close profile overlay
  const closeProfileOverlay = () => {
    setIsProfileOverlayOpen(false);
  };

  // Function to open bookings overlay
  const openBookingsOverlay = () => {
    setIsBookingsOverlayOpen(true);
    closeProfileMenu();
    closeMobileMenu();
  };

  // Function to close bookings overlay
  const closeBookingsOverlay = () => {
    setIsBookingsOverlayOpen(false);
  };

  // Function to open cart overlay
  const openCartOverlay = () => {
    setIsCartOverlayOpen(true);
    closeProfileMenu();
    closeMobileMenu();
  };

  // Function to close cart overlay
  const closeCartOverlay = () => {
    setIsCartOverlayOpen(false);
  };

  // Function to open favorites overlay
  const openFavoritesOverlay = () => {
    setIsFavoritesOverlayOpen(true);
    closeProfileMenu();
    closeMobileMenu();
  };

  // Function to close favorites overlay
  const closeFavoritesOverlay = () => {
    setIsFavoritesOverlayOpen(false);
  };

  // Function to open payment overlay
  const openPaymentOverlay = () => {
    setIsPaymentOverlayOpen(true);
    closeProfileMenu();
    closeMobileMenu();
  };

  // Function to close payment overlay
  const closePaymentOverlay = () => {
    setIsPaymentOverlayOpen(false);
  };

  // Function to open order overlay
  const openOrderOverlay = () => {
    setIsOrderOverlayOpen(true);
    closeProfileMenu();
    closeMobileMenu();
  };

  // Function to close order overlay
  const closeOrderOverlay = () => {
    setIsOrderOverlayOpen(false);
  };

  const handleLoginSignup = (e) => {
    if (e) e.stopPropagation();
    closeProfileMenu();
    closeMobileMenu();
    navigate("/role-selection");
  };

  const handleServiceBook = (serviceId) => {
    const isLoggedIn = localStorage.getItem("token");
    if (isLoggedIn) {
      // Navigate to booking with service pre-selected
      navigate(`/customer/booking?service=${serviceId}`);
    } else {
      navigate("/role-selection", {
        state: {
          redirectTo: "booking",
          serviceId: serviceId,
        },
      });
    }
  };

  const handleProductPurchase = (productId) => {
    const isLoggedIn = localStorage.getItem("token");
    if (isLoggedIn) {
      // Navigate to products page and scroll to specific product
      navigate(`/customer/products`, {
        state: { scrollToProduct: productId },
      });
    } else {
      navigate("/role-selection", {
        state: {
          redirectTo: "customer/products",
          productId: productId,
        },
      });
    }
  };

  const handleBookNow = (e) => {
    if (e) e.stopPropagation();
    const isLoggedIn = localStorage.getItem("token");
    if (isLoggedIn) {
      navigate("/customer/booking");
    } else {
      navigate("/role-selection", {
        state: {
          redirectTo: "booking",
        },
      });
    }
  };

  const handleDownloadApp = (userType) => {
    console.log(`Download app for ${userType}`);
    alert(`App download for ${userType} - This feature is coming soon!`);
  };

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

  const handleLogout = () => {
    logout();
    navigate("/role-selection");
  };

  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;

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

    const currentIndex = navItems.indexOf(activeTab);
    const newIndex = navItems.indexOf(newTab);
    setSlideDirection(newIndex > currentIndex ? "right" : "left");
    setIsAnimating(true);
    setActiveTab(newTab);
    setTimeout(() => setIsAnimating(false), 500);
    closeMobileMenu();
  };

  const renderStarRating = (rating) => {
    const numericRating =
      typeof rating === "number"
        ? rating
        : rating?.average || rating?.rating || 0;
    const stars = [];
    const fullStars = Math.floor(numericRating);
    const hasHalfStar = numericRating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <IoStar key={`full-${i}`} className="w-4 h-4 text-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(<IoStarHalf key="half" className="w-4 h-4 text-yellow-400" />);
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <IoStarOutline key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
      );
    }

    return stars;
  };

  const getRatingValue = (rating) => {
    if (!rating) return 0;
    return typeof rating === "number" ? rating : rating.average || 0;
  };

  const formatPrice = (price) => {
    if (typeof price === "string") return price;
    if (typeof price === "number") return productUtils.formatPrice(price);
    return productUtils.formatPrice(price || 0);
  };

  const getServiceIcon = (category) => {
    return serviceIcons[category] || serviceIcons["General"];
  };

  const getProductImage = (product) => {
    if (product.image) return product.image;

    // Enhanced product image mapping
    const productName = product.name || "";
    if (productName && productNameToImage[productName]) {
      const imageKey = productNameToImage[productName];
      return productImages[imageKey] || productImages.default;
    }

    return productImages.default;
  };

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

  return (
    <div className="customer-home relative overflow-x-hidden min-h-screen bg-[#0a0e27]">
      {/* UNIFIED BACKGROUND WITH GLOWING CIRCLES */}
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
              {/* Logo - LEFT SIDE */}
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
                      {["Home", "Services", "Products", "Appointments"].map(
                        (item) => {
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
                        }
                      )}
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
                      <span className="hidden sm:inline relative z-10 text-white">
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

        {/* Profile Overlay */}
        <Profile isOpen={isProfileOverlayOpen} onClose={closeProfileOverlay} />

        {/* Bookings Overlay */}
        <Bookings
          isOpen={isBookingsOverlayOpen}
          onClose={closeBookingsOverlay}
        />

        {/* Cart Overlay */}
        <Cart isOpen={isCartOverlayOpen} onClose={closeCartOverlay} />

        {/* Favorites Overlay */}
        <Favorites
          isOpen={isFavoritesOverlayOpen}
          onClose={closeFavoritesOverlay}
        />

        {/* Payment Overlay */}
        <Payment isOpen={isPaymentOverlayOpen} onClose={closePaymentOverlay} />

        {/* Order Overlay */}
        <Order isOpen={isOrderOverlayOpen} onClose={closeOrderOverlay} />

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center px-4 sm:px-6 overflow-hidden pt-20">
          <div className="container mx-auto relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              {/* Heading */}
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-[70px] max-w-[1500px] font-[500] tracking-tight sm:tracking-[-2px] md:tracking-[-3px] lg:tracking-[-4px] text-center leading-tight z-10 mb-6 md:mb-8 break-words">
                <div className="max-w-[1100px] mx-auto">
                  <span className="block sm:inline-block text-white">
                    Welcome {currentUser ? "Back" : ""} to
                    <br />
                    <span className="glow-sweep-multi inline-block">
                      SandreaLee Salon
                    </span>
                  </span>
                </div>
              </div>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 md:mb-12 max-w-3xl mx-auto scroll-fade-up">
                {currentUser
                  ? `Continue your beauty journey, ${
                      currentUser.firstName ||
                      currentUser.username ||
                      "Valued Customer"
                    }`
                  : "Start your beauty journey with our premium services and products"}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={handleBookNow}
                  className="cta-glow-button group relative rounded-full font-semibold transition-all duration-500 overflow-hidden transform hover:scale-105 active:scale-95 touch-manipulation
                  px-8 py-4 text-base
                  sm:px-10 sm:py-4 sm:text-lg
                  md:px-12 md:py-5"
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
                    {currentUser
                      ? "Book Your Next Appointment"
                      : "Book Appointment Now"}
                  </span>
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: "linear-gradient(to left, #76C4FF, #0348D3)",
                    }}
                  />
                </button>

                <button
                  onClick={() => navigate("/customer/services")}
                  className="group relative rounded-full font-semibold transition-all duration-500 overflow-hidden transform hover:scale-105 active:scale-95 touch-manipulation
                  px-8 py-4 text-base border-2 border-white/50
                  sm:px-10 sm:py-4 sm:text-lg
                  md:px-12 md:py-5 hover:border-white hover:bg-white/10"
                  style={{
                    background: "transparent",
                    color: "#fff",
                  }}>
                  <span className="relative z-10 font-bold tracking-wide">
                    Explore Services
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Services Section - ONLY 3 SERVICES */}
        <section className="relative py-16 sm:py-20 md:py-24 overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            {/* Section Header */}
            <div className="text-center mb-12 sm:mb-16 scroll-reveal">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Featured{" "}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Services
                </span>
              </h2>
              <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
                Discover our most popular and highly-rated salon services
              </p>
            </div>

            {/* Services Grid - RESPONSIVE LAYOUT */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
                <span className="ml-4 text-white">
                  Loading featured services...
                </span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-yellow-400 text-lg mb-4">{error}</p>
                <p className="text-gray-300 text-sm mb-4">
                  Showing sample data. Check console for details.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-full text-white transition-colors">
                  Try Again
                </button>
              </div>
            ) : featuredServices.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">
                  No featured services available
                </p>
                <p className="text-gray-500 text-sm">Please check back later</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
                {featuredServices.slice(0, 3).map((service, index) => (
                  <div
                    key={service._id}
                    className={`group service-card scroll-reveal rounded-2xl p-5 sm:p-6 transition-all duration-500 hover:scale-[1.02] shadow-xl cursor-pointer active:scale-95 touch-manipulation service-card-mobile`}
                    onClick={() => handleServiceBook(service._id)}>
                    {/* Service Header with Icon */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-cyan-500/20 flex items-center justify-center service-icon flex-shrink-0">
                          {getServiceIcon(service.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 break-words">
                            {service.name}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1 flex-wrap">
                            <div className="flex items-center space-x-1">
                              {renderStarRating(getRatingValue(service.rating))}
                            </div>
                            <span className="text-xs sm:text-sm text-gray-300 whitespace-nowrap">
                              ({getRatingValue(service.rating).toFixed(1)})
                            </span>
                          </div>
                        </div>
                      </div>
                      {service.isPromo && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2">
                          PROMO
                        </span>
                      )}
                    </div>

                    {/* Service Details */}
                    <div className="space-y-3 sm:space-y-3 mb-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-300 flex items-center gap-1 whitespace-nowrap">
                          <IoTime className="w-4 h-4 flex-shrink-0" />
                          <span>Duration:</span>
                        </span>
                        <span className="text-white font-medium text-sm sm:text-base ml-2">
                          {service.duration}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-300 flex items-center gap-1 whitespace-nowrap">
                          <IoCash className="w-4 h-4 flex-shrink-0" />
                          <span>Price:</span>
                        </span>
                        <span className="text-cyan-400 font-bold text-lg sm:text-xl">
                          {service.priceRange}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-300 text-sm mb-4 sm:mb-6 line-clamp-3 min-h-[4rem] break-words">
                      {service.description ||
                        "Professional salon service with premium care"}
                    </p>

                    {/* Book Button */}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-700/50">
                      <span className="text-xs sm:text-sm text-gray-400 flex items-center gap-1 whitespace-nowrap">
                        <IoPeople className="w-4 h-4 flex-shrink-0" />
                        <span>{service.totalBookings || 0} bookings</span>
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleServiceBook(service._id);
                        }}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-2 px-4 sm:py-3 sm:px-6 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-2 text-sm sm:text-base touch-manipulation min-h-[44px]">
                        <IoCalendar className="w-4 h-4" />
                        <span>Book Now</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* View All Services Button */}
            <div className="text-center mt-8 sm:mt-12 scroll-reveal">
              <button
                onClick={() => navigate("/customer/services")}
                className="group relative overflow-hidden rounded-full font-semibold transition-all duration-500 shadow-xl hover:shadow-cyan-500/25 transform hover:scale-105 active:scale-95 px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg border-2 border-cyan-400/50 hover:border-cyan-400 bg-transparent text-cyan-400 hover:bg-cyan-400/10 touch-manipulation">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  View All Services
                  <IoChevronForward className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Featured Products Section - ONLY 2 PRODUCTS */}
        <section className="relative py-16 sm:py-20 md:py-24 overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            {/* Section Header */}
            <div className="text-center mb-12 sm:mb-16 scroll-reveal">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Featured{" "}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Products
                </span>
              </h2>
              <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
                Shop our curated collection of professional hair care products
              </p>
            </div>

            {/* Products Grid - ONLY 2 PRODUCTS */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
                <span className="ml-4 text-white">
                  Loading featured products...
                </span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-yellow-400 text-lg mb-4">{error}</p>
                <p className="text-gray-300 text-sm">Showing sample products</p>
              </div>
            ) : featuredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">
                  No featured products available
                </p>
                <p className="text-gray-500 text-sm">Please check back later</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
                {featuredProducts.slice(0, 2).map((product, index) => (
                  <div
                    key={product._id}
                    className={`group product-card scroll-reveal rounded-3xl p-6 transition-all duration-500 hover:scale-[1.02] shadow-2xl cursor-pointer active:scale-98 touch-manipulation`}
                    onClick={() => handleProductPurchase(product._id)}>
                    {/* Product Image and Details Layout */}
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <div className="w-full lg:w-48 h-48 rounded-2xl overflow-hidden bg-white/5 flex items-center justify-center">
                          <img
                            src={getProductImage(product)}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                              console.error(
                                `Failed to load image for product: ${product.name}`
                              );
                              e.target.src = productImages.default;
                              // If default also fails, show a placeholder
                              e.target.onerror = () => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              };
                            }}
                          />
                          {/* Fallback placeholder */}
                          <div className="hidden w-full h-full items-center justify-center bg-gray-700/50">
                            <IoBag className="w-12 h-12 text-gray-400" />
                          </div>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 flex flex-col">
                        {/* Product Header */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2 mb-2">
                              {product.name}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1">
                                {renderStarRating(
                                  getRatingValue(product.rating)
                                )}
                              </div>
                              <span className="text-sm text-gray-300">
                                ({getRatingValue(product.rating).toFixed(1)})
                              </span>
                              <span className="text-sm text-gray-400">
                                • {product.rating?.totalRaters || 0} reviews
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Price and Category */}
                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-3xl font-bold text-purple-400">
                              {product.priceDisplay ||
                                formatPrice(product.price)}
                            </span>
                            <span className="text-xs px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-400/30">
                              {product.category}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-gray-300 text-sm mb-6 line-clamp-3 flex-1">
                          {product.description}
                        </p>

                        {/* Add to Cart Button */}
                        <div className="flex justify-between items-center pt-2">
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            {product.inStock ? (
                              <span className="flex items-center gap-1 text-green-400">
                                <IoCheckmarkCircle className="w-4 h-4" />
                                In Stock
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-red-400">
                                <IoCloseCircle className="w-4 h-4" />
                                Out of Stock
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProductPurchase(product._id);
                            }}
                            disabled={!product.inStock}
                            className={`font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-2 touch-manipulation ${
                              product.inStock
                                ? "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25"
                                : "bg-gray-600 text-gray-400 cursor-not-allowed"
                            }`}>
                            <IoCart className="w-5 h-5" />
                            {product.inStock ? "Add to Cart" : "Out of Stock"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* View All Products Button */}
            <div className="text-center mt-12 scroll-reveal">
              <button
                onClick={() => navigate("/customer/products")}
                className="group relative overflow-hidden rounded-full font-semibold transition-all duration-500 shadow-xl hover:shadow-purple-500/25 transform hover:scale-105 active:scale-95 px-8 py-4 text-lg border-2 border-purple-400/50 hover:border-purple-400 bg-transparent text-purple-400 hover:bg-purple-400/10 touch-manipulation">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  View All Products
                  <IoChevronForward className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Quick Booking CTA Section */}
        <section className="relative py-20 sm:py-24 md:py-28 overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center scroll-zoom">
              <div className="bg-gradient-to-br from-slate-900/60 via-blue-900/40 to-cyan-900/40 backdrop-blur-sm rounded-3xl p-8 sm:p-12 md:p-16 border border-white/10 shadow-2xl">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
                  Ready for Your Next
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    {" "}
                    Transformation?
                  </span>
                </h2>
                <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                  Book your appointment now and experience the SandreaLee
                  difference
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleBookNow}
                    className="cta-glow-button group relative rounded-full font-semibold transition-all duration-500 overflow-hidden transform hover:scale-105 active:scale-95 px-8 py-4 text-lg touch-manipulation"
                    style={{
                      background: "linear-gradient(to right, #76C4FF, #0348D3)",
                      color: "#000",
                    }}>
                    <span className="relative z-10 font-bold">
                      Book Appointment
                    </span>
                  </button>
                  <button
                    onClick={() => navigate("/customer/contact")}
                    className="group relative rounded-full font-semibold transition-all duration-500 overflow-hidden transform hover:scale-105 active:scale-95 px-8 py-4 text-lg border-2 border-white/50 hover:border-white hover:bg-white/10 touch-manipulation"
                    style={{
                      background: "transparent",
                      color: "#fff",
                    }}>
                    <span className="relative z-10">Contact Us</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

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
                      className="flex items-center justify-center space-x-3 bg-white hover:bg-gray-100 text-black rounded-xl px-5 py-3 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg w-full max-w-[200px] touch-manipulation">
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
                      className="flex items-center justify-center space-x-3 bg-white hover:bg-gray-100 text-black rounded-xl px-5 py-3 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg w-full max-w-[200px] touch-manipulation">
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

                {/* Quick Links */}
                <div className="scroll-reveal scroll-stagger-1">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-4 pb-2">
                    Quick links
                  </h3>
                  <ul className="space-y-2.5">
                    <li>
                      <button
                        onClick={() => navigate("/customer/home")}
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-sm text-left">
                        Home
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigate("/customer/services")}
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-sm text-left">
                        Services
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigate("/customer/products")}
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-sm text-left">
                        Products
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigate("/customer/appointment")}
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-sm text-left">
                        Appointment
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
    </div>
  );
};

export default CustomerHome;
