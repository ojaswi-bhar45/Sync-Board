const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");
const helmet = require("helmet");
const compression = require("compression");
const apiRoutes = require("./routes/index");
const errorHandler = require("./middlewares/errorHandler");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();

const app = express();

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
//to check the backend server is working or not 
app.get("/", (req, res) => {
  res.send("Working");
});

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1", apiRoutes);

app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
      console.log("MongoDB is connected successfully :)");
    })
    .catch((err) => console.log(err));

  app.listen(process.env.PORT, () => {
    console.log(`Server is running or port ${process.env.PORT}`);
  });
}

module.exports = app;
