import React, { useEffect, useState, useMemo, useCallback } from "react";
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
  Typography,
} from "@mui/material";
import { Search as SearchIcon, Close, FileDownload, Sort } from "@mui/icons-material";
import { motion } from "framer-motion";
import { saveAs } from "file-saver";
import {
  fetchPunjabOwnershipChanges,
  fetchHaryanaOwnershipChanges,
} from "../../utils/api";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { year, total_changes } = payload[0].payload;
    return (
      <Box sx={{ background: "#fff", p: 1, borderRadius: "6px", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}>
        <Typography sx={{ fontWeight: 600, color: "#333", fontSize: "0.85rem" }}>{`Year: ${year}`}</Typography>
        <Typography sx={{ color: "#333", fontSize: "0.85rem" }}>{`Changes: ${total_changes}`}</Typography>
      </Box>
    );
  }
  return null;
};

const LineChartOwnershipChanges = ({ data: initialData, selectedState }) => {
  const [data, setData] = useState(initialData || []);
  const [districts, setDistricts] = useState([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [dialogDistrictId, setDialogDistrictId] = useState("");
  const [unitDetails, setUnitDetails] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof selectedState === "undefined") {
      console.error("SelectedState prop is undefined. Expected 'Punjab' or 'Haryana'.");
      setError("Invalid state: Please select Punjab or Haryana.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      console.log(`SelectedState prop received: ${selectedState}`);
      try {
        let fetchFunction;
        if (selectedState === "Punjab") {
          fetchFunction = fetchPunjabOwnershipChanges;
        } else if (selectedState === "Haryana") {
          fetchFunction = fetchHaryanaOwnershipChanges;
        } else {
          throw new Error(`Invalid selectedState prop: ${selectedState}`);
        }

        console.log(`Fetching ownership changes using ${fetchFunction.name} for ${selectedState}`);
        const rawData = await fetchFunction({});
        console.log(`Raw ownership changes response for ${selectedState}:`, rawData);

        if (!rawData || !Array.isArray(rawData)) {
          throw new Error("Invalid data format received");
        }

        setData(rawData);

        const districtMap = {};
        rawData.forEach((item) => {
          if (item.districtId && item.districtName && !districtMap[item.districtId]) {
            districtMap[item.districtId] = { id: item.districtId, name: item.districtName };
          }
        });
        const uniqueDistricts = Object.values(districtMap).sort((a, b) => a.name.localeCompare(b.name));
        setDistricts(uniqueDistricts);

        if (rawData.length === 0) {
          setError(`No ownership changes data available for ${selectedState}`);
        }
      } catch (error) {
        console.error(`Error fetching ${selectedState} ownership changes:`, error);
        setError(`Failed to load ${selectedState} ownership changes: ${error.message}`);
        setData([]);
        setDistricts([]);
      } finally {
        setLoading(false);
      }
    };

    if (initialData && initialData.length > 0) {
      console.log(`Using initialData for ${selectedState}:`, initialData);
      setData(initialData);
      const districtMap = {};
      initialData.forEach((item) => {
        if (item.districtId && item.districtName && !districtMap[item.districtId]) {
          districtMap[item.districtId] = { id: item.districtId, name: item.districtName };
        }
      });
      const uniqueDistricts = Object.values(districtMap).sort((a, b) => a.name.localeCompare(b.name));
      setDistricts(uniqueDistricts);
    } else {
      fetchData();
    }
  }, [initialData, selectedState]);

  const chartData = useMemo(() => {
    const aggregated = data.reduce((acc, curr) => {
      const year = curr.year;
      if (!acc[year]) acc[year] = { year, total_changes: 0 };
      acc[year].total_changes += curr.total_changes || 0;
      return acc;
    }, {});

    let result = Object.values(aggregated);
    if (selectedDistrictId) {
      result = data
        .filter((item) => item.districtId === selectedDistrictId)
        .map((item) => ({
          year: item.year,
          total_changes: item.total_changes || 0,
        }));
    }
    return result.sort((a, b) => a.year - b.year);
  }, [data, selectedDistrictId]);

  const fetchUnitDetails = useCallback(async (year) => {
    if (typeof selectedState === "undefined") {
      setError("Invalid state: Please select Punjab or Haryana.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const fetchFunction = selectedState === "Punjab" ? fetchPunjabOwnershipChanges : fetchHaryanaOwnershipChanges;
      console.log(`Fetching detailed ownership changes using ${fetchFunction.name} for ${selectedState}, year: ${year}`);
      const response = await fetchFunction({ year, detailed: true });
      console.log(`Detailed response for ${selectedState}, year ${year}:`, response);
      const result = Array.isArray(response) ? response : [];
      setUnitDetails(result);
      setDialogDistrictId("");
      setDialogOpen(true);
      if (result.length === 0) {
        setError(`No detailed data for ${selectedState} in ${year}`);
      }
    } catch (error) {
      console.error(`Error fetching ${selectedState} unit details for year ${year}:`, error);
      setError(`Failed to load ${selectedState} unit details: ${error.message}`);
      setUnitDetails([]);
    } finally {
      setLoading(false);
    }
  }, [selectedState]);

  const handleLineClick = useCallback((data) => {
    if (!data || !data.activePayload || !data.activePayload[0]) return;
    const clickedYear = data.activePayload[0].payload.year;
    setSelectedYear(clickedYear);
    fetchUnitDetails(clickedYear);
  }, [fetchUnitDetails]);

  const sortedUnitDetails = useMemo(() => {
    if (!sortConfig.key) return unitDetails;
    return [...unitDetails].sort((a, b) => {
      const direction = sortConfig.direction === "asc" ? 1 : -1;
      const aValue = a[sortConfig.key] || "";
      const bValue = b[sortConfig.key] || "";
      if (sortConfig.key === "Id" || sortConfig.key === "IsApproved") return direction * (aValue - bValue);
      if (sortConfig.key === "Createddate") return direction * (new Date(aValue) - new Date(bValue));
      return direction * String(aValue).localeCompare(String(bValue));
    });
  }, [unitDetails, sortConfig]);

  const filteredUnitDetails = useMemo(() => {
    let filtered = sortedUnitDetails;
    if (dialogDistrictId) {
      filtered = filtered.filter((unit) => unit.districtId === dialogDistrictId);
    }
    if (searchTerm) {
      filtered = filtered.filter((unit) =>
        [unit.Id, unit.Licenseno, unit.firmname, unit.districtName, unit.categoryName, unit.IsApproved ? "Approved" : "Not Approved"]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return filtered;
  }, [sortedUnitDetails, searchTerm, dialogDistrictId]);

  const exportChartToCSV = useCallback(() => {
    const districtName = districts.find((d) => d.id === selectedDistrictId)?.name || "All";
    const csvContent = [
      "Year,Total Changes",
      ...chartData.map((item) => `${item.year},${item.total_changes}`),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    saveAs(blob, `${selectedState || "unknown"}_ownership_changes_${districtName}.csv`);
  }, [chartData, districts, selectedDistrictId, selectedState]);

  const exportTableToCSV = useCallback(() => {
    const headers = "ID,License No,Firm Name,District,Category,Created Date,Approved";
    const csvContent = [
      headers,
      ...filteredUnitDetails.map((unit) =>
        `${unit.Id || "N/A"},${unit.Licenseno || "N/A"},${unit.firmname || "N/A"},${unit.districtName || "N/A"},${unit.categoryName || "N/A"},${unit.Createddate ? new Date(unit.Createddate).toLocaleDateString() : "N/A"},${unit.IsApproved ? "Yes" : "No"}`
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    saveAs(blob, `${selectedState || "unknown"}_ownership_changes_details_${selectedYear}.csv`);
  }, [filteredUnitDetails, selectedYear, selectedState]);

  const handleSort = useCallback((key) => {
    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
  }, [sortConfig]);

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
            Ownership Changes Over Time - {selectedState || "Unknown State"}
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
            disabled={loading || chartData.length === 0}
          >
            Export
          </Button>
        </Box>
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <Select
            value={selectedDistrictId}
            onChange={(e) => setSelectedDistrictId(e.target.value)}
            displayEmpty
            sx={{
              background: "#f9f9f9",
              borderRadius: "6px",
              px: 1.5,
              py: 0.25,
              width: 200,
              fontSize: "0.85rem",
              border: "1px solid #ddd",
            }}
            disabled={!selectedState}
          >
            <MenuItem value="">All Districts</MenuItem>
            {districts.map((district) => (
              <MenuItem key={district.id} value={district.id}>
                {district.name}
              </MenuItem>
            ))}
          </Select>
        </Box>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
            <CircularProgress sx={{ color: "#26A69A" }} />
          </Box>
        ) : error ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400 }}>
            <Typography sx={{ color: "#EF5350" }}>{error}</Typography>
          </Box>
        ) : chartData.length === 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400 }}>
            <Typography sx={{ color: "#777", fontSize: "1rem" }}>
              No ownership changes data available for {selectedState || "unknown state"}
            </Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} onClick={handleLineClick}>
              <XAxis dataKey="year" tick={{ fill: "#555", fontSize: "0.8rem" }} />
              <YAxis tick={{ fill: "#555", fontSize: "0.8rem" }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="total_changes"
                stroke="#0088FE"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
        <Typography sx={{ textAlign: "center", mt: 2, color: "#666", fontSize: "1rem" }}>
          Total Changes: <strong>{chartData.reduce((sum, entry) => sum + (entry.total_changes || 0), 0)}</strong>
        </Typography>
      </Box>

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
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <DialogTitle sx={{ p: "8px 16px", borderBottom: "1px solid #ddd" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" sx={{ color: "#26A69A", fontWeight: 600, fontSize: "1.1rem" }}>
              Ownership Changes in {selectedYear} ({selectedState || "Unknown State"})
            </Typography>
            <IconButton onClick={() => setDialogOpen(false)} sx={{ color: "#26A69A", p: 0.5 }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 2, display: "flex", flexDirection: "column", height: "calc(95vh - 96px)" }}>
          <Box sx={{ display: "flex", gap: 1, py: 1, flexShrink: 0 }}>
            <Select
              value={dialogDistrictId}
              onChange={(e) => setDialogDistrictId(e.target.value)}
              displayEmpty
              sx={{
                background: "#f9f9f9",
                borderRadius: "6px",
                px: 1.5,
                py: 0.25,
                width: 200,
                fontSize: "0.85rem",
                border: "1px solid #ddd",
              }}
              disabled={!selectedState}
            >
              <MenuItem value="">All Districts</MenuItem>
              {districts.map((district) => (
                <MenuItem key={district.id} value={district.id}>
                  {district.name}
                </MenuItem>
              ))}
            </Select>
            <InputBase
              placeholder="Search by ID, License, Firm, Approved..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              disabled={loading || filteredUnitDetails.length === 0}
            >
              Export
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
                  background: "#fff",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  overflowY: "auto",
                }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        onClick={() => handleSort("Id")}
                        sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}
                      >
                        ID <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                      </TableCell>
                      <TableCell
                        onClick={() => handleSort("Licenseno")}
                        sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}
                      >
                        License No <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                      </TableCell>
                      <TableCell
                        onClick={() => handleSort("firmname")}
                        sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}
                      >
                        Firm Name <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                      </TableCell>
                      <TableCell
                        onClick={() => handleSort("districtName")}
                        sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}
                      >
                        District <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                      </TableCell>
                      <TableCell
                        onClick={() => handleSort("categoryName")}
                        sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}
                      >
                        Category <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                      </TableCell>
                      <TableCell
                        onClick={() => handleSort("Createddate")}
                        sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}
                      >
                        Created Date <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                      </TableCell>
                      <TableCell
                        onClick={() => handleSort("IsApproved")}
                        sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}
                      >
                        Approved <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUnitDetails.length > 0 ? (
                      filteredUnitDetails
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((unit) => (
                          <TableRow key={unit.Id || Math.random()} sx={{ "&:hover": { background: "#f0f0f0" } }}>
                            <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{unit.Id || "N/A"}</TableCell>
                            <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{unit.Licenseno || "N/A"}</TableCell>
                            <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{unit.firmname || "N/A"}</TableCell>
                            <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{unit.districtName || "N/A"}</TableCell>
                            <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{unit.categoryName || "N/A"}</TableCell>
                            <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>
                              {unit.Createddate ? new Date(unit.Createddate).toLocaleDateString() : "N/A"}
                            </TableCell>
                            <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>
                              {unit.IsApproved ? "Yes" : "No"}
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 2, color: "#777", fontSize: "0.85rem" }}>
                          No ownership changes found for {selectedState || "unknown state"} in {selectedYear}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={filteredUnitDetails.length}
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default React.memo(LineChartOwnershipChanges);