import React, { useState, useEffect } from "react";
import "../css/LoginForm.css"; // Import CSS for styling
import Navigation from "../components/Navigation"; // Import the Navigation component
import Header from "../components/Header"; // Import the Header component
import Footer from "../components/Footer"; // Import the Footer component
import { useAuth } from "../utils/AuthContext"; // Import the AuthContext hook
import { jwtDecode } from "jwt-decode";

const LoginForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    captcha: "", // Add CAPTCHA input field
  });
  const [captchaSvg, setCaptchaSvg] = useState(""); // Store CAPTCHA SVG
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(null); // Error message
  const { login } = useAuth(); // Access the login function from AuthContext

  // Fetch CAPTCHA on component mount or refresh
  useEffect(() => {
    fetchCaptcha();
  }, []);

  // Function to fetch CAPTCHA from the backend
  const fetchCaptcha = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/captcha");
      if (!response.ok) {
        throw new Error("Failed to fetch CAPTCHA");
      }
      const svg = await response.text(); // CAPTCHA is returned as SVG
      setCaptchaSvg(svg); // Update state with the CAPTCHA image
    } catch (err) {
      console.error("Failed to fetch CAPTCHA:", err);
      setError("Failed to load CAPTCHA. Please try again later.");
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData), // Send plain text password
      });

      const data = await response.json();

      if (response.ok) {
        // Decode the JWT token to extract the user's role
        const decodedToken = jwtDecode(data.token);
        const userRole = decodedToken.role;


        // Save the JWT token in localStorage (or sessionStorage)
        localStorage.setItem("token", data.token);

        // Update the authentication state using AuthContext
        login();

        // Redirect based on role (matching App.jsx routes)
        switch (userRole) {
          case "admin":
            window.location.href = "/admin/dashboard";

            break;
            case "user":
            window.location.href = "/user/application-form";
            break;

          case "DFO_Operator":
            window.location.href = "/dfo-operator/dashboard";
            break;
          case "ccf":
            window.location.href = "/ccf/dashboard";
            break;
          case "DIC":
            window.location.href = "/dic/dashboard";
            break;
          case "nuser":
            window.location.href = "/nuser/dashboard";
            break;
          case "wuser":
            window.location.href = "/wuser/dashboard";
            break;
          case "dfo":
            window.location.href = "/dfo/dashboard";
            break;
          case "slc(Member Secretary)":
            window.location.href = "/admin/dashboard";
            break;
          case "cf":
            window.location.href = "/cf/dashboard";
            break;
          case "SLC_Verifier":
            window.location.href = "/slc-verifier/dashboard";
            break;
          default:
            window.location.href = "/user";
            break;
        }
      } else {
        setError(data.error || "Login failed. Please check your credentials.");
        fetchCaptcha(); // Refresh CAPTCHA after failed attempt
      }
    } catch (err) {
      setError("❌ Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Header /> {/* Add Header component */}
      <Navigation /> {/* Navigation component */}
      <div className="login-form-container">
        <h1 className="form-title">Login</h1>
       {/* <div><img src="../../tree3d.png" alt="" /></div> */}
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit} className="form">
          {/* Username */}
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Enter your Username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          {/* CAPTCHA */}
          <div className="form-group">
            <label htmlFor="captcha">Solve the CAPTCHA</label>
            <div className="captcha-container">
              <div
                dangerouslySetInnerHTML={{ __html: captchaSvg }} // Render CAPTCHA SVG
                className="captcha-image"
              />
              <button
                type="button"
                className="refresh-captcha-btn"
                onClick={fetchCaptcha} // Refresh CAPTCHA
                aria-label="Refresh CAPTCHA"
              >
                Refresh
              </button>
            </div>
            <input
              type="text"
              id="captcha"
              name="captcha"
              placeholder="Enter the result"
              value={formData.captcha}
              onChange={handleChange}
              required
            />
          </div>
          {/* Button Group */}
          <div className="button-group">
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
              aria-label="Login"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
          {/* Links */}
          <div className="form-links">
            <a href="/Account/Registration" className="form-link">
              Don't have an account? Sign Up
            </a>
            <a href="/forgot-password" className="form-link">
              Forgot your Password / Username ?
            </a>
            {/* <a href="/forgot-username" className="form-link">
              Forgot your Username?
            </a> */}
          </div>
        </form>
      </div>
      <Footer /> {/* Add Footer component */}
    </div>
  );
};

export default LoginForm;