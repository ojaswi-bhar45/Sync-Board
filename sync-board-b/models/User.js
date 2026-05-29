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
  },
  address: {
    type: String,
    default: null,
  },
  linkedInProfile: {
    type: String,
    default: null,
  },
  githubProfile: {
    type: String,
    default: null,
  },
  Timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
