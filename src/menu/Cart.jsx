import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cartAPI, customerUtils, productUtils } from "../services/api";
import "../styles/Cart.css";

// Import product images for fallback
import product1 from "../assets/TressfinityKeratinArganMorocco.png";
import product2 from "../assets/Tressfinity Purple Mask.png";
import product3 from "../assets/Tressfinity Purple Shampoo & Conditioner.png";
import product4 from "../assets/Tressfinity Sulfate Free Shampoo & Conditioner.png";

const Cart = ({ isOpen, onClose }) => {
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingItems, setUpdatingItems] = useState({});
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchCartData();
      loadUserData();
    }
  }, [isOpen]);

  const loadUserData = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setUserData(user);
  };

  const fetchCartData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await cartAPI.get();
      console.log("🛒 Cart API Response:", response);

      let cartData = null;

      if (response.data) {
        const responseData = response.data;

        if (responseData.success) {
          if (responseData.data) {
            cartData = responseData.data;
          } else if (responseData.items) {
            cartData = {
              items: responseData.items,
              subtotal: responseData.subtotal || 0,
              total: responseData.total || 0,
              tax: responseData.tax || 0,
              shipping: responseData.shipping || 0,
              discount: responseData.discount || 0,
            };
          } else {
            cartData = responseData;
          }
        } else {
          if (responseData.items || Array.isArray(responseData)) {
            cartData = {
              items: responseData.items || responseData,
              subtotal: responseData.subtotal || 0,
              total: responseData.total || 0,
              tax: responseData.tax || 0,
              shipping: responseData.shipping || 0,
              discount: responseData.discount || 0,
            };
          } else {
            setError(responseData.message || "Failed to load cart");
          }
        }
      } else {
        if (response.items || Array.isArray(response)) {
          cartData = {
            items: response.items || response,
            subtotal: response.subtotal || 0,
            total: response.total || 0,
            tax: response.tax || 0,
            shipping: response.shipping || 0,
            discount: response.discount || 0,
          };
        } else {
          setError("Invalid cart response format");
        }
      }

      if (!cartData || !Array.isArray(cartData.items)) {
        console.warn(
          "🛒 Cart items missing or invalid, setting to empty array"
        );
        cartData = {
          items: [],
          subtotal: 0,
          total: 0,
          tax: 0,
          shipping: 0,
          discount: 0,
        };
      }

      console.log("🛒 Processed Cart Data:", cartData);
      setCartData(cartData);
    } catch (err) {
      console.error("❌ Cart loading error:", err);
      setError("An error occurred while loading cart");
      setCartData({
        items: [],
        subtotal: 0,
        total: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 0) return;

    try {
      setUpdatingItems((prev) => ({ ...prev, [itemId]: true }));

      if (newQuantity === 0) {
        await cartAPI.remove(itemId);
      } else {
        await cartAPI.update(itemId, newQuantity);
      }

      await fetchCartData();
    } catch (err) {
      console.error("Error updating quantity:", err);
      setError("Failed to update quantity");
      setTimeout(() => setError(null), 3000);
    } finally {
      setUpdatingItems((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      setUpdatingItems((prev) => ({ ...prev, [itemId]: true }));
      await cartAPI.remove(itemId);
      await fetchCartData();
    } catch (err) {
      console.error("Error removing item:", err);
      setError("Failed to remove item");
      setTimeout(() => setError(null), 3000);
    } finally {
      setUpdatingItems((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const handleContinueShopping = () => {
    onClose();
    navigate("/customer/products"); // Navigate to products page
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);

      if (!cartData || !cartData.items || cartData.items.length === 0) {
        setError("Your cart is empty. Please add items before checkout.");
        setTimeout(() => setError(null), 3000);
        return;
      }

      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (!token || !user.id) {
        setError("Please log in to proceed with checkout.");
        setTimeout(() => setError(null), 3000);
        return;
      }

      console.log("🛒 Proceeding to checkout with cart:", cartData);
      onClose();

      navigate("/checkout", {
        state: {
          cart: cartData,
        },
      });
    } catch (err) {
      console.error("❌ Checkout navigation error:", err);
      setError("Failed to proceed to checkout. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestCheckout = () => {
    if (!cartData || !cartData.items || cartData.items.length === 0) {
      setError("Your cart is empty. Please add items before checkout.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    onClose();

    navigate("/checkout", {
      state: {
        cart: cartData,
        isGuest: true,
      },
    });
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

  const getProductData = (item) => {
    console.log("🛒 RAW CART ITEM:", item);

    let productData = null;

    if (item.product && typeof item.product === "object") {
      productData = {
        _id: item.product._id || item.product.id || item._id,
        name: item.product.name || "Unknown Product",
        price: item.product.price || 0,
        image: item.product.image || getFallbackImage(item.product.name),
        description: item.product.description || "No description available",
        rating: item.product.rating || { average: 0, totalRaters: 0 },
        inStock: item.product.inStock !== false,
        category: item.product.category || "Uncategorized",
        reviewCount: item.product.reviewCount || 0,
      };
    } else if (item.productData && typeof item.productData === "object") {
      productData = {
        _id: item.productData._id || item.productData.id || item._id,
        name: item.productData.name || "Unknown Product",
        price: item.productData.price || 0,
        image:
          item.productData.image || getFallbackImage(item.productData.name),
        description: item.productData.description || "No description available",
        rating: item.productData.rating || { average: 0, totalRaters: 0 },
        inStock: item.productData.inStock !== false,
        category: item.productData.category || "Uncategorized",
        reviewCount: item.productData.reviewCount || 0,
      };
    } else if (item.name || item.price) {
      productData = {
        _id: item._id || item.id,
        name: item.name || "Unknown Product",
        price: item.price || 0,
        image: item.image || getFallbackImage(item.name),
        description: item.description || "No description available",
        rating: item.rating || { average: 0, totalRaters: 0 },
        inStock: item.inStock !== false,
        category: item.category || "Uncategorized",
        reviewCount: item.reviewCount || 0,
      };
    } else {
      const possibleProductFields = [
        "product",
        "productData",
        "item",
        "productId",
      ];
      for (const field of possibleProductFields) {
        if (
          item[field] &&
          typeof item[field] === "object" &&
          (item[field].name || item[field].price)
        ) {
          const potentialProduct = item[field];
          productData = {
            _id: potentialProduct._id || potentialProduct.id || item._id,
            name: potentialProduct.name || "Unknown Product",
            price: potentialProduct.price || 0,
            image:
              potentialProduct.image || getFallbackImage(potentialProduct.name),
            description:
              potentialProduct.description || "No description available",
            rating: potentialProduct.rating || { average: 0, totalRaters: 0 },
            inStock: potentialProduct.inStock !== false,
            category: potentialProduct.category || "Uncategorized",
            reviewCount: potentialProduct.reviewCount || 0,
          };
          break;
        }
      }
    }

    if (!productData) {
      console.warn("❌ No product data structure found in item:", item);
      productData = {
        _id: item._id || item.id || `unknown-${Date.now()}`,
        name: "Unknown Product",
        price: 0,
        image: product1,
        description: "Product information not available",
        rating: { average: 0, totalRaters: 0 },
        inStock: true,
        category: "Uncategorized",
        reviewCount: 0,
      };
    }

    console.log("🛒 EXTRACTED PRODUCT DATA:", productData);
    return productData;
  };

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

    return product1;
  };

  const getProductImage = (product) => {
    if (!product || !product.image) {
      return getFallbackImage(product?.name);
    }

    let imageUrl = product.image;

    if (typeof imageUrl === "string") {
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

      if (
        imageUrl.startsWith("http") ||
        imageUrl.startsWith("/") ||
        imageUrl.startsWith("./") ||
        imageUrl.startsWith("../")
      ) {
        return imageUrl;
      }
    }

    return getFallbackImage(product?.name);
  };

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
      className="cart-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={handleOverlayClick}>
      <div className="cart-container bg-[#1a2332] rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        {/* Error Message */}
        {error && (
          <div
            className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-[70] animate-fade-in text-sm sm:text-base sm:px-6 sm:py-3 ${
              error.includes("Checkout") || error.includes("empty")
                ? "bg-yellow-500 text-black"
                : "bg-red-500 text-white"
            }`}>
            {error.includes("Checkout") || error.includes("empty") ? "⚠️" : "✗"}{" "}
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

          {/* Cart Banner */}
          <div className="bg-gradient-to-r from-blue-400 via-purple-300 to-yellow-300 h-16 sm:h-24 mx-4 sm:mx-6 rounded-t-2xl flex items-center justify-center">
            <h2 className="text-black text-2xl sm:text-5xl font-bold tracking-wider text-center px-2">
              YOUR CART
            </h2>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-[#0f1621] mx-4 sm:mx-6 rounded-b-2xl p-4 sm:p-6 lg:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-20">
              <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 mt-3 sm:mt-4 text-sm sm:text-base">
                Loading cart...
              </p>
            </div>
          ) : error && (!cartData || cartData.items.length === 0) ? (
            <div className="text-center py-12 sm:py-20">
              <p className="text-red-400 mb-4 text-sm sm:text-base">
                Error: {error}
              </p>
              <button
                onClick={fetchCartData}
                className="px-4 py-2 sm:px-6 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base">
                Try Again
              </button>
            </div>
          ) : cartData && cartData.items.length > 0 ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Cart Items */}
              {cartData.items.map((item, index) => {
                const product = getProductData(item);
                const productId = item.id || item._id || product._id;
                const productName = product.name;
                const productPrice = product.price;
                const productQuantity = item.quantity || 1;
                const productImage = getProductImage(product);
                const rating = getProductRating(product);

                return (
                  <div
                    key={productId}
                    className="bg-[#1a2332] rounded-xl p-4 sm:p-6 border border-gray-700 hover:border-blue-500 transition-all duration-300">
                    <div className="flex flex-col">
                      {/* Product Image, Name and Details */}
                      <div className="flex items-start space-x-4 sm:space-x-6 mb-3 sm:mb-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24">
                          <img
                            src={productImage}
                            alt={productName}
                            className="w-full h-full object-cover rounded-lg bg-white/5"
                            onError={(e) => {
                              console.log(
                                "🖼️ Image failed to load, using fallback"
                              );
                              e.target.onerror = null;
                              e.target.src = getFallbackImage(productName);
                              e.target.classList.add("object-contain", "p-2");
                            }}
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white text-base sm:text-lg lg:text-xl font-semibold mb-1 sm:mb-2 line-clamp-2">
                            {productName}
                          </h3>

                          {/* Category */}
                          {product.category && (
                            <p className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">
                              Category: {product.category}
                            </p>
                          )}

                          {/* Rating */}
                          {rating.average > 0 && (
                            <div className="flex items-center space-x-1 mb-1 sm:mb-2">
                              <StarRating rating={rating} />
                              <span className="text-gray-400 text-xs sm:text-sm">
                                ({rating.totalRaters})
                              </span>
                            </div>
                          )}

                          <p className="text-white font-semibold text-base sm:text-lg lg:text-xl">
                            {formatPrice(productPrice)}
                          </p>

                          {/* Description */}
                          {product.description && (
                            <p className="text-gray-400 text-xs sm:text-sm mt-1 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 sm:mt-4 space-y-3 sm:space-y-0">
                        <div className="flex items-center justify-between sm:justify-start sm:space-x-4">
                          <div className="flex items-center space-x-2 sm:space-x-4">
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  productId,
                                  productQuantity - 1
                                )
                              }
                              disabled={
                                updatingItems[productId] || productQuantity <= 1
                              }
                              className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gray-700 text-white rounded-lg flex items-center justify-center hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-bold">
                              -
                            </button>

                            <span className="text-white font-semibold min-w-8 sm:min-w-12 text-center text-sm sm:text-base lg:text-lg">
                              {updatingItems[productId] ? (
                                <div className="w-4 h-4 sm:w-6 sm:h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                              ) : (
                                productQuantity
                              )}
                            </span>

                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  productId,
                                  productQuantity + 1
                                )
                              }
                              disabled={updatingItems[productId]}
                              className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gray-700 text-white rounded-lg flex items-center justify-center hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-bold">
                              +
                            </button>
                          </div>
                        </div>

                        {/* Total Price for this item */}
                        <div className="text-left sm:text-right">
                          <p className="text-white font-semibold text-lg sm:text-xl">
                            {formatPrice(productPrice * productQuantity)}
                          </p>
                          {productQuantity > 1 && (
                            <p className="text-gray-400 text-xs sm:text-sm">
                              {formatPrice(productPrice)} each
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(productId)}
                        disabled={updatingItems[productId]}
                        className="mt-3 text-red-400 hover:text-red-300 text-xs sm:text-base font-semibold disabled:opacity-50 transition-colors flex items-center space-x-1 sm:space-x-2 self-start">
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        <span>
                          {updatingItems[productId]
                            ? "Removing..."
                            : "Remove Item"}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Total and Checkout */}
              <div className="bg-[#1a2332] rounded-xl p-4 sm:p-6 border border-gray-700 mt-6 sm:mt-8">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <span className="text-gray-400 text-base sm:text-xl">
                    Subtotal
                  </span>
                  <span className="text-white font-bold text-lg sm:text-2xl">
                    {formatPrice(cartData.subtotal || cartData.total || 0)}
                  </span>
                </div>

                {cartData.tax > 0 && (
                  <div className="flex justify-between items-center mb-2 sm:mb-3">
                    <span className="text-gray-400 text-sm sm:text-base">
                      Tax
                    </span>
                    <span className="text-white font-semibold text-sm sm:text-base">
                      {formatPrice(cartData.tax)}
                    </span>
                  </div>
                )}

                {cartData.shipping > 0 && (
                  <div className="flex justify-between items-center mb-2 sm:mb-3">
                    <span className="text-gray-400 text-sm sm:text-base">
                      Shipping
                    </span>
                    <span className="text-white font-semibold text-sm sm:text-base">
                      {formatPrice(cartData.shipping)}
                    </span>
                  </div>
                )}

                {cartData.discount > 0 && (
                  <div className="flex justify-between items-center mb-2 sm:mb-3">
                    <span className="text-gray-400 text-sm sm:text-base">
                      Discount
                    </span>
                    <span className="text-green-400 font-semibold text-sm sm:text-base">
                      -{formatPrice(cartData.discount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center mb-6 sm:mb-8 pt-4 sm:pt-6 border-t border-gray-600">
                  <span className="text-gray-400 text-base sm:text-xl">
                    Total
                  </span>
                  <span className="text-white font-bold text-xl sm:text-3xl">
                    {formatPrice(cartData.total || 0)}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={handleContinueShopping}
                    className="flex-1 bg-gray-600 text-white py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-gray-700 transition-all duration-300">
                    Continue Shopping
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg">
                    {loading ? "Processing..." : "PROCEED TO CHECKOUT"}
                  </button>
                </div>

                {/* Guest Checkout Option */}
                {!userData?.id && (
                  <div className="mt-3 sm:mt-4 text-center">
                    <p className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">
                      Don't have an account?
                    </p>
                    <button
                      onClick={handleGuestCheckout}
                      className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-semibold underline">
                      Continue as Guest
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 sm:py-20">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg
                  className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-white text-lg sm:text-2xl font-semibold mb-3 sm:mb-4">
                Your cart is empty
              </h3>
              <p className="text-gray-400 mb-6 sm:mb-8 text-sm sm:text-lg px-4">
                Add some amazing products to get started with your shopping
              </p>
              <button
                onClick={handleContinueShopping}
                className="px-6 py-3 sm:px-8 sm:py-4 bg-blue-500 text-white rounded-lg font-semibold text-base sm:text-lg hover:bg-blue-600 transition-colors">
                Browse Products
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;
