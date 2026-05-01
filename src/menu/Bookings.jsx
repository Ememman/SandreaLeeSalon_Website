// Bookings.jsx
import React, { useState, useEffect } from "react";
import {
  bookingsAPI,
  getCurrentUser,
  stylistsManagement,
} from "../services/api";
import "../styles/Bookings.css";

const Bookings = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("recent");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [stylists, setStylists] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchUserData();
      fetchBookings();
      fetchStylists();
    }
  }, [isOpen]);

  const fetchUserData = () => {
    const user = getCurrentUser();
    setUserData(user);
  };

  const fetchStylists = async () => {
    try {
      const result = await stylistsManagement.getAllStylists();
      if (result.success) {
        setStylists(result.stylists);
      }
    } catch (error) {
      console.error("Error fetching stylists:", error);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use real API call to get bookings from backend
      const result = await bookingsAPI.getMyBookings();

      if (result.data && result.data.success) {
        console.log("API Bookings data:", result.data.data); // Debug log

        // Transform API data to match our component structure
        const apiBookings = result.data.data.map((booking) => {
          // Find stylist information
          const assignedStylist = stylists.find(
            (stylist) =>
              stylist.id === booking.selectedStylistId?._id ||
              stylist.id === booking.selectedStylistId
          );

          // Validate and format date
          const bookingDate = validateAndFormatDate(
            booking.preferredDate || booking.appointmentDate || booking.date
          );

          // Determine status - prioritize upcoming appointments
          let status = booking.status || "upcoming";
          const now = new Date();
          const bookingDateTime = new Date(
            booking.preferredDate || booking.appointmentDate || booking.date
          );

          // If booking is in the future and not cancelled, mark as upcoming
          if (
            bookingDateTime > now &&
            status !== "cancelled" &&
            status !== "completed"
          ) {
            status = "upcoming";
          }

          return {
            id: booking._id || booking.id,
            date: bookingDate.formatted,
            time: formatTimeWithAMPM(
              booking.preferredTime || booking.appointmentTime || booking.time
            ),
            salonName: booking.salon?.name || "SandreaLee Salon",
            address:
              booking.salon?.address ||
              "2184 Loyola St, Sampaloc, Manila, 1008 Metro Manila",
            service:
              booking.serviceId?.name ||
              booking.service?.name ||
              booking.serviceName ||
              booking.service ||
              "Hair Service",
            status: status,
            // Additional real data from API
            customerName:
              booking.customerName || booking.customer?.firstName || "Customer",
            serviceDuration:
              booking.serviceId?.duration || booking.service?.duration || "1h",
            totalAmount: booking.totalAmount || 0,
            staffName:
              assignedStylist?.displayName ||
              assignedStylist?.firstName ||
              assignedStylist?.username ||
              booking.selectedStylistId?.username ||
              "Staff",
            stylistId:
              booking.selectedStylistId?._id || booking.selectedStylistId,
            createdAt: booking.createdAt,
            isValidDate: bookingDate.isValid,
            rawDate:
              booking.preferredDate || booking.appointmentDate || booking.date,
            referenceNumber: booking.referenceNumber || "N/A",
            paymentMethod: booking.paymentMethod || "Cash",
          };
        });

        // Sort bookings by date (upcoming first)
        const sortedBookings = apiBookings.sort((a, b) => {
          return new Date(a.rawDate) - new Date(b.rawDate);
        });

        console.log("Transformed bookings:", sortedBookings); // Debug log
        setBookings(sortedBookings);
      } else {
        throw new Error("Failed to load bookings from server");
      }
    } catch (err) {
      console.error("Bookings loading error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load bookings. Please try again."
      );

      // Fallback to mock data with proper date validation - UPDATED TO MATCH IMAGE
      const mockBookings = [
        {
          id: "1",
          date: "1 May 2025",
          time: "10:00 AM",
          salonName: "Sandraduce Salon",
          address:
            "Sandraduce Salon. 2184 Layola St. Samplebc. Mamla. 1008 Metro Mamla",
          service: "Hair Spa",
          status: "completed",
          customerName: "James",
          serviceDuration: "1h 30min",
          totalAmount: 1500,
          staffName: "Sarah Smith",
          isValidDate: true,
          rawDate: "2025-05-01",
          referenceNumber: "REF001",
          paymentMethod: "Cash",
        },
        {
          id: "2",
          date: "3 May 2025",
          time: "10:30 AM",
          salonName: "Sandraduce Salon",
          address:
            "Sandraduce Salon. 2184 Layola St. Samplebc. Mamla. 1008 Metro Mamla",
          service: "Shampoo",
          status: "completed",
          customerName: "James",
          serviceDuration: "45min",
          totalAmount: 350,
          staffName: "Mike Johnson",
          isValidDate: true,
          rawDate: "2025-05-03",
          referenceNumber: "REF002",
          paymentMethod: "Cash",
        },
        {
          id: "3",
          date: "12 May 2025",
          time: "4:30 PM",
          salonName: "Sandraduce Salon",
          address:
            "Sandraduce Salon. 2184 Layola St. Samplebc. Mamla. 1008 Metro Mamla",
          service: "Rebond + Haircut",
          status: "upcoming",
          customerName: "James",
          serviceDuration: "3h",
          totalAmount: 2500,
          staffName: "Emily Davis",
          isValidDate: true,
          rawDate: "2025-05-12",
          referenceNumber: "REF003",
          paymentMethod: "Cash",
        },
      ];

      // Sort mock bookings by date
      const sortedMockBookings = mockBookings.sort((a, b) => {
        return new Date(a.rawDate) - new Date(b.rawDate);
      });

      setBookings(sortedMockBookings);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to validate and format dates
  const validateAndFormatDate = (dateString) => {
    if (!dateString) {
      return { formatted: "Date not set", isValid: false };
    }

    try {
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return { formatted: "Invalid date", isValid: false };
      }

      // Format the date exactly like in the image: "1 May 2025"
      const formatted = date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      return { formatted, isValid: true };
    } catch (error) {
      console.error("Error formatting date:", error);
      return { formatted: "Invalid date", isValid: false };
    }
  };

  // Helper function to format time with AM/PM
  const formatTimeWithAMPM = (timeString) => {
    if (!timeString) return "Time not set";

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

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (dateString) => {
    return dateString; // Already formatted in fetchBookings
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    setActiveTab(newTab);
  };

  // UPDATED: Enhanced filtering logic to properly show upcoming appointments
  const filteredBookings = bookings.filter((booking) => {
    const now = new Date();
    const bookingDate = new Date(booking.rawDate);

    if (activeTab === "recent") {
      // Show upcoming bookings (future dates) and confirmed/pending status
      return (
        (bookingDate >= now ||
          booking.status === "confirmed" ||
          booking.status === "pending") &&
        booking.status !== "completed" &&
        booking.status !== "cancelled"
      );
    } else {
      // Show completed bookings (past dates or completed status)
      return (
        bookingDate < now ||
        booking.status === "completed" ||
        booking.status === "cancelled"
      );
    }
  });

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      try {
        // Real API call to cancel booking
        await bookingsAPI.cancel(bookingId, "User cancelled");

        // Update local state to reflect cancellation
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === bookingId
              ? { ...booking, status: "cancelled" }
              : booking
          )
        );

        // Show success message
        setError(null);
        alert("Booking cancelled successfully!");
      } catch (err) {
        setError(
          "Failed to cancel booking: " +
            (err.response?.data?.message || err.message)
        );
        console.error("Cancel booking error:", err);
        alert("Failed to cancel booking. Please try again.");
      }
    }
  };

  const handleRescheduleBooking = async (bookingId) => {
    // Implement reschedule functionality
    alert(
      "Reschedule functionality would open a booking modal for " + bookingId
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="bookings-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}>
      <div className="bookings-container bg-[#1a2332] rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header Section - Updated with real-time data */}
        <div className="relative">
          {/* Back Button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 md:top-6 md:left-6 text-white hover:text-gray-300 transition-colors z-10">
            <svg
              className="w-6 h-6 md:w-8 md:h-8"
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

          {/* Welcome Header with Real-time Data */}
          <div className="pt-4 pl-16 pr-4 pb-4 md:pt-6 md:pl-20 md:pr-6 md:pb-4">
            <div>
              <h1 className="text-white text-xl md:text-3xl font-semibold">
                Welcome, {userData?.firstName || userData?.username || "James"}
              </h1>
              <p className="text-gray-400 text-xs md:text-sm mt-1">
                {getCurrentDate()}
              </p>
            </div>
          </div>

          {/* Bookings Banner */}
          <div className="bg-gradient-to-r from-blue-400 via-purple-300 to-yellow-300 h-16 md:h-24 mx-4 md:mx-6 rounded-t-2xl flex items-center justify-center">
            <h2 className="text-black text-2xl md:text-5xl font-bold tracking-wider">
              BOOKINGS
            </h2>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-[#0f1621] mx-4 md:mx-6 rounded-b-2xl p-4 md:p-8">
          {/* Tab Navigation with Enhanced Animation */}
          <div className="flex border-b border-gray-700 mb-4 md:mb-6 relative">
            <div className="flex w-full bg-[#1a2332] rounded-t-lg overflow-hidden">
              <button
                className={`tab-button flex-1 text-center transition-all duration-300 ease-in-out ${
                  activeTab === "recent"
                    ? "tab-active bg-[#0f1621] text-white"
                    : "tab-inactive text-gray-400 hover:text-gray-300"
                }`}
                onClick={() => handleTabChange("recent")}>
                Recent Bookings
              </button>
              <button
                className={`tab-button flex-1 text-center transition-all duration-300 ease-in-out ${
                  activeTab === "completed"
                    ? "tab-active bg-[#0f1621] text-white"
                    : "tab-inactive text-gray-400 hover:text-gray-300"
                }`}
                onClick={() => handleTabChange("completed")}>
                Completed Bookings
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 md:py-20">
              <div className="w-8 h-8 md:w-12 md:h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 mt-2 md:mt-4 text-sm md:text-base">
                Loading bookings...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-10 md:py-20">
              <p className="text-red-400 mb-3 md:mb-4 text-sm md:text-base">
                Error: {error}
              </p>
              <button
                onClick={fetchBookings}
                className="px-4 py-2 md:px-6 md:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm md:text-base">
                Try Again
              </button>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-10 md:py-20">
              <p className="text-gray-400 text-base md:text-lg">
                No {activeTab === "recent" ? "upcoming" : "completed"} bookings
                found
              </p>
              <p className="text-gray-500 text-xs md:text-sm mt-1 md:mt-2">
                {activeTab === "recent"
                  ? "You don't have any upcoming appointments."
                  : "Your completed bookings will appear here."}
              </p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-[#1a2332] rounded-xl p-4 md:p-6 border border-gray-700 hover:border-gray-600 transition-colors booking-card">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1">
                      {/* Date and Time - Matches image format */}
                      <div className="text-white text-base md:text-lg font-semibold mb-2">
                        {formatDate(booking.date)} {booking.time}
                        {booking.serviceDuration && (
                          <span className="text-gray-400 text-xs md:text-sm ml-2">
                            ({booking.serviceDuration})
                          </span>
                        )}
                      </div>

                      {/* Salon Name */}
                      <div className="text-white text-lg md:text-xl font-bold mb-2">
                        {booking.salonName}
                      </div>

                      {/* Address - Matches image format exactly */}
                      <div className="text-gray-400 text-xs md:text-sm mb-3">
                        {booking.address}
                      </div>

                      {/* Service - Matches image format */}
                      <div className="text-gray-300 text-sm md:text-base mb-2">
                        <strong>Service :</strong> {booking.service}
                      </div>

                      {/* Additional Booking Information */}
                      {booking.staffName && (
                        <div className="text-gray-300 text-xs md:text-sm mb-2">
                          <strong>Assigned Stylist:</strong> {booking.staffName}
                        </div>
                      )}

                      {booking.referenceNumber &&
                        booking.referenceNumber !== "N/A" && (
                          <div className="text-gray-300 text-xs md:text-sm mb-2">
                            <strong>Reference #:</strong>{" "}
                            {booking.referenceNumber}
                          </div>
                        )}

                      {booking.totalAmount > 0 && (
                        <div className="text-gray-300 text-xs md:text-sm">
                          <strong>Total Amount:</strong> ₱
                          {booking.totalAmount.toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Status and Actions */}
                    <div className="flex flex-col items-start md:items-end space-y-3 w-full md:w-auto">
                      <span
                        className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-semibold ${
                          booking.status === "upcoming" ||
                          booking.status === "confirmed" ||
                          booking.status === "pending"
                            ? "bg-yellow-500 bg-opacity-20 text-yellow-300"
                            : booking.status === "completed"
                            ? "bg-green-500 bg-opacity-20 text-green-300"
                            : "bg-red-500 bg-opacity-20 text-red-300"
                        }`}>
                        {booking.status === "upcoming" && "Upcoming"}
                        {booking.status === "confirmed" && "Confirmed"}
                        {booking.status === "pending" && "Pending"}
                        {booking.status === "completed" && "Completed"}
                        {booking.status === "cancelled" && "Cancelled"}
                      </span>

                      {(booking.status === "upcoming" ||
                        booking.status === "confirmed" ||
                        booking.status === "pending") && (
                        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                          <button
                            onClick={() => handleRescheduleBooking(booking.id)}
                            className="px-4 py-2 md:px-6 md:py-2 border-2 border-blue-500 text-blue-500 rounded-full font-semibold text-xs md:text-sm hover:bg-blue-500 hover:text-white transition-all duration-300 tracking-wider w-full md:w-auto">
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="px-4 py-2 md:px-6 md:py-2 border-2 border-red-500 text-red-500 rounded-full font-semibold text-xs md:text-sm hover:bg-red-500 hover:text-white transition-all duration-300 tracking-wider w-full md:w-auto">
                            Cancel
                          </button>
                        </div>
                      )}

                      {booking.status === "completed" && (
                        <button
                          onClick={() => {
                            /* Add review functionality */
                            alert(
                              "Add review functionality for booking: " +
                                booking.id
                            );
                          }}
                          className="px-4 py-2 md:px-6 md:py-2 border-2 border-green-500 text-green-500 rounded-full font-semibold text-xs md:text-sm hover:bg-green-500 hover:text-white transition-all duration-300 tracking-wider w-full md:w-auto">
                          Add Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Bookings;
