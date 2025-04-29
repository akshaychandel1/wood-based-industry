const express = require("express");
const { sql, poolPromise } = require("../config/db"); // Added sql for parameterized queries
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises; // For file deletion

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../InstructionUploads")); // New folder for instructions
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Fetch all Instructions
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT ID, Title, FilePath, CreatedAt 
      FROM user_db.dbo.Instructions 
      ORDER BY CreatedAt DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error fetching instructions:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add new Instruction with file upload
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { Title } = req.body;
    const FilePath = req.file ? `/InstructionUploads/${req.file.filename}` : null;

    if (!Title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const pool = await poolPromise;
    await pool
      .request()
      .input("Title", sql.NVarChar, Title)
      .input("FilePath", sql.NVarChar, FilePath)
      .query(`
        INSERT INTO user_db.dbo.Instructions (Title, FilePath, CreatedAt) 
        VALUES (@Title, @FilePath, GETDATE())
      `);
    res.json({ message: "Instruction added successfully" });
  } catch (err) {
    console.error("❌ Error adding instruction:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update Instruction
router.put("/:id", upload.single("file"), async (req, res) => {
  try {
    const { id } = req.params;
    const { Title } = req.body;
    const newFilePath = req.file ? `/InstructionUploads/${req.file.filename}` : req.body.FilePath;

    if (!Title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const pool = await poolPromise;

    // Fetch existing file path for potential cleanup
    const existingResult = await pool
      .request()
      .input("ID", sql.Int, id)
      .query("SELECT FilePath FROM user_db.dbo.Instructions WHERE ID = @ID");

    const oldFilePath = existingResult.recordset[0]?.FilePath;

    // Update the record
    await pool
      .request()
      .input("ID", sql.Int, id)
      .input("Title", sql.NVarChar, Title)
      .input("FilePath", sql.NVarChar, newFilePath)
      .query(`
        UPDATE user_db.dbo.Instructions 
        SET Title = @Title, FilePath = @FilePath 
        WHERE ID = @ID
      `);

    // Delete old file if a new file was uploaded and old file exists
    if (req.file && oldFilePath) {
      const fullOldPath = path.join(__dirname, "..", oldFilePath);
      try {
        await fs.unlink(fullOldPath);
        console.log(`✅ Deleted old file: ${fullOldPath}`);
      } catch (fileErr) {
        console.error(`⚠️ Could not delete old file ${fullOldPath}:`, fileErr.message);
      }
    }

    res.json({ message: "Instruction updated successfully" });
  } catch (err) {
    console.error("❌ Error updating instruction:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete Instruction
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    // Fetch the file path before deleting
    const result = await pool
      .request()
      .input("ID", sql.Int, id)
      .query("SELECT FilePath FROM user_db.dbo.Instructions WHERE ID = @ID");

    const filePath = result.recordset[0]?.FilePath;

    // Delete the record
    const deleteResult = await pool
      .request()
      .input("ID", sql.Int, id)
      .query("DELETE FROM user_db.dbo.Instructions WHERE ID = @ID");

    if (deleteResult.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Instruction not found" });
    }

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

    res.json({ message: "Instruction deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting instruction:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;