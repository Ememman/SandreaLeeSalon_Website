// src/App.jsx - COMPLETED AND UPDATED VERSION
import React, { Suspense, lazy, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LandingPage from "./pages/Landing";
import RoleSelection from "./pages/RoleSelection";
import AuthPage from "./pages/AuthPage";
import ServicesPage from "./pages/Services";
import ProductsPage from "./pages/Products";
import AboutPage from "./pages/About";
import ContactPage from "./pages/Contact";
import CustomerHome from "./CustomerPage/Home";
import CustomerServices from "./CustomerPage/Services";
import CustomerProducts from "./CustomerPage/Products";
import CustomerAppointment from "./CustomerPage/Appointment";
import { isAuthenticated, getUserRole } from "./services/authCustomer";
import "./App.css";

// Debug route loading
console.log("🚀 App.jsx - Initializing application routes...");

// Lazy load the Booking component with error boundary
const CustomerBooking = lazy(() =>
  import("./CustomerPage/Booking").catch((error) => {
    console.error("❌ Failed to load Booking component:", error);
    return {
      default: () => (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Booking Component Failed to Load
            </h2>
            <p className="text-gray-600">
              Please check if the Booking.jsx file exists in the CustomerPage
              directory.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Reload Page
            </button>
          </div>
        </div>
      ),
    };
  })
);

// Checkout component
const Checkout = lazy(() =>
  import("./menu/Checkout").catch((error) => {
    console.error("❌ Failed to load Checkout component:", error);
    return {
      default: () => (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Checkout Component Failed to Load
            </h2>
            <p className="text-gray-600">
              Please check if the Checkout.jsx file exists in the menu
              directory.
            </p>
          </div>
        </div>
      ),
    };
  })
);

import Payment from "./menu/Payment";
import Order from "./menu/Order";

// CORRECTED: Reports component import with proper error handling
const Reports = lazy(() =>
  import("./EmployeesPage/Reports.jsx").catch((error) => {
    console.error("❌ Failed to load Reports component:", error);
    return {
      default: () => (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-400 mb-2">
              Reports Component Failed to Load
            </h2>
            <p className="text-gray-400 mb-4">Error: {error.message}</p>
            <div className="text-left bg-gray-800 p-4 rounded max-w-md">
              <p className="text-sm text-gray-300">Troubleshooting steps:</p>
              <ul className="text-sm text-gray-400 mt-2 list-disc list-inside">
                <li>Check if Reports.jsx exists in EmployeesPage directory</li>
                <li>Verify the file has proper default export</li>
                <li>Check for syntax errors in Reports.jsx</li>
                <li>Ensure all imported components exist</li>
              </ul>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Reload Page
            </button>
          </div>
        </div>
      ),
    };
  })
);

// Attendance component
const Attendance = lazy(() =>
  import("./EmployeesPage/Attendance.jsx").catch((error) => {
    console.error("❌ Failed to load Attendance component:", error);
    return {
      default: () => (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-400 mb-2">
              Attendance Component Failed to Load
            </h2>
            <p className="text-gray-400 mb-4">Error: {error.message}</p>
            <div className="text-left bg-gray-800 p-4 rounded max-w-md">
              <p className="text-sm text-gray-300">Troubleshooting steps:</p>
              <ul className="text-sm text-gray-400 mt-2 list-disc list-inside">
                <li>
                  Check if Attendance.jsx exists in EmployeesPage directory
                </li>
                <li>Verify the file has proper default export</li>
                <li>Check for syntax errors in Attendance.jsx</li>
              </ul>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Reload Page
            </button>
          </div>
        </div>
      ),
    };
  })
);

// Clients component
const Clients = lazy(() =>
  import("./EmployeesPage/Clients.jsx").catch((error) => {
    console.error("❌ Failed to load Clients component:", error);
    return {
      default: () => (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-400 mb-2">
              Clients Component Failed to Load
            </h2>
            <p className="text-gray-400 mb-4">Error: {error.message}</p>
            <div className="text-left bg-gray-800 p-4 rounded max-w-md">
              <p className="text-sm text-gray-300">Troubleshooting steps:</p>
              <ul className="text-sm text-gray-400 mt-2 list-disc list-inside">
                <li>Check if Clients.jsx exists in EmployeesPage directory</li>
                <li>Verify the file has proper default export</li>
                <li>Check for syntax errors in Clients.jsx</li>
              </ul>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Reload Page
            </button>
          </div>
        </div>
      ),
    };
  })
);

// LearningModules component
const LearningModules = lazy(() =>
  import("./EmployeesPage/LearningModules.jsx").catch((error) => {
    console.error("❌ Failed to load LearningModules component:", error);
    return {
      default: () => (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-400 mb-2">
              LearningModules Component Failed to Load
            </h2>
            <p className="text-gray-400 mb-4">Error: {error.message}</p>
            <div className="text-left bg-gray-800 p-4 rounded max-w-md">
              <p className="text-sm text-gray-300">Troubleshooting steps:</p>
              <ul className="text-sm text-gray-400 mt-2 list-disc list-inside">
                <li>
                  Check if LearningModules.jsx exists in EmployeesPage directory
                </li>
                <li>Verify the file has proper default export</li>
                <li>Check for syntax errors in LearningModules.jsx</li>
              </ul>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Reload Page
            </button>
          </div>
        </div>
      ),
    };
  })
);

// Loading component for Suspense
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading page...</p>
    </div>
  </div>
);

