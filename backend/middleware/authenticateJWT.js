const jwt = require("jsonwebtoken");

const authenticateJWT = (req, res, next) => {
  // Get the token from the Authorization header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Expects format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "Access Denied! No token provided." });
  }

  // Verify the token using the JWT secret from the environment variables
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token." });
    }
    // Attach the decoded user information to the request object
    req.user = user;
    next();
  });
};



module.exports = authenticateJWT;
