import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import salonLogo from "../assets/SandreaLeeSalonLogoCapstone.png";
import starIcon from "../assets/icons/star.png";
import starHalfIcon from "../assets/icons/star_half.png";
import { productsAPI, handleApiError, productUtils } from "../services/api";
import "../styles/Products.css";

// Import product images
import product1 from "../assets/TressfinityKeratinArganMorocco.png";
import product2 from "../assets/Tressfinity Purple Mask.png";
import product3 from "../assets/Tressfinity Purple Shampoo & Conditioner.png";
import product4 from "../assets/Tressfinity Sulfate Free Shampoo & Conditioner.png";

const ProductsPage = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  // Refs for the menu and button to detect clicks outside
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);

  // Mock product data with proper image assignments
  const mockProducts = [
    {
      id: 1,
      _id: "1",
      name: "Tressfinity Keratin Argan Morocco",
      price: 1299,
      rating: { average: 4.8, totalRaters: 829 },
      reviewCount: "829",
      image: product1,
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
      image: product4,
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
      image: product3,
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
      image: product2,
      category: "Hair Mask",
      inStock: false,
      description: "Intensive purple conditioning mask for color-treated hair",
    },
  ];

  // Fetch real products from API
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

        // Assign proper images to products
        const productsWithImages = productsData.map((product, index) => {
          const mockProduct = mockProducts[index % mockProducts.length];
          return {
            ...product,
            image: mockProduct?.image || product1,
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

  // Initialize data fetching
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts]);

  // Real-time updates with polling
  useEffect(() => {
    // Clear existing interval
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }

    // Set up new interval for real-time updates
    const interval = setInterval(() => {
      fetchProducts();
    }, 30000); // Refresh every 30 seconds

    setRefreshInterval(interval);

    // Cleanup on unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [fetchProducts]);

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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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

  // Detect scroll to change header color
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setScrolled(scrollTop > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      navigate("/booking");
    } else {
      navigate("/role-selection", { state: { redirectTo: "booking" } });
    }
  };

  const handleAddToCart = async (product, e) => {
    if (e) e.stopPropagation();

    if (!product.inStock) {
      alert("This product is currently out of stock");
      return;
    }

    try {
      // Add to cart via API
      const productId = product.id || product._id;
      const response = await productsAPI.purchase(productId, 1);

      if (response.data && response.data.success) {
        // Update local cart state
        setCartItems((prev) => {
          const existingItem = prev.find((item) => item.id === productId);
          if (existingItem) {
            return prev.map((item) =>
              item.id === productId
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          }
          return [...prev, { ...product, id: productId, quantity: 1 }];
        });

        // Show success message
        alert(`✅ Added ${product.name} to cart!`);
      } else {
        throw new Error("Failed to add to cart via API");
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      // Fallback to local cart
      setCartItems((prev) => {
        const productId = product.id || product._id;
        const existingItem = prev.find((item) => item.id === productId);
        if (existingItem) {
          return prev.map((item) =>
            item.id === productId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [...prev, { ...product, id: productId, quantity: 1 }];
      });
      alert(`✅ Added ${product.name} to cart! (Local storage)`);
    }
  };

  // Favorite function
  const handleFavorite = (productId, e) => {
    if (e) e.stopPropagation();

    const isLoggedIn = localStorage.getItem("token");
    if (!isLoggedIn) {
      navigate("/role-selection");
      return;
    }

    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
      } else {
        newFavorites.add(productId);
      }
      return newFavorites;
    });
  };

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

  const handleViewCart = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty");
      return;
    }
    alert(
      `You have ${cartItems.length} items in your cart. Total: ₱${cartItems
        .reduce((total, item) => total + item.price * item.quantity, 0)
        .toLocaleString()}`
    );
    // You can navigate to cart page here: navigate("/cart");
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
      <div className="star-rating">
        {[...Array(fullStars)].map((_, i) => (
          <img key={`full-${i}`} src={starIcon} alt="★" className="star" />
        ))}
        {halfStar && <img src={starHalfIcon} alt="½" className="star" />}
        {[...Array(emptyStars)].map((_, i) => (
          <img
            key={`empty-${i}`}
            src={starIcon}
            alt="☆"
            className="star"
            style={{ opacity: 0.3 }}
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
        className={`product-card scroll-reveal ${
          !product.inStock ? "opacity-60" : ""
        }`}
        style={{ animationDelay: `${index * 0.1}s` }}>
        <div className="flex flex-col h-full">
          <div className="flex-1">
            {/* Product Image */}
            <div className="relative">
              <img
                src={product.image || product1}
                alt={product.name}
                className="w-full h-48 object-contain mb-4 rounded-xl bg-white/5 p-4"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div
                className="w-full h-48 object-contain mb-4 rounded-xl bg-white/5 p-4 hidden items-center justify-center text-gray-400"
                style={{ display: "none" }}>
                <span>Image not available</span>
              </div>

              {/* Favorite Button */}
              <button
                onClick={(e) => handleFavorite(productId, e)}
                className={`absolute top-2 right-2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isFavorite
                    ? "bg-red-500/90 text-white"
                    : "bg-white/20 text-white/70 hover:bg-white/30"
                } backdrop-blur-sm`}>
                <svg
                  className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`}
                  viewBox="0 0 24 24"
                  stroke={isFavorite ? "none" : "currentColor"}
                  strokeWidth={isFavorite ? 0 : 2}>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>

              {/* Stock Status Badge */}
              {!product.inStock && (
                <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Out of Stock
                </div>
              )}

              {/* Category Badge */}
              {product.category && (
                <div className="absolute bottom-2 left-2 bg-blue-500/80 text-white px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                  {product.category}
                </div>
              )}
            </div>

            <h3 className="product-title text-white text-xl font-semibold mb-3 line-clamp-2">
              {product.name}
            </h3>

            <div className="flex items-center justify-between mb-3">
              <StarRating rating={product.rating} />
              <span className="rating-count text-gray-400 text-sm">
                {(product.rating && product.rating.totalRaters) ||
                  product.reviewCount ||
                  0}{" "}
                reviews
              </span>
            </div>

            {/* Product Description */}
            {product.description && (
              <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                {product.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <span className="product-price text-2xl font-bold text-white">
              {productUtils.formatPrice(product.price)}
            </span>
            <div className="flex gap-2">
              <button
                onClick={(e) => handleAddToCart(product, e)}
                disabled={!product.inStock}
                className={`px-4 py-3 rounded-full font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                  !product.inStock
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:shadow-lg"
                }`}
                style={{
                  background: product.inStock
                    ? "linear-gradient(to right, #76C4FF, #0348D3)"
                    : "linear-gradient(to right, #666, #333)",
                  color: product.inStock ? "#000" : "#999",
                }}>
                {product.inStock ? "Add to Cart" : "Out of Stock"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Scroll reveal effect
  useEffect(() => {
    const scrollReveal = () => {
      const reveals = document.querySelectorAll(".scroll-reveal");
      reveals.forEach((element) => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;

        if (elementTop < windowHeight - elementVisible) {
          element.classList.add("scroll-reveal-visible");
        }
      });
    };

    window.addEventListener("scroll", scrollReveal);
    scrollReveal(); // Initial check

    return () => window.removeEventListener("scroll", scrollReveal);
  }, []);

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
                  className="h-10 sm:h-12 w-auto object-contain cursor-pointer"
                  onClick={() => navigate("/")}
                />
                <span
                  className="relative top-1.5 -left-3 text-xl sm:text-3xl font-semi-bold text-white font-['Tenali_Ramakrishna'] tracking-wide leading-none cursor-pointer"
                  onClick={() => navigate("/")}>
                  SALON
                </span>
              </div>

              {/* NAVBAR COMPONENT */}
              <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2">
                <Navbar />
              </div>

              {/* Cart & Menu */}
              <div className="flex items-center space-x-4">
                {/* Cart Button */}
                {cartItems.length > 0 && (
                  <button
                    onClick={handleViewCart}
                    className="relative px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold text-sm transition-all duration-300 transform hover:scale-105">
                    🛒 Cart ({cartItems.length})
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                      {cartItems.reduce(
                        (total, item) => total + item.quantity,
                        0
                      )}
                    </span>
                  </button>
                )}

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

        {/* Products Section */}
        <section className="pt-32 pb-20 px-4 sm:px-6">
          <div className="container mx-auto max-w-6xl">
            {/* Section Header */}
            <div className="text-center mb-12 scroll-reveal">
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                Our{" "}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Products
                </span>
              </h1>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Discover our premium hair care products designed to give you the
                salon experience at home. Real-time inventory updates.
              </p>
            </div>

            {/* Filters and Search */}
            <div className="mb-8 scroll-reveal scroll-stagger-1">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                {/* Search Bar */}
                <div className="flex-1 w-full lg:w-auto">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search products by name, description, or category..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg
                        className="w-5 h-5"
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

                {/* Category Filter */}
                <div className="flex gap-2 flex-wrap justify-center">
                  <button
                    onClick={() => handleCategoryChange("all")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
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
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
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
                  className="px-4 py-3 bg-slate-700/50 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-300">
                  <span>Active filters:</span>
                  {selectedCategory !== "all" && (
                    <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">
                      Category: {selectedCategory}
                      <button
                        onClick={() => setSelectedCategory("all")}
                        className="ml-2 text-blue-100 hover:text-white">
                        ×
                      </button>
                    </span>
                  )}
                  {searchQuery && (
                    <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full">
                      Search: "{searchQuery}"
                      <button
                        onClick={() => setSearchQuery("")}
                        className="ml-2 text-green-100 hover:text-white">
                        ×
                      </button>
                    </span>
                  )}
                  {sortBy !== "newest" && (
                    <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full">
                      Sorted by: {sortBy.replace("-", " ")}
                      <button
                        onClick={() => setSortBy("newest")}
                        className="ml-2 text-purple-100 hover:text-white">
                        ×
                      </button>
                    </span>
                  )}
                  <button
                    onClick={handleClearFilters}
                    className="text-gray-400 hover:text-white underline text-sm">
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="text-white text-lg flex items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  Loading products...
                </div>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center py-20">
                <div className="text-center max-w-md">
                  <div className="text-yellow-400 text-lg mb-4">⚠️ {error}</div>
                  <p className="text-gray-300 text-sm mb-4">
                    Showing demo products. Some features may be limited.
                  </p>
                  <button
                    onClick={fetchProducts}
                    className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors font-semibold">
                    Retry Connection
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Results Count */}
                <div className="mb-6 scroll-reveal scroll-stagger-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <p className="text-gray-300">
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
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Live inventory updates
                    </div>
                  </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                      <div className="text-gray-400 text-lg mb-4">
                        🕵️‍♂️ No products found matching your criteria.
                      </div>
                      <button
                        onClick={handleClearFilters}
                        className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors font-semibold">
                        Show All Products
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Footer Section */}
        <footer className="relative overflow-hidden bg-transparent pt-24 sm:pt-32 md:pt-40">
          <div className="bg-[#0A142F] rounded-t-[120px] sm:rounded-t-[160px] md:rounded-t-[200px] lg:rounded-t-[240px]">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-10">
                <div>
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

                <div>
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
                      <button className="text-gray-300 hover:text-white transition-colors duration-300 text-sm">
                        Products
                      </button>
                    </li>
                    <li>
                      <button className="text-gray-300 hover:text-white transition-colors duration-300 text-sm">
                        About
                      </button>
                    </li>
                    <li>
                      <button className="text-gray-300 hover:text-white transition-colors duration-300 text-sm">
                        Contact
                      </button>
                    </li>
                  </ul>
                </div>

                <div>
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

                <div>
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

export default ProductsPage;
