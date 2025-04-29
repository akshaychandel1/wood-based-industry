const sql = require("mssql");
require("dotenv").config();

// ✅ Database configuration
const config = {
  user: process.env.DB_USER || "ak",
  password: process.env.DB_PASSWORD || "1234",
  server: process.env.DB_SERVER || "DESKTOP-TLUIQG1",
  database: process.env.DB_NAME || "WBIHRY",
  pool: {
    max: 20, // Maintain up to 10 connections
    min: 5,  // Keep at least 2 connections always open
    idleTimeoutMillis: 60000, // Close idle connections after 30 seconds
  },
  options: {
    encrypt: false, // Set to true if using Azure
    trustServerCertificate: true, // Fix SSL certificate issues
    requestTimeout: 60000, // 60 seconds
  },
};

// ✅ Create a global connection pool
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("✅ Connected to SQL Server");
    return pool;
  })
  .catch((err) => {
    console.error("❌ Database Connection Failed:", err.message);
    process.exit(1);
  });

module.exports = { sql, poolPromise };
