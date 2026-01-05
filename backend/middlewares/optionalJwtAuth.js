import jwt from "jsonwebtoken";

// Optional JWT authentication - doesn't fail if no token is provided
export default function (req, res, next) {
  try {
    const authHeader =
      req.headers["authorization"] || req.headers["Authorization"];

    // If no auth header, just continue without setting req.user
    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      // Invalid format, but don't fail - just continue without user
      return next();
    }

    const token = parts[1];
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload;
      next();
    } catch (err) {
      // Invalid or expired token, but don't fail - just continue without user
      next();
    }
  } catch (err) {
    next(err);
  }
}
