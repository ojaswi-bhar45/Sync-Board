const { Timestamp } = require("mongodb");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  contactNumber: {
    type: String,
    default: null,
    required: true,
  },
  address: {
    type: String,
    default: null,
    required: true,
  },
  linkedInProfile: {
    type: String,
    required: true,
  },
  githubProfile: {
    type: String,
    required: true,
  },
  Timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
