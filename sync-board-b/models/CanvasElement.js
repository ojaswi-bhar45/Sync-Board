const mongoose = require("mongoose");

const canvasElementSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ["sticky", "idea"],
    default: "sticky",
  },
  color: {
    type: String,
    default: "yellow",
  },
  top: { type: Number, default: 100 },
  left: { type: Number, default: 100 },
  rotation: { type: Number, default: 0 },
  title: { type: String, default: "" },
  content: { type: String, default: "" },
  badge: { type: String, default: "" },
  desc: { type: String, default: "" },
  progress: { type: Number, default: 0 },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("CanvasElement", canvasElementSchema);
