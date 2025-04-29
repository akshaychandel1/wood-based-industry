import React, { useState, useEffect } from "react";
import "../css/RegistrationForm.css"; // Import CSS for styling
import Navigation from "../components/Navigation"; // Import the Navigation component
import Header from "../components/Header"; // Import the Header component
import Footer from "../components/Footer"; // Import the Footer component

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    title: "",
    firstName: "",
    lastName: "",
    Aadharid: "",
    PhoneNumber: "",
    email: "",
    username: "",
    dob: "",
    password: "",
    confirmPassword: "",
    captcha: "", // Add CAPTCHA input field
    gender: "", // Add gender field
  });

  const [captchaSvg, setCaptchaSvg] = useState(""); // Store CAPTCHA SVG
  const [errors, setErrors] = useState({}); // Store field-specific errors
  const [loading, setLoading] = useState(false); // Loading state
  const [formError, setFormError] = useState(null); // General form error

  // Fetch CAPTCHA on component mount or refresh
  useEffect(() => {
    fetchCaptcha();
  }, []);

  // Function to fetch CAPTCHA from the backend
  const fetchCaptcha = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/captcha"); // Updated to match API_BASE_URL
      if (!response.ok) {
        throw new Error("Failed to fetch CAPTCHA");
      }
      const svg = await response.text(); // CAPTCHA is returned as SVG
      setCaptchaSvg(svg); // Update state with the CAPTCHA image
    } catch (err) {
      console.error("Failed to fetch CAPTCHA:", err);
      setFormError("Failed to load CAPTCHA. Please try again later.");
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear field-specific error when the user starts typing
    setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title) newErrors.title = "Title is required.";
    if (!formData.firstName) newErrors.firstName = "First Name is required.";
    if (!formData.lastName) newErrors.lastName = "Last Name is required.";
    if (!formData.Aadharid || formData.Aadharid.length !== 12)
      newErrors.Aadharid = "Aadhar ID must be 12 digits.";
    if (!formData.PhoneNumber || formData.PhoneNumber.length !== 10)
      newErrors.PhoneNumber = "Mobile No. must be 10 digits.";
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email address.";
    if (!formData.username) newErrors.username = "Username is required.";
    if (!formData.dob) newErrors.dob = "Date of Birth is required.";
    if (!formData.password || formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters.";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";
    if (!formData.captcha) newErrors.captcha = "CAPTCHA is required.";
    if (!formData.gender) newErrors.gender = "Gender is required."; // Validate gender

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      setFormError("Please fix the errors below.");
      return;
    }

    setLoading(true);
    setFormError(null);

    try {
      const response = await fetch("http://localhost:5000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData), // Send form data including CAPTCHA
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ Registration Successful!");
        setFormData({
          title: "",
          firstName: "",
          lastName: "",
          Aadharid: "",
          PhoneNumber: "",
          email: "",
          username: "",
          dob: "",
          password: "",
          confirmPassword: "",
          captcha: "",
          gender: "", // Reset gender field
        });
        setErrors({});
        fetchCaptcha(); // Refresh CAPTCHA after successful registration
      } else {
        setFormError(data.error || "Registration failed. Please try again.");
        fetchCaptcha(); // Refresh CAPTCHA after failed attempt
      }
    } catch (error) {
      setFormError("❌ Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-page">
      <Header /> {/* Add Header component */}
      <Navigation /> {/* Navigation component */}
      <div className="registration-form-container">
        <h1 className="form-title">Register</h1>
        {formError && <p className="error-message">{formError}</p>}
        <form onSubmit={handleSubmit} className="form">
          {/* Title and First Name */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <select
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              >
                <option value="">Select Title</option>
                <option value="Mr">Mr</option>
                <option value="Mrs">Mrs</option>
                <option value="Ms">Ms</option>
                <option value="Dr">Dr</option>
              </select>
              {errors.title && <p className="error-message">{errors.title}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                placeholder="Enter your First Name"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              {errors.firstName && (
                <p className="error-message">{errors.firstName}</p>
              )}
            </div>
          </div>

          {/* Last Name and Gender */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                placeholder="Enter your Last Name"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
              {errors.lastName && (
                <p className="error-message">{errors.lastName}</p>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <p className="error-message">{errors.gender}</p>}
            </div>
          </div>

          {/* Aadhar ID and Phone Number */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="Aadharid">Aadhar ID</label>
              <input
                type="text"
                id="Aadharid"
                name="Aadharid"
                placeholder="Enter your Aadhar ID"
                value={formData.Aadharid}
                onChange={handleChange}
                required
              />
              {errors.Aadharid && (
                <p className="error-message">{errors.Aadharid}</p>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="PhoneNumber">Phone Number</label>
              <input
                type="text"
                id="PhoneNumber"
                name="PhoneNumber"
                placeholder="Enter your Phone Number"
                value={formData.PhoneNumber}
                onChange={handleChange}
                required
              />
              {errors.PhoneNumber && (
                <p className="error-message">{errors.PhoneNumber}</p>
              )}
            </div>
          </div>

          {/* Email and Username */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              {errors.email && <p className="error-message">{errors.email}</p>}
            </div>
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
              {errors.username && (
                <p className="error-message">{errors.username}</p>
              )}
            </div>
          </div>

          {/* Date of Birth and Password */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dob">Date of Birth</label>
              <input
                type="date"
                id="dob"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
              />
              {errors.dob && <p className="error-message">{errors.dob}</p>}
            </div>
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
              {errors.password && (
                <p className="error-message">{errors.password}</p>
              )}
            </div>
          </div>

          {/* Confirm Password and CAPTCHA */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              {errors.confirmPassword && (
                <p className="error-message">{errors.confirmPassword}</p>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="captcha">Solve the CAPTCHA</label>
              <div className="captcha-container">
                <div
                  dangerouslySetInnerHTML={{ __html: captchaSvg }} // Render CAPTCHA SVG
                  className="captcha-image"
                />
                <button
                  type="button"
                  className="refresh-btn"
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
              {errors.captcha && (
                <p className="error-message">{errors.captcha}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="button-group">
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
              aria-label="Register"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </div>
        </form>
      </div>
      <Footer /> {/* Add Footer component */}
    </div>
  );
};

export default RegistrationForm;