// Protected Route Component - UPDATED with proper staff redirect to /employees/reports
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const authenticated = isAuthenticated();
  const userRole = getUserRole();

  console.log("🔒 ProtectedRoute Check:", {
    authenticated,
    userRole,
    allowedRoles,
    path: window.location.pathname,
  });

  if (!authenticated) {
    console.log("🚫 Not authenticated, redirecting to role-selection");
    return <Navigate to="/role-selection" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    console.log("🚫 Role not allowed, redirecting based on role");
    if (userRole === "customer") {
      return <Navigate to="/home" replace />;
    } else if (userRole === "salon_staff") {
      // FIXED: Redirect to /employees/reports as landing page for staff
      console.log("🎯 Redirecting staff to /employees/reports");
      return <Navigate to="/employees/reports" replace />;
    }
    return <Navigate to="/role-selection" replace />;
  }

  console.log("✅ Access granted to protected route");
  return children;
};

// Public Route Component - UPDATED with proper staff redirect
const PublicRoute = ({ children }) => {
  const authenticated = isAuthenticated();
  const userRole = getUserRole();

  console.log("🌐 PublicRoute Check:", {
    authenticated,
    userRole,
    path: window.location.pathname,
  });

  if (authenticated) {
    console.log(
      "✅ Already authenticated, redirecting to appropriate dashboard"
    );
    if (userRole === "customer") {
      return <Navigate to="/home" replace />;
    } else if (userRole === "salon_staff") {
      // FIXED: Redirect authenticated staff to /employees/reports
      console.log("🎯 Redirecting authenticated staff to /employees/reports");
      return <Navigate to="/employees/reports" replace />;
    }
  }

  return children;
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("❌ Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-700 mb-4">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  // Debug route initialization
  useEffect(() => {
    console.log("📁 App.jsx - Route configuration loaded:");
    console.log("✅ Customer routes: /home, /customer/*");
    console.log(
      "✅ Employee routes: /employees/reports, /employees/attendance, /employees/clients, /employees/learning-modules"
    );
    console.log("🎯 Staff landing page: /employees/reports");
    console.log("🚫 Old staff routes redirected to /employees/reports");
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public Routes */}
              <Route
                path="/"
                element={
                  <PublicRoute>
                    <LandingPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/services"
                element={
                  <PublicRoute>
                    <ServicesPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <PublicRoute>
                    <ProductsPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/about"
                element={
                  <PublicRoute>
                    <AboutPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/contact"
                element={
                  <PublicRoute>
                    <ContactPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/role-selection"
                element={
                  <PublicRoute>
                    <RoleSelection />
                  </PublicRoute>
                }
              />
              <Route
                path="/auth"
                element={
                  <PublicRoute>
                    <AuthPage />
                  </PublicRoute>
                }
              />

              {/* Customer Routes */}
              <Route
                path="/home"
                element={
                  <ProtectedRoute allowedRoles={["customer"]}>
                    <CustomerHome />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/services"
                element={
                  <ProtectedRoute allowedRoles={["customer"]}>
                    <CustomerServices />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/products"
                element={
                  <ProtectedRoute allowedRoles={["customer"]}>
                    <CustomerProducts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/appointments"
                element={
                  <ProtectedRoute allowedRoles={["customer"]}>
                    <CustomerAppointment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customer/booking"
                element={
                  <ProtectedRoute allowedRoles={["customer"]}>
                    <CustomerBooking />
                  </ProtectedRoute>
                }
              />

              {/* Checkout Route */}
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute allowedRoles={["customer"]}>
                    <Checkout />
                  </ProtectedRoute>
                }
              />

              {/* Payment Route */}
              <Route
                path="/customer/payment"
                element={
                  <ProtectedRoute allowedRoles={["customer"]}>
                    <Payment />
                  </ProtectedRoute>
                }
              />

              {/* Order Route */}
              <Route
                path="/customer/orders"
                element={
                  <ProtectedRoute allowedRoles={["customer"]}>
                    <Order />
                  </ProtectedRoute>
                }
              />

              {/* EMPLOYEES ROUTES - Primary staff routes with /employees prefix */}
              {/* Reports is the LANDING PAGE for staff */}
              <Route
                path="/employees/reports"
                element={
                  <ProtectedRoute allowedRoles={["salon_staff"]}>
                    <Reports />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/employees/attendance"
                element={
                  <ProtectedRoute allowedRoles={["salon_staff"]}>
                    <Attendance />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/employees/clients"
                element={
                  <ProtectedRoute allowedRoles={["salon_staff"]}>
                    <Clients />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/employees/learning-modules"
                element={
                  <ProtectedRoute allowedRoles={["salon_staff"]}>
                    <LearningModules />
                  </ProtectedRoute>
                }
              />

              {/* REDIRECTS: All old /staff/* routes to new /employees/reports */}
              <Route
                path="/staff/dashboard"
                element={<Navigate to="/employees/reports" replace />}
              />
              <Route
                path="/staff/*"
                element={<Navigate to="/employees/reports" replace />}
              />

              {/* Additional redirects for any legacy staff paths */}
              <Route
                path="/staff"
                element={<Navigate to="/employees/reports" replace />}
              />
              <Route
                path="/employee"
                element={<Navigate to="/employees/reports" replace />}
              />
              <Route
                path="/employee/*"
                element={<Navigate to="/employees/reports" replace />}
              />

              {/* Fallback Routes */}
              <Route
                path="/login"
                element={<Navigate to="/role-selection" replace />}
              />
              <Route
                path="/register"
                element={<Navigate to="/role-selection" replace />}
              />
              <Route
                path="/signin"
                element={<Navigate to="/role-selection" replace />}
              />
              <Route
                path="/signup"
                element={<Navigate to="/role-selection" replace />}
              />

              {/* 404 Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
