import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CustomerAuth from "../components/auth/CustomerAuth";
import StaffAuth from "../components/auth/StaffAuth";
import "../styles/AuthPage.css";

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    if (location.state?.selectedRole) {
      setSelectedRole(location.state.selectedRole);
    } else {
      // Redirect back if no role selected
      navigate("/role-selection");
    }
  }, [location, navigate]);

  if (!selectedRole) {
    return <div>Loading...</div>;
  }

  return (
    <div className="auth-page-container">
      <div className="auth-content">
        {selectedRole.id === "customer" ? <CustomerAuth /> : <StaffAuth />}
      </div>
    </div>
  );
};

export default AuthPage;
