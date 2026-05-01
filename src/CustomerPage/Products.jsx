// src/CustomerPage/Products.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import salonLogo from "../assets/SandreaLeeSalonLogoCapstone.png";
import starIcon from "../assets/icons/star.png";
import starHalfIcon from "../assets/icons/star_half.png";
import {
  productsAPI,
  handleApiError,
  productUtils,
  favoritesAPI,
  cartAPI,
  getCurrentUser,
  logout,
  customerProfile,
  customerUtils,
} from "../services/api";

// Import product images with correct names
import TressfinityKeratinArganMorocco from "../assets/TressfinityKeratinArganMorocco.png";
import TressfinityPurpleMask from "../assets/Tressfinity Purple Mask.png";
import TressfinityPurpleShampooConditioner from "../assets/Tressfinity Purple Shampoo & Conditioner.png";
import TressfinitySulfateFreeShampooConditioner from "../assets/Tressfinity Sulfate Free Shampoo & Conditioner.png";

// React Icons for profile menu and hamburger
import {
  IoPersonCircle,
  IoCalendar,
  IoCart,
  IoHeart,
  IoCash,
  IoBag,
  IoLogOut,
  IoChevronDown,
  IoChevronForward,
  IoMenu,
  IoClose,
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
} from "react-icons/io5";

// Import your overlay components
import Profile from "../menu/Profile";
import Bookings from "../menu/Bookings";
import Cart from "../menu/Cart";
import Favorites from "../menu/Favorites";
import Payment from "../menu/Payment";
import Order from "../menu/Order";

