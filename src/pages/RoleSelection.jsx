import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ModelLogin from "../assets/ModelLogin.png";
import StaffIcon from "../assets/icons/staff.png";
import CustomerIcon from "../assets/icons/customer.png";
import SalonLogo from "../assets/SandreaLeeSalonLogoCapstone.png";
import "../styles/RoleSelection.css";

const RoleSelection = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check screen size on load and resize
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    // Load Urbanist font
    const font = new FontFace(
      "Urbanist",
      "url(../assets/fonts/Urbanist-VariableFont_wght.ttf)"
    );

    font
      .load()
      .then((loadedFont) => {
        document.fonts.add(loadedFont);
        document.body.style.fontFamily = "Urbanist, sans-serif";
      })
      .catch((error) => {
        console.error("Error loading Urbanist font:", error);
      });

    fetchRoles();

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/auth/roles");
      const data = await response.json();

      if (data.success) {
        setRoles(data.data.roles);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      // Fallback roles
      setRoles([
        {
          id: "customer",
          name: "Customer",
          description: "Those who need Service",
          authMethods: ["email_phone", "google", "facebook"],
        },
        {
          id: "salon_staff",
          name: "Salon Staff",
          description: "Those who sell Service",
          authMethods: ["email_phone"],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role) => {
    navigate("/auth", { state: { selectedRole: role } });
  };

  const handleBack = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div className="role-selection-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="role-selection-container">
      {/* Back Button - Hidden on smallest screens */}
      <button className="back-button" onClick={handleBack}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M19 12H5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 19L5 12L12 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="back-text">Back to Home</span>
      </button>

      <div className="role-selection-card">
        <div className="role-content">
          <div className="role-left-panel">
            {/* Mobile Header Logo */}
            {isMobile && (
              <div className="mobile-logo">
                <img
                  src={SalonLogo}
                  alt="Sandrea Lee Salon"
                  className="salon-logo-mobile"
                />
              </div>
            )}

            <div className="role-header">
              {!isMobile && (
                <div className="logo-section">
                  <img
                    src={SalonLogo}
                    alt="Sandrea Lee Salon"
                    className="salon-logo"
                  />
                </div>
              )}
              <p>Select your role to continue your journey with us</p>
            </div>

            <div className="roles-list">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="role-card"
                  onClick={() => handleRoleSelect(role)}>
                  <div className="role-icon-container">
                    <div className="role-icon">
                      <img
                        src={role.id === "customer" ? CustomerIcon : StaffIcon}
                        alt={role.name}
                        className="role-icon-image"
                      />
                    </div>
                  </div>
                  <div className="role-info">
                    <h3>{role.name}</h3>
                    <p>{role.description}</p>
                  </div>
                  <div className="role-arrow">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M5 12H19"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 5L19 12L12 19"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            <div className="role-footer">
              <p>
                Need help choosing? <span>Contact support</span>
              </p>
            </div>
          </div>

          {/* Hide right panel on mobile */}
          {!isMobile && (
            <div className="role-right-panel">
              <div className="image-container">
                <img
                  src={ModelLogin}
                  alt="Salon Professional"
                  className="model-image"
                />
                <div className="image-overlay">
                  <div className="overlay-content">
                    <h3>Elevate Your Style</h3>
                    <p>
                      Join thousands of satisfied customers and professional
                      stylists
                    </p>
                    <div className="stats">
                      <div className="stat">
                        <strong>500+</strong>
                        <span>Professionals</span>
                      </div>
                      <div className="stat">
                        <strong>10K+</strong>
                        <span>Happy Clients</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
