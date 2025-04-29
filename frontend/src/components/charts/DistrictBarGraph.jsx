import React, { useEffect, useState, useMemo, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  IconButton,
  Select,
  MenuItem,
  InputBase,
  TablePagination,
  Button,
  CircularProgress,
  DialogActions,
  Typography,
} from "@mui/material";
import { Search as SearchIcon, Close, Sort, FileDownload, Refresh } from "@mui/icons-material";
import {
  fetchPunjabDashboardData,
  fetchHaryanaDashboardData,
  fetchPunjabApplicationsByDistrict,
  fetchHaryanaApplicationsByDistrict,
} from "../../utils/api";
import { motion } from "framer-motion";
import { saveAs } from "file-saver";
import debounce from "lodash/debounce";

const COLORS = {
  approved: "#4CAF50",
  pending: "#F44336",
};

const CustomTooltip = ({ active, payload, label, totalApplications, status }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const percentage = totalApplications > 0 ? ((value / totalApplications) * 100).toFixed(1) : 0;
    return (
      <Box sx={{ background: "#fff", p: 1, borderRadius: "8px", boxShadow: "0 3px 12px rgba(0,0,0,0.15)" }}>
        <Typography sx={{ fontWeight: 600, color: "#333", fontSize: "0.9rem" }}>{`${label}: ${value} ${status.toLowerCase()}`}</Typography>
        <Typography sx={{ color: "#777", fontSize: "0.8rem" }}>{`${percentage}%`}</Typography>
      </Box>
    );
  }
  return null;
};

