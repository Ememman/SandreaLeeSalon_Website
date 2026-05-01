// src/components/ui/Toast.jsx
import React, { useEffect, useState } from "react";
import {
  IoCheckmarkCircle,
  IoCloseCircle,
  IoWarning,
  IoInformationCircle,
  IoClose,
} from "react-icons/io5";
import "../../styles/Toast.css";

const Toast = ({ type = "default", message, duration = 5000, onClose }) => {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getToastConfig = () => {
    const config = {
      success: {
        icon: <IoCheckmarkCircle className="toast-icon" />,
        className: "toast-success",
      },
      error: {
        icon: <IoCloseCircle className="toast-icon" />,
        className: "toast-error",
      },
      warning: {
        icon: <IoWarning className="toast-icon" />,
        className: "toast-warning",
      },
      info: {
        icon: <IoInformationCircle className="toast-icon" />,
        className: "toast-info",
      },
      default: {
        icon: <IoInformationCircle className="toast-icon" />,
        className: "toast-default",
      },
    };

    return config[type] || config.default;
  };

  const { icon, className } = getToastConfig();

  return (
    <div className={`toast ${className} ${isLeaving ? "toast-leaving" : ""}`}>
      <div className="toast-content">
        <div className="toast-icon-wrapper">{icon}</div>
        <div className="toast-message">{message}</div>
        <button
          className="toast-close-btn"
          onClick={handleClose}
          aria-label="Close notification">
          <IoClose className="toast-close-icon" />
        </button>
      </div>
      <div
        className="toast-progress"
        style={{
          animationDuration: `${duration}ms`,
          animationPlayState: isLeaving ? "paused" : "running",
        }}
      />
    </div>
  );
};

export default ToastContainer;
