const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");
const helmet = require("helmet");
const compression = require("compression");
const http = require("http");
const apiRoutes = require("./routes/index");
const errorHandler = require("./middlewares/errorHandler");
const { createSocketServer } = require("./socket");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();

const app = express();
const server = http.createServer(app);

const io = createSocketServer(server);

app.set("io", io);

app.use(helmet());
app.use(compression());

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: corsOrigin.split(",").map((s) => s.trim()),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }),
);

app.get("/", (req, res) => {
  res.send("Working");
});

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1", apiRoutes);

app.use(errorHandler);

async function connectWithRetry(maxRetries = 5, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(process.env.MONGO_URL);
      console.log("MongoDB is connected successfully :)");
      return;
    } catch (err) {
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.error(`MongoDB connection attempt ${attempt}/${maxRetries} failed. Retrying in ${delay}ms...`);
      if (attempt === maxRetries) {
        console.error("All MongoDB connection attempts failed:", err.message);
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

if (process.env.NODE_ENV !== "test") {
  connectWithRetry();

  server.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
  });
}

module.exports = { app, server };
