const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Also accept token via query param (for direct browser download links)
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey123_change_this_in_production');
    req.user = decoded; // Contains id, email, role
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

// Middleware to authorize roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role '${req.user?.role || 'Guest'}' is not authorized to access this resource.` 
      });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  authorizeRoles
};
