import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("Home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navbarRef = useRef(null);

  const navItems = useMemo(
    () => [
      { name: "Home", path: "/" },
      { name: "Services", path: "/services" },
      { name: "Products", path: "/products" },
      { name: "About", path: "/about" },
      { name: "Contact", path: "/contact" },
    ],
    []
  );

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Sync active tab with current route
  useEffect(() => {
    const currentItem = navItems.find(
      (item) =>
        location.pathname === item.path ||
        (location.pathname.startsWith(item.path) && item.path !== "/")
    );

    if (currentItem && currentItem.name !== activeTab) {
      setActiveTab(currentItem.name);
    }
  }, [location.pathname, navItems, activeTab]);

  const handleNavigation = useCallback(
    (item) => {
      if (activeTab === item.name) return;
      setActiveTab(item.name);
      navigate(item.path);
    },
    [navigate, activeTab]
  );

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  }, [isMobileMenuOpen]);

  return (
    <nav
      ref={navbarRef}
      className="modern-navbar"
      role="navigation"
      aria-label="Main Navigation">
      {/* Glass container */}
      <div className="navbar-glass">
        {/* Desktop Navigation */}
        {!isMobile ? (
          <div className="navbar-links">
            {navItems.map((item) => {
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item)}
                  className={`nav-link ${isActive ? "active" : ""} ${
                    item.name === "Contact" ? "nav-link--contact" : ""
                  }`}
                  role="tab"
                  aria-selected={isActive}>
                  {item.name}
                </button>
              );
            })}
          </div>
        ) : (
          /* Mobile Hamburger Menu - Centered */
          <div className="navbar-mobile">
            {/* Centered Hamburger Button */}
            <button
              onClick={toggleMobileMenu}
              className={`hamburger-button ${
                isMobileMenuOpen ? "hamburger-button--active" : ""
              }`}
              aria-label="Toggle Menu"
              aria-expanded={isMobileMenuOpen}>
              <span className="hamburger-button__line hamburger-button__line--1" />
              <span className="hamburger-button__line hamburger-button__line--2" />
              <span className="hamburger-button__line hamburger-button__line--3" />
            </button>
          </div>
        )}

        {/* Mobile Dropdown Menu */}
        {isMobile && isMobileMenuOpen && (
          <div className="navbar-dropdown">
            <div className="navbar-dropdown__content">
              {navItems.map((item) => {
                const isActive = activeTab === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item)}
                    className={`navbar-dropdown__item ${
                      isActive ? "navbar-dropdown__item--active" : ""
                    }`}>
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default React.memo(Navbar);
