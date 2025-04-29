import React, { useEffect, useState } from "react";
import axios from "axios";
import "../css/Footer.css";
import "../css/Navigation.css";
import "../css/Header.css";
import "../css/Home.css";
import Navigation from "./Navigation";
import Header from "./Header"; // Import the Header component
import Footer from "./Footer";
import Notifications from "./Notifications"; // ✅ Now we use this component
import TreeCensus from "./TreeCensus";
import Instructions from "./Instructions";

const Home = () => {
  const [treeCensus, setTreeCensus] = useState([]);
  const [instructions, setInstructions] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [treeRes, instrRes] = await Promise.all([
        axios.get("http://localhost:5000/api/treecensus"),
        axios.get("http://localhost:5000/api/instructions"),
      ]);

      setTreeCensus(treeRes.data);
      setInstructions(instrRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <div className="app-container">
      <Header /> {/* Add Header component */}
      <Navigation />
      <div className="main-content">
        <div className="content-wrapper">
          {/* Left Section - Notifications (70%) */}
          <Notifications /> {/* ✅ Now using the component properly */}

          {/* Right Section - Tree Census & Instructions (30%) */}
          <div className="right-column">
            <TreeCensus data={treeCensus} />
            <Instructions data={instructions} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;
