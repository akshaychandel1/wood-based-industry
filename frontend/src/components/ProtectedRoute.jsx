import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, userRole, isLoading } = useAuth();

  // Show a fallback UI while the authentication state is being restored
  if (isLoading) {
    return <div>Loading...</div>; // Replace with a proper loading spinner
  }

  // Redirect unauthenticated users to the login page
  if (!isAuthenticated) {
    console.log("Redirecting to /Account/Login because isAuthenticated is false");
    return <Navigate to="/Account/Login" replace />;
  }

  // Check if the user's role is allowed
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    console.log(`Redirecting because user role (${userRole}) is not in allowed roles:`, allowedRoles);
    return <Navigate to="/Account/Login" replace />;
  }

  // Render the protected content if authenticated and authorized
  return children;
};
export default ProtectedRoute;