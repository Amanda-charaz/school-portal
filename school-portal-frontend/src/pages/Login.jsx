import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Lock, Mail, ArrowLeft, Shield, Eye, EyeOff } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const { theme, darkMode, toggleTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false); // New state for "Remember Me"
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const navigate = useNavigate();

  useEffect(() => {
    const savedIdentifier = localStorage.getItem("rememberedIdentifier");
    if (savedIdentifier) {
      setIdentifier(savedIdentifier);
      setRememberMe(true);
    }

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
      
      // Handle "Remember Me"
      if (rememberMe) {
        localStorage.setItem("rememberedIdentifier", identifier);
      } else {
        localStorage.removeItem("rememberedIdentifier");
      }
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
          autoComplete="username"
          required
        />

        {!isForgotMode && (
          <>
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                style={{ ...styles.input, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.inputBorder, paddingRight: '40px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: theme.subText }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div style={{ textAlign: 'right', width: '100%', marginBottom: '16px', marginTop: '-8px' }}>
              <button
                type="button"
                onClick={() => { setIsForgotMode(true); setError(""); setMessage(""); }}
                style={{ background: 'none', border: 'none', color: theme.accentBlue, fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
              >
                Forgot Password?
              </button>
            </div>
          </>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: '100%', marginBottom: '20px' }}>
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{ marginRight: '8px', width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label
            htmlFor="rememberMe"
            style={{ fontSize: '14px', color: theme.subText, cursor: 'pointer', lineHeight: '1.5' }}
          >
            Remember Me
          </label>
        </div>

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
          <p style={{ marginTop: "20px", fontSize: "12px", color: theme.subText, lineHeight: "1.4" }}>
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
      justifyContent: "center", // Base font size should be handled by global CSS or specific elements
      backgroundColor: "#F5F0E6",
      padding: isMobile ? "16px" : "0"
    },
    card: {
      backgroundColor: "#FFFDF8",
      padding: isMobile ? "24px" : "50px",
      borderRadius: "12px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.07)",
      width: "100%",
      maxWidth: "420px",
      textAlign: "center",
      border: "1px solid #DDD6C8"
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
    universityName: { fontSize: isMobile ? "16px" : "18px", fontWeight: "700", color: "#172033", lineHeight: "1.4" },
    universitySubtext: { fontSize: "12px", color: "#6B6B63", lineHeight: "1.4" },
    title: { fontSize: isMobile ? "20px" : "24px", fontWeight: "700", color: "#172033", marginBottom: "24px", lineHeight: "1.3" },
    input: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: "6px",
      border: "1px solid #DDD6C8",
      boxSizing: "border-box",
      fontSize: "14px",
      lineHeight: "1.5",
      backgroundColor: "#FFFDF8"
    },
    button: { width: "100%", padding: "12px", backgroundColor: "#A52A2A", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer", fontSize: "14px", lineHeight: "1.4" },
    error: { color: "#ef4444", marginBottom: "16px", fontSize: "14px", fontWeight: "400", lineHeight: "1.5" },
    success: { color: "#10b981", marginBottom: "16px", fontSize: "14px", fontWeight: "400", lineHeight: "1.5" },
    backBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", fontSize: "14px", marginTop: "20px", margin: "20px auto 0", color: "#6B6B63", lineHeight: "1.4" },
  };
};

export default Login;