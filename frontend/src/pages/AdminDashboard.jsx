import React, { useState } from "react";
import { useAuth } from "../utils/AuthContext";
import Sidebar from "./Sidebar";
import BarChartTotalUnits from "../components/charts/BarChartTotalUnits";
import PieChartUnitCategories from "../components/charts/PieChartUnitCategories";
import PieChartLicenseStatus from "../components/charts/PieChartLicenseStatus";
import LineChartOwnershipChanges from "../components/charts/LineChartOwnershipChanges";
import NewApplications from "../components/charts/NewApplications";
import DistrictBarGraph from "../components/charts/DistrictBarGraph";
import Footer from "../components/Footer";
import { Box, Grid, Button, Tabs, Tab, Typography } from "@mui/material";
import { motion } from "framer-motion";

const drawerWidth = 240;
const collapsedWidth = 60;

const AdminDashboard = () => {
  const { logout, userRole } = useAuth(); // Use userRole from AuthContext
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Determine if the user is an admin
  const isAdmin = userRole === "admin";

  // Set initial state: Punjab for all, but SLC can't change it
  const [selectedState, setSelectedState] = useState("Punjab");

  const handleSidebarToggle = (collapsed) => {
    setIsSidebarCollapsed(collapsed);
  };

  const handleStateChange = (event, newValue) => {
    if (isAdmin) { // Only allow state change for admin
      setSelectedState(newValue);
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", background: "#ECEFF1" }}>
      <Sidebar onToggle={handleSidebarToggle} />
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        sx={{
          flexGrow: 1,
          width: `calc(100% - ${isSidebarCollapsed ? collapsedWidth : drawerWidth}px)`,
          p: { xs: 1.5, sm: 2, md: 2.5 },
          transition: "width 0.3s ease-in-out",
          boxSizing: "border-box",
        }}
      >
        {/* State Selection or Fixed Title */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          {isAdmin ? (
            <Tabs
              value={selectedState}
              onChange={handleStateChange}
              sx={{
                "& .MuiTab-root": {
                  fontWeight: 600,
                  textTransform: "none",
                  color: "#444",
                  "&.Mui-selected": { color: "#26A69A" },
                },
                "& .MuiTabs-indicator": { backgroundColor: "#26A69A" },
              }}
            >
              <Tab label="Punjab" value="Punjab" />
              <Tab label="Haryana" value="Haryana" />
            </Tabs>
          ) : (
            <Typography
              variant="h6"
              sx={{ color: "#26A69A", fontWeight: 600, py: 1 }}
            >
              Punjab Dashboard (SLC Member Secretary)
            </Typography>
          )}
          <Button
            onClick={logout}
            variant="contained"
            sx={{
              background: "#26A69A",
              color: "#fff",
              borderRadius: "6px",
              px: 3,
              py: 0.8,
              fontWeight: 600,
              textTransform: "none",
              boxShadow: "0 3px 15px rgba(38, 166, 154, 0.3)",
              "&:hover": { background: "#1E7E73", boxShadow: "0 5px 20px rgba(38, 166, 154, 0.4)" },
            }}
          >
            Logout
          </Button>
        </Box>

        {/* Dashboard Components */}
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <BarChartTotalUnits selectedState={selectedState} />
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={6}>
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <PieChartUnitCategories selectedState={selectedState} />
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={6}>
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <PieChartLicenseStatus selectedState={selectedState} />
            </motion.div>
          </Grid>
          <Grid item xs={12}>
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <NewApplications selectedState={selectedState} />
            </motion.div>
          </Grid>
          <Grid item xs={12}>
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <DistrictBarGraph selectedState={selectedState} />
            </motion.div>
          </Grid>
          <Grid item xs={12}>
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <LineChartOwnershipChanges selectedState={selectedState} />
            </motion.div>
          </Grid>
          <Grid item xs={12}>
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <Footer selectedState={selectedState} />
            </motion.div>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AdminDashboard;

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.08); }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(styleSheet);