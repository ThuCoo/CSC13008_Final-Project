import app from "./app.js";
import dotenv from "dotenv";

// Load ENV from .env
dotenv.config();

// Bind to port
app.listen(process.env.PORT, () => {
  console.log(`Server is listening on port ${process.env.PORT}`);
});
