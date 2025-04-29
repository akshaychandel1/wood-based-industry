const express = require("express");
const { poolPromise } = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises; // For file deletion

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../NotificationUploads")); // New folder for notifications
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Fetch all Notifications
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT ID, Subject, FilePath, CreatedAt 
      FROM user_db.dbo.Notifications 
      ORDER BY CreatedAt DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error fetching notifications:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add new notification with file upload
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { Subject } = req.body;
    const FilePath = req.file ? `/NotificationUploads/${req.file.filename}` : null;

    const pool = await poolPromise;
    await pool
      .request()
      .input("Subject", Subject)
      .input("FilePath", FilePath)
      .query(`
        INSERT INTO user_db.dbo.Notifications (Subject, FilePath, CreatedAt) 
        VALUES (@Subject, @FilePath, GETDATE())
      `);
    res.json({ message: "Notification added successfully" });
  } catch (err) {
    console.error("❌ Error adding notification:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update notification
router.put("/:id", async (req, res) => {
  try {
    const { Subject, FilePath } = req.body;
    const pool = await poolPromise;
    await pool
      .request()
      .input("ID", req.params.id)
      .input("Subject", Subject)
      .input("FilePath", FilePath)
      .query(`
        UPDATE user_db.dbo.Notifications 
        SET Subject = @Subject, FilePath = @FilePath 
        WHERE ID = @ID
      `);
    res.json({ message: "Notification updated successfully" });
  } catch (err) {
    console.error("❌ Error updating notification:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete notification
router.delete("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;

    // Fetch the file path before deleting
    const result = await pool
      .request()
      .input("ID", req.params.id)
      .query("SELECT FilePath FROM user_db.dbo.Notifications WHERE ID = @ID");

    const filePath = result.recordset[0]?.FilePath;

    // Delete the record
    await pool
      .request()
      .input("ID", req.params.id)
      .query("DELETE FROM user_db.dbo.Notifications WHERE ID = @ID");

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

    res.json({ message: "Notification deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting notification:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;