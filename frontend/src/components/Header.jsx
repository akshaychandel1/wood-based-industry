import React from "react";
import "../css/Navigation.css";

const Header = () => (
  <header className="topheader">
    <div className="overlay"></div>
    <div className="header-row">
      <div className="logo">
        <a href="#"><img src="/Forestlogo.jpg" alt="Forest Logo" /></a>
      </div>
      <div className="site-title">
        <h1>WOOD BASED INDUSTRIES MIS</h1>
        <h4>Forest Department, Govt. of Haryana</h4>
      </div>
      <div className="header-images">
        <img className="img_1" src="/header.svg" alt="SWH" />
        <img className="img_2" src="/Emblem_of_Haryana.svg" alt="Haryana Logo" />
      </div>
    </div>
  </header>
);

export default Header;