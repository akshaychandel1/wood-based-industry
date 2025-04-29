const express = require("express");
const { poolPromise } = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises; // For file deletion

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../TreeCensusUploads")); // Adjust path as needed
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});
const upload = multer({ storage });


// const verifyToken = (req, res, next) => {
//   const token = req.headers["authorization"]?.split(" ")[1];
//   if (!token) return res.status(401).json({ error: "No token provided" });
//   try {
//     const decoded = require("jsonwebtoken").verify(token, process.env.JWT_SECRET || "your-secret");
//     req.user = decoded;
//     next();
//   } catch (err) {
//     res.status(403).json({ error: "Invalid token" });
//   }
// };

// Fetch all Tree Census records
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT ID, Description, FilePath, CreatedAt 
      FROM user_db.dbo.TreeCensus 
      ORDER BY CreatedAt DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error fetching tree census data:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add new tree census record with file upload
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { Description } = req.body;
    const FilePath = req.file ? `/TreeCensusUploads/${req.file.filename}` : null;

    const pool = await poolPromise;
    await pool
      .request()
      .input("Description", Description)
      .input("FilePath", FilePath)
      .query(`
        INSERT INTO user_db.dbo.TreeCensus (Description, FilePath, CreatedAt) 
        VALUES (@Description, @FilePath, GETDATE())
      `);
    res.json({ message: "Record added successfully" });
  } catch (err) {
    console.error("❌ Error adding tree census record:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete tree census record
router.delete("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;

    // Fetch the file path before deleting the record (for cleanup)
    const result = await pool
      .request()
      .input("ID", req.params.id)
      .query("SELECT FilePath FROM user_db.dbo.TreeCensus WHERE ID = @ID");

    const filePath = result.recordset[0]?.FilePath;

    // Delete the record
    await pool
      .request()
      .input("ID", req.params.id)
      .query("DELETE FROM user_db.dbo.TreeCensus WHERE ID = @ID");

    // Clean up the file if it exists
    if (filePath) {
      const fullPath = path.join(__dirname, "..", filePath);
      try {
        await fs.unlink(fullPath);
        console.log(`✅ Deleted file: ${fullPath}`);
      } catch (fileErr) {
        console.error(`⚠️ Could not delete file ${fullPath}:`, fileErr.message);
      }
    }

    res.json({ message: "Record deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting tree census record:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update tree census record
router.put("/:id", async (req, res) => {
  try {
    const { Description, FilePath } = req.body;
    const pool = await poolPromise;
    await pool
      .request()
      .input("ID", req.params.id)
      .input("Description", Description)
      .input("FilePath", FilePath)
      .query(`
        UPDATE user_db.dbo.TreeCensus 
        SET Description = @Description, FilePath = @FilePath 
        WHERE ID = @ID
      `);
    res.json({ message: "Record updated successfully" });
  } catch (err) {
    console.error("❌ Error updating tree census record:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;