// Simple inline ToastContainer component
const ToastContainer = ({ toasts = [], removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-6 py-4 rounded-xl shadow-2xl text-white font-medium max-w-sm transform transition-all duration-300 ${
            toast.type === "success"
              ? "bg-gradient-to-r from-green-500 to-green-600"
              : toast.type === "error"
              ? "bg-gradient-to-r from-red-500 to-red-600"
              : toast.type === "warning"
              ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
              : "bg-gradient-to-r from-blue-500 to-blue-600"
          } animate-in slide-in-from-right-full`}
          onAnimationEnd={() =>
            setTimeout(() => removeToast(toast.id), toast.duration)
          }>
          <div className="flex items-center space-x-2">
            {toast.type === "success" && (
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            )}
            {toast.type === "error" && (
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const ProductsPage = () => {
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState("Products");
  const [slideDirection, setSlideDirection] = useState("right");
  const [isAnimating, setIsAnimating] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfileImage, setUserProfileImage] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Overlay states - COPIED FROM HOME.JSX
  const [isProfileOverlayOpen, setIsProfileOverlayOpen] = useState(false);
  const [isBookingsOverlayOpen, setIsBookingsOverlayOpen] = useState(false);
  const [isCartOverlayOpen, setIsCartOverlayOpen] = useState(false);
  const [isFavoritesOverlayOpen, setIsFavoritesOverlayOpen] = useState(false);
  const [isPaymentOverlayOpen, setIsPaymentOverlayOpen] = useState(false);
  const [isOrderOverlayOpen, setIsOrderOverlayOpen] = useState(false);

  const navItems = ["Home", "Services", "Products", "Appointments"];

  // Refs for the menu and button to detect clicks outside
  const profileMenuRef = useRef(null);
  const profileButtonRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Mock product data with CORRECT image assignments
  const mockProducts = [
    {
      id: 1,
      _id: "1",
      name: "Tressfinity Keratin Argan Morocco",
      price: 1299,
      rating: { average: 4.8, totalRaters: 829 },
      reviewCount: "829",
      image: TressfinityKeratinArganMorocco,
      category: "Hair Treatment",
      inStock: true,
      description:
        "Advanced keratin treatment with argan oil for smooth, shiny hair",
    },
    {
      id: 2,
      _id: "2",
      name: "Tressfinity Sulfate Free Shampoo & Conditioner",
      price: 899,
      rating: { average: 4.5, totalRaters: 1829 },
      reviewCount: "1829",
      image: TressfinitySulfateFreeShampooConditioner,
      category: "Shampoo & Conditioner",
      inStock: true,
      description: "Gentle sulfate-free formula for daily hair care",
    },
    {
      id: 3,
      _id: "3",
      name: "Tressfinity Purple Shampoo & Conditioner",
      price: 949,
      rating: { average: 4.5, totalRaters: 1829 },
      reviewCount: "1829",
      image: TressfinityPurpleShampooConditioner,
      category: "Shampoo & Conditioner",
      inStock: true,
      description:
        "Purple formula to neutralize brassiness in blonde and gray hair",
    },
    {
      id: 4,
      _id: "4",
      name: "Tressfinity Purple Mask",
      price: 1199,
      rating: { average: 4.7, totalRaters: 1245 },
      reviewCount: "1245",
      image: TressfinityPurpleMask,
      category: "Hair Mask",
      inStock: false,
      description: "Intensive purple conditioning mask for color-treated hair",
    },
  ];

  // Toast notification function
  const showToast = (message, type = "success", duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    // Auto-remove toast after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // COPIED FROM HOME.JSX: Toggle mobile menu function
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // COPIED FROM HOME.JSX: Close mobile menu function
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // COPIED FROM HOME.JSX: Handle tab change with mobile menu support
  const handleTabChange = (newTab) => {
    if (newTab === activeTab || isAnimating) return;

    const currentIndex = navItems.indexOf(activeTab);
    const newIndex = navItems.indexOf(newTab);
    setSlideDirection(newIndex > currentIndex ? "right" : "left");
    setIsAnimating(true);

    // Set active tab immediately to prevent glitch
    setActiveTab(newTab);

    // Navigate after a very short delay to ensure smooth transition
    setTimeout(() => {
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

      // Reset animation state
      setTimeout(() => setIsAnimating(false), 100);
    }, 50);

    closeMobileMenu();
  };

  // COPIED FROM HOME.JSX: Quick links navigation functions
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

  // COPIED FROM HOME.JSX: Handle download app function
  const handleDownloadApp = (userType) => {
    console.log(`Download app for ${userType}`);
    alert(`App download for ${userType} - This feature is coming soon!`);
  };

  // COPIED FROM HOME.JSX: Check if user is logged in and load profile
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const user = getCurrentUser();
        console.log("👤 Current User:", user);
        setCurrentUser(user);

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

        // Mark as initialized to prevent glitches
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing app:", error);
        setIsInitialized(true); // Still mark as initialized even on error
      }
    };

    initializeApp();
  }, []);

  // COPIED FROM HOME.JSX: Prevent body scroll when mobile menu is open
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

  // COPIED FROM HOME.JSX: Close menu when clicking outside - IMPROVED VERSION
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
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isProfileMenuOpen, isMobileMenuOpen]);

  // COPIED FROM HOME.JSX: Close menu on escape key
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

  // Detect scroll to change header color
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setScrolled(scrollTop > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeProfileMenu = () => {
    setIsProfileMenuOpen(false);
  };

  // COPIED FROM HOME.JSX: Overlay control functions
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

  // COPIED FROM HOME.JSX: Profile menu actions
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

  // COPIED FROM HOME.JSX: Handle logout
  const handleLogout = () => {
    logout();
    navigate("/role-selection");
  };

  const handleLoginSignup = (e) => {
    if (e) e.stopPropagation();
    closeProfileMenu();
    closeMobileMenu();
    navigate("/role-selection");
  };

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

  // COPIED FROM HOME.JSX: Get user profile image or initials
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

  // COPIED FROM HOME.JSX: Profile menu items with icons
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
    {
      key: "cart",
      label: "Cart",
      icon: <IoCart className="w-5 h-5" />,
    },
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

  // Fetch real products from API - OPTIMIZED
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = {};
      if (selectedCategory !== "all") {
        filters.category = selectedCategory;
      }
      if (searchQuery) {
        filters.q = searchQuery;
      }
      if (sortBy) {
        filters.sortBy = sortBy;
      }

      const response = await productsAPI.getAll(filters);

      if (response.data && response.data.success) {
        const productsData = response.data.data || response.data.products;

        // Assign proper images to products based on name matching
        const productsWithImages = productsData.map((product) => {
          // Find matching mock product by name
          const mockProduct = mockProducts.find(
            (mock) =>
              product.name &&
              mock.name &&
              product.name
                .toLowerCase()
                .includes(
                  mock.name.toLowerCase().replace("tressfinity", "").trim()
                )
          );

          return {
            ...product,
            image: mockProduct?.image || TressfinityKeratinArganMorocco,
          };
        });

        setProducts(productsWithImages);

        // Extract categories from products if categories API fails
        if (productsData && productsData.length > 0) {
          const uniqueCategories = [
            ...new Set(
              productsData
                .filter((product) => product.category)
                .map((product) => product.category)
            ),
          ];
          if (uniqueCategories.length > 0) {
            setCategories(uniqueCategories);
          }
        }
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      const apiError = handleApiError(err);
      setError(apiError.message || "Failed to load products. Using demo data.");

      // Fallback to mock data
      setProducts(mockProducts);
      const uniqueCategories = [
        ...new Set(mockProducts.map((product) => product.category)),
      ];
      setCategories(uniqueCategories);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, sortBy]);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      if (response.data && response.data.success) {
        const categoriesData = response.data.data || response.data.categories;
        if (categoriesData && categoriesData.length > 0) {
          setCategories(categoriesData);
        }
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      // Fallback to extracting from mock products
      const uniqueCategories = [
        ...new Set(mockProducts.map((product) => product.category)),
      ];
      setCategories(uniqueCategories);
    }
  };

  // Load user favorites
  const loadUserFavorites = async () => {
    const user = getCurrentUser();
    if (!user) return;

    try {
      const response = await favoritesAPI.getAll();
      if (response.data && response.data.success) {
        const favoriteItems =
          response.data.data || response.data.favorites || [];
        const favoriteIds = new Set(
          favoriteItems.map((item) => item.productId || item._id)
        );
        setFavorites(favoriteIds);
      }
    } catch (err) {
      console.error("Error loading favorites:", err);
    }
  };

  // Load user cart items
  const loadUserCart = async () => {
    const user = getCurrentUser();
    if (!user) return;

    try {
      const response = await cartAPI.get();
      if (response.data && response.data.success) {
        const cartItemsData = response.data.items || [];
        setCartItems(cartItemsData);
      }
    } catch (err) {
      console.error("Error loading cart:", err);
    }
  };

  // Initialize data fetching - OPTIMIZED TO PREVENT GLITCHES
  useEffect(() => {
    if (!isInitialized) return;

    const initializeData = async () => {
      await Promise.all([
        fetchProducts(),
        fetchCategories(),
        loadUserFavorites(),
        loadUserCart(),
      ]);
    };

    initializeData();
  }, [fetchProducts, isInitialized]);

  // Real-time updates with polling
  useEffect(() => {
    if (!isInitialized) return;

    // Clear existing interval
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }

    // Set up new interval for real-time updates
    const interval = setInterval(() => {
      fetchProducts();
      loadUserCart();
    }, 30000); // Refresh every 30 seconds

    setRefreshInterval(interval);

    // Cleanup on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [fetchProducts, isInitialized]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handleSortChange = (sortType) => {
    setSortBy(sortType);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleClearFilters = () => {
    setSelectedCategory("all");
    setSearchQuery("");
    setSortBy("newest");
  };

  // Add to Cart with complete product data
  const handleAddToCart = async (product, e) => {
    if (e) e.stopPropagation();

    if (!product.inStock) {
      showToast("This product is currently out of stock", "error");
      return;
    }

    try {
      const productId = product.id || product._id;

      // Prepare complete product data for API
      const completeProductData = {
        _id: productId,
        name: product.name || "Unknown Product",
        price: product.price || 0,
        image: product.image || TressfinityKeratinArganMorocco,
        description: product.description || "No description available",
        category: product.category || "Uncategorized",
        rating: product.rating || { average: 0, totalRaters: 0 },
        inStock: product.inStock !== false,
        reviewCount: product.reviewCount || 0,
      };

      console.log("🛒 Adding to cart with product data:", completeProductData);

      // Add to cart via API with complete product data
      const response = await cartAPI.add({
        productId: productId,
        quantity: 1,
        productData: completeProductData,
      });

      if (response.data && response.data.success) {
        // Update local cart state with complete product data
        setCartItems((prev) => {
          const existingItem = prev.find((item) => item.id === productId);
          if (existingItem) {
            return prev.map((item) =>
              item.id === productId
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          }
          return [
            ...prev,
            { ...completeProductData, id: productId, quantity: 1 },
          ];
        });

        // Show success toast
        showToast(`✅ Added ${product.name} to cart!`, "success");
      } else {
        throw new Error("Failed to add to cart via API");
      }
    } catch (err) {
      console.error("Error adding to cart:", err);

      // Fallback to local cart with complete data
      const productId = product.id || product._id;
      const completeProductData = {
        _id: productId,
        name: product.name || "Unknown Product",
        price: product.price || 0,
        image: product.image || TressfinityKeratinArganMorocco,
        description: product.description || "No description available",
        category: product.category || "Uncategorized",
        rating: product.rating || { average: 0, totalRaters: 0 },
        inStock: product.inStock !== false,
        reviewCount: product.reviewCount || 0,
      };

      setCartItems((prev) => {
        const existingItem = prev.find((item) => item.id === productId);
        if (existingItem) {
          return prev.map((item) =>
            item.id === productId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [
          ...prev,
          { ...completeProductData, id: productId, quantity: 1 },
        ];
      });

      showToast(`✅ Added ${product.name} to cart!`, "success");
    }
  };

  // Favorite function with complete product data
  const handleFavorite = async (productId, e) => {
    if (e) e.stopPropagation();

    const isLoggedIn = localStorage.getItem("token");
    if (!isLoggedIn) {
      showToast("Please login to add favorites", "warning");
      navigate("/role-selection");
      return;
    }

    try {
      const product = products.find((p) => (p.id || p._id) === productId);
      const isCurrentlyFavorite = favorites.has(productId);

      if (isCurrentlyFavorite) {
        // Remove from favorites
        const response = await favoritesAPI.remove(productId);
        if (response.data && response.data.success) {
          setFavorites((prev) => {
            const newFavorites = new Set(prev);
            newFavorites.delete(productId);
            return newFavorites;
          });
          showToast("Removed from favorites", "success");
        }
      } else {
        // Prepare complete product data for favorites
        const completeProductData = {
          _id: productId,
          name: product?.name || "Unknown Product",
          price: product?.price || 0,
          image: product?.image || TressfinityKeratinArganMorocco,
          description: product?.description || "No description available",
          category: product?.category || "Uncategorized",
          rating: product?.rating || { average: 0, totalRaters: 0 },
          inStock: product?.inStock !== false,
          reviewCount: product?.reviewCount || 0,
        };

        console.log(
          "❤️ Adding to favorites with product data:",
          completeProductData
        );

        // Add to favorites with complete product data
        const response = await favoritesAPI.add({
          productId: productId,
          productData: completeProductData,
        });

        if (response.data && response.data.success) {
          setFavorites((prev) => {
            const newFavorites = new Set(prev);
            newFavorites.add(productId);
            return newFavorites;
          });
          showToast("Added to favorites!", "success");
        }
      }
    } catch (err) {
      console.error("Error updating favorites:", err);
      // Fallback to local state
      setFavorites((prev) => {
        const newFavorites = new Set(prev);
        if (newFavorites.has(productId)) {
          newFavorites.delete(productId);
          showToast("Removed from favorites", "success");
        } else {
          newFavorites.add(productId);
          showToast("Added to favorites!", "success");
        }
        return newFavorites;
      });
    }
  };

  // Filter and sort products
  const filteredAndSortedProducts = React.useMemo(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) =>
          product.category &&
          product.category
            .toLowerCase()
            .includes(selectedCategory.toLowerCase())
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          (product.name && product.name.toLowerCase().includes(query)) ||
          (product.description &&
            product.description.toLowerCase().includes(query)) ||
          (product.category && product.category.toLowerCase().includes(query))
      );
    }

    // Sort products
    return productUtils.sortProducts(filtered, sortBy);
  }, [products, selectedCategory, searchQuery, sortBy]);

  // Star rating component
  const StarRating = ({ rating }) => {
    const numericRating =
      typeof rating === "number" ? rating : rating?.average || 0;
    const { fullStars, halfStar, emptyStars } =
      productUtils.generateStarRating(numericRating);

    return (
      <div className="star-rating flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <img
            key={`full-${i}`}
            src={starIcon}
            alt="★"
            className="star w-4 h-4"
          />
        ))}
        {halfStar && (
          <img src={starHalfIcon} alt="½" className="star w-4 h-4" />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <img
            key={`empty-${i}`}
            src={starIcon}
            alt="☆"
            className="star w-4 h-4 opacity-30"
          />
        ))}
        <span className="rating-value ml-2 text-sm text-gray-300">
          {numericRating.toFixed(1)}
        </span>
      </div>
    );
  };

  // Product card component
  const ProductCard = ({ product, index }) => {
    const productId = product.id || product._id;
    const isFavorite = favorites.has(productId);

    return (
      <div
        className={`product-card scroll-reveal rounded-2xl p-4 sm:p-6 bg-slate-800/30 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] ${
          !product.inStock ? "opacity-60" : ""
        }`}
        style={{ animationDelay: `${index * 0.1}s` }}>
        <div className="flex flex-col h-full">
          <div className="flex-1">
            {/* Product Image */}
            <div className="relative">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-40 sm:h-48 object-contain mb-3 sm:mb-4 rounded-xl bg-white/5 p-2 sm:p-4"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = TressfinityKeratinArganMorocco;
                  e.target.classList.add("object-contain", "p-2");
                }}
              />

              {/* Favorite Button */}
              <button
                onClick={(e) => handleFavorite(productId, e)}
                className={`absolute top-2 right-2 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 touch-manipulation ${
                  isFavorite
                    ? "bg-red-500/90 text-white"
                    : "bg-white/20 text-white/70 hover:bg-white/30"
                } backdrop-blur-sm`}>
                <svg
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    isFavorite ? "fill-current" : ""
                  }`}
                  viewBox="0 0 24 24"
                  stroke={isFavorite ? "none" : "currentColor"}
                  strokeWidth={isFavorite ? 0 : 2}>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>

              {/* Stock Status Badge */}
              {!product.inStock && (
                <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-semibold">
                  Out of Stock
                </div>
              )}

              {/* Category Badge */}
              {product.category && (
                <div className="absolute bottom-2 left-2 bg-blue-500/80 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                  {product.category}
                </div>
              )}
            </div>

            <h3 className="product-title text-white text-lg sm:text-xl font-semibold mb-2 sm:mb-3 line-clamp-2 min-h-[3.5rem]">
              {product.name}
            </h3>

            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <StarRating rating={product.rating} />
              <span className="rating-count text-gray-400 text-xs sm:text-sm">
                {(product.rating && product.rating.totalRaters) ||
                  product.reviewCount ||
                  0}{" "}
                reviews
              </span>
            </div>

            {/* Product Description */}
            {product.description && (
              <p className="text-gray-300 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2 min-h-[2.5rem]">
                {product.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-white/10">
            <span className="product-price text-xl sm:text-2xl font-bold text-white">
              {productUtils.formatPrice(product.price)}
            </span>
            <div className="flex gap-2">
              <button
                onClick={(e) => handleAddToCart(product, e)}
                disabled={!product.inStock}
                className={`px-3 py-2 sm:px-4 sm:py-3 rounded-full font-semibold text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 touch-manipulation active:scale-95 ${
                  !product.inStock
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:shadow-lg"
                }`}
                style={{
                  background: product.inStock
                    ? "linear-gradient(to right, #76C4FF, #0348D3)"
                    : "linear-gradient(to right, #666, #333)",
                  color: product.inStock ? "#000" : "#999",
                  minWidth: "100px",
                }}>
                {product.inStock ? "Add to Cart" : "Out of Stock"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced scroll reveal effect - FIXED GLITCH
  useEffect(() => {
    if (!isInitialized) return;

    const scrollReveal = () => {
      const reveals = document.querySelectorAll(".scroll-reveal");
      const windowHeight = window.innerHeight;
      const elementVisible = 150;

      reveals.forEach((element) => {
        const elementTop = element.getBoundingClientRect().top;

        if (elementTop < windowHeight - elementVisible) {
          element.classList.add("scroll-reveal-visible");
        } else {
          // Remove the class when element is out of view to prevent glitches
          element.classList.remove("scroll-reveal-visible");
        }
      });
    };

    // Initial reveal after a short delay to prevent glitch
    const initialTimer = setTimeout(() => {
      scrollReveal();
    }, 100);

    window.addEventListener("scroll", scrollReveal);

    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener("scroll", scrollReveal);
    };
  }, [isInitialized]);

  // Preload images to prevent flickering
  useEffect(() => {
    if (!isInitialized) return;

    const preloadImages = () => {
      const imageUrls = [
        TressfinityKeratinArganMorocco,
        TressfinityPurpleMask,
        TressfinityPurpleShampooConditioner,
        TressfinitySulfateFreeShampooConditioner,
      ];

      imageUrls.forEach((url) => {
        const img = new Image();
        img.src = url;
      });
    };

    preloadImages();
  }, [isInitialized]);

  return (
    <div className="relative overflow-x-hidden min-h-screen bg-[#0a0e27]">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* COPIED FROM HOME.JSX: Overlay Components */}
      <Profile isOpen={isProfileOverlayOpen} onClose={closeProfileOverlay} />
      <Bookings isOpen={isBookingsOverlayOpen} onClose={closeBookingsOverlay} />
      <Cart isOpen={isCartOverlayOpen} onClose={closeCartOverlay} />
      <Favorites
        isOpen={isFavoritesOverlayOpen}
        onClose={closeFavoritesOverlay}
      />
      <Payment isOpen={isPaymentOverlayOpen} onClose={closePaymentOverlay} />
      <Order isOpen={isOrderOverlayOpen} onClose={closeOrderOverlay} />

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
        {/* COPIED FROM HOME.JSX: Header / Navigation with Hamburger Menu */}
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

              {/* Mobile Cart & Favorites Buttons - Visible on mobile */}
              <div className="flex lg:hidden items-center space-x-2 mr-2">
                {/* Cart Button */}
                <button
                  onClick={openCartOverlay}
                  className="relative p-2 text-white hover:text-cyan-300 transition-colors duration-300 touch-manipulation">
                  <IoCart className="w-5 h-5" />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                      {cartItems.reduce(
                        (total, item) => total + item.quantity,
                        0
                      )}
                    </span>
                  )}
                </button>

                {/* Favorites Button */}
                <button
                  onClick={openFavoritesOverlay}
                  className="relative p-2 text-white hover:text-cyan-300 transition-colors duration-300 touch-manipulation">
                  <IoHeart className="w-5 h-5" />
                  {favorites.size > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                      {favorites.size}
                    </span>
                  )}
                </button>
              </div>

              {/* Profile Menu & Hamburger Menu Button - RIGHT SIDE */}
              <div className="flex items-center space-x-2">
                {/* Profile Menu Button - Hidden on mobile when hamburger is shown */}
                {currentUser ? (
                  <div className="hidden lg:block">
                    <button
                      ref={profileButtonRef}
                      onClick={toggleProfileMenu}
                      className="relative px-4 py-2 rounded-full font-bold text-sm transition-all duration-300 overflow-hidden flex items-center space-x-2 z-50 flex-shrink-0 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 touch-manipulation"
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
                      className="relative px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 overflow-hidden flex items-center space-x-2 z-50 flex-shrink-0 touch-manipulation"
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
                  className="lg:hidden mobile-menu-button relative p-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 touch-manipulation active:scale-95"
                  onClick={toggleMobileMenu}
                  aria-label="Toggle menu">
                  {isMobileMenuOpen ? (
                    <IoClose className="w-5 h-5 text-white" />
                  ) : (
                    <IoMenu className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* COPIED FROM HOME.JSX: Mobile Menu Overlay - RIGHT SIDE with Scroll */}
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
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors touch-manipulation"
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
                          className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 touch-manipulation active:scale-95 ${
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
                        className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200 text-left touch-manipulation active:scale-95">
                        <span className="text-gray-400">{item.icon}</span>
                        <span className="flex-1 font-medium">{item.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Mobile Logout Button */}
                  {currentUser && (
                    <button
                      onClick={(e) => handleProfileAction("logout", e)}
                      className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-red-400 hover:bg-red-400/10 transition-all duration-200 text-left border border-red-400/20 hover:border-red-400/40 mt-4 touch-manipulation active:scale-95">
                      <IoLogOut className="w-5 h-5" />
                      <span className="flex-1 font-medium">Logout</span>
                    </button>
                  )}

                  {/* Mobile Login/Signup Button */}
                  {!currentUser && (
                    <button
                      onClick={handleLoginSignup}
                      className="w-full mt-4 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium transition-all duration-200 hover:from-blue-600 hover:to-purple-700 touch-manipulation active:scale-95">
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
                className="w-full px-6 py-3 rounded-full font-semibold text-white border-2 border-white/50 hover:border-white hover:bg-white/10 transition-all duration-300 touch-manipulation active:scale-95">
                Book Now
              </button>
            </div>
          </div>
        </div>

        {/* COPIED FROM HOME.JSX: Profile Menu Dropdown */}
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
                    className="flex items-center space-x-3 w-full px-3 py-3 rounded-lg text-white hover:bg-white/5 transition-all duration-200 hover:scale-105 transform text-left touch-manipulation active:scale-95">
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
                  className="flex items-center space-x-3 w-full px-3 py-3 rounded-lg text-red-400 hover:bg-red-400/10 transition-all duration-200 hover:scale-105 transform text-left border border-red-400/20 hover:border-red-400/40 touch-manipulation active:scale-95">
                  <IoLogOut className="w-5 h-5" />
                  <span className="flex-1 font-medium">Logout</span>
                </button>
              </div>

              {/* Quick Action - Book Now */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleBookNow}
                  className="w-full px-8 py-3 rounded-full font-semibold text-sm transition-all border-2 border-white/50 hover:border-white hover:bg-white/10 hover:scale-105 cursor-pointer transform transition-transform duration-300 touch-manipulation active:scale-95"
                  style={{ background: "transparent", color: "#fff" }}>
                  Book Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Section */}
        <section className="pt-28 sm:pt-32 pb-20 px-4 sm:px-6">
          <div className="container mx-auto max-w-6xl">
            {/* Section Header */}
            <div className="text-center mb-8 sm:mb-12 scroll-reveal">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
                Our{" "}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Products
                </span>
              </h1>
              <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto px-4">
                Discover our premium hair care products designed to give you the
                salon experience at home. Real-time inventory updates.
              </p>
            </div>

            {/* Filters and Search */}
            <div className="mb-6 sm:mb-8 scroll-reveal scroll-stagger-1">
              <div className="flex flex-col gap-4 items-stretch sm:items-center justify-between bg-slate-800/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/10">
                {/* Search Bar */}
                <div className="flex-1 w-full">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5"
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

                {/* Category Filter - Scrollable on mobile */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <button
                    onClick={() => handleCategoryChange("all")}
                    className={`px-3 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                      selectedCategory === "all"
                        ? "bg-blue-500 text-white shadow-lg"
                        : "bg-slate-700/50 text-gray-300 hover:bg-slate-600/50"
                    }`}>
                    All Products
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                      className={`px-3 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                        selectedCategory === category
                          ? "bg-blue-500 text-white shadow-lg"
                          : "bg-slate-700/50 text-gray-300 hover:bg-slate-600/50"
                      }`}>
                      {category}
                    </button>
                  ))}
                </div>

                {/* Sort Options */}
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-4 py-3 bg-slate-700/50 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base">
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="name-asc">Name: A-Z</option>
                  <option value="name-desc">Name: Z-A</option>
                </select>
              </div>

              {/* Active Filters Display */}
              {(selectedCategory !== "all" ||
                searchQuery ||
                sortBy !== "newest") && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-300">
                  <span>Active filters:</span>
                  {selectedCategory !== "all" && (
                    <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs">
                      Category: {selectedCategory}
                      <button
                        onClick={() => setSelectedCategory("all")}
                        className="ml-1 text-blue-100 hover:text-white">
                        ×
                      </button>
                    </span>
                  )}
                  {searchQuery && (
                    <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs">
                      Search: "{searchQuery}"
                      <button
                        onClick={() => setSearchQuery("")}
                        className="ml-1 text-green-100 hover:text-white">
                        ×
                      </button>
                    </span>
                  )}
                  {sortBy !== "newest" && (
                    <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full text-xs">
                      Sorted by: {sortBy.replace("-", " ")}
                      <button
                        onClick={() => setSortBy("newest")}
                        className="ml-1 text-purple-100 hover:text-white">
                        ×
                      </button>
                    </span>
                  )}
                  <button
                    onClick={handleClearFilters}
                    className="text-gray-400 hover:text-white underline text-xs">
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-16 sm:py-20">
                <div className="text-white text-base sm:text-lg flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
                  Loading products...
                </div>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center py-16 sm:py-20">
                <div className="text-center max-w-md px-4">
                  <div className="text-yellow-400 text-base sm:text-lg mb-3 sm:mb-4">
                    ⚠️ {error}
                  </div>
                  <p className="text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4">
                    Showing demo products. Some features may be limited.
                  </p>
                  <button
                    onClick={fetchProducts}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors font-semibold text-sm sm:text-base touch-manipulation">
                    Retry Connection
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Results Count */}
                <div className="mb-4 sm:mb-6 scroll-reveal scroll-stagger-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                    <p className="text-gray-300 text-sm sm:text-base">
                      Showing{" "}
                      <span className="text-white font-semibold">
                        {filteredAndSortedProducts.length}
                      </span>{" "}
                      product{filteredAndSortedProducts.length !== 1 ? "s" : ""}
                      {selectedCategory !== "all" && ` in `}
                      {selectedCategory !== "all" && (
                        <span className="text-blue-300 font-semibold">
                          {selectedCategory}
                        </span>
                      )}
                      {searchQuery && ` for `}
                      {searchQuery && (
                        <span className="text-green-300 font-semibold">
                          "{searchQuery}"
                        </span>
                      )}
                    </p>

                    {/* Real-time indicator */}
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Live inventory updates
                    </div>
                  </div>
                </div>

                {/* Products Grid - IMPROVED RESPONSIVENESS */}
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {filteredAndSortedProducts.length > 0 ? (
                    filteredAndSortedProducts.map((product, index) => (
                      <ProductCard
                        key={product.id || product._id}
                        product={product}
                        index={index}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 scroll-reveal">
                      <div className="text-gray-400 text-base sm:text-lg mb-3 sm:mb-4">
                        🕵️‍♂️ No products found matching your criteria.
                      </div>
                      <button
                        onClick={handleClearFilters}
                        className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors font-semibold text-sm sm:text-base touch-manipulation">
                        Show All Products
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* COPIED FROM HOME.JSX: Footer Section with Functional Quick Links */}
        <footer className="relative overflow-hidden bg-transparent pt-20 sm:pt-24 md:pt-32">
          <div className="bg-[#0A142F] rounded-t-[80px] sm:rounded-t-[120px] md:rounded-t-[160px] lg:rounded-t-[200px]">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 mb-8 sm:mb-10">
                <div className="scroll-reveal">
                  <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                    <img
                      src={salonLogo}
                      alt="Sandrea Lee Salon"
                      className="h-8 sm:h-10 md:h-12 w-auto object-contain"
                    />
                    <span className="relative top-1 -left-2 text-xl sm:text-2xl md:text-3xl font-semi-bold text-white font-['Tenali_Ramakrishna'] tracking-wide leading-none">
                      SALON
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 sm:gap-3">
                    <button
                      onClick={() => handleDownloadApp("customer")}
                      className="flex items-center justify-center space-x-2 sm:space-x-3 bg-white hover:bg-gray-100 text-black rounded-xl px-3 sm:px-4 py-2 sm:py-3 transition-all duration-300 transform hover:scale-105 shadow-lg w-full max-w-[180px] sm:max-w-[200px] touch-manipulation active:scale-95">
                      <IoLogoApple className="w-5 h-5 sm:w-6 sm:h-6" />
                      <div className="text-left">
                        <div className="text-[8px] sm:text-[9px] text-gray-600 leading-tight">
                          Download on the
                        </div>
                        <div className="text-xs sm:text-sm font-semibold leading-tight">
                          App Store
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleDownloadApp("customer")}
                      className="flex items-center justify-center space-x-2 sm:space-x-3 bg-white hover:bg-gray-100 text-black rounded-xl px-3 sm:px-4 py-2 sm:py-3 transition-all duration-300 transform hover:scale-105 shadow-lg w-full max-w-[180px] sm:max-w-[200px] touch-manipulation active:scale-95">
                      <IoLogoGooglePlaystore className="w-5 h-5 sm:w-6 sm:h-6" />
                      <div className="text-left">
                        <div className="text-[8px] sm:text-[9px] text-gray-600 leading-tight">
                          Get it on
                        </div>
                        <div className="text-xs sm:text-sm font-semibold leading-tight">
                          Google Play
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Quick Links with Functional Navigation */}
                <div className="scroll-reveal">
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mb-3 sm:mb-4 pb-2">
                    Quick links
                  </h3>
                  <ul className="space-y-1.5 sm:space-y-2">
                    <li>
                      <button
                        onClick={() => handleQuickLinkNavigation("home")}
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-xs sm:text-sm text-left touch-manipulation">
                        Home
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleQuickLinkNavigation("services")}
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-xs sm:text-sm text-left touch-manipulation">
                        Services
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleQuickLinkNavigation("products")}
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-xs sm:text-sm text-left touch-manipulation">
                        Products
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() =>
                          handleQuickLinkNavigation("appointments")
                        }
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-xs sm:text-sm text-left touch-manipulation">
                        Appointments
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleQuickLinkNavigation("about")}
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-xs sm:text-sm text-left touch-manipulation">
                        About
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleQuickLinkNavigation("contact")}
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-xs sm:text-sm text-left touch-manipulation">
                        Contact
                      </button>
                    </li>
                  </ul>
                </div>

                <div className="scroll-reveal">
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mb-3 sm:mb-4 pb-2">
                    Contact Us
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-start space-x-2">
                      <IoLocation className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0 mt-0.5" />
                      <p className="text-gray-300 text-xs leading-relaxed">
                        2184 Loyola St, Sampaloc,
                        <br />
                        Manila, 1008 Metro Manila
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <IoCall className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0" />
                      <a
                        href="tel:09998081357"
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-xs sm:text-sm">
                        0999 808 1357
                      </a>
                    </div>

                    <div className="flex items-center space-x-2">
                      <IoLogoWhatsapp className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0" />
                      <a
                        href="https://wa.me/639175350244"
                        className="text-gray-300 hover:text-white transition-colors duration-300 text-xs sm:text-sm">
                        +63 917 535 0244
                      </a>
                    </div>

                    <div className="flex items-center space-x-2">
                      <IoTimeOutline className="w-4 h-4 sm:w-5 sm:h-5 text-white flex-shrink-0" />
                      <p className="text-gray-300 text-xs sm:text-sm">
                        Mon-Sun | 9:00 AM - 9:00 PM
                      </p>
                    </div>
                  </div>
                </div>

                <div className="scroll-reveal">
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mb-2 sm:mb-3 pb-2">
                    Join our Newsletter
                  </h3>
                  <p className="text-gray-300 text-xs mb-3 sm:mb-4">
                    Subscribe for special offers,
                    <br />
                    beauty tips, and updates!
                  </p>

                  <div className="flex items-center bg-white rounded-full overflow-hidden shadow-lg">
                    <input
                      type="email"
                      placeholder="Get updates"
                      className="flex-1 px-3 sm:px-4 py-2 text-gray-800 text-xs sm:text-sm outline-none bg-transparent"
                    />
                    <button className="bg-blue-500 hover:bg-blue-600 text-white p-2 sm:p-2.5 transition-colors duration-300 touch-manipulation">
                      <IoMail className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center py-4 sm:py-6 border-t border-gray-700/50">
                <h4 className="text-white text-sm sm:text-base font-medium mb-3 sm:mb-4">
                  Social Media
                </h4>
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <a
                    href="#"
                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 border-gray-500 hover:border-white flex items-center justify-center transition-all duration-300 hover:scale-110 touch-manipulation"
                    aria-label="Facebook">
                    <IoLogoFacebook className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 hover:text-white" />
                  </a>

                  <a
                    href="#"
                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 border-gray-500 hover:border-white flex items-center justify-center transition-all duration-300 hover:scale-110 touch-manipulation"
                    aria-label="Instagram">
                    <IoLogoInstagram className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 hover:text-white" />
                  </a>

                  <a
                    href="#"
                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 border-gray-500 hover:border-white flex items-center justify-center transition-all duration-300 hover:scale-110 touch-manipulation"
                    aria-label="Twitter">
                    <IoLogoTwitter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 hover:text-white" />
                  </a>
                </div>
              </div>

              <div className="border-t border-gray-700/50 pt-4 sm:pt-5 mt-2">
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-400">
                  <p>© 2025 SALON. All Rights Reserved</p>
                  <div className="flex items-center space-x-2 sm:space-x-3">
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

export default ProductsPage;
