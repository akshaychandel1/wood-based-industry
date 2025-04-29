const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { sql, poolPromise } = require("../config/db"); // ✅ Ensure correct DB connection
const crypto = require("crypto");

const router = express.Router();

// Load environment variables
const JWT_SECRET = process.env.JWT_SECRET || "naresh12345";
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

/**
 * ✅ Forgot Password Route - Sends Reset Email
 */
router.post("/forgot-password", async (req, res) => {
  console.log("Forgot Password API Hit");

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const pool = await poolPromise; // ✅ Use connection pool
    const userResult = await pool
      .request()
      .input("email", sql.NVarChar, email.toLowerCase()) // Ensure case insensitivity
      .query(`
        SELECT Id, UserName, Email 
        FROM [WBIHRY].[dbo].[wbi_AspNetUsers] 
        WHERE LOWER(Email) = @email
      `);

    if (userResult.recordset.length === 0) {
      return res.json({ message: "If your email exists, you will receive a reset link." });
    }

    const user = userResult.recordset[0];

    // Generate a JWT token valid for 15 minutes
    const resetToken = jwt.sign({ userId: user.Id, email: user.Email }, JWT_SECRET, { expiresIn: "15m" });

    // Reset Link
    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
    console.log("Generated Reset Link:", resetLink);

    // Send Email
    const mailOptions = {
      from: EMAIL_USER,
      to: email,
      subject: "Username / Password Reset Request",
      html: `
        <p>Your Username: <strong>${user.UserName}</strong></p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 15 minutes.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "If your email exists, you will receive a reset link." });
  } catch (err) {
    console.error("❌ Forgot Password Error:", err.message);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

/**
 * ✅ Reset Password Route
 */
router.post("/reset-password", async (req, res) => {
  console.log("Reset Password API Hit");

  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required" });
    }

    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const userId = decoded.userId;

    const pool = await poolPromise; // ✅ Use connection pool
    const userResult = await pool
      .request()
      .input("userId", sql.UniqueIdentifier, userId)
      .query(`
        SELECT Id FROM [WBIHRY].[dbo].[wbi_AspNetUsers] 
        WHERE Id = @userId
      `);

    if (userResult.recordset.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    // ✅ Validate Password Strength (Ensure at least 6 characters)
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    const newHashedPassword = hashPassword(newPassword);

    // Update the password in the database
    await pool
      .request()
      .input("userId", sql.UniqueIdentifier, userId)
      .input("passwordHash", sql.NVarChar, newHashedPassword)
      .query(`
        UPDATE [WBIHRY].[dbo].[wbi_AspNetUsers] 
        SET PasswordHash = @passwordHash 
        WHERE Id = @userId
      `);

    res.json({ message: "✅ Password reset successful!" });
  } catch (err) {
    console.error("❌ Reset Password Error:", err.message);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

/**
 * ✅ Secure Password Hashing Function (ASP.NET Identity Compatible)
 */
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16);
  const derivedKey = crypto.pbkdf2Sync(password, salt, 1000, 32, "sha1");
  const hashBuffer = Buffer.concat([Buffer.from([0x00]), salt, derivedKey]);
  return hashBuffer.toString("base64");
};

module.exports = router;
