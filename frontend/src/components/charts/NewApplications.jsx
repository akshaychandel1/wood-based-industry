import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  fetchPunjabNewApplications,
  fetchHaryanaNewApplications,
  fetchPunjabFilterOptions,
  fetchHaryanaFilterOptions,
} from "../../utils/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
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
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import { Search as SearchIcon, Close, FileDownload, Sort, Refresh } from "@mui/icons-material";
import { motion } from "framer-motion";
import debounce from "lodash/debounce";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { month } = payload[0].payload;
    return (
      <Box sx={{ background: "#fff", p: 1, borderRadius: "6px", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}>
        <Typography sx={{ fontWeight: 600, color: "#333", fontSize: "0.85rem" }}>{`Month: ${month}`}</Typography>
        {payload.map((entry, index) => (
          <Typography key={index} sx={{ color: entry.stroke, fontSize: "0.85rem" }}>
            {`${entry.name}: ${entry.value}`}
          </Typography>
        ))}
      </Box>
    );
  }
  return null;
};

const NewApplications = ({ selectedState }) => {
  const [data, setData] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailedDataCache, setDetailedDataCache] = useState({});
  const [dialogMonth, setDialogMonth] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const fetchAppsFunction = selectedState === "Punjab" ? fetchPunjabNewApplications : fetchHaryanaNewApplications;
      const fetchFiltersFunction = selectedState === "Punjab" ? fetchPunjabFilterOptions : fetchHaryanaFilterOptions;

      const [aggregateData, filterOptions] = await Promise.all([
        fetchAppsFunction(params),
        fetchFiltersFunction(),
      ]);

      const formattedData = aggregateData
        .reduce((acc, item) => {
          const existing = acc.find((d) => d.month === item.month);
          if (existing) {
            existing[item.type] = item.total;
          } else {
            acc.push({ month: item.month, [item.type]: item.total });
          }
          return acc;
        }, [])
        .sort((a, b) => new Date(a.month) - new Date(b.month));

      setData(formattedData);
      setDistricts(filterOptions.districts || []);
      setCategories(filterOptions.categories || []);
    } catch (err) {
      console.error(`Failed to fetch ${selectedState} data:`, err.message);
      setError(`Failed to load ${selectedState} data: ${err.message}`);
      setData([]);
      setDistricts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [selectedState]);

  useEffect(() => {
    const params = {};
    if (selectedType) params.type = selectedType;
    if (selectedDistrictId) params.district = selectedDistrictId;
    if (selectedCategoryId) params.category = selectedCategoryId;
    fetchData(params);
  }, [selectedState, selectedType, selectedDistrictId, selectedCategoryId, fetchData]);

  const handleResetFilters = useCallback(() => {
    setSelectedType("");
    setSelectedDistrictId("");
    setSelectedCategoryId("");
  }, []);

  const handleLineClick = useCallback(async (data) => {
    if (!data || !data.activePayload || !data.activePayload[0]) return;
    const clickedMonth = data.activePayload[0].payload.month;
    setDialogMonth(clickedMonth);

    if (detailedDataCache[clickedMonth]) {
      setDialogOpen(true);
    } else {
      setLoading(true);
      setError(null);
      try {
        const fetchAppsFunction = selectedState === "Punjab" ? fetchPunjabNewApplications : fetchHaryanaNewApplications;
        const detailedData = await fetchAppsFunction({ detailed: true, month: clickedMonth });
        setDetailedDataCache((prev) => ({ ...prev, [clickedMonth]: detailedData }));
        setDialogOpen(true);
      } catch (err) {
        console.error(`Error fetching ${selectedState} detailed data:`, err.message);
        setError(`Failed to load ${selectedState} details: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  }, [selectedState, detailedDataCache]);

  const exportToCSV = useCallback(() => {
    const headers = "Month,New License,Renewal,Ownership Change,Relocation";
    const rows = data.map((item) =>
      `${item.month},${item["New License"] || 0},${item["Renewal"] || 0},${item["Ownership Change"] || 0},${item["Relocation"] || 0}`
    );
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedState}_new_applications.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }, [data, selectedState]);

  const handleSort = useCallback((key) => {
    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
  }, [sortConfig]);

  const debouncedSetSearchTerm = useMemo(() => debounce((value) => setSearchTerm(value), 300), []);

  const sortedDetailedData = useMemo(() => {
    const detailedData = detailedDataCache[dialogMonth] || [];
    if (!sortConfig.key) return detailedData;
    return [...detailedData].sort((a, b) => {
      const direction = sortConfig.direction === "asc" ? 1 : -1;
      const aValue = a[sortConfig.key] || "";
      const bValue = b[sortConfig.key] || "";
      if (sortConfig.key === "id") return direction * (aValue - bValue);
      if (sortConfig.key.includes("Date") || sortConfig.key === "renewalFrom" || sortConfig.key === "renewalTo")
        return direction * (new Date(aValue || 0) - new Date(bValue || 0));
      return direction * String(aValue).localeCompare(String(bValue));
    });
  }, [detailedDataCache, dialogMonth, sortConfig]);

  const filteredDetailedData = useMemo(() => {
    const tabTypes = ["New License", "Renewal", "Ownership Change", "Relocation"];
    let filtered = sortedDetailedData.filter((item) => item.type === tabTypes[tabValue]);
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        [item.id, item.firmName, item.licenseNo, item.districtName, item.categoryName, item.dfoDivision]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return filtered;
  }, [sortedDetailedData, tabValue, searchTerm]);

  return (
    <Box sx={{ minHeight: "auto", background: "#ECEFF1", p: 1 }}>
      <Box
        component={motion.div}
        sx={{
          mx: "auto",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 6px 15px rgba(0,0,0,0.1)",
          overflow: "hidden",
          p: 4,
          minHeight: 400,
        }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h5" sx={{ color: "#26A69A", fontWeight: 600 }}>
            Application Type Comparison Per Month - {selectedState}
          </Typography>
          <Button
            onClick={exportToCSV}
            startIcon={<FileDownload />}
            sx={{ background: "#26A69A", color: "#fff", borderRadius: "6px", px: 2, py: 0.5, "&:hover": { background: "#1E7E73" } }}
            disabled={data.length === 0 || loading}
          >
            Export
          </Button>
        </Box>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
          <Select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            displayEmpty
            sx={{ background: "#f9f9f9", borderRadius: "6px", px: 1.5, py: 0.25, width: 200, fontSize: "0.85rem", border: "1px solid #ddd" }}
          >
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="New License">New License</MenuItem>
            <MenuItem value="Renewal">Renewal</MenuItem>
            <MenuItem value="Ownership Change">Ownership Change</MenuItem>
            <MenuItem value="Relocation">Relocation</MenuItem>
          </Select>
          <Select
            value={selectedDistrictId}
            onChange={(e) => setSelectedDistrictId(e.target.value)}
            displayEmpty
            sx={{ background: "#f9f9f9", borderRadius: "6px", px: 1.5, py: 0.25, width: 200, fontSize: "0.85rem", border: "1px solid #ddd" }}
          >
            <MenuItem value="">All Districts</MenuItem>
            {districts.map((district) => (
              <MenuItem key={district.id} value={district.id}>
                {district.name}
              </MenuItem>
            ))}
          </Select>
          <Select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            displayEmpty
            sx={{ background: "#f9f9f9", borderRadius: "6px", px: 1.5, py: 0.25, width: 200, fontSize: "0.85rem", border: "1px solid #ddd" }}
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
          <Button
            onClick={handleResetFilters}
            startIcon={<Refresh />}
            sx={{ background: "#f9f9f9", color: "#26A69A", borderRadius: "6px", px: 2, py: 0.5, border: "1px solid #ddd", "&:hover": { background: "#e0e0e0" } }}
          >
            Reset Filters
          </Button>
        </Box>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
            <CircularProgress sx={{ color: "#26A69A" }} />
          </Box>
        ) : data.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
            <Typography sx={{ color: "#777", fontSize: "1rem" }}>No data available for {selectedState} with the selected filters</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} onClick={handleLineClick}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: "0.8rem" }}
                label={{ value: "Month", position: "insideBottom", offset: -5, fill: "#666" }}
              />
              <YAxis
                tick={{ fontSize: "0.8rem" }}
                label={{ value: "Number of Applications", angle: -90, position: "insideLeft", offset: 10, fill: "#666" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="New License" stroke="#0088FE" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="New License" />
              <Line type="monotone" dataKey="Renewal" stroke="#00C49F" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Renewal" />
              <Line type="monotone" dataKey="Ownership Change" stroke="#FFBB28" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Ownership Change" />
              <Line type="monotone" dataKey="Relocation" stroke="#FF8042" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Relocation" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="lg"
        sx={{ "& .MuiDialog-paper": { background: "#fff", borderRadius: "12px", boxShadow: "0 8px 25px rgba(0,0,0,0.15)", maxHeight: "95vh", overflow: "hidden" } }}
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <DialogTitle sx={{ p: "8px 16px", borderBottom: "1px solid #ddd" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" sx={{ color: "#26A69A", fontWeight: 600, fontSize: "1.1rem" }}>
              Applications for {dialogMonth} ({selectedState})
            </Typography>
            <IconButton onClick={() => setDialogOpen(false)} sx={{ color: "#26A69A", p: 0.5 }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 2, display: "flex", flexDirection: "column", height: "calc(95vh - 96px)" }}>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          <Box sx={{ display: "flex", gap: 1, py: 1, flexShrink: 0 }}>
            <InputBase
              placeholder="Search by ID, Firm, License..."
              onChange={(e) => debouncedSetSearchTerm(e.target.value)}
              startAdornment={<SearchIcon sx={{ color: "#26A69A", fontSize: "18px", mr: 1 }} />}
              sx={{ background: "#f9f9f9", borderRadius: "6px", px: 1.5, py: 0.25, flexGrow: 1, fontSize: "0.85rem", border: "1px solid #ddd" }}
            />
            <Button
              onClick={() => {
                const headers = "ID,Firm Name,License No,District,Category,Created Date,DFO Division,Renewal From,Renewal To";
                const rows = filteredDetailedData.map((item) =>
                  `${item.id},${item.firmName || "N/A"},${item.licenseNo || "N/A"},${item.districtName || "N/A"},${item.categoryName || "N/A"},${new Date(item.createdDate).toLocaleDateString()},${item.dfoDivision || "N/A"},${item.renewalFrom ? new Date(item.renewalFrom).toLocaleDateString() : "N/A"},${item.renewalTo ? new Date(item.renewalTo).toLocaleDateString() : "N/A"}`
                );
                const csvContent = [headers, ...rows].join("\n");
                const blob = new Blob([csvContent], { type: "text/csv" });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${selectedState}_applications_${dialogMonth}.csv`;
                link.click();
                window.URL.revokeObjectURL(url);
              }}
              startIcon={<FileDownload fontSize="small" />}
              sx={{ background: "#26A69A", color: "#fff", borderRadius: "6px", px: 2, py: 0.25, fontSize: "0.85rem", "&:hover": { background: "#1E7E73" } }}
              disabled={filteredDetailedData.length === 0}
            >
              Export
            </Button>
          </Box>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ borderBottom: "1px solid #ddd", mb: 1 }}>
            <Tab label="New License" sx={{ fontSize: "0.85rem" }} />
            <Tab label="Renewal" sx={{ fontSize: "0.85rem" }} />
            <Tab label="Ownership Change" sx={{ fontSize: "0.85rem" }} />
            <Tab label="Relocation" sx={{ fontSize: "0.85rem" }} />
          </Tabs>
          {loading ? (
            <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <CircularProgress sx={{ color: "#26A69A" }} />
            </Box>
          ) : (
            <>
              <TableContainer sx={{ flex: 1, background: "#fff", borderRadius: "8px", border: "1px solid #ddd", overflowY: "auto" }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell onClick={() => handleSort("id")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                        ID <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                      </TableCell>
                      <TableCell onClick={() => handleSort("firmName")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                        Firm Name <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                      </TableCell>
                      <TableCell onClick={() => handleSort("licenseNo")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                        License No <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                      </TableCell>
                      <TableCell onClick={() => handleSort("districtName")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                        District <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                      </TableCell>
                      <TableCell onClick={() => handleSort("categoryName")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                        Category <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                      </TableCell>
                      <TableCell onClick={() => handleSort("createdDate")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                        Created Date <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                      </TableCell>
                      <TableCell onClick={() => handleSort("dfoDivision")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                        DFO Division <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                      </TableCell>
                      <TableCell onClick={() => handleSort("renewalFrom")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                        Renewal From <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                      </TableCell>
                      <TableCell onClick={() => handleSort("renewalTo")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "f5f5f5", cursor: "pointer" }}>
                        Renewal To <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredDetailedData.length > 0 ? (
                      filteredDetailedData
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((item) => (
                          <TableRow key={item.id} sx={{ "&:hover": { background: "#f0f0f0" } }}>
                            <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{item.id}</TableCell>
                            <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{item.firmName || "N/A"}</TableCell>
                            <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{item.licenseNo || "N/A"}</TableCell>
                            <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{item.districtName || "N/A"}</TableCell>
                            <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{item.categoryName || "N/A"}</TableCell>
                            <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>
                              {item.createdDate ? new Date(item.createdDate).toLocaleDateString() : "N/A"}
                            </TableCell>
                            <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{item.dfoDivision || "N/A"}</TableCell>
                            <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>
                              {item.renewalFrom ? new Date(item.renewalFrom).toLocaleDateString() : "N/A"}
                            </TableCell>
                            <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>
                              {item.renewalTo ? new Date(item.renewalTo).toLocaleDateString() : "N/A"}
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 2, color: "#777", fontSize: "0.85rem" }}>
                          No applications found for {selectedState}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={filteredDetailedData.length}
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default React.memo(NewApplications);