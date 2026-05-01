// Favorites.jsx
import React, { useState, useEffect } from "react";
import {
  favoritesAPI,
  customerUtils,
  cartAPI,
  productUtils,
} from "../services/api";
import "../styles/Favorites.css";

// Import product images for fallback
import product1 from "../assets/TressfinityKeratinArganMorocco.png";
import product2 from "../assets/Tressfinity Purple Mask.png";
import product3 from "../assets/Tressfinity Purple Shampoo & Conditioner.png";
import product4 from "../assets/Tressfinity Sulfate Free Shampoo & Conditioner.png";

const Favorites = ({ isOpen, onClose }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [addingToCart, setAddingToCart] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchFavorites();
      loadUserData();
    }
  }, [isOpen]);

  const loadUserData = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setUserData(user);
  };

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await favoritesAPI.getAll();
      console.log("❤️ Favorites API Response:", result);

      let favoritesData = [];

      if (result.data) {
        const responseData = result.data;

        if (responseData.success) {
          // Handle different response structures
          if (responseData.data) {
            favoritesData = responseData.data;
          } else if (responseData.favorites) {
            favoritesData = responseData.favorites;
          } else {
            favoritesData = responseData;
          }
        } else {
          // If no success flag but has data structure
          if (Array.isArray(responseData)) {
            favoritesData = responseData;
          } else {
            setError(responseData.message || "Failed to load favorites");
          }
        }
      } else {
        // If result itself is the data
        if (Array.isArray(result)) {
          favoritesData = result;
        } else {
          setError("Invalid favorites response format");
        }
      }

      // Ensure we have an array
      if (!Array.isArray(favoritesData)) {
        console.warn(
          "❤️ Favorites data is not an array, converting to empty array"
        );
        favoritesData = [];
      }

      console.log("❤️ Processed Favorites Data:", favoritesData);
      setFavorites(favoritesData);
    } catch (err) {
      console.error("❌ Favorites loading error:", err);
      setError("An error occurred while loading favorites");
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (favoriteId) => {
    try {
      const result = await favoritesAPI.remove(favoriteId);

      if (result.data?.success || result.success) {
        setFavorites((prev) => prev.filter((fav) => fav._id !== favoriteId));
        setError("Removed from favorites");
        setTimeout(() => setError(null), 3000);
      } else {
        setError(
          result.data?.message || result.error || "Failed to remove favorite"
        );
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError("An error occurred while removing favorite");
      setTimeout(() => setError(null), 3000);
      console.error("Remove favorite error:", err);
    }
  };

  const handleAddToCart = async (product) => {
    if (!product) return;

    try {
      setAddingToCart((prev) => ({ ...prev, [product._id]: true }));

      const productData = {
        productId: product._id || product.id,
        quantity: 1,
        productData: product,
      };

      const response = await cartAPI.add(productData);

      if (response.data && response.data.success) {
        setError(`✅ Added ${product.name} to cart!`);
        setTimeout(() => setError(null), 3000);
      } else {
        throw new Error("Failed to add to cart");
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      setError("Failed to add product to cart");
      setTimeout(() => setError(null), 3000);
    } finally {
      setAddingToCart((prev) => ({ ...prev, [product._id]: false }));
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleContinueShopping = () => {
    onClose();
  };

  const formatPrice = (price) => {
    const priceNumber =
      typeof price === "string"
        ? parseFloat(price.replace(/[^\d.]/g, ""))
        : price || 0;

    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(priceNumber);
  };

  // NEW: Function to get fallback image based on product name
  const getFallbackImage = (productName) => {
    if (!productName) return product1;

    const name = productName.toLowerCase();
    if (
      name.includes("keratin") ||
      name.includes("argan") ||
      name.includes("morocco")
    ) {
      return product1;
    } else if (name.includes("purple") && name.includes("mask")) {
      return product2;
    } else if (
      name.includes("purple") &&
      (name.includes("shampoo") || name.includes("conditioner"))
    ) {
      return product3;
    } else if (
      name.includes("sulfate") ||
      (name.includes("shampoo") && name.includes("conditioner"))
    ) {
      return product4;
    }

    return product1; // Default fallback
  };

  // FIXED: Function to get product data with proper image handling
  const getProductData = (favorite) => {
    console.log("❤️ RAW FAVORITE ITEM:", favorite);

    let productData = null;

    // Case 1: favorite has product object
    if (favorite.product && typeof favorite.product === "object") {
      productData = {
        _id: favorite.product._id || favorite.product.id || favorite._id,
        name: favorite.product.name || "Unknown Product",
        price: favorite.product.price || 0,
        image:
          favorite.product.image || getFallbackImage(favorite.product.name),
        description: favorite.product.description || "No description available",
        category: favorite.product.category || "Uncategorized",
        rating: favorite.product.rating || { average: 0, totalRaters: 0 },
        inStock: favorite.product.inStock !== false,
        reviewCount: favorite.product.reviewCount || 0,
      };
    }
    // Case 2: favorite has productData object
    else if (favorite.productData && typeof favorite.productData === "object") {
      productData = {
        _id:
          favorite.productData._id || favorite.productData.id || favorite._id,
        name: favorite.productData.name || "Unknown Product",
        price: favorite.productData.price || 0,
        image:
          favorite.productData.image ||
          getFallbackImage(favorite.productData.name),
        description:
          favorite.productData.description || "No description available",
        category: favorite.productData.category || "Uncategorized",
        rating: favorite.productData.rating || { average: 0, totalRaters: 0 },
        inStock: favorite.productData.inStock !== false,
        reviewCount: favorite.productData.reviewCount || 0,
      };
    }
    // Case 3: favorite itself is the product
    else if (favorite.name || favorite.price) {
      productData = {
        _id: favorite._id || favorite.id,
        name: favorite.name || "Unknown Product",
        price: favorite.price || 0,
        image: favorite.image || getFallbackImage(favorite.name),
        description: favorite.description || "No description available",
        category: favorite.category || "Uncategorized",
        rating: favorite.rating || { average: 0, totalRaters: 0 },
        inStock: favorite.inStock !== false,
        reviewCount: favorite.reviewCount || 0,
      };
    }
    // Case 4: Look for product data in nested structures
    else {
      const possibleProductFields = [
        "product",
        "productData",
        "item",
        "productId",
      ];
      for (const field of possibleProductFields) {
        if (
          favorite[field] &&
          typeof favorite[field] === "object" &&
          (favorite[field].name || favorite[field].price)
        ) {
          const potentialProduct = favorite[field];
          productData = {
            _id: potentialProduct._id || potentialProduct.id || favorite._id,
            name: potentialProduct.name || "Unknown Product",
            price: potentialProduct.price || 0,
            image:
              potentialProduct.image || getFallbackImage(potentialProduct.name),
            description:
              potentialProduct.description || "No description available",
            category: potentialProduct.category || "Uncategorized",
            rating: potentialProduct.rating || { average: 0, totalRaters: 0 },
            inStock: potentialProduct.inStock !== false,
            reviewCount: potentialProduct.reviewCount || 0,
          };
          break;
        }
      }
    }

    // Final fallback
    if (!productData) {
      console.warn("❌ No product data structure found in favorite:", favorite);
      productData = {
        _id: favorite._id || favorite.id || `unknown-${Date.now()}`,
        name: "Unknown Product",
        price: 0,
        image: product1, // Use imported image as fallback
        description: "Product information not available",
        inStock: true,
        rating: { average: 0, totalRaters: 0 },
        category: "Uncategorized",
        reviewCount: 0,
      };
    }

    console.log("❤️ EXTRACTED PRODUCT DATA:", productData);
    return productData;
  };

  // FIXED: Function to get product image with proper fallbacks
  const getProductImage = (product) => {
    if (!product || !product.image) {
      return getFallbackImage(product?.name);
    }

    // Handle different image formats
    let imageUrl = product.image;

    // If it's a string that represents one of our imported images
    if (typeof imageUrl === "string") {
      // Check if it matches any of our imported images
      const imageMap = {
        product1: product1,
        product2: product2,
        product3: product3,
        product4: product4,
        [product1]: product1,
        [product2]: product2,
        [product3]: product3,
        [product4]: product4,
      };

      if (imageMap[imageUrl]) {
        return imageMap[imageUrl];
      }

      // If it's a relative path or URL, use it directly
      if (
        imageUrl.startsWith("http") ||
        imageUrl.startsWith("/") ||
        imageUrl.startsWith("./") ||
        imageUrl.startsWith("../")
      ) {
        return imageUrl;
      }
    }

    // Final fallback
    return getFallbackImage(product?.name);
  };

  // Check if product is in stock
  const isProductInStock = (product) => {
    return product.inStock !== false;
  };

  // Get product rating with fallbacks
  const getProductRating = (product) => {
    if (product.rating && typeof product.rating === "object") {
      return {
        average: product.rating.average || 0,
        totalRaters: product.rating.totalRaters || 0,
      };
    }
    return {
      average: product.rating || 0,
      totalRaters: product.reviewCount || 0,
    };
  };

  // Star rating component
  const StarRating = ({ rating }) => {
    const numericRating =
      typeof rating === "number" ? rating : rating?.average || 0;
    const { fullStars, halfStar, emptyStars } =
      productUtils.generateStarRating(numericRating);

    return (
      <div className="star-rating flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className="text-yellow-400">
            ★
          </span>
        ))}
        {halfStar && <span className="text-yellow-400">½</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="text-gray-400">
            ☆
          </span>
        ))}
        <span className="rating-value ml-2 text-sm text-gray-300">
          {numericRating.toFixed(1)}
        </span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="favorites-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={handleOverlayClick}>
      <div className="favorites-container bg-[#1a2332] rounded-lg sm:rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-y-auto mx-auto">
        {/* Error Message */}
        {error && (
          <div
            className={`fixed top-2 sm:top-4 right-2 sm:right-4 px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-lg z-[70] animate-fade-in text-sm sm:text-base ${
              error.includes("Added") || error.includes("✅")
                ? "bg-green-500 text-white"
                : error.includes("Removed")
                ? "bg-blue-500 text-white"
                : "bg-red-500 text-white"
            }`}>
            {error.includes("Added") || error.includes("✅")
              ? "✓"
              : error.includes("Removed")
              ? "✓"
              : "✗"}{" "}
            {error}
          </div>
        )}

        {/* Header Section */}
        <div className="relative">
          {/* Back Button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 sm:top-6 sm:left-6 text-white hover:text-gray-300 transition-colors z-10">
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8"
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

          {/* Welcome Header */}
          <div className="pt-4 pl-16 pr-4 pb-3 sm:pt-6 sm:pl-20 sm:pr-6 sm:pb-4">
            <h1 className="text-white text-xl sm:text-3xl font-semibold">
              Welcome, {userData?.firstName || userData?.username || "User"}
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Favorites Banner */}
          <div className="bg-gradient-to-r from-blue-400 via-purple-300 to-yellow-300 h-16 sm:h-20 md:h-24 mx-4 sm:mx-6 rounded-t-lg sm:rounded-t-2xl flex items-center justify-center">
            <h2 className="text-black text-2xl sm:text-4xl md:text-5xl font-bold tracking-wider text-center px-2">
              YOUR FAVORITES
            </h2>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-[#0f1621] mx-4 sm:mx-6 rounded-b-lg sm:rounded-b-2xl p-4 sm:p-6 md:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20">
              <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 mt-3 sm:mt-4 text-sm sm:text-base">
                Loading favorites...
              </p>
            </div>
          ) : error && favorites.length === 0 ? (
            <div className="text-center py-16 sm:py-20">
              <p className="text-red-400 mb-4 text-sm sm:text-base">
                Error: {error}
              </p>
              <button
                onClick={fetchFavorites}
                className="px-4 py-2 sm:px-6 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base">
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {/* From Your Wishlist Section */}
              <div>
                <h3 className="text-white text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-6 md:mb-8 text-center">
                  Your Wishlist ({favorites.length})
                </h3>

                {favorites.length === 0 ? (
                  <div className="text-center py-12 sm:py-16 bg-[#1a2332] rounded-xl sm:rounded-2xl border border-gray-700 px-4">
                    <div className="text-gray-400 text-6xl sm:text-8xl mb-4 sm:mb-6">
                      ♡
                    </div>
                    <h4 className="text-white text-lg sm:text-xl md:text-2xl font-semibold mb-3 sm:mb-4">
                      No favorites yet
                    </h4>
                    <p className="text-gray-400 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 max-w-md mx-auto">
                      Start adding items to your wishlist by clicking the heart
                      icon on products you love
                    </p>
                    <button
                      onClick={handleContinueShopping}
                      className="px-6 py-2 sm:px-8 sm:py-3 bg-blue-500 text-white rounded-lg font-semibold text-base sm:text-lg hover:bg-blue-600 transition-colors">
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                    {favorites.map((favorite, index) => {
                      const product = getProductData(favorite);
                      const isInStock = isProductInStock(product);
                      const rating = getProductRating(product);
                      const productId =
                        product._id || product.id || favorite._id;
                      const favoriteId = favorite._id || favorite.id;
                      const productImage = getProductImage(product);

                      console.log("🖼️ Rendering favorites item image:", {
                        productId,
                        productName: product.name,
                        imageUrl: productImage,
                        rawImage: product.image,
                      });

                      return (
                        <div
                          key={favoriteId}
                          className="bg-[#1a2332] rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-gray-700 hover:border-purple-500 transition-all duration-300 group">
                          {/* Product Image */}
                          <div className="relative mb-3 sm:mb-4">
                            <img
                              src={productImage}
                              alt={product.name}
                              className="w-full h-32 sm:h-36 md:h-40 lg:h-48 object-cover rounded-lg bg-white/5"
                              onError={(e) => {
                                console.log(
                                  "🖼️ Image failed to load, using fallback"
                                );
                                e.target.onerror = null;
                                e.target.src = getFallbackImage(product.name);
                                e.target.classList.add("object-contain", "p-2");
                              }}
                            />
                            {/* Remove Button */}
                            <button
                              onClick={() => handleRemoveFavorite(favoriteId)}
                              className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-red-500 text-white p-1 sm:p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-600">
                              <svg
                                className="w-4 h-4 sm:w-5 sm:h-5"
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

                            {/* Stock Status Badge */}
                            {!isInStock && (
                              <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                                Out of Stock
                              </div>
                            )}

                            {/* Category Badge */}
                            {product.category && (
                              <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-blue-500/80 text-white px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                                {product.category}
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="space-y-2 sm:space-y-3">
                            <h4 className="text-white font-semibold text-base sm:text-lg md:text-xl line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem]">
                              {product.name}
                            </h4>

                            {/* Price and Rating */}
                            <div className="flex items-center justify-between flex-wrap gap-1 sm:gap-2">
                              <span className="text-purple-400 font-bold text-lg sm:text-xl">
                                {formatPrice(product.price)}
                              </span>

                              {/* Rating */}
                              {rating.average > 0 && (
                                <div className="flex items-center space-x-1">
                                  <StarRating rating={rating} />
                                  <span className="text-gray-400 text-xs sm:text-sm">
                                    ({rating.totalRaters})
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Description */}
                            <p className="text-gray-500 text-xs sm:text-sm line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">
                              {product.description || "Premium quality product"}
                            </p>

                            {/* Add to Cart Button */}
                            <button
                              onClick={() => handleAddToCart(product)}
                              disabled={!isInStock || addingToCart[productId]}
                              className={`w-full mt-2 sm:mt-3 py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-300 ${
                                !isInStock
                                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                                  : addingToCart[productId]
                                  ? "bg-purple-400 text-white cursor-wait"
                                  : "bg-purple-600 text-white hover:bg-purple-700 hover:scale-105"
                              }`}>
                              {addingToCart[productId] ? (
                                <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Adding...</span>
                                </div>
                              ) : !isInStock ? (
                                "Out of Stock"
                              ) : (
                                "Add to Cart"
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {favorites.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-6 sm:pt-8">
                  <button
                    onClick={handleContinueShopping}
                    className="px-6 py-2 sm:px-8 sm:py-3 bg-gray-600 text-white rounded-lg font-semibold text-sm sm:text-base md:text-lg hover:bg-gray-700 transition-colors">
                    Continue Shopping
                  </button>
                  <button
                    onClick={() => {
                      // Add all favorites to cart
                      favorites.forEach((favorite) => {
                        const product = getProductData(favorite);
                        if (isProductInStock(product)) {
                          handleAddToCart(product);
                        }
                      });
                    }}
                    disabled={Object.keys(addingToCart).length > 0}
                    className="px-6 py-2 sm:px-8 sm:py-3 bg-green-600 text-white rounded-lg font-semibold text-sm sm:text-base md:text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Add All to Cart
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Favorites;
