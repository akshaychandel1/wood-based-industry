import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { loginUser, registerUser, requestPasswordReset, resetPassword } from "./api"; // ✅ Matches `api.js`

// ✅ Create the AuthContext
const AuthContext = createContext();

// ✅ AuthProvider Component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Login function
  const login = async (credentials) => {
    try {
      const data = await loginUser(credentials);
      const token = data.token;

      // Decode the token to get the user's role
      const decodedToken = jwtDecode(token);
      const role = decodedToken.role;

      // Store the token and role in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("userRole", role);

      // Update state
      setIsAuthenticated(true);
      setUserRole(role);
      console.log(`✅ Logged in as ${role}`);
      return data;
    } catch (error) {
      throw error;
    }
  };

  // ✅ Register function
  const register = async (userData) => {
    try {
      return await registerUser(userData);
    } catch (error) {
      throw error;
    }
  };

  // ✅ Logout function
  const logout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    console.log("✅ Logged out successfully");
  };

  // ✅ Forgot Password function
  const forgotPassword = async (email) => {
    try {
      return await requestPasswordReset(email);
    } catch (error) {
      throw error;
    }
  };

  // ✅ Reset Password function
  const resetUserPassword = async (data) => {
    try {
      return await resetPassword(data);
    } catch (error) {
      throw error;
    }
  };

  // ✅ Check if the user is authenticated on page load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        // Decode the token to extract the user's role
        const decodedToken = jwtDecode(token);
        const role = decodedToken.role;

        // Update state
        setIsAuthenticated(true);
        setUserRole(role);
        console.log(`✅ Restored authentication for role: ${role}`);
      } catch (err) {
        console.error("❌ Invalid token:", err.message);
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userRole,
        login,
        logout,
        register,
        forgotPassword,
        resetUserPassword,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Custom hook to use the AuthContext
export const useAuth = () => useContext(AuthContext);
