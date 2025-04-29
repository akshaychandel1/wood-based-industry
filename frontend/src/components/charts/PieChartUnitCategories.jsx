import React, { useState, useEffect, useMemo, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  InputBase,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TablePagination,
  CircularProgress,
} from "@mui/material";
import { FileDownload, ExpandMore, ExpandLess, Close, Search as SearchIcon, Sort } from "@mui/icons-material";
import { fetchPunjabUnitCategories, fetchHaryanaUnitCategories } from "../../utils/api";
import debounce from "lodash/debounce";

// Category colors
const CATEGORY_COLORS = {
  Sawmill: "#D2691E",
  Veneer: "#F4A460",
  "Katha Unit": "#8B4513",
  Plywood: "#FFA500",
  Others: "#4caf50",
};

const COLORS = ["#26A69A", "#4DD0E1", "#FFCA28", "#EF5350", "#AB47BC"];

const getCategoryColor = (category, index) => CATEGORY_COLORS[category] || COLORS[index % COLORS.length];

// Custom Tooltip
const CustomTooltip = ({ active, payload, totalUnits }) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0];
    const percentage = totalUnits > 0 ? ((value / totalUnits) * 100).toFixed(1) : 0;
    return (
      <Box sx={{ background: "#fff", p: 1, borderRadius: "6px", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}>
        <Typography sx={{ fontWeight: 600, color: "#333", fontSize: "0.85rem" }}>{`${name}: ${value}`}</Typography>
        <Typography sx={{ color: "#666", fontSize: "0.75rem" }}>{`${percentage}%`}</Typography>
      </Box>
    );
  }
  return null;
};

