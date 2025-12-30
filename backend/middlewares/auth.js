export default function (req, res, next) {
  const apiKey = req.headers["apikey"];
  if (!apiKey) {
    return res.status(401).json({ message: "API Key is required" });
  }
  if (apiKey != process.env.API_KEY) {
    return res.status(401).json({ message: "Invalid API Key" });
  }
  next();
}
