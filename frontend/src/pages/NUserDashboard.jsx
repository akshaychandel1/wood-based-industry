import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

const NUserDashboard = () => {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const decodedToken = jwtDecode(token);
        if (decodedToken.role !== "nuser") {
          window.location.href = "/Account/Login";
          return;
        }
        setUsername(decodedToken.username || "NUser");
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
      <p>You are logged in as a <strong>NUser</strong>.</p>
      <div>
        <h2>NUser Actions</h2>
        <ul>
          <li>View Notifications</li>
          <li>Submit Feedback</li>
          <li>Access Resources</li>
        </ul>
      </div>
    </div>
  );
};

export default NUserDashboard;