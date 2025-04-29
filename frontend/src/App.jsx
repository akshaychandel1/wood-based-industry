import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css"; // Import the global CSS
import Home from "./components/Home";
import About from "./pages/About";
import RegistrationForm from "./pages/RegistrationForm";
import LoginForm from "./pages/LoginForm";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import DFOOperatorDashboard from "./pages/DFOOperatorDashboard";
import CCFDashboard from "./pages/CCFDashboard";
import DICDashboard from "./pages/DICDashboard";
import NUserDashboard from "./pages/NUserDashboard";
import WUserDashboard from "./pages/WUserDashboard";
import DFODashboard from "./pages/DFODashboard";
import SLCMemberSecretaryDashboard from "./pages/SLCMemberSecretaryDashboard";
import CFDashboard from "./pages/CFDashboard";
import SLCVerifierDashboard from "./pages/SLCVerifierDashboard";
import ContactInfo from "./pages/ContactUs"; // Import ContactInfo component
import { AuthProvider } from "./utils/AuthContext"; // Import the AuthProvider
import ProtectedRoute from "./components/ProtectedRoute"; // Import the ProtectedRoute
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./components/ResetPassword";


const App = () => {
  return (
    <AuthProvider> {/* Wrap the app with AuthProvider */}
      <Router>
        <div className="app-container">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/Account/Registration" element={<RegistrationForm />} />
            <Route path="/Account/Login" element={<LoginForm />} />
            <Route path="/Home/About" element={<About />} />
            <Route path="/Home/Contact" element={<ContactInfo />} /> {/* Add ContactInfo route */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />



            {/* Protected Routes */}
            {/* Admin Dashboard - Accessible to 'admin' role */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"] ["slc(Member Secretary)"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* User Dashboard - Accessible to 'user' role */}
            <Route
              path="/user/*"
              element={
                <ProtectedRoute allowedRoles={["user"]}>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />

            {/* DFO Operator Dashboard - Accessible to 'DFO_Operator' role */}
            <Route
              path="/dfo-operator/dashboard"
              element={
                <ProtectedRoute allowedRoles={["DFO_Operator"]}>
                  <DFOOperatorDashboard />
                </ProtectedRoute>
              }
            />

            {/* CCF Dashboard - Accessible to 'ccf' role */}
            <Route
              path="/ccf/dashboard"
              element={
                <ProtectedRoute allowedRoles={["ccf"]}>
                  <CCFDashboard />
                </ProtectedRoute>
              }
            />

            {/* DIC Dashboard - Accessible to 'DIC' role */}
            <Route
              path="/dic/dashboard"
              element={
                <ProtectedRoute allowedRoles={["DIC"]}>
                  <DICDashboard />
                </ProtectedRoute>
              }
            />

            {/* NUser Dashboard - Accessible to 'nuser' role */}
            <Route
              path="/nuser/dashboard"
              element={
                <ProtectedRoute allowedRoles={["nuser"]}>
                  <NUserDashboard />
                </ProtectedRoute>
              }
            />

            {/* WUser Dashboard - Accessible to 'wuser' role */}
            <Route
              path="/wuser/dashboard"
              element={
                <ProtectedRoute allowedRoles={["wuser"]}>
                  <WUserDashboard />
                </ProtectedRoute>
              }
            />

            {/* DFO Dashboard - Accessible to 'dfo' role */}
            <Route
              path="/dfo/dashboard"
              element={
                <ProtectedRoute allowedRoles={["dfo"]}>
                  <DFODashboard />
                </ProtectedRoute>
              }
            />

            {/* SLC Member Secretary Dashboard - Accessible to 'slc(Member Secretary)' role */}
            {/* <Route
              path="/slc-member-secretary/dashboard"
              element={
                <ProtectedRoute allowedRoles={["slc(Member Secretary)"]}>
                  <SLCMemberSecretaryDashboard />
                </ProtectedRoute>
              }
            /> */}

            {/* CF Dashboard - Accessible to 'cf' role */}
            <Route
              path="/cf/dashboard"
              element={
                <ProtectedRoute allowedRoles={["cf"]}>
                  <CFDashboard />
                </ProtectedRoute>
              }
            />

            {/* SLC Verifier Dashboard - Accessible to 'SLC_Verifier' role */}
            <Route
              path="/slc-verifier/dashboard"
              element={
                <ProtectedRoute allowedRoles={["SLC_Verifier"]}>
                  <SLCVerifierDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;