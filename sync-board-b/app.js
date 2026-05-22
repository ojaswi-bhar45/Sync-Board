const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");
const authRoute = require("./controllers/authController");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/", authRoute);

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("MongoDB is connected successfully :)");
  })
  .catch((err) => console.log(err));

app.listen(process.env.PORT, () => {
  console.log(`Server is running or port ${process.env.PORT}`);
});
