// Profile.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  customerProfile,
  getCurrentUser,
  customerUtils,
  authAPI,
  logout,
} from "../services/api";
import "../styles/Profile.css";

const Profile = ({ isOpen, onClose }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchUserProfile();
    }
  }, [isOpen]);

  // Function to detect gender based on first name
  const detectGender = (firstName) => {
    if (!firstName) return "Not Set";

    const maleNames = [
      "james",
      "john",
      "robert",
      "michael",
      "william",
      "david",
      "richard",
      "charles",
      "joseph",
      "thomas",
      "christopher",
      "daniel",
      "paul",
      "mark",
      "donald",
      "george",
      "kenneth",
      "steven",
      "edward",
      "brian",
      "ronald",
      "anthony",
      "kevin",
      "jason",
      "matthew",
      "gary",
      "timothy",
      "jose",
    ];

    const normalizedName = firstName.toLowerCase().trim();
    return maleNames.includes(normalizedName) ? "Male" : "Not Set";
  };

  // Process user data to ensure all fields are properly set
  const processUserData = (data) => {
    const firstName = data?.firstName || data?.username || "User";
    const email = data?.email || "Not Set";

    return {
      firstName: firstName,
      username: data?.username || firstName,
      email: email,
      phoneNumber: data?.phoneNumber || "Not Set",
      gender: data?.gender || detectGender(firstName),
      address: data?.address || "Not Set",
      profileImage: data?.profileImage || null,
    };
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await customerProfile.loadProfile();

      if (result.success) {
        const processedData = processUserData(result.profile);
        setUserData(processedData);
        setEditedData(processedData);
      } else {
        setError(result.error || "Failed to load profile");
      }
    } catch (err) {
      setError("An error occurred while loading profile");
      console.error("Profile loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatPhoneNumber = (phone) => {
    if (!phone || phone === "Not Set") return "Not Set";

    const cleaned = phone.replace(/\D/g, "");

    if (cleaned.startsWith("63") && cleaned.length === 12) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(
        5,
        8
      )} ${cleaned.slice(8)}`;
    }

    if (cleaned.startsWith("0") && cleaned.length === 11) {
      return `+63 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(
        7
      )}`;
    }

    return phone;
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  const handleImageClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      setUploadingImage(true);
      setError(null);

      const result = await customerProfile.uploadProfileImage(file);

      if (result.success) {
        const processedData = processUserData(result.profile);
        setUserData(processedData);
        setEditedData(processedData);
        setSuccessMessage("Profile image updated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setError(result.error || "Failed to upload image");
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError("An error occurred while uploading image");
      setTimeout(() => setError(null), 3000);
      console.error("Image upload error:", err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - revert to original data
      setEditedData({ ...userData });
      setIsEditing(false);
      setError(null);
    } else {
      // Start editing
      setEditedData({ ...userData });
      setIsEditing(true);
    }
  };

  const handleInputChange = (field, value) => {
    setEditedData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);

      const updateData = {
        firstName: editedData.firstName,
        phoneNumber: editedData.phoneNumber,
        address: editedData.address,
        gender: editedData.gender,
      };

      const result = await customerProfile.updateProfile(updateData);

      if (result.success) {
        const processedData = processUserData(result.profile);
        setUserData(processedData);
        setEditedData(processedData);

        // ✅ UPDATE LOCALSTORAGE - THIS IS CRITICAL!
        const currentUser = getCurrentUser();
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            firstName: processedData.firstName,
            phoneNumber: processedData.phoneNumber,
            address: processedData.address,
            gender: processedData.gender,
            profileImage: processedData.profileImage,
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));

          // Trigger a custom event to notify other components
          window.dispatchEvent(
            new CustomEvent("userProfileUpdated", {
              detail: updatedUser,
            })
          );
        }

        setIsEditing(false);
        setSuccessMessage("Profile updated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setError(result.error || "Failed to update profile");
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      setError("An error occurred while updating profile");
      setTimeout(() => setError(null), 3000);
      console.error("Profile update error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError("");

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }

    try {
      const response = await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.data.success) {
        setSuccessMessage("Password changed successfully!");
        setShowPasswordModal(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (err) {
      setPasswordError(
        err.response?.data?.message ||
          "Failed to change password. Please check your current password."
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="profile-overlay" onClick={handleOverlayClick}>
      <div className="profile-container">
        {/* Success Message */}
        {successMessage && (
          <div className="success-message">✓ {successMessage}</div>
        )}

        {/* Error Message */}
        {error && <div className="error-message">✗ {error}</div>}

        {/* Header Section - Updated to match Bookings.jsx */}
        <div className="profile-header">
          {/* Back Button */}
          <button onClick={onClose} className="profile-back-button">
            <svg
              className="back-icon"
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

          {/* Welcome Header - Updated structure */}
          <div className="profile-welcome-header">
            <div className="profile-welcome-text">
              <h1 className="profile-welcome-title">
                Welcome, {userData?.firstName || "User"}
              </h1>
              <p className="profile-welcome-date">{getCurrentDate()}</p>
            </div>

            {/* Edit/Save Button */}
            {!loading && !error && (
              <button
                onClick={isEditing ? handleSaveProfile : handleEditToggle}
                disabled={saving}
                className={`profile-edit-save-button ${
                  isEditing ? "editing" : ""
                } ${saving ? "saving" : ""}`}>
                {saving
                  ? "Saving..."
                  : isEditing
                  ? "Save Changes"
                  : "Edit Profile"}
              </button>
            )}
          </div>

          {/* Profile Banner - Updated to match Bookings.jsx */}
          <div className="profile-banner">
            <h2 className="profile-banner-text">PROFILE</h2>
          </div>
        </div>

        {/* Main Content */}
        <div className="profile-content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading profile...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-text">Error: {error}</p>
              <button onClick={fetchUserProfile} className="retry-button">
                Try Again
              </button>
            </div>
          ) : userData ? (
            <div className="profile-details">
              {/* Profile Image and Name */}
              <div className="profile-image-section">
                <div className="profile-image-container">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="file-input"
                  />
                  <div
                    onClick={handleImageClick}
                    className={`image-wrapper ${isEditing ? "editable" : ""}`}>
                    {uploadingImage && (
                      <div className="image-upload-overlay">
                        <div className="upload-spinner"></div>
                      </div>
                    )}
                    {editedData.profileImage ? (
                      <img
                        src={customerUtils.validateProfileImage(
                          editedData.profileImage
                        )}
                        alt={`${editedData.firstName}'s profile`}
                        className="profile-image"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            editedData.firstName
                          )}&size=128&background=3b82f6&color=fff`;
                        }}
                      />
                    ) : (
                      <div className="profile-image-placeholder">
                        {editedData.firstName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {isEditing && (
                      <div className="image-edit-overlay">
                        <svg
                          className="edit-icon"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                <div className="profile-info">
                  <h3 className="profile-name">
                    {editedData?.firstName || userData.firstName}
                  </h3>
                  <p className="profile-email">{userData.email}</p>
                  {isEditing && (
                    <p className="image-edit-hint">
                      Click on image to change profile picture
                    </p>
                  )}
                </div>
              </div>

              {/* Profile Fields Grid */}
              <div className="profile-fields-grid">
                {/* Full name */}
                <div className="profile-field">
                  <label className="field-label">Full name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.firstName || ""}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      className="field-input editable"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <input
                      type="text"
                      value={userData.firstName || "Not Set"}
                      readOnly
                      className="field-input"
                    />
                  )}
                </div>

                {/* Phone number */}
                <div className="profile-field">
                  <label className="field-label">
                    <span className="flag">🇵🇭</span>
                    Phone number
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.phoneNumber || ""}
                      onChange={(e) =>
                        handleInputChange("phoneNumber", e.target.value)
                      }
                      placeholder="+63 XXX XXX XXXX"
                      className="field-input editable"
                    />
                  ) : (
                    <input
                      type="text"
                      value={formatPhoneNumber(userData.phoneNumber)}
                      readOnly
                      className="field-input"
                    />
                  )}
                </div>

                {/* Nick name */}
                <div className="profile-field">
                  <label className="field-label">Nick name</label>
                  <input
                    type="text"
                    value={userData.username || userData.firstName || "Not Set"}
                    readOnly
                    className="field-input readonly"
                  />
                  <p className="field-hint">Username cannot be changed</p>
                </div>

                {/* Language */}
                <div className="profile-field">
                  <label className="field-label">Language</label>
                  <input
                    type="text"
                    value="English"
                    readOnly
                    className="field-input readonly"
                  />
                </div>

                {/* Gender */}
                <div className="profile-field">
                  <label className="field-label">Gender</label>
                  {isEditing ? (
                    <select
                      value={editedData.gender || "Not Set"}
                      onChange={(e) =>
                        handleInputChange("gender", e.target.value)
                      }
                      className="field-select editable">
                      <option value="Not Set">Not Set</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={userData.gender}
                      readOnly
                      className="field-input"
                    />
                  )}
                </div>

                {/* Email Address */}
                <div className="profile-field">
                  <label className="field-label">Email Address</label>
                  <input
                    type="email"
                    value={userData.email}
                    readOnly
                    className="field-input readonly"
                  />
                  <p className="field-hint">Email cannot be changed</p>
                </div>

                {/* Address - Full Width */}
                <div className="profile-field full-width">
                  <label className="field-label">Address</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.address || ""}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      className="field-input editable"
                      placeholder="Enter your address"
                    />
                  ) : (
                    <input
                      type="text"
                      value={userData.address}
                      readOnly
                      className="field-input"
                    />
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                {/* Change Password Button */}
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="change-password-button">
                  Change Password
                </button>

                {/* Logout and Cancel Buttons */}
                <div className="right-buttons">
                  {isEditing && (
                    <button
                      onClick={handleEditToggle}
                      className="cancel-button">
                      CANCEL
                    </button>
                  )}
                  <button onClick={handleLogout} className="logout-button">
                    LOG OUT
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-data-container">
              <p className="no-data-text">No user data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div
          className="password-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPasswordModal(false);
              setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
              });
              setPasswordError("");
            }
          }}>
          <div className="password-modal">
            <h3 className="modal-title">Change Password</h3>

            <form onSubmit={handlePasswordChange} className="password-form">
              {/* Current Password */}
              <div className="password-field">
                <label className="password-label">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  required
                  className="password-input"
                  placeholder="Enter current password"
                />
              </div>

              {/* New Password */}
              <div className="password-field">
                <label className="password-label">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  required
                  minLength={8}
                  className="password-input"
                  placeholder="Enter new password (min 8 characters)"
                />
              </div>

              {/* Confirm New Password */}
              <div className="password-field">
                <label className="password-label">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                  minLength={8}
                  className="password-input"
                  placeholder="Confirm new password"
                />
              </div>

              {/* Error Message */}
              {passwordError && (
                <div className="password-error">{passwordError}</div>
              )}

              {/* Buttons */}
              <div className="modal-buttons">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                    setPasswordError("");
                  }}
                  className="modal-cancel-button">
                  Cancel
                </button>
                <button type="submit" className="modal-confirm-button">
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
