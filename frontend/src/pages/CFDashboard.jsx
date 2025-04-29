import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

const CFDashboard = () => {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const decodedToken = jwtDecode(token);
        if (decodedToken.role !== "cf") {
          window.location.href = "/Account/Login";
          return;
        }
        setUsername(decodedToken.username || "CF");
      } else {
        window.location.href = "/Account/Login";
      }
    } catch (err) {
      console.error("Error decoding token:", err.message);
      window.location.href = "/Account/Login";
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome, {username}!</h1>
      <p>You are logged in as a <strong>CF</strong>.</p>
      <div>
        <h2>CF Actions</h2>
        <ul>
          <li>Manage Forest Policies</li>
          <li>Review Reports</li>
          <li>Coordinate with Teams</li>
        </ul>
      </div>
    </div>
  );
};

export default CFDashboard;