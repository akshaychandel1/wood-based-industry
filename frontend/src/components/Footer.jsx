import React from "react";
import "../css/Footer.css"; // Import CSS for Footer

const Footer = () => (
  <footer>
    <div className="container footer-container" style={{  display: "flex", justifyContent: "space-between" }}>
      {/* Left Side Logos */}
      <div className="footer-logos left">
        <img src="/mygov1.svg" alt="MyGov Logo" className="footer-logo large-logo" />
        <img src="/Digital.svg" alt="Digital India Logo" width="150px" height="150px"  className="footer-logo large-logo" />
      </div>

      {/* Footer Text */}
      <div className="footer-text">
        <p>Website Content Managed by Forest Department, Govt of Haryana</p>
        <p>
          Designed and Developed by{" "}
          <a href="https://cdac.in" target="_blank" rel="noopener noreferrer">
            C-DAC, Mohali
          </a>
        </p>
      </div>

      {/* Right Side Logos */}
      <div className="footer-logos right">
        <img src="/g20.svg" alt="G20 Logo" className="footer-logo" />
        <img src="/npilogo.png" alt="National Portal of India Logo" className="footer-logo" />
      </div>

      {/* Social Media Icons */}
      <div className="footer-social-icons">
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
          <i className="fab fa-facebook-f"></i>
        </a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
          <i className="fab fa-twitter"></i>
        </a>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
          <i className="fab fa-instagram"></i>
        </a>
        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
          <i className="fab fa-linkedin-in"></i>
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;