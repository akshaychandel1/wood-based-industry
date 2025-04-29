import React from "react";
import "../css/About.css"; // Import CSS for styling
import Navigation from "../components/Navigation"; // Import the Navigation component
import Header from "../components/Header"; // Import the Header component
import Footer from "../components/Footer"; // Import the Footer component

const About = () => {
  return (
    <div className="about-page">
      <Header /> {/* Add Header component */}
      <Navigation /> {/* Navigation component */}
      <section className="about-section">
        <div className="container">
          <h1 className="section-title">About Forest Department</h1>
          <p>
            Haryana is primarily an agricultural state with almost 80% of its land under cultivation. The geographical area of the state is 44,212 sq. km, which is 1.3% of India’s geographical area. It is not bestowed with a bounty of natural forests, and only 3.9% of its geographical area is under notified forests.
          </p>
          <p>
            As per the India State of Forest Report (FSI, 2013), the Forest Cover in the state is 1,586 sq. km, which is 3.59% of the state's geographical area, and the Tree Cover in the state is 1,282 sq. km, which is 2.90% of the geographical area. Thus, the Forest and Tree Cover of the Haryana state is 6.49% of its geographical area.
          </p>
          <p>
            Forestry activities in the state are dispersed over rugged Shiwalik Hills in the north, Aravalli hills in the south, sand dunes in the west, and wastelands, saline-alkaline lands, and waterlogged sites in the central part of the state.
          </p>
        </div>
      </section>
      <Footer /> {/* Add Footer component */}
    </div>
  );
};

export default About;