import React, { useEffect, useState } from "react";
import { fetchTreeCensus, addTreeCensus, updateTreeCensus, deleteTreeCensus } from "../utils/api";
import { jwtDecode } from "jwt-decode";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  TablePagination,
  InputAdornment,
  Modal,
} from "@mui/material";
import { Add, Edit, Save, Delete, Search, CloudUpload } from "@mui/icons-material";
import { motion } from "framer-motion";

const API_BASE_URL = "http://localhost:5000";

const TreeCensus = () => {
  const [treeCensus, setTreeCensus] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ Description: "", FilePath: "", file: null });
  const [newForm, setNewForm] = useState({ Description: "", file: null });
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.role);
      } catch (err) {
        console.error("Error decoding JWT:", err);
        setUserRole(null);
      }
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTreeCensus();
      setTreeCensus(data);
    } catch (err) {
      setError("Failed to load tree census data. Please try again.");
      setSnackbar({ open: true, message: "Failed to load tree census data.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this tree census entry?")) {
      try {
        await deleteTreeCensus(id);
        setSnackbar({ open: true, message: "Tree census deleted successfully!", severity: "success" });
        loadData();
      } catch (err) {
        setSnackbar({ open: true, message: "Error deleting tree census.", severity: "error" });
      }
    }
  };

  const handleEdit = (tree) => {
    setEditingId(tree.ID);
    setEditForm({ Description: tree.Description, FilePath: tree.FilePath, file: null });
  };

  const handleUpdate = async (id) => {
    if (!editForm.Description) {
      setSnackbar({ open: true, message: "Description is required!", severity: "warning" });
      return;
    }
    try {
      const formData = new FormData();
      formData.append("Description", editForm.Description);
      if (editForm.file) {
        formData.append("file", editForm.file);
      }
      await updateTreeCensus(id, formData);
      setEditingId(null);
      setSnackbar({ open: true, message: "Tree census updated successfully!", severity: "success" });
      loadData();
    } catch (err) {
      setSnackbar({ open: true, message: "Error updating tree census.", severity: "error" });
    }
  };

  const handleAdd = async () => {
    if (!newForm.Description) {
      setSnackbar({ open: true, message: "Description is required!", severity: "warning" });
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("Description", newForm.Description);
      if (newForm.file) {
        formData.append("file", newForm.file);
      }
      await addTreeCensus(formData);
      setNewForm({ Description: "", file: null });
      setOpenModal(false);
      setSnackbar({ open: true, message: "Tree census added successfully!", severity: "success" });
      loadData();
    } catch (err) {
      setSnackbar({ open: true, message: "Error adding tree census.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No Date Found";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const filteredTreeCensus = treeCensus.filter((tree) =>
    (tree.Description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box
      component={motion.div}
      sx={{
        mx: { xs: 2, sm: 4, md: "auto" },
        maxWidth: "1200px",
        background: "linear-gradient(135deg, #ffffff, #f5f7fa)",
        borderRadius: "20px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        p: { xs: 2, sm: 4 },
        minHeight: "auto",
        width: "100%",
      }}
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Typography
        variant="h4"
        sx={{
          color: "#388E3C",
          fontWeight: 700,
          mb: 4,
          pl: 2,
          textShadow: "1px 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        Tree Census
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          mb: 4,
          px: 2,
          gap: 2,
        }}
      >
        <TextField
          label="Search by Description"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
          size="small"
          sx={{
            width: { xs: "100%", sm: "300px" },
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              "&:hover fieldset": { borderColor: "#388E3C" },
              "&.Mui-focused fieldset": { borderColor: "#388E3C" },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "#388E3C" }} />
              </InputAdornment>
            ),
          }}
        />
        {userRole === "admin" && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setNewForm({ Description: "", file: null });
              setOpenModal(true);
            }}
            sx={{
              background: "linear-gradient(45deg, #388E3C, #66BB6A)",
              "&:hover": { background: "linear-gradient(45deg, #2e6b32, #4caf50)" },
              borderRadius: "25px",
              textTransform: "uppercase",
              boxShadow: "0 5px 15px rgba(56,142,60,0.3)",
              px: 3,
              py: 1,
              width: { xs: "100%", sm: "auto" },
            }}
          >
            Add New
          </Button>
        )}
      </Box>

      {loading && treeCensus.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
          <CircularProgress sx={{ color: "#388E3C" }} />
        </Box>
      ) : error ? (
        <Typography color="error" align="center" sx={{ py: 2 }}>
          {error}
        </Typography>
      ) : (
        <>
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: "12px",
              border: "1px solid #e0e0e0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              maxHeight: "none",
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ background: "linear-gradient(135deg, #388E3C, #2e6b32)", color: "#fff", fontWeight: 600, py: 2 }}>Description</TableCell>
                  <TableCell sx={{ background: "linear-gradient(135deg, #388E3C, #2e6b32)", color: "#fff", fontWeight: 600, py: 2 }}>Date</TableCell>
                  <TableCell sx={{ background: "linear-gradient(135deg, #388E3C, #2e6b32)", color: "#fff", fontWeight: 600, py: 2 }}>Download</TableCell>
                  {userRole === "admin" && (
                    <>
                      <TableCell sx={{ background: "linear-gradient(135deg, #388E3C, #2e6b32)", color: "#fff", fontWeight: 600, py: 2 }}>Edit</TableCell>
                      <TableCell sx={{ background: "linear-gradient(135deg, #388E3C, #2e6b32)", color: "#fff", fontWeight: 600, py: 2 }}>Delete</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTreeCensus.length > 0 ? (
                  filteredTreeCensus
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((tree) => (
                      <TableRow key={tree.ID} sx={{ "&:hover": { background: "#f5f7fa", transition: "background 0.2s" } }}>
                        <TableCell sx={{ py: 1.5 }}>
                          {userRole === "admin" && editingId === tree.ID ? (
                            <TextField
                              value={editForm.Description}
                              onChange={(e) => setEditForm({ ...editForm, Description: e.target.value })}
                              variant="outlined"
                              size="small"
                              fullWidth
                              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                            />
                          ) : (
                            <Typography sx={{ color: "#424242" }}>{tree.Description || "No Description"}</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ py: 1.5 }}>{formatDate(tree.CreatedAt)}</TableCell>
                        <TableCell sx={{ py: 1.5 }}>
                          {userRole === "admin" && editingId === tree.ID ? (
                            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                              <TextField
                                value={editForm.file ? editForm.file.name : editForm.FilePath.split('/').pop()}
                                variant="outlined"
                                size="small"
                                disabled
                                sx={{ flexGrow: 1, "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                              />
                              <input
                                type="file"
                                onChange={(e) => setEditForm({ ...editForm, file: e.target.files[0] })}
                                style={{ display: "none" }}
                                id={`edit-file-upload-${tree.ID}`}
                              />
                              <label htmlFor={`edit-file-upload-${tree.ID}`}>
                                <IconButton
                                  component="span"
                                  sx={{ color: "#388E3C", "&:hover": { color: "#2e6b32" } }}
                                >
                                  <CloudUpload />
                                </IconButton>
                              </label>
                            </Box>
                          ) : tree.FilePath ? (
                            <a href={`${API_BASE_URL}${tree.FilePath}`} target="_blank" rel="noopener noreferrer" style={{ color: "#388E3C", textDecoration: "none" }}>
                              Download
                            </a>
                          ) : (
                            <Typography sx={{ color: "#757575" }}>-</Typography>
                          )}
                        </TableCell>
                        {userRole === "admin" && (
                          <>
                            <TableCell sx={{ py: 1.5 }}>
                              {editingId === tree.ID ? (
                                <IconButton
                                  onClick={() => handleUpdate(tree.ID)}
                                  sx={{ color: "#28a745", "&:hover": { color: "#218838", bgcolor: "#e8f5e9" } }}
                                >
                                  <Save />
                                </IconButton>
                              ) : (
                                <IconButton
                                  onClick={() => handleEdit(tree)}
                                  sx={{ color: "#ffa500", "&:hover": { color: "#e69500", bgcolor: "#fff3e0" } }}
                                >
                                  <Edit />
                                </IconButton>
                              )}
                            </TableCell>
                            <TableCell sx={{ py: 1.5 }}>
                              <IconButton
                                onClick={() => handleDelete(tree.ID)}
                                sx={{ color: "#dc3545", "&:hover": { color: "#c82333", bgcolor: "#ffebee" } }}
                              >
                                <Delete />
                              </IconButton>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={userRole === "admin" ? 5 : 3} align="center" sx={{ py: 4, color: "#757575" }}>
                      No tree census data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredTreeCensus.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{
              color: "#388E3C",
              "& .MuiIconButton-root": { color: "#388E3C" },
              mt: 2,
            }}
          />
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%", borderRadius: "8px" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Box
          component={motion.div}
          sx={{
            background: "#fff",
            borderRadius: "16px",
            p: 4,
            width: "90%",
            maxWidth: 500,
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Typography variant="h6" sx={{ color: "#388E3C", mb: 3 }}>
            Add New Tree Census
          </Typography>
          {loading && (
            <CircularProgress sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
          )}
          <TextField
            label="Tree Census Description"
            value={newForm.Description}
            onChange={(e) => setNewForm({ ...newForm, Description: e.target.value })}
            variant="outlined"
            fullWidth
            sx={{ mb: 2 }}
            disabled={loading}
          />
          <input
            type="file"
            onChange={(e) => setNewForm({ ...newForm, file: e.target.files[0] })}
            style={{ display: "none" }}
            id="tree-modal-file-upload"
            disabled={loading}
          />
          <label htmlFor="tree-modal-file-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUpload />}
              sx={{
                borderColor: "#388E3C",
                color: "#388E3C",
                "&:hover": { borderColor: "#2e6b32", color: "#2e6b32" },
                mb: 2,
                width: "100%",
              }}
              disabled={loading}
            >
              {newForm.file ? newForm.file.name : "Upload File"}
            </Button>
          </label>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button onClick={() => setOpenModal(false)} sx={{ color: "#777" }} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleAdd}
              sx={{
                background: "linear-gradient(45deg, #388E3C, #66BB6A)",
                "&:hover": { background: "linear-gradient(45deg, #2e6b32, #4caf50)" },
              }}
              disabled={loading || !newForm.Description}
            >
              Save
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default TreeCensus;