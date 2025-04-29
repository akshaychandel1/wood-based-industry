import React, { useState } from "react";
import "../css/LoginForm.css"; // Use the same CSS for styling
import Navigation from "../components/Navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("http://localhost:5000/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ A password reset link has been sent to your email.");
      } else {
        setError(data.error || "❌ Failed to send reset link. Try again.");
      }
    } catch (err) {
      setError("❌ Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Header />
      <Navigation />
      <div className="login-form-container">
        <h1 className="form-title">Forgot Password / Username</h1>
        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit} className="form">
          {/* Email Input */}
          <div className="form-group">
            <label htmlFor="email">Enter your registered email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your Email"
              value={email}
              onChange={handleChange}
              required
            />
          </div>
          {/* Submit Button */}
          <div className="button-group">
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </div>
          {/* Links */}
          <div className="form-links">
            <a href="/Account/Login" className="form-link">Back to Login</a>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default ForgotPassword;