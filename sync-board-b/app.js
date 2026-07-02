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

if (process.env.MONGO_URL?.includes("mongodb+srv")) {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
}

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

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ data: { status: "ok" }, message: "OK" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ data: { status: "ok" }, message: "OK" });
});

app.use("/api/v1", apiRoutes);

app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  const MAX_RETRIES = 3;
  (async function connect() {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("MongoDB is connected successfully :)");
        server.listen(process.env.PORT, () => {
          console.log(`Server is running on port ${process.env.PORT}`);
        });
        return;
      } catch (err) {
        if (attempt === MAX_RETRIES) {
          console.error("Failed to connect to MongoDB:", err.message);
          process.exit(1);
        }
        console.error(`Connection attempt ${attempt}/${MAX_RETRIES} failed. Retrying...`);
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  })();
}

module.exports = { app, server };
