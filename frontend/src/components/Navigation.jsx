import React, { useState } from "react";
import "../css/Navigation.css"; // Import CSS for Navigation

const Navigation = () => {
  const [menuActive, setMenuActive] = useState(false);

  const toggleMenu = () => {
    setMenuActive(!menuActive);
  };

  return (
    <nav className="navbar">
      <div className="container">
        <button className="navbar-toggle" onClick={toggleMenu}>
          Menu
        </button>
        <ul className={`nav-menu ${menuActive ? "active" : ""}`}>
          <li><a href="/">Home</a></li>
          <li><a href="/Home/About">About Us</a></li>
          <li><a href="/Home/Contact">Contact Us</a></li>
          <li><a href="/Account/Login">Log in</a></li>
          <li><a href="/Account/Registration">Register</a></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;