import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

const SLCMemberSecretaryDashboard = () => {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const decodedToken = jwtDecode(token);
        if (decodedToken.role !== "slc(Member Secretary)") {
          window.location.href = "/Account/Login";
          return;
        }
        setUsername(decodedToken.username || "SLC Member Secretary");
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
      <p>You are logged in as a <strong>SLC Member Secretary</strong>.</p>
      <div>
        <h2>SLC Member Secretary Actions</h2>
        <ul>
          <li>Manage Meetings</li>
          <li>Prepare Agendas</li>
          <li>Review Documents</li>
        </ul>
      </div>
    </div>
  );
};

export default SLCMemberSecretaryDashboard;