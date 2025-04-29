import React, { useState, useEffect, useMemo, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  InputBase,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TablePagination,
  CircularProgress,
} from "@mui/material";
import { Search as SearchIcon, Close, Sort, FileDownload } from "@mui/icons-material";
import { motion } from "framer-motion";
import debounce from "lodash/debounce";
import { fetchPunjabLicenseStatus, fetchHaryanaLicenseStatus } from "../../utils/api";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0];
    return (
      <Box sx={{ background: "#fff", p: 1, borderRadius: "6px", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}>
        <Typography sx={{ fontWeight: 600, color: "#333", fontSize: "0.85rem" }}>{`${name}: ${value}`}</Typography>
      </Box>
    );
  }
  return null;
};

const PieChartLicenseStatus = ({ selectedState }) => {
  const [summaryData, setSummaryData] = useState([]);
  const [licensesData, setLicensesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [tableSearch, setTableSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // Fetch license status data based on selectedState
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchFunction = selectedState === "Haryana" ? fetchHaryanaLicenseStatus : fetchPunjabLicenseStatus;
        const response = await fetchFunction(); // No params needed
        if (!response || typeof response !== "object" || !Array.isArray(response.summary) || !Array.isArray(response.licenses)) {
          throw new Error("Invalid data format received");
        }
        setSummaryData(response.summary);
        setLicensesData(response.licenses);
      } catch (err) {
        console.error(`Error fetching ${selectedState} license status:`, err);
        setError(`Failed to load ${selectedState} license status data.`);
        setSummaryData([]);
        setLicensesData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedState]);

  const debouncedSetTableSearch = useMemo(() => debounce((value) => setTableSearch(value), 300), []);

  const filteredLicenses = useMemo(() => {
    if (!selectedStatus) return [];
    return licensesData
      .filter((license) => license.license_status === selectedStatus)
      .filter((license) =>
        String(license.LicenseNo || "").toLowerCase().includes(tableSearch.toLowerCase()) ||
        String(license.DFODivision || "").toLowerCase().includes(tableSearch.toLowerCase()) ||
        String(license.LetterNo || "").toLowerCase().includes(tableSearch.toLowerCase())
      );
  }, [licensesData, selectedStatus, tableSearch]);

  const sortedLicenses = useMemo(() => {
    if (!sortConfig.key) return filteredLicenses;
    return [...filteredLicenses].sort((a, b) => {
      const direction = sortConfig.direction === "asc" ? 1 : -1;
      const aValue = a[sortConfig.key] || "";
      const bValue = b[sortConfig.key] || "";
      if (sortConfig.key === "Id") return direction * (aValue - bValue);
      if (sortConfig.key.includes("Date") || sortConfig.key.includes("Renewal")) {
        return direction * (new Date(aValue) - new Date(bValue));
      }
      return direction * String(aValue).localeCompare(String(bValue));
    });
  }, [filteredLicenses, sortConfig]);

  const handlePieClick = useCallback((entry) => {
    setSelectedStatus(entry.name);
    setDialogOpen(true);
    setTableSearch("");
    setPage(0);
  }, []);

  const handleSort = useCallback((key) => {
    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
  }, [sortConfig]);

  const exportTableToCSV = useCallback(() => {
    const headers = "ID,License No,Division,Renewal From,Renewal To,Issue Date,Letter No,Letter Date,RFO Recommended,SDFO Recommended,Active";
    const csvContent = [
      headers,
      ...sortedLicenses.map((license) =>
        `${license.Id},${license.LicenseNo || "N/A"},${license.DFODivision || "N/A"},${license.LicenseRenewalFrom || "N/A"},${license.LicenseRenewalTo || "N/A"},${license.LicenseIssueDate || "N/A"},${license.LetterNo || "N/A"},${license.LetterDate || "N/A"},${license.IsRecommendRFO ? "Yes" : "No"},${license.IsRecommendSDFO ? "Yes" : "No"},${license.IsActive ? "Yes" : "No"}`
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedState}_${selectedStatus}_licenses.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }, [sortedLicenses, selectedStatus, selectedState]);

  return (
    <Box sx={{ minHeight: "auto", background: "#ECEFF1", p: 1 }}>
      <Box
        component={motion.div}
        sx={{
          maxWidth: 1200,
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
            Active vs. Expired Licenses - {selectedState}
          </Typography>
          <Button
            onClick={exportTableToCSV}
            startIcon={<FileDownload />}
            sx={{
              background: "#26A69A",
              color: "#fff",
              borderRadius: "6px",
              px: 2,
              py: 0.5,
              "&:hover": { background: "#1E7E73" },
            }}
            disabled={!summaryData.length || loading} // Disable if no data or loading
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
        ) : summaryData.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
            <Typography sx={{ color: "#777", fontSize: "1rem" }}>No license data available for {selectedState}</Typography>
          </Box>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={summaryData}
                  dataKey="total"
                  nameKey="license_status"
                  cx="50%"
                  cy="50%"
                  outerRadius={140}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: "#666", strokeWidth: 1 }}
                  onClick={handlePieClick}
                >
                  {summaryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <Typography sx={{ textAlign: "center", mt: 2, color: "#666", fontSize: "1rem" }}>
              Total Licenses: <strong>{summaryData.reduce((sum, entry) => sum + entry.total, 0)}</strong>
            </Typography>
          </>
        )}
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
              {selectedStatus} Licenses ({selectedState})
            </Typography>
            <IconButton onClick={() => setDialogOpen(false)} sx={{ color: "#26A69A", p: 0.5 }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 2, display: "flex", flexDirection: "column", height: "calc(95vh - 96px)" }}>
          <Box sx={{ display: "flex", gap: 1, py: 1, flexShrink: 0 }}>
            <InputBase
              placeholder="Search by license no/division/letter..."
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
                  <TableCell onClick={() => handleSort("Id")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                    ID <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                  </TableCell>
                  <TableCell onClick={() => handleSort("LicenseNo")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                    License No <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                  </TableCell>
                  <TableCell onClick={() => handleSort("DFODivision")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                    Division <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                  </TableCell>
                  <TableCell onClick={() => handleSort("LicenseRenewalFrom")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                    Renewal From <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                  </TableCell>
                  <TableCell onClick={() => handleSort("LicenseRenewalTo")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                    Renewal To <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                  </TableCell>
                  <TableCell onClick={() => handleSort("LicenseIssueDate")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                    Issue Date <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                  </TableCell>
                  <TableCell onClick={() => handleSort("LetterNo")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                    Letter No <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                  </TableCell>
                  <TableCell onClick={() => handleSort("LetterDate")} sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5", cursor: "pointer" }}>
                    Letter Date <Sort sx={{ fontSize: 12, verticalAlign: "middle" }} />
                  </TableCell>
                  <TableCell sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5" }}>
                    RFO Rec.
                  </TableCell>
                  <TableCell sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5" }}>
                    SDFO Rec.
                  </TableCell>
                  <TableCell sx={{ py: 0.75, fontWeight: 600, color: "#333", fontSize: "0.8rem", background: "#f5f5f5" }}>
                    Active
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedLicenses.length > 0 ? (
                  sortedLicenses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((license) => (
                    <TableRow key={license.Id} sx={{ "&:hover": { background: "#f0f0f0" } }}>
                      <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{license.Id}</TableCell>
                      <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{license.LicenseNo || "N/A"}</TableCell>
                      <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{license.DFODivision || "N/A"}</TableCell>
                      <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{license.LicenseRenewalFrom?.split("T")[0] || "N/A"}</TableCell>
                      <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{license.LicenseRenewalTo?.split("T")[0] || "N/A"}</TableCell>
                      <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{license.LicenseIssueDate?.split("T")[0] || "N/A"}</TableCell>
                      <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{license.LetterNo || "N/A"}</TableCell>
                      <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{license.LetterDate?.split("T")[0] || "N/A"}</TableCell>
                      <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{license.IsRecommendRFO ? "Yes" : "No"}</TableCell>
                      <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{license.IsRecommendSDFO ? "Yes" : "No"}</TableCell>
                      <TableCell sx={{ py: 0.5, fontSize: "0.8rem", color: "#555" }}>{license.IsActive ? "Yes" : "No"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 2, color: "#777", fontSize: "0.85rem" }}>
                      No {selectedStatus} licenses found for {selectedState}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={sortedLicenses.length}
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

export default React.memo(PieChartLicenseStatus);