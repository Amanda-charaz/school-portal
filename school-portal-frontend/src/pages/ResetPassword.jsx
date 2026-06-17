import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { Lock, ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") setDarkMode(true);

    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Invalid request. Missing reset token.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/reset-password", {
        token,
        newPassword
      });
      setMessage(response.data.message);
      // Redirect to login after a short delay so they can read the success message
      setTimeout(() => navigate("/"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const theme = {
    bg: darkMode ? "#111827" : "#f3f4f6",
    card: darkMode ? "#1f2937" : "#ffffff",
    text: darkMode ? "#f9fafb" : "#111827",
    subText: darkMode ? "#9ca3af" : "#6b7280",
    inputBg: darkMode ? "#374151" : "#ffffff",
    inputBorder: darkMode ? "#4b5563" : "#d1d5db",
    accent: "#6366f1"
  };

  const styles = getResponsiveStyles(windowWidth);

  return (
    <div style={{ ...styles.container, backgroundColor: theme.bg }}>
      <form onSubmit={handleResetSubmit} style={{ ...styles.card, backgroundColor: theme.card }}>
        <div style={styles.logoContainer}>
          <div style={{ ...styles.logoPlaceholder, backgroundColor: theme.accent }}>
            <ShieldCheck size={24} color="white" />
          </div>
          <div style={styles.logoText}>
            <div style={{ ...styles.universityName, color: theme.text }}>SECURITY HUB</div>
            <div style={styles.universitySubtext}>ACCOUNT RECOVERY</div>
          </div>
        </div>

        <h2 style={{ ...styles.title, color: theme.text, marginTop: "30px" }}>
          Create New Password
        </h2>
        <p style={{ color: theme.subText, fontSize: "13px", marginBottom: "25px" }}>
          Please enter and confirm your new secure password.
        </p>

        {error && <p style={styles.error}>{error}</p>}
        {message && <p style={styles.success}>{message}</p>}

        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New Password"
            style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.inputBorder, paddingRight: '40px' }}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: theme.subText }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <input
          type="password"
          placeholder="Confirm New Password"
          style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.inputBorder, marginBottom: '25px' }}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button type="submit" style={{ ...styles.button, backgroundColor: theme.accent }} disabled={loading}>
          {loading ? "Updating..." : "Reset Password"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/")}
          style={{ ...styles.backBtn, color: theme.subText }}
        >
          <ArrowLeft size={16} /> Back to Login
        </button>
      </form>
    </div>
  );
};

const getResponsiveStyles = (width) => {
  const isMobile = width < 640;
  return {
    container: {
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: isMobile ? "19px" : "17px",
      padding: isMobile ? "16px" : "0"
    },
    card: {
      padding: isMobile ? "24px" : "50px",
      borderRadius: "12px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
      width: "100%",
      maxWidth: "420px",
      textAlign: "center",
      border: "1px solid #e5e7eb"
    },
    logoContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "15px",
      marginBottom: "10px"
    },
    logoPlaceholder: {
      width: "45px",
      height: "45px",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    logoText: { textAlign: "left" },
    universityName: { fontSize: "18px", fontWeight: "bold", lineHeight: "1.2" },
    universitySubtext: { fontSize: "13px", color: "#6b7280", lineHeight: "1.2" },
    title: { fontSize: isMobile ? "22px" : "26px", fontWeight: "700", marginBottom: "10px" },
    input: { 
      width: "100%", 
      padding: "12px 14px", 
      borderRadius: "6px", 
      border: "1px solid #d1d5db", 
      boxSizing: "border-box", 
      fontSize: isMobile ? "19px" : "17px" 
    },
    button: { width: "100%", padding: "12px", color: "white", border: "none", borderRadius: "6px", fontWeight: "700", cursor: "pointer", fontSize: "15px" },
    error: { color: "#ef4444", marginBottom: "16px", fontSize: "13px", fontWeight: "500", backgroundColor: "#fee2e2", padding: "10px", borderRadius: "6px" },
    success: { color: "#065f46", marginBottom: "16px", fontSize: "13px", fontWeight: "500", backgroundColor: "#ecfdf5", padding: "10px", borderRadius: "6px" },
    backBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", fontSize: "13px", marginTop: "20px", margin: "20px auto 0" },
  };
};

export default ResetPassword;