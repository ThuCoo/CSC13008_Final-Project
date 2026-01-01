import jwt from "jsonwebtoken";

export default function (req, res, next) {
  try {
    const authHeader =
      req.headers["authorization"] || req.headers["Authorization"];
    if (!authHeader)
      return res.status(401).json({ message: "Authorization required" });
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer")
      return res.status(401).json({ message: "Invalid authorization format" });
    const token = parts[1];
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  } catch (err) {
    next(err);
  }
}
