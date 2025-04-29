import React, { useState, useMemo, useCallback, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, CartesianGrid, PieChart, Pie } from "recharts";
import {
  Box,
  Typography,
  IconButton,
  Button,
  InputBase,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Dialog,
  DialogTitle,
  DialogContent,
  TablePagination,
  CircularProgress,
} from "@mui/material";
import { Search as SearchIcon, Close, Sort, ExpandMore, ExpandLess, FileDownload } from "@mui/icons-material";
import {
  fetchPunjabTotalUnits,
  fetchPunjabDistrictCategory,
  fetchPunjabDistrictCategoryDetails,
  fetchHaryanaTotalUnits,
  fetchHaryanaDistrictCategory,
  fetchHaryanaDistrictCategoryDetails,
} from "../../utils/api";
import { motion } from "framer-motion";
import debounce from "lodash/debounce";

const COLORS = [
  "#26A69A", "#4DD0E1", "#FFCA28", "#EF5350", "#AB47BC",
  "#FF7043", "#66BB6A", "#D4E157", "#F06292", "#29B6F6",
];

const CustomTooltip = ({ active, payload, label, totalUnits, rank }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const percentage = totalUnits > 0 ? ((value / totalUnits) * 100).toFixed(1) : 0;
    return (
      <Box sx={{ background: "#fff", p: 1.5, borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
        <Typography sx={{ fontWeight: 500, color: "#333" }}>{`${label}: ${value} units`}</Typography>
        <Typography sx={{ color: "#555" }}>{`Percentage: ${percentage}%`}</Typography>
        <Typography sx={{ color: "#555" }}>{`Rank: ${rank}`}</Typography>
      </Box>
    );
  }
  return null;
};

const BarChartTotalUnits = ({ selectedState }) => {
  const [data, setData] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("total_units_desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [hiddenDistricts, setHiddenDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [categoryDetails, setCategoryDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [tableSearch, setTableSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [legendCollapsed, setLegendCollapsed] = useState(false);

  // Fetch initial total units data based on selectedState
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingInitial(true);
      setError(null);
      try {
        const fetchFunction = selectedState === "Haryana" ? fetchHaryanaTotalUnits : fetchPunjabTotalUnits;
        const response = await fetchFunction(); // No state param needed
        setData(Array.isArray(response) ? response : []);
      } catch (err) {
        console.error(`Error fetching ${selectedState} total units:`, err);
        setError(`Failed to load ${selectedState} total units data.`);
        setData([]);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchInitialData();
  }, [selectedState]);

  const totalUnits = useMemo(() => data.reduce((sum, entry) => sum + (entry.total_units || 0), 0), [data]);

  const processedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    let filtered = data.filter((entry) =>
      (entry.district || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    filtered.sort((a, b) => {
      if (sortBy === "total_units_desc") return (b.total_units || 0) - (a.total_units || 0);
      if (sortBy === "total_units_asc") return (a.total_units || 0) - (b.total_units || 0);
      if (sortBy === "district_asc") return (a.district || "").localeCompare(b.district || "");
      return (b.district || "").localeCompare(a.district || "");
    });
    filtered = filtered.map((entry, index) => ({ ...entry, rank: index + 1 }));
    return filtered.filter((entry) => !hiddenDistricts.includes(entry.district));
  }, [data, sortBy, searchTerm, hiddenDistricts]);

  const topDistricts = useMemo(() => {
    return data
      .slice()
      .sort((a, b) => (b.total_units || 0) - (a.total_units || 0))
      .slice(0, 3)
      .map((entry) => entry.district || "");
  }, [data]);

  const debouncedSetTableSearch = useMemo(() => debounce((value) => setTableSearch(value), 300), []);

  const filteredCategoryDetails = useMemo(() => {
    return categoryDetails.filter((unit) =>
      (unit.firmname || "").toLowerCase().includes(tableSearch.toLowerCase()) ||
      (unit.ownername || "").toLowerCase().includes(tableSearch.toLowerCase()) ||
      (unit.location || "").toLowerCase().includes(tableSearch.toLowerCase())
    );
  }, [categoryDetails, tableSearch]);

  const sortedCategoryDetails = useMemo(() => {
    if (!sortConfig.key) return filteredCategoryDetails;
    return [...filteredCategoryDetails].sort((a, b) => {
      const direction = sortConfig.direction === "asc" ? 1 : -1;
      const aValue = sortConfig.key === "id" ? (a[sortConfig.key] || 0) : String(a[sortConfig.key] || "").toLowerCase();
      const bValue = sortConfig.key === "id" ? (b[sortConfig.key] || 0) : String(b[sortConfig.key] || "").toLowerCase();
      if (sortConfig.key === "id") return direction * (aValue - bValue);
      return direction * aValue.localeCompare(bValue);
    });
  }, [filteredCategoryDetails, sortConfig]);

  const handleLegendClick = useCallback((entry) => {
    const district = entry.value || entry.dataKey;
    if (typeof district !== "string") return;
    setHiddenDistricts((prev) =>
      prev.includes(district) ? prev.filter((d) => d !== district) : [...prev, district]
    );
  }, []);

  const exportToCSV = useCallback(() => {
    const csvContent = [
      "District,Total Units",
      ...processedData.map((entry) => `${entry.district || "Unknown"},${entry.total_units || 0}`),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `total_units_by_district_${selectedState}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }, [processedData, selectedState]);

  const exportTableToCSV = useCallback(() => {
    const csvContent = [
      "Unit ID,Firm Name,Owner Name,Location",
      ...sortedCategoryDetails.map((unit) => `${unit.id},${unit.firmname || "N/A"},${unit.ownername || "N/A"},${unit.location || "N/A"}`),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedDistrict}_${selectedCategory}_details_${selectedState}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }, [sortedCategoryDetails, selectedDistrict, selectedCategory, selectedState]);

  const handleBarClick = useCallback(async (data) => {
    if (data && data.activeLabel) {
      const district = data.activeLabel;
      setSelectedDistrict(district);
      setLoading(true);
      setCategoryDetails([]);
      setSelectedCategory(null);
      setDetailsDialogOpen(false);
      try {
        const fetchFunction = selectedState === "Haryana" ? fetchHaryanaDistrictCategory : fetchPunjabDistrictCategory;
        const response = await fetchFunction({ district }); // Only district param
        console.log(`${selectedState} Category Data Response:`, response);
        const dataArray = Array.isArray(response) ? response : [];
        setCategoryData(dataArray);
      } catch (error) {
        console.error(`Error fetching ${selectedState} category data:`, error);
        setCategoryData([]);
      } finally {
        setLoading(false);
      }
    }
  }, [selectedState]);

  const handlePieClick = useCallback(async (data) => {
    if (data && data.name) {
      const category = data.name;
      console.log("Pie Clicked - Category:", category, "District:", selectedDistrict, "State:", selectedState);
      setSelectedCategory(category);
      setLoading(true);
      setTableSearch("");
      setPage(0);
      try {
        const fetchFunction = selectedState === "Haryana" ? fetchHaryanaDistrictCategoryDetails : fetchPunjabDistrictCategoryDetails;
        const response = await fetchFunction({ district: selectedDistrict, category }); // District and category params
        console.log(`${selectedState} Category Details Response:`, response);
        const detailsArray = Array.isArray(response) ? response : [];
        setCategoryDetails(detailsArray);
        setDetailsDialogOpen(true);
        console.log("Updated categoryDetails:", detailsArray);
      } catch (error) {
        console.error(`Error fetching ${selectedState} category details:`, error);
        setCategoryDetails([]);
        setDetailsDialogOpen(false);
      } finally {
        setLoading(false);
      }
    }
  }, [selectedDistrict, selectedState]);

  const handleSort = useCallback((key) => {
    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
  }, [sortConfig]);

  const pieChartContent = useMemo(() => {
    if (categoryData.length === 0) return <Typography sx={{ color: "#777" }}>No category data available.</Typography>;
    return (
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={categoryData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={120}
            fill="#26A69A"
            label={({ name, value }) => `${name}: ${value}`}
            labelLine={true}
            onClick={handlePieClick}
          >
            {categoryData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }, [categoryData, handlePieClick]);

  return (
    <Box
      component={motion.div}
      sx={{
        mx: "auto",
        background: "#fff",
        borderRadius: "16px",
        boxShadow: "0 6px 15px rgba(0,0,0,0.1)",
        overflow: "hidden",
        p: 4,
        minHeight: 450,
        position: "relative",
      }}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 3, pl: 2 }}>
        <Typography variant="h4" sx={{ color: "#26A69A", fontWeight: 700, flexGrow: 1 }}>
          TOTAL UNITS BY DISTRICT - {selectedState}
        </Typography>
      </Box>

      {loadingInitial ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 450 }}>
          <CircularProgress sx={{ color: "#26A69A" }} />
        </Box>
      ) : error ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 450 }}>
          <Typography sx={{ color: "#EF5350" }}>{error}</Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ display: "flex", gap: 2, mb: 3, px: 2, background: "#f5f7fa", py: 1.5, borderRadius: "8px" }}>
            <InputBase
              placeholder="Search districts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startAdornment={<SearchIcon sx={{ color: "#26A69A", mr: 1 }} />}
              sx={{
                background: "#fff",
                borderRadius: "8px",
                px: 2,
                py: 0.5,
                flexGrow: 1,
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                "&:hover": { boxShadow: "0 4px 8px rgba(0,0,0,0.1)" },
              }}
            />
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              sx={{
                background: "#fff",
                borderRadius: "8px",
                px: 1,
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                "&:hover": { boxShadow: "0 4px 8px rgba(0,0,0,0.1)" },
                minWidth: 200,
              }}
            >
              <MenuItem value="total_units_desc">Units (High to Low)</MenuItem>
              <MenuItem value="total_units_asc">Units (Low to High)</MenuItem>
              <MenuItem value="district_asc">District (A-Z)</MenuItem>
              <MenuItem value="district_desc">District (Z-A)</MenuItem>
            </Select>
            <Button
              onClick={exportToCSV}
              startIcon={<FileDownload />}
              sx={{
                background: "#26A69A",
                color: "#fff",
                borderRadius: "8px",
                px: 3,
                py: 1,
                textTransform: "none",
                "&:hover": { background: "#1E7E73" },
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              Export
            </Button>
          </Box>

          <ResponsiveContainer width="100%" height={450}>
            <BarChart data={processedData} onClick={handleBarClick}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
              <XAxis dataKey="district" angle={-22} textAnchor="end" height={80} interval={0} tick={{ fill: "#777", fontSize: 12 }} />
              <YAxis domain={[0, Math.max(...processedData.map((d) => d.total_units || 0), 10) + 10]} tick={{ fill: "#777", fontSize: 12 }} />
              <Tooltip
                content={({ active, payload, label }) => (
                  <CustomTooltip
                    active={active}
                    payload={payload}
                    label={label}
                    totalUnits={totalUnits}
                    rank={processedData.find((d) => d.district === label)?.rank}
                  />
                )}
              />
              <Legend
                onClick={handleLegendClick}
                wrapperStyle={{ cursor: "pointer", fontSize: "14px", color: "#777", paddingTop: 10 }}
                iconType="circle"
                verticalAlign="bottom"
                layout="horizontal"
                formatter={(value) => (
                  <span onClick={() => setLegendCollapsed(!legendCollapsed)} style={{ cursor: "pointer" }}>
                    {value} {legendCollapsed ? <ExpandMore /> : <ExpandLess />}
                  </span>
                )}
                hidden={legendCollapsed}
              />
              <Bar dataKey="total_units" barSize={Math.min(40, 800 / (processedData.length || 1))} animationDuration={800} isAnimationActive={true}>
                {processedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke={topDistricts.includes(entry.district) ? "#FFD700" : "none"}
                    strokeWidth={topDistricts.includes(entry.district) ? 2 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>
      )}

      {/* Pie Chart Dialog */}
      <Dialog
        open={!!selectedDistrict}
        onClose={() => setSelectedDistrict(null)}
        fullWidth
        maxWidth="md"
        sx={{
          "& .MuiDialog-paper": {
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          },
        }}
        component={motion.div}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <DialogTitle component="div" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2 }}>
          <Typography variant="h6" sx={{ color: "#26A69A", fontWeight: 600 }}>
            Units in {selectedDistrict} ({selectedState})
          </Typography>
          <IconButton onClick={() => setSelectedDistrict(null)} sx={{ color: "#26A69A" }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 320 }}>
              <CircularProgress sx={{ color: "#26A69A" }} />
            </Box>
          ) : (
            pieChartContent
          )}
        </DialogContent>
      </Dialog>

      {/* Category Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
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
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <DialogTitle sx={{ p: "8px 16px", borderBottom: "1px solid #ddd" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" sx={{ color: "#26A69A", fontWeight: 600, fontSize: "1.1rem" }}>
              {selectedCategory} in {selectedDistrict} ({selectedState})
            </Typography>
            <IconButton onClick={() => setDetailsDialogOpen(false)} sx={{ color: "#26A69A", p: 0.5 }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 2, display: "flex", flexDirection: "column", height: "calc(95vh - 96px)" }}>
          <Box sx={{ display: "flex", gap: 1, py: 1, flexShrink: 0 }}>
            <InputBase
              placeholder="Search by firm/owner/location..."
              onChange={(e) => debouncedSetTableSearch(e.target.value)}
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
                  <TableCell onClick={() => handleSort("id")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                    Application ID <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                  </TableCell>
                  <TableCell onClick={() => handleSort("firmname")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                    Firm Name <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                  </TableCell>
                  <TableCell onClick={() => handleSort("ownername")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                    Owner Name <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                  </TableCell>
                  <TableCell onClick={() => handleSort("location")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                    Location <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedCategoryDetails.length > 0 ? (
                  sortedCategoryDetails.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((unit) => (
                    <TableRow key={unit.id} sx={{ "&:hover": { background: "#f0f0f0" } }}>
                      <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{unit.id}</TableCell>
                      <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{unit.firmname || "N/A"}</TableCell>
                      <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{unit.ownername || "N/A"}</TableCell>
                      <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{unit.location || "N/A"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 2, color: "#777", fontSize: "0.85rem" }}>
                      No data available
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
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: "0.8rem" },
              "& .MuiIconButton-root": { color: "#26A69A", p: 0.5 },
              flexShrink: 0,
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default React.memo(BarChartTotalUnits);