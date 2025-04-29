import React, { useState, useEffect } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Typography,
  InputBase,
  Collapse,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Assessment as ReportIcon,
  PersonAdd as PersonAddIcon,
  Description as DescriptionIcon,
  Group as GroupIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronLeft as ChevronLeftIcon,
  Search as SearchIcon,
  Business as OwnershipIcon,
  LocationOn as RelocationIcon,
  Sync as SyncIcon,
  DataArray as MasterDataIcon,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";

const drawerWidth = 240;
const collapsedWidth = 70;

// Animation variants for sidebar
const sidebarVariants = {
  expanded: { width: drawerWidth, transition: { duration: 0.3, ease: "easeInOut" } },
  collapsed: { width: collapsedWidth, transition: { duration: 0.3, ease: "easeInOut" } },
};

// Animation variants for menu items
const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
};

// Animation variants for search bar
const searchVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
};

const Sidebar = ({ onToggle }) => {
  const [openMenu, setOpenMenu] = useState({
    newLicense: false,
    renewal: false,
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();

  const toggleMenu = (menu) => {
    setOpenMenu((prevState) => ({
      ...prevState,
      [menu]: !prevState[menu],
    }));
  };

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  useEffect(() => {
    if (onToggle) {
      onToggle(isCollapsed);
    }
  }, [isCollapsed, onToggle]);

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/admin/dashboard" },
    { text: "Reports", icon: <ReportIcon />, path: "/" },
    { text: "Create User", icon: <PersonAddIcon />, path: "/create-user" },
    { text: "License Detail", icon: <DescriptionIcon />, path: "/license-detail" },
    { text: "Process Master", icon: <GroupIcon />, path: "/process-master" },
  ];

  const dropdownItems = {
    newLicense: [
      { text: "Option 1", path: "/new-license-1" },
      { text: "Option 2", path: "/new-license-2" },
    ],
    renewal: [
      { text: "Option 1", path: "/renewal-1" },
      { text: "Option 2", path: "/renewal-2" },
    ],
  };

  const otherItems = [
    { text: "Ownership Applications", icon: <OwnershipIcon />, path: "/ownership-applications" },
    { text: "Relocation Applications", icon: <RelocationIcon />, path: "/relocation-applications" },
    { text: "Relocation with Ownership", icon: <SyncIcon />, path: "/relocation-with-ownership" },
    { text: "Master Data of License", icon: <MasterDataIcon />, path: "/master-data-license" },
  ];

  // Filter items based on search query
  const filteredMenuItems = menuItems.filter((item) =>
    item.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDropdownItems = {
    newLicense: dropdownItems.newLicense.filter((item) =>
      item.text.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    renewal: dropdownItems.renewal.filter((item) =>
      item.text.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  };

  const filteredOtherItems = otherItems.filter((item) =>
    item.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: isCollapsed ? collapsedWidth : drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: isCollapsed ? collapsedWidth : drawerWidth,
          background: "linear-gradient(180deg, #ffffff 0%, #f5f7fa 100%)",
          borderRadius: "0 20px 20px 0",
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
          overflowX: "hidden",
          borderRight: "none",
        },
      }}
      component={motion.div}
      variants={sidebarVariants}
      initial="expanded"
      animate={isCollapsed ? "collapsed" : "expanded"}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "space-between",
          p: 2,
          borderBottom: "1px solid rgba(0,0,0,0.05)",
          background: "linear-gradient(45deg, #26A69A, #4DB6AC)",
          color: "#fff",
        }}
      >
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
                Admin Panel
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>
        <IconButton
          onClick={toggleSidebar}
          sx={{ color: "#fff", "&:hover": { background: "rgba(255,255,255,0.1)" } }}
          component={motion.div}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeftIcon
            sx={{
              transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s",
            }}
          />
        </IconButton>
      </Box>

      {/* Search */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            variants={searchVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            sx={{ p: 2 }}
          >
            <InputBase
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startAdornment={<SearchIcon sx={{ color: "#26A69A", mr: 1, fontSize: 20 }} />}
              sx={{
                background: "#fff",
                borderRadius: "10px",
                px: 1.5,
                py: 0.5,
                width: "100%",
                fontSize: "0.9rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                border: "1px solid #e0e7ff",
                transition: "all 0.2s",
                "&:focus-within": {
                  borderColor: "#26A69A",
                  boxShadow: "0 4px 12px rgba(38,166,154,0.2)",
                },
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu List */}
      <List sx={{ p: 1 }}>
        {filteredMenuItems.map((item, index) => (
          <Tooltip key={item.text} title={isCollapsed ? item.text : ""} placement="right">
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <ListItem
                component={Link}
                to={item.path}
                sx={{
                  borderRadius: "12px",
                  mb: 0.5,
                  py: 1,
                  bgcolor: location.pathname === item.path ? "rgba(38,166,154,0.15)" : "transparent",
                  "&:hover": { bgcolor: "rgba(38,166,154,0.08)" },
                  transition: "all 0.2s ease",
                }}
              >
                <ListItemIcon sx={{ color: "#26A69A", minWidth: isCollapsed ? 0 : 40 }}>
                  {item.icon}
                </ListItemIcon>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ListItemText
                        primary={item.text}
                        sx={{
                          color: location.pathname === item.path ? "#26A69A" : "#444",
                          fontWeight: 500,
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </ListItem>
            </motion.div>
          </Tooltip>
        ))}

        {/* New License Dropdown */}
        <Tooltip title={isCollapsed ? "New License Applications" : ""} placement="right">
          <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
            <ListItem
              onClick={() => toggleMenu("newLicense")}
              sx={{
                borderRadius: "12px",
                mb: 0.5,
                py: 1,
                "&:hover": { bgcolor: "rgba(38,166,154,0.08)" },
                transition: "all 0.2s ease",
              }}
            >
              <ListItemIcon sx={{ color: "#26A69A", minWidth: isCollapsed ? 0 : 40 }}>
                <DescriptionIcon />
              </ListItemIcon>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: "flex", alignItems: "center", flexGrow: 1 }}
                  >
                    <ListItemText
                      primary="New License Applications"
                      sx={{ color: "#444", fontWeight: 500 }}
                    />
                    <motion.div
                      animate={{ rotate: openMenu.newLicense ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ExpandMoreIcon sx={{ color: "#26A69A" }} />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </ListItem>
          </motion.div>
        </Tooltip>
        <Collapse in={openMenu.newLicense && !isCollapsed} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {filteredDropdownItems.newLicense.map((subItem, index) => (
              <motion.div
                key={subItem.text}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                <ListItem
                  component={Link}
                  to={subItem.path}
                  sx={{
                    pl: 6,
                    borderRadius: "12px",
                    py: 0.75,
                    bgcolor: location.pathname === subItem.path ? "rgba(38,166,154,0.15)" : "transparent",
                    "&:hover": { bgcolor: "rgba(38,166,154,0.08)" },
                    transition: "all 0.2s ease",
                  }}
                >
                  <ListItemText
                    primary={subItem.text}
                    sx={{
                      color: location.pathname === subItem.path ? "#26A69A" : "#555",
                      fontSize: "0.9rem",
                    }}
                  />
                </ListItem>
              </motion.div>
            ))}
          </List>
        </Collapse>

        {/* Renewal Dropdown */}
        <Tooltip title={isCollapsed ? "Renewal Applications" : ""} placement="right">
          <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
            <ListItem
              onClick={() => toggleMenu("renewal")}
              sx={{
                borderRadius: "12px",
                mb: 0.5,
                py: 1,
                "&:hover": { bgcolor: "rgba(38,166,154,0.08)" },
                transition: "all 0.2s ease",
              }}
            >
              <ListItemIcon sx={{ color: "#26A69A", minWidth: isCollapsed ? 0 : 40 }}>
                <ReportIcon />
              </ListItemIcon>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: "flex", alignItems: "center", flexGrow: 1 }}
                  >
                    <ListItemText
                      primary="Renewal Applications"
                      sx={{ color: "#444", fontWeight: 500 }}
                    />
                    <motion.div
                      animate={{ rotate: openMenu.renewal ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ExpandMoreIcon sx={{ color: "#26A69A" }} />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </ListItem>
          </motion.div>
        </Tooltip>
        <Collapse in={openMenu.renewal && !isCollapsed} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {filteredDropdownItems.renewal.map((subItem, index) => (
              <motion.div
                key={subItem.text}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                <ListItem
                  component={Link}
                  to={subItem.path}
                  sx={{
                    pl: 6,
                    borderRadius: "12px",
                    py: 0.75,
                    bgcolor: location.pathname === subItem.path ? "rgba(38,166,154,0.15)" : "transparent",
                    "&:hover": { bgcolor: "rgba(38,166,154,0.08)" },
                    transition: "all 0.2s ease",
                  }}
                >
                  <ListItemText
                    primary={subItem.text}
                    sx={{
                      color: location.pathname === subItem.path ? "#26A69A" : "#555",
                      fontSize: "0.9rem",
                    }}
                  />
                </ListItem>
              </motion.div>
            ))}
          </List>
        </Collapse>

        <Divider sx={{ my: 1, borderColor: "rgba(0,0,0,0.05)" }} />

        {/* Other Items */}
        {filteredOtherItems.map((item, index) => (
          <Tooltip key={item.text} title={isCollapsed ? item.text : ""} placement="right">
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <ListItem
                component={Link}
                to={item.path}
                sx={{
                  borderRadius: "12px",
                  mb: 0.5,
                  py: 1,
                  bgcolor: location.pathname === item.path ? "rgba(38,166,154,0.15)" : "transparent",
                  "&:hover": { bgcolor: "rgba(38,166,154,0.08)" },
                  transition: "all 0.2s ease",
                }}
              >
                <ListItemIcon sx={{ color: "#26A69A", minWidth: isCollapsed ? 0 : 40 }}>
                  {item.icon}
                </ListItemIcon>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ListItemText
                        primary={item.text}
                        sx={{
                          color: location.pathname === item.path ? "#26A69A" : "#444",
                          fontWeight: 500,
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </ListItem>
            </motion.div>
          </Tooltip>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;