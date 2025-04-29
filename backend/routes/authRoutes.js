const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const svgCaptcha = require("svg-captcha");
const { sql, poolPromise } = require("../config/db"); // ✅ Use `pool`

const router = express.Router();

// Store CAPTCHA solutions in memory (for simplicity). In production, use a database or session store.
const captchaStore = new Map();

// ✅ Function to validate ASP.NET Identity hashed passwords
const validatePassword = (enteredPassword, storedPasswordHash) => {
  try {
    if (!storedPasswordHash) return false;

    const hashBuffer = Buffer.from(storedPasswordHash, "base64");
    if (hashBuffer.length !== 49 || hashBuffer[0] !== 0) return false;

    const salt = hashBuffer.slice(1, 17);
    const storedHash = hashBuffer.slice(17, 49);
    const derivedKey = crypto.pbkdf2Sync(enteredPassword, salt, 1000, 32, "sha1");
    console.log("Derived Key: ", derivedKey);
    console.log("Stored Hash: ", storedHash);
    return crypto.timingSafeEqual(derivedKey, storedHash);
  } catch (err) {
    console.error("❌ Password validation error:", err.message);
    return false;
  }
};

router.post("/register", async (req, res) => {
  try {
    const { title, firstName, lastName, Aadharid, PhoneNumber, email, username, dob, password, gender } = req.body;

    // 🔍 Validate required fields
    if (!title || !firstName || !lastName || !Aadharid || !PhoneNumber || !email || !username || !dob || !password || !gender) {
      return res.status(400).json({ error: "All fields are required!" });
    }

    const pool = await poolPromise;
    if (!pool) {
      return res.status(500).json({ error: "Database connection not available" });
    }

    // 🚀 Faster existing user check
    const userExists = await pool
      .request()
      .input("username", sql.NVarChar, username)
      .input("email", sql.NVarChar, email)
      .input("Aadharid", sql.NVarChar, Aadharid)
      .query(`
        SELECT 1 FROM [WBIHRY].[dbo].[wbi_AspNetUsers] 
        WHERE UserName = @username OR Email = @email OR Aadharid = @Aadharid
      `);

    if (userExists.recordset.length > 0) {
      return res.status(400).json({ error: "Username, Email, or Aadharid already exists!" });
    }

    // 🔑 Generate required values
    const newUserId = crypto.randomUUID();
    const passwordHash = hashPassword(password);
    const securityStamp = crypto.randomUUID();
    const currentDateTime = new Date();

    // 🚀 Faster Insert Query
    await pool
      .request()
      .input("id", sql.UniqueIdentifier, newUserId)
      .input("title", sql.NVarChar, title)
      .input("firstName", sql.NVarChar, firstName)
      .input("lastName", sql.NVarChar, lastName)
      .input("Aadharid", sql.NVarChar, Aadharid)
      .input("PhoneNumber", sql.NVarChar, PhoneNumber)
      .input("email", sql.NVarChar, email)
      .input("username", sql.NVarChar, username)
      .input("dob", sql.Date, dob)
      .input("passwordHash", sql.NVarChar, passwordHash)
      .input("securityStamp", sql.NVarChar, securityStamp)
      .input("createdDate", sql.DateTime, currentDateTime)
      .input("modifiedDate", sql.DateTime, currentDateTime)
      .input("gender", sql.NVarChar, gender)
      .query(`
        INSERT INTO [WBIHRY].[dbo].[wbi_AspNetUsers] 
        (Id, Title, FirstName, LastName, Aadharid, PhoneNumber, Email, UserName, Dob, PasswordHash, SecurityStamp, Createddate, Modifieddate, Gender) 
        VALUES 
        (@id, @title, @firstName, @lastName, @Aadharid, @PhoneNumber, @email, @username, @dob, @passwordHash, @securityStamp, @createdDate, @modifiedDate, @gender)
      `);

    res.status(201).json({ message: "✅ User registered successfully!" });
  } catch (err) {
    console.error("❌ Registration Error:", err);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

// 🔐 PBKDF2 Password Hashing Function
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16);
  const derivedKey = crypto.pbkdf2Sync(password, salt, 1000, 32, "sha1");
  return Buffer.concat([Buffer.from([0x00]), salt, derivedKey]).toString("base64");
};

// ✅ User Login Route
router.post("/login", async (req, res) => {
  try {
    const { username, password, captcha } = req.body;

    // ✅ Validate CAPTCHA
    const storedCaptcha = captchaStore.get(req.ip);
    if (!storedCaptcha || storedCaptcha !== captcha) {
      return res.status(400).json({ error: "Invalid CAPTCHA. Please try again." });
    }

    // ✅ Get DB connection
    const pool = await poolPromise;
    if (!pool) {
      return res.status(500).json({ error: "Database connection not available" });
    }

    // ✅ Query user details
    const result = await pool
      .request()
      .input("username", sql.NVarChar, username)
      .query(`
        SELECT 
          u.Id, 
          u.UserName, 
          u.PasswordHash, 
          ur.RoleId, 
          r.Name AS RoleName
        FROM [WBIHRY].[dbo].[wbi_AspNetUsers] u
        LEFT JOIN [WBIHRY].[dbo].[wbi_AspNetUserRoles] ur ON u.Id = ur.UserId
        LEFT JOIN [WBIHRY].[dbo].[wbi_AspNetRoles] r ON ur.RoleId = r.Id
        WHERE u.UserName = @username
      `);

    const user = result.recordset[0];
    if (!user) {
      return res.status(400).json({ error: "Invalid username or password." });
    }

    // ✅ Validate password
    const isMatch = validatePassword(password, user.PasswordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid username or password." });
    }

    const userRole = user.RoleName || "user";

    // ✅ Generate JWT token
    const token = jwt.sign(
      { id: user.Id, username: user.UserName, role: userRole },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({
      message: "✅ Login successful!",
      token,
      user: { id: user.Id, username: user.UserName, role: userRole },
    });
  } catch (err) {
    console.error("❌ Login Error:", err.message);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

// ✅ CAPTCHA Generation Endpoint
router.get("/captcha", (req, res) => {
  try {
    const captcha = svgCaptcha.create({
      size: 6,
      noise: 2,
      color: true,
      background: "#f0f0f0",
    });

    captchaStore.set(req.ip, captcha.text);

    res.type("svg");
    res.send(captcha.data);
  } catch (err) {
    console.error("❌ CAPTCHA generation error:", err.message);
    res.status(500).json({ error: "Failed to generate CAPTCHA." });
  }
});

module.exports = router;
