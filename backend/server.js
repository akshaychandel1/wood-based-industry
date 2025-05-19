// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const session = require("express-session");
// const { poolPromise } = require("./config/db"); // Use poolPromise
// const authRoutes = require("./routes/authRoutes");
// const forgotRoutes = require("./routes/forgotRoutes");
// const notificationRoutes = require("./routes/notificationRoutes");
// const treeCensusRoutes = require("./routes/treeCensusRoutes");
// const instructionRoutes = require("./routes/instructionRoutes");
// const dashboardRoutes = require("./routes/dashboardRoutes"); // Punjab
// const haryanaRoutes = require("./routes/haryanaRoutes"); // Haryana

// const app = express();
// const PORT = process.env.PORT || 10000;
// const path = require("path");

// // Serve static files
// app.use("/TreeCensusUploads", express.static(path.join(__dirname, "TreeCensusUploads")));
// app.use("/NotificationUploads", express.static(path.join(__dirname, "NotificationUploads")));
// app.use("/InstructionUploads", express.static("InstructionUploads"));

// // // Optimized CORS Middleware
// // const corsOptions = {
// //   origin: "http://localhost:5173", // Ensure this matches your frontend URL
// //   methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
// //   allowedHeaders: "Content-Type, Authorization",
// //   credentials: true,
// // };

// // app.use(cors(corsOptions));

// // // Handle Preflight Requests (CORS Fix for OPTIONS Requests)
// // app.options("*", (req, res) => {
// //   res.set({
// //     "Access-Control-Allow-Origin": "http://localhost:5173",
// //     "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
// //     "Access-Control-Allow-Headers": "Content-Type, Authorization",
// //     "Access-Control-Allow-Credentials": "true",
// //   });
// //   res.status(204).end();
// // });


// // Optimized CORS Middleware
// const corsOptions = {
//   origin: process.env.FRONTEND_URL || 'https://wood-based-industry.vercel.app', // Use environment variable for flexibility
//   // origin: "http://localhost:5173", // For local development, uncomment this line
//   methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//   allowedHeaders: "Content-Type, Authorization",
//   credentials: true,
// };

// app.use(cors(corsOptions));

// // Optional: Preflight handler (if needed)
// app.options("*", cors(corsOptions));

// // Body Parser (Improved Performance)
// app.use(express.json({ limit: "1mb" })); // Limit body size for efficiency

// // Session Middleware (Secure Settings)
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET || "naresh12345",
//     resave: false,
//     saveUninitialized: false, // Avoid unnecessary session storage
//     cookie: {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "lax",
//       maxAge: 24 * 60 * 60 * 1000, // 24 hours
//     },
//   })
// );

// // Ensure DB connection before starting the server
// poolPromise
//   .then(() => {
//     console.log("✅ Database connection ready");

//     // Define Routes
//     app.use("/api/auth", authRoutes);
//     app.use("/api/auth", forgotRoutes); // Note: Potential conflict; consider merging or renaming
//     app.use("/api/notifications", notificationRoutes);
//     app.use("/api/treeCensus", treeCensusRoutes);
//     app.use("/api/instructions", instructionRoutes);
//     app.use("/api/dashboard", dashboardRoutes); // Punjab dashboard
//     app.use("/api/haryana", haryanaRoutes); // Haryana dashboard

//     // Start Server
//     app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
//   })
//   .catch((err) => {
//     console.error("❌ Failed to start server due to DB error:", err);
//     process.exit(1); // Exit process on DB failure
//   });

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const RedisStore = require("connect-redis")(session); // Add RedisStore
const redis = require("redis"); // Add redis client
const { poolPromise } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const forgotRoutes = require("./routes/forgotRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const treeCensusRoutes = require("./routes/treeCensusRoutes");
const instructionRoutes = require("./routes/instructionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const haryanaRoutes = require("./routes/haryanaRoutes");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

// Serve static files
app.use("/TreeCensusUploads", express.static(path.join(__dirname, "TreeCensusUploads")));
app.use("/NotificationUploads", express.static(path.join(__dirname, "NotificationUploads")));
app.use("/InstructionUploads", express.static(path.join(__dirname, "InstructionUploads"))); // Fixed path

// Optimized CORS Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || "https://wood-based-industry.vercel.app",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Body Parser
app.use(express.json({ limit: "1mb" }));

// Redis Session Store
const redisClient = redis.createClient({
  url: process.env.REDIS_URL, // Set in Render environment
});
redisClient.connect().catch(console.error);

app.use(
  session({
    store: new RedisStore({ client: redisClient }), // Use RedisStore
    secret: process.env.SESSION_SECRET, // Require in production
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Ensure DB connection before starting the server
poolPromise
  .then(() => {
    console.log("✅ Database connection ready");

    // Define Routes
    app.use("/api/auth", authRoutes);
    app.use("/api/forgot", forgotRoutes); // Fixed route conflict
    app.use("/api/notifications", notificationRoutes);
    app.use("/api/treeCensus", treeCensusRoutes);
    app.use("/api/instructions", instructionRoutes);
    app.use("/api/dashboard", dashboardRoutes);
    app.use("/api/haryana", haryanaRoutes);

    // Start Server
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Failed to start server due to DB error:", err.stack);
    process.exit(1);
  });