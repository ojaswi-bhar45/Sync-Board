const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  note: {
    type: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  techStack: {
    type: [String],
    default: [],
  },
  //user who liked the project

  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  //Commects on the project
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      text: {
        type: String,
      },

      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  //Team members

  members: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      permission: { type: String, enum: ["owner", "admin", "member"], default: "member" },
      teamRole: { type: String, enum: ["frontend", "backend", "fullstack", "uiux", "devops", "qa", "ml", "mobile", "other"], default: "other" },
      joinedAt: { type: Date, default: Date.now },
    },
  ],

  //Join Request

  joinRequest: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      note: {
        type: String,
      },
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  status: {
    type: String,
    enum: ["planning", "active", "completed"],
    default: "planning",
  },

  isOpenForCollaboration: {
    type: Boolean,
    default: true,
  },

  lookingFor: [{ type: String }],

  visibility: {
    type: String,
    enum: ["public", "private"],
    default: "public",
  },

  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  pinned: {
    type: Boolean,
    default: false,
  },
  image: {
    type: String,
    default: "",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Project", projectSchema);