const DistrictBarGraph = ({ selectedState }) => {
  const [graphData, setGraphData] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState({ service_type: "", search: "", pending_stage: "" });
  const [statusTab, setStatusTab] = useState("Pending");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [selectedApp, setSelectedApp] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("count_desc");
  const [pendingStages, setPendingStages] = useState([]);
  const [rawApiData, setRawApiData] = useState(null); // For debugging

  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchFunction = selectedState === "Punjab" ? fetchPunjabDashboardData : fetchHaryanaDashboardData;
      const params = {
        service_type: filter.service_type || undefined,
        status: statusTab,
        pending_stage: statusTab === "Pending" ? filter.pending_stage || undefined : undefined,
      };
      console.log(`Fetching dashboard data for ${selectedState} with params:`, params);
      const response = await fetchFunction(params);
      console.log(`Raw dashboard response for ${selectedState}:`, response);
      setRawApiData(response);

      const data = Array.isArray(response) ? response : [];
      console.log(`Processed dashboard data length: ${data.length}`);

      // Aggregate data by district directly from filtered response
      const aggregatedData = data.reduce((acc, item) => {
        const district = String(item.district || "Unknown").trim().toLowerCase();
        const approved = Number(item.approved_count) || 0;
        const pending = Number(item.pending_count) || 0;

        if (!acc[district]) {
          acc[district] = { district: item.district || "Unknown", approved_count: 0, pending_count: 0 };
        }
        acc[district].approved_count += approved;
        acc[district].pending_count += pending;
        return acc;
      }, {});

      const aggregatedArray = Object.values(aggregatedData);
      console.log(`Aggregated graph data:`, aggregatedArray);

      // Extract unique pending stages
      const stages = [...new Set(data.map((item) => item.action_status).filter(Boolean))];
      console.log(`Pending stages:`, stages);

      setGraphData(aggregatedArray);
      setPendingStages(stages);

      if (aggregatedArray.length === 0) {
        setError(`No data for ${selectedState} with current filters.`);
      }
    } catch (error) {
      console.error(`Error fetching ${selectedState} dashboard data:`, error);
      setError(`Failed to load ${selectedState} dashboard data: ${error.message}`);
      setGraphData([]);
      setPendingStages([]);
    } finally {
      setLoading(false);
    }
  }, [selectedState, filter.service_type, filter.pending_stage, statusTab]);

  const fetchApplications = useCallback(
    debounce(async (district, status, search, serviceType, pendingStage) => {
      if (!district) return;
      setLoading(true);
      setError(null);
      try {
        const fetchFunction =
          selectedState === "Punjab" ? fetchPunjabApplicationsByDistrict : fetchHaryanaApplicationsByDistrict;
        const params = { search, pending_stage: status === "Pending" ? pendingStage : undefined };
        console.log(`Fetching applications for ${district} in ${selectedState} with filters:`, {
          district,
          serviceType,
          status,
          ...params,
        });
        const response = await fetchFunction(district, serviceType, status, params);
        console.log(`Applications response:`, response);
        setApplications(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error(`Error fetching ${selectedState} applications:`, error);
        setError(`Failed to load ${selectedState} applications: ${error.message}`);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [selectedState]
  );

  const totalApplications = useMemo(() => {
    return graphData.reduce((sum, item) => sum + (statusTab === "Approved" ? item.approved_count : item.pending_count), 0);
  }, [graphData, statusTab]);

  const chartData = useMemo(() => {
    let filtered = graphData
      .map((item) => ({
        district: item.district,
        count: statusTab === "Approved" ? item.approved_count : item.pending_count,
      }))
      .filter((entry) => entry.district.toLowerCase().includes(searchTerm.toLowerCase()) && entry.count > 0);

    filtered.sort((a, b) => {
      if (sortBy === "count_desc") return b.count - a.count;
      if (sortBy === "count_asc") return a.count - b.count;
      if (sortBy === "district_asc") return a.district.localeCompare(b.district);
      return b.district.localeCompare(a.district);
    });

    console.log(`Chart data after sorting and filtering:`, filtered);
    return filtered;
  }, [graphData, statusTab, sortBy, searchTerm]);

  const sortedApplications = useMemo(() => {
    if (!sortConfig.key) return applications;
    return [...applications].sort((a, b) => {
      const direction = sortConfig.direction === "asc" ? 1 : -1;
      const aValue = String(a[sortConfig.key] || "").toLowerCase();
      const bValue = String(b[sortConfig.key] || "").toLowerCase();
      return direction * aValue.localeCompare(bValue);
    });
  }, [applications, sortConfig]);

  const handleBarClick = useCallback((data) => {
    if (data && data.activeLabel) {
      const district = data.activeLabel;
      setSelectedDistrict(district);
      setPage(0);
      fetchApplications(district, statusTab, filter.search, filter.service_type, filter.pending_stage);
    }
  }, [fetchApplications, statusTab, filter.search, filter.service_type, filter.pending_stage]);

  const exportChartToCSV = useCallback(() => {
    if (!chartData.length) return;
    const csvContent = [
      `District,${statusTab} Count`,
      ...chartData.map((entry) => `${entry.district},${entry.count}`),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    saveAs(blob, `${selectedState}_${statusTab.toLowerCase()}_district_applications.csv`);
  }, [chartData, selectedState, statusTab]);

  const exportTableToCSV = useCallback(() => {
    if (!sortedApplications.length) return;
    const headers = "Application ID,Owner/Firm,Service Type,Status";
    const csvContent = [
      headers,
      ...sortedApplications.map((app) =>
        `${app.appid || "N/A"},${app.Ownername || app.firmname || "N/A"},${app.service_type || "N/A"},${app.pending_stage || "N/A"}`
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    saveAs(blob, `${selectedState}_${selectedDistrict}_${statusTab.toLowerCase()}_applications.csv`);
  }, [sortedApplications, selectedState, selectedDistrict, statusTab]);

  const resetFilters = useCallback(() => {
    setFilter({ service_type: "", search: "", pending_stage: "" });
    setSearchTerm("");
    setPage(0);
    fetchGraphData(); // Refetch graph data with no filters
    if (selectedDistrict) {
      fetchApplications(selectedDistrict, statusTab, "", "", "");
    }
  }, [fetchGraphData, fetchApplications, selectedDistrict, statusTab]);

  const handleSort = useCallback((key) => {
    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
  }, [sortConfig]);

  const handleFilterChange = useCallback((newFilter) => {
    setFilter((prev) => ({ ...prev, ...newFilter }));
    fetchGraphData(); // Refetch graph data when filters change
  }, [fetchGraphData]);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

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
      }}
      initial={{ y: 15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" sx={{ color: "#26A69A", fontWeight: 600 }}>
          District-wise Applications - {selectedState}
        </Typography>
      </Box>

      <Tabs
        value={statusTab}
        onChange={(e, value) => {
          setStatusTab(value);
          setFilter((prev) => ({ ...prev, pending_stage: "" }));
          fetchGraphData(); // Refetch graph data when status tab changes
        }}
        sx={{
          mb: 2,
          "& .MuiTab-root": { color: "#666", fontWeight: 500, textTransform: "none" },
          "& .Mui-selected": { color: "#26A69A", fontWeight: 600 },
          "& .MuiTabs-indicator": { backgroundColor: "#26A69A" },
        }}
        centered
      >
        <Tab label="Approved" value="Approved" />
        <Tab label="Pending" value="Pending" />
      </Tabs>

      <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap", justifyContent: "center" }}>
        <InputBase
          placeholder="Search districts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          startAdornment={<SearchIcon sx={{ color: "#26A69A", fontSize: "18px", mr: 1 }} />}
          sx={{
            background: "#F5F7FA",
            borderRadius: "8px",
            px: 1.5,
            py: 0.5,
            width: { xs: "100%", sm: "200px" },
            fontSize: "0.9rem",
            border: "1px solid #E0E7FF",
            "&:hover": { borderColor: "#26A69A" },
          }}
        />
        <Select
          value={filter.service_type}
          onChange={(e) => handleFilterChange({ service_type: e.target.value })}
          displayEmpty
          sx={{
            background: "#F5F7FA",
            borderRadius: "8px",
            px: 1,
            py: 0.5,
            width: { xs: "100%", sm: "200px" },
            fontSize: "0.9rem",
            border: "1px solid #E0E7FF",
            "&:hover": { borderColor: "#26A69A" },
          }}
        >
          <MenuItem value="">All Services</MenuItem>
          <MenuItem value="New Licenses">New Licenses</MenuItem>
          <MenuItem value="Renewal of Licenses">Renewal</MenuItem>
          <MenuItem value="Ownership Change">Ownership Change</MenuItem>
          <MenuItem value="Unit Relocation">Relocation</MenuItem>
        </Select>
        {statusTab === "Pending" && (
          <Select
            value={filter.pending_stage}
            onChange={(e) => handleFilterChange({ pending_stage: e.target.value })}
            displayEmpty
            sx={{
              background: "#F5F7FA",
              borderRadius: "8px",
              px: 1,
              py: 0.5,
              width: { xs: "100%", sm: "200px" },
              fontSize: "0.9rem",
              border: "1px solid #E0E7FF",
              "&:hover": { borderColor: "#26A69A" },
            }}
          >
            <MenuItem value="">All Pending Stages</MenuItem>
            {pendingStages.map((stage) => (
              <MenuItem key={stage} value={stage}>
                {stage}
              </MenuItem>
            ))}
          </Select>
        )}
        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          sx={{
            background: "#F5F7FA",
            borderRadius: "8px",
            px: 1,
            py: 0.5,
            width: { xs: "100%", sm: "200px" },
            fontSize: "0.9rem",
            border: "1px solid #E0E7FF",
            "&:hover": { borderColor: "#26A69A" },
          }}
        >
          <MenuItem value="count_desc">{statusTab} (High to Low)</MenuItem>
          <MenuItem value="count_asc">{statusTab} (Low to High)</MenuItem>
          <MenuItem value="district_asc">District (A-Z)</MenuItem>
          <MenuItem value="district_desc">District (Z-A)</MenuItem>
        </Select>
        <Button
          onClick={exportChartToCSV}
          startIcon={<FileDownload fontSize="small" />}
          sx={{
            background: "linear-gradient(45deg, #26A69A 30%, #4DD0E1 90%)",
            color: "#fff",
            borderRadius: "8px",
            px: 2,
            py: 0.5,
            fontSize: "0.9rem",
            fontWeight: 500,
            "&:hover": { background: "linear-gradient(45deg, #1E7E73 30%, #39B6C8 90%)" },
          }}
          disabled={loading || chartData.length === 0}
        >
          Export
        </Button>
        <Button
          onClick={resetFilters}
          startIcon={<Refresh fontSize="small" />}
          sx={{
            background: "#F44336",
            color: "#fff",
            borderRadius: "8px",
            px: 2,
            py: 0.5,
            fontSize: "0.9rem",
            "&:hover": { background: "#D32F2F" },
          }}
        >
          Reset
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
          <CircularProgress sx={{ color: "#26A69A" }} />
        </Box>
      ) : error ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400 }}>
          <Typography sx={{ color: "#EF5350" }}>{error}</Typography>
          {rawApiData && (
            <Typography sx={{ color: "#777", fontSize: "0.9rem", mt: 1 }}>
              Raw API Response: {JSON.stringify(rawApiData, null, 2)}
            </Typography>
          )}
        </Box>
      ) : graphData.length === 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400 }}>
          <Typography sx={{ color: "#777", fontSize: "1rem" }}>No data available for {selectedState}</Typography>
          {rawApiData && (
            <Typography sx={{ color: "#777", fontSize: "0.9rem", mt: 1 }}>
              Raw API Response: {JSON.stringify(rawApiData, null, 2)}
            </Typography>
          )}
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} onClick={handleBarClick}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />
            <XAxis
              dataKey="district"
              angle={-18}
              textAnchor="end"
              height={80}
              interval={0}
              tick={{ fill: "#666", fontSize: 12 }}
            />
            <YAxis tick={{ fill: "#666", fontSize: 12 }} />
            <Tooltip content={<CustomTooltip totalApplications={totalApplications} status={statusTab} />} />
            <Bar
              dataKey="count"
              fill={statusTab === "Approved" ? COLORS.approved : COLORS.pending}
              barSize={30}
              animationDuration={800}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}

      <Dialog
        open={!!selectedDistrict}
        onClose={() => setSelectedDistrict(null)}
        fullWidth
        maxWidth="lg"
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: "12px",
            boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
            overflow: "hidden",
          },
        }}
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <DialogTitle sx={{ p: 2, background: "linear-gradient(45deg, #26A69A 30%, #4DD0E1 90%)", color: "#fff" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ fontWeight: 600, fontSize: "1.1rem" }}>{statusTab} in {selectedDistrict} ({selectedState})</Typography>
            <IconButton onClick={() => setSelectedDistrict(null)} sx={{ color: "#fff" }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 2, display: "flex", flexDirection: "column", height: "calc(95vh - 96px)" }}>
          <Box sx={{ display: "flex", gap: 1.5, py: 1, flexShrink: 0, flexWrap: "wrap" }}>
            <Select
              value={filter.service_type}
              onChange={(e) => {
                const newServiceType = e.target.value;
                setFilter((prev) => ({ ...prev, service_type: newServiceType }));
                fetchApplications(selectedDistrict, statusTab, filter.search, newServiceType, filter.pending_stage);
              }}
              displayEmpty
              sx={{
                background: "#F5F7FA",
                borderRadius: "8px",
                px: 1,
                py: 0.5,
                minWidth: { xs: "100%", sm: 150 },
                fontSize: "0.9rem",
                border: "1px solid #E0E7FF",
              }}
            >
              <MenuItem value="">All Services</MenuItem>
              <MenuItem value="New Licenses">New Licenses</MenuItem>
              <MenuItem value="Renewal of Licenses">Renewal</MenuItem>
              <MenuItem value="Ownership Change">Ownership Change</MenuItem>
              <MenuItem value="Unit Relocation">Relocation</MenuItem>
            </Select>
            <InputBase
              placeholder="Search Owner/Firm..."
              value={filter.search}
              onChange={(e) => {
                const newSearch = e.target.value;
                setFilter((prev) => ({ ...prev, search: newSearch }));
                fetchApplications(selectedDistrict, statusTab, newSearch, filter.service_type, filter.pending_stage);
              }}
              startAdornment={<SearchIcon sx={{ color: "#26A69A", fontSize: "18px", mr: 1 }} />}
              sx={{
                background: "#F5F7FA",
                borderRadius: "8px",
                px: 1.5,
                py: 0.5,
                flexGrow: 1,
                fontSize: "0.9rem",
                border: "1px solid #E0E7FF",
              }}
            />
            <Button
              onClick={exportTableToCSV}
              startIcon={<FileDownload fontSize="small" />}
              sx={{
                background: "#26A69A",
                color: "#fff",
                borderRadius: "8px",
                px: 2,
                py: 0.5,
                fontSize: "0.9rem",
                "&:hover": { background: "#1E7E73" },
              }}
              disabled={loading || sortedApplications.length === 0}
            >
              Export
            </Button>
            <Button
              onClick={resetFilters}
              startIcon={<Refresh fontSize="small" />}
              sx={{
                background: "#F44336",
                color: "#fff",
                borderRadius: "8px",
                px: 2,
                py: 0.5,
                fontSize: "0.9rem",
                "&:hover": { background: "#D32F2F" },
              }}
            >
              Reset
            </Button>
          </Box>
          {loading ? (
            <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <CircularProgress sx={{ color: "#26A69A" }} />
            </Box>
          ) : error ? (
            <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <Typography sx={{ color: "#EF5350" }}>{error}</Typography>
            </Box>
          ) : (
            <>
              <TableContainer
                sx={{
                  flex: 1,
                  borderRadius: "8px",
                  border: "1px solid #E0E7FF",
                  overflowY: "auto",
                }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell onClick={() => handleSort("appid")} sx={{ py: 1, fontWeight: 600, color: "#333", fontSize: "0.85rem", background: "#F5F7FA", cursor: "pointer" }}>
                        ID <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                      </TableCell>
                      <TableCell onClick={() => handleSort("Ownername")} sx={{ py: 1, fontWeight: 600, color: "#333", fontSize: "0.85rem", background: "#F5F7FA", cursor: "pointer" }}>
                        Owner/Firm <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                      </TableCell>
                      <TableCell onClick={() => handleSort("service_type")} sx={{ py: 1, fontWeight: 600, color: "#333", fontSize: "0.85rem", background: "#F5F7FA", cursor: "pointer" }}>
                        Service <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                      </TableCell>
                      <TableCell onClick={() => handleSort("pending_stage")} sx={{ py: 1, fontWeight: 600, color: "#333", fontSize: "0.85rem", background: "#F5F7FA", cursor: "pointer" }}>
                        Status <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedApplications.length > 0 ? (
                      sortedApplications.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((app) => (
                        <TableRow
                          key={app.appid || Math.random()}
                          hover
                          onClick={() => setSelectedApp(app)}
                          sx={{ "&:hover": { background: "#F5F7FA" } }}
                        >
                          <TableCell sx={{ py: 0.75, fontSize: "0.85rem", color: "#555" }}>{app.appid || "N/A"}</TableCell>
                          <TableCell sx={{ py: 0.75, fontSize: "0.85rem", color: "#555" }}>{app.Ownername || app.firmname || "N/A"}</TableCell>
                          <TableCell sx={{ py: 0.75, fontSize: "0.85rem", color: "#555" }}>{app.service_type || "N/A"}</TableCell>
                          <TableCell sx={{ py: 0.75, fontSize: "0.85rem", color: "#555" }}>{app.pending_stage || "N/A"}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 2, color: "#777", fontSize: "0.9rem" }}>
                          No applications found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={sortedApplications.length}
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
                  "& .MuiIconButton-root": { color: "#26A69A" },
                }}
              />
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedApp} onClose={() => setSelectedApp(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: "#26A69A", color: "#fff", fontWeight: 600, py: 1.5 }}>Details - {selectedState}</DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          {selectedApp && (
            <Box sx={{ fontSize: "0.9rem", color: "#333" }}>
              <Typography sx={{ mb: 1 }}><strong>ID:</strong> {selectedApp.appid || "N/A"}</Typography>
              <Typography sx={{ mb: 1 }}><strong>Owner/Firm:</strong> {selectedApp.Ownername || selectedApp.firmname || "N/A"}</Typography>
              <Typography sx={{ mb: 1 }}><strong>Service:</strong> {selectedApp.service_type || "N/A"}</Typography>
              <Typography sx={{ mb: 1 }}><strong>Status:</strong> {selectedApp.pending_stage || "N/A"}</Typography>
              <Typography sx={{ mb: 1 }}><strong>District:</strong> {selectedApp.district || "N/A"}</Typography>
              <Typography><strong>Action ID:</strong> {selectedApp.actionid || "N/A"}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setSelectedApp(null)}
            variant="contained"
            sx={{ background: "#26A69A", "&:hover": { background: "#1E7E73" }, fontSize: "0.9rem" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default React.memo(DistrictBarGraph);   