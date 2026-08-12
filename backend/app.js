require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/database");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const templateRoutes = require("./routes/templateRoutes");
const contactRoutes = require("./routes/contactRoutes");

const app = express();
const PORT = process.env.PORT || 8001;

app.set("trust proxy", true);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDB();

app.use("/auth", authRoutes);
app.use("/portfolio", portfolioRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/templates", templateRoutes);
app.use("/contact", contactRoutes);
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "✓ Portfolio Generator Backend is Running",
    version: "2.0",
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});