const PieChartUnitCategories = ({ selectedState }) => {
  const [data, setData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryDetails, setCategoryDetails] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Fetch and process data based on selectedState
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchFunction = selectedState === "Haryana" ? fetchHaryanaUnitCategories : fetchPunjabUnitCategories;
        const rawData = await fetchFunction(); // No params needed

        if (!rawData || !Array.isArray(rawData)) {
          throw new Error("Invalid data format received");
        }

        const totalUnits = rawData.reduce((sum, entry) => sum + (entry.total_units || 0), 0);
        const threshold = totalUnits * 0.02;
        const keyCategories = ["Sawmill", "Veneer", "Katha Unit", "Plywood"];
        let othersUnits = 0;
        let othersDetails = [];

        const processedData = rawData.filter((entry) => {
          if (keyCategories.includes(entry.category)) return true;
          if (entry.total_units < threshold) {
            othersUnits += entry.total_units;
            othersDetails = othersDetails.concat(JSON.parse(entry.unit_details || "[]"));
            return false;
          }
          return true;
        });

        if (othersUnits > 0) {
          processedData.push({ category: "Others", total_units: othersUnits, unit_details: JSON.stringify(othersDetails) });
        }

        setData(rawData);
        setChartData(processedData);
      } catch (error) {
        console.error(`Error fetching ${selectedState} unit categories:`, error);
        setError(`Failed to load ${selectedState} unit categories data.`);
        setData([]);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedState]);

  const totalUnits = useMemo(() => chartData.reduce((sum, entry) => sum + (entry.total_units || 0), 0), [chartData]);

  const districts = useMemo(() => {
    const allDetails = chartData.flatMap((entry) => JSON.parse(entry.unit_details || "[]"));
    return ["All", ...new Set(allDetails.map((unit) => unit.district_name || "Unknown"))];
  }, [chartData]);

  const handlePieClick = useCallback((entry) => {
    const category = entry.name;
    const details = entry.payload.unit_details ? JSON.parse(entry.payload.unit_details) : [];
    setSelectedCategory(category);
    setCategoryDetails(details);
    setDialogOpen(true);
    setTableSearch("");
    setSelectedDistrict("All");
    setPage(0);
  }, []);

  const debouncedSetSearch = useMemo(() => debounce((value) => setTableSearch(value), 300), []);
  const handleSearchChange = (e) => debouncedSetSearch(e.target.value);

  const filteredCategoryDetails = useMemo(() => {
    return categoryDetails.filter((unit) => {
      const matchesSearch =
        (unit.firmname || "").toLowerCase().includes(tableSearch.toLowerCase()) ||
        (unit.Ownername || "").toLowerCase().includes(tableSearch.toLowerCase()) ||
        (unit.district_name || "").toLowerCase().includes(tableSearch.toLowerCase()) ||
        (unit.Category || "").toLowerCase().includes(tableSearch.toLowerCase());
      const matchesDistrict = selectedDistrict === "All" || unit.district_name === selectedDistrict;
      return matchesSearch && matchesDistrict;
    });
  }, [categoryDetails, tableSearch, selectedDistrict]);

  const sortedCategoryDetails = useMemo(() => {
    if (!sortConfig.key) return filteredCategoryDetails;
    return [...filteredCategoryDetails].sort((a, b) => {
      const direction = sortConfig.direction === "asc" ? 1 : -1;
      const aValue = a[sortConfig.key] || "";
      const bValue = b[sortConfig.key] || "";
      if (sortConfig.key === "Timbervolume") return direction * (Number(aValue) - Number(bValue));
      return direction * String(aValue).localeCompare(String(bValue));
    });
  }, [filteredCategoryDetails, sortConfig]);

  const handleSort = useCallback((key) => {
    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
  }, [sortConfig]);

  const exportChartToCSV = useCallback(() => {
    const csvContent = ["Category,Total Units", ...chartData.map((entry) => `${entry.category},${entry.total_units}`)].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedState}_unit_categories.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }, [chartData, selectedState]);

  const exportTableToCSV = useCallback(() => {
    const headers = selectedCategory === "Others"
      ? "Category,Owner Name,Gender,Mobile,Firm Name,Address,District,Timber Volume,Species"
      : "Owner Name,Gender,Mobile,Firm Name,Address,District,Timber Volume,Species";
    const csvContent = [
      headers,
      ...sortedCategoryDetails.map((unit) =>
        selectedCategory === "Others"
          ? `${unit.Category || "N/A"},${unit.Ownername || "N/A"},${unit.Gender || "N/A"},${unit.Mobile || "N/A"},${unit.firmname || "N/A"},${unit.full_address || "N/A"},${unit.district_name || "N/A"},${unit.Timbervolume || "N/A"},${unit.Species || "N/A"}`
          : `${unit.Ownername || "N/A"},${unit.Gender || "N/A"},${unit.Mobile || "N/A"},${unit.firmname || "N/A"},${unit.full_address || "N/A"},${unit.district_name || "N/A"},${unit.Timbervolume || "N/A"},${unit.Species || "N/A"}`
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedState}_${selectedCategory}_units.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }, [sortedCategoryDetails, selectedCategory, selectedState]);

  return (
    <Box sx={{ minHeight: "auto", background: "#ECEFF1", p: 1 }}>
      {/* Pie Chart Container */}
      <Box
        sx={{
          maxWidth: 1200,
          mx: "auto",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 6px 15px rgba(0,0,0,0.1)",
          p: 4,
          overflow: "hidden",
          minHeight: 450,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h5" sx={{ color: "#26A69A", fontWeight: 600 }}>
            Unit Categories Distribution - {selectedState}
          </Typography>
          <Button
            onClick={exportChartToCSV}
            startIcon={<FileDownload />}
            sx={{
              background: "#26A69A",
              color: "#fff",
              borderRadius: "6px",
              px: 2,
              py: 0.5,
              "&:hover": { background: "#1E7E73" },
            }}
            disabled={chartData.length === 0}
          >
            Export
          </Button>
        </Box>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
            <CircularProgress sx={{ color: "#26A69A" }} />
          </Box>
        ) : error ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
            <Typography sx={{ color: "#EF5350" }}>{error}</Typography>
          </Box>
        ) : chartData.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
            <Typography sx={{ color: "#777", fontSize: "1rem" }}>No unit category data available for {selectedState}</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="total_units"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={140}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: "#666", strokeWidth: 1 }}
                onClick={handlePieClick}
                onMouseEnter={(_, index) => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getCategoryColor(entry.category, index)}
                    style={{ transform: hoveredIndex === index ? "scale(1.03)" : "scale(1)", transition: "transform 0.2s ease" }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip totalUnits={totalUnits} />} />
              <Legend
                verticalAlign="bottom"
                onClick={() => setLegendCollapsed(!legendCollapsed)}
                wrapperStyle={{ cursor: "pointer", fontSize: "14px", color: "#555", paddingTop: 10 }}
                iconType="circle"
                formatter={(value) => (
                  <span style={{ marginRight: 10 }}>
                    {value} {legendCollapsed ? <ExpandMore /> : <ExpandLess />}
                  </span>
                )}
                hidden={legendCollapsed}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
        <Typography sx={{ textAlign: "center", mt: 2, color: "#666", fontSize: "1rem" }}>
          Total: <strong>{totalUnits}</strong> | Categories: <strong>{chartData.length}</strong>
        </Typography>
      </Box>

      {/* Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="lg"
        sx={{
          "& .MuiDialog-paper": {
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
            maxHeight: "95vh",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle sx={{ p: "8px 16px", borderBottom: "1px solid #ddd" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" sx={{ color: "#26A69A", fontWeight: 600, fontSize: "1.1rem" }}>
              {selectedCategory} Units ({selectedState})
            </Typography>
            <IconButton onClick={() => setDialogOpen(false)} sx={{ color: "#26A69A", p: 0.5 }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 2, display: "flex", flexDirection: "column", height: "calc(95vh - 96px)" }}>
          <Box sx={{ display: "flex", gap: 1, py: 1, flexShrink: 0 }}>
            <InputBase
              placeholder="Search..."
              onChange={handleSearchChange}
              startAdornment={<SearchIcon sx={{ color: "#26A69A", fontSize: "18px", mr: 1 }} />}
              sx={{
                background: "#f9f9f9",
                borderRadius: "6px",
                px: 1.5,
                py: 0.25,
                flexGrow: 1,
                fontSize: "0.85rem",
                border: "1px solid #ddd",
              }}
            />
            <Select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              sx={{
                background: "#f9f9f9",
                borderRadius: "6px",
                minWidth: 120,
                fontSize: "0.85rem",
                height: 32,
                border: "1px solid #ddd",
              }}
            >
              {districts.map((district) => (
                <MenuItem key={district} value={district} sx={{ fontSize: "0.85rem" }}>
                  {district}
                </MenuItem>
              ))}
            </Select>
            <Button
              onClick={exportTableToCSV}
              startIcon={<FileDownload fontSize="small" />}
              sx={{
                background: "#26A69A",
                color: "#fff",
                borderRadius: "6px",
                px: 2,
                py: 0.25,
                fontSize: "0.85rem",
                "&:hover": { background: "#1E7E73" },
              }}
            >
              Export
            </Button>
          </Box>
          <TableContainer
            sx={{
              flex: 1,
              background: "#fff",
              borderRadius: "8px",
              border: "1px solid #ddd",
              overflowY: "auto",
            }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", minWidth: 50 }}>
                    Photo
                  </TableCell>
                  {selectedCategory === "Others" && (
                    <TableCell onClick={() => handleSort("Category")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                      Category <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                    </TableCell>
                  )}
                  <TableCell onClick={() => handleSort("Ownername")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                    Owner <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                  </TableCell>
                  <TableCell onClick={() => handleSort("Gender")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                    Gender <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                  </TableCell>
                  <TableCell onClick={() => handleSort("Mobile")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                    Mobile <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                  </TableCell>
                  <TableCell onClick={() => handleSort("firmname")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                    Firm <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                  </TableCell>
                  <TableCell onClick={() => handleSort("full_address")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                    Address <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                  </TableCell>
                  <TableCell onClick={() => handleSort("district_name")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                    District <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                  </TableCell>
                  <TableCell onClick={() => handleSort("Timbervolume")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                    Volume <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                  </TableCell>
                  <TableCell onClick={() => handleSort("Species")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                    Species <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedCategoryDetails.length > 0 ? (
                  sortedCategoryDetails.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((unit, index) => (
                    <TableRow key={index} sx={{ "&:hover": { background: "#f0f0f0" } }}>
                      <TableCell sx={{ py: 0.5 }}>
                        {unit.Ownerphoto ? (
                          <Box
                            component="img"
                            src={unit.Ownerphoto}
                            alt={unit.Ownername}
                            sx={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
                          />
                        ) : (
                          <Box sx={{ width: 28, height: 28, borderRadius: "50%", background: "#e0e0e0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>
                            N/A
                          </Box>
                        )}
                      </TableCell>
                      {selectedCategory === "Others" && (
                        <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{unit.Category || "N/A"}</TableCell>
                      )}
                      <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{unit.Ownername || "N/A"}</TableCell>
                      <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{unit.Gender || "N/A"}</TableCell>
                      <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{unit.Mobile || "N/A"}</TableCell>
                      <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{unit.firmname || "N/A"}</TableCell>
                      <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{unit.full_address || "N/A"}</TableCell>
                      <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{unit.district_name || "N/A"}</TableCell>
                      <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{unit.Timbervolume || "N/A"}</TableCell>
                      <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{unit.Species || "N/A"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={selectedCategory === "Others" ? 10 : 9} align="center" sx={{ py: 2, color: "#777", fontSize: "0.85rem" }}>
                      No {selectedCategory} units found for {selectedState}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={sortedCategoryDetails.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{
              py: 0.5,
              color: "#666",
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: "0.85rem" },
              "& .MuiIconButton-root": { color: "#26A69A", p: 0.5 },
              flexShrink: 0,
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default React.memo(PieChartUnitCategories);