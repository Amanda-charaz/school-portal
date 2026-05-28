import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Lock, Mail, ArrowLeft, Shield } from "lucide-react";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); 
    setLoading(true);

    try {
      localStorage.clear();

      // POST request to backend
      const response = await api.post("/auth/login", {
        identifier,
        email: identifier, 
        password,
      });

      const { token, user } = response.data;

      // Save Auth Data
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      
      // Determine Role (Prioritize 'role' over 'role_id' to fix the identity crisis)
      const userRole = String(user.role || user.role_id || "").toLowerCase().trim();

      if (userRole === "admin") {
        navigate("/admin-dashboard");
      } else if (userRole === "teacher") {
        navigate("/teacher-dashboard"); // ✅ Target the Hub
      } else {
        navigate("/student-dashboard");
      }
    } catch (err) {
      console.error("Login Error:", err.response?.data || err.message);
      setError(
        err.response?.data?.message || "Login failed. Check your ID/Password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const response = await api.post("/auth/forgot-password", { identifier });
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset link.");
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
      <form onSubmit={isForgotMode ? handleForgotPassword : handleLogin} style={{ ...styles.card, backgroundColor: theme.card }}>
        <div style={styles.logoContainer}>
          <div style={styles.logoPlaceholder}>🎓</div>
          <div style={styles.logoText}>
            <div style={styles.universityName}>SCHOOL PORTAL</div>
            <div style={styles.universitySubtext}>STATE INSTITUTION</div>
          </div>
        </div>
        <h2 style={{ ...styles.title, color: theme.text, marginTop: "30px" }}>
          {isForgotMode ? "Reset Password" : "Sign In"}
        </h2>

        {error && <p style={styles.error}>{error}</p>}
        {message && <p style={styles.success}>{message}</p>}

        <input
          type="text"
          placeholder="Email or School ID"
          style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.inputBorder }}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />

        {!isForgotMode && (
          <>
            <input
              type="password"
              placeholder="Password"
              style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.inputBorder }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div style={{ textAlign: 'right', width: '100%', marginBottom: '16px', marginTop: '-8px' }}>
              <button
                type="button"
                onClick={() => { setIsForgotMode(true); setError(""); setMessage(""); }}
                style={{ background: 'none', border: 'none', color: theme.accent, fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
              >
                Forgot Password?
              </button>
            </div>
          </>
        )}

        <button type="submit" style={{ ...styles.button, backgroundColor: theme.accent }} disabled={loading}>
          {loading ? "Please wait..." : (isForgotMode ? "Send Reset Link" : "Sign In")}
        </button>

        {isForgotMode ? (
          <button
            type="button"
            onClick={() => { setIsForgotMode(false); setError(""); setMessage(""); }}
            style={{ ...styles.backBtn, color: theme.subText }}
          >
            <ArrowLeft size={16} /> Back to Login
          </button>
        ) : (
          <p style={{ marginTop: "20px", fontSize: "12px", color: theme.subText }}>
            Contact Admin if you forgot your ID.
          </p>
        )}
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
      backgroundColor: "#f3f4f6",
      padding: isMobile ? "16px" : "0"
    },
    card: {
      backgroundColor: "white",
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
      gap: isMobile ? "10px" : "15px",
      marginBottom: "10px",
      flexDirection: isMobile ? "column" : "row"
    },
    logoPlaceholder: {
      width: isMobile ? "40px" : "50px",
      height: isMobile ? "40px" : "50px",
      backgroundColor: "#003DA5",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: isMobile ? "20px" : "24px"
    },
    logoText: { textAlign: "center" },
    universityName: { fontSize: isMobile ? "14px" : "16px", fontWeight: "bold", color: "#111827", lineHeight: "1.2" },
    universitySubtext: { fontSize: isMobile ? "10px" : "11px", color: "#6b7280", lineHeight: "1.2" },
    title: { fontSize: isMobile ? "18px" : "22px", fontWeight: "700", color: "#111827", marginBottom: "24px" },
    input: { width: "100%", padding: "12px 14px", marginBottom: "16px", borderRadius: "6px", border: "1px solid #d1d5db", boxSizing: "border-box", fontSize: "16px", backgroundColor: "#f9fafb" },
    button: { width: "100%", padding: "12px", backgroundColor: "#003DA5", color: "white", border: "none", borderRadius: "6px", fontWeight: "700", cursor: "pointer", fontSize: "15px" },
    error: { color: "#ef4444", marginBottom: "16px", fontSize: "13px", fontWeight: "500" },
    success: { color: "#10b981", marginBottom: "16px", fontSize: "13px", fontWeight: "500" },
    backBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", fontSize: "13px", marginTop: "20px", margin: "20px auto 0", color: "#6b7280" },
  };
};

export default Login;