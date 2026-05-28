const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const Message = require("../models/Message");
const Project = require("../models/Project");

async function requireMember(req, res, next) {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const userId = req.user._id.toString();
    const isOwner = project.userId.toString() === userId;
    const isMember = project.members.some((m) => m.toString() === userId);

    if (!isOwner && !isMember)
      return res.status(403).json({ message: "You are not a member of this project" });

    req.project = project;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

router.get("/:projectId", auth, requireMember, async (req, res) => {
  try {
    const messages = await Message.find({ projectId: req.params.projectId })
      .populate("sender", "username email")
      .sort({ timestamp: 1 })
      .limit(200);

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:projectId", auth, requireMember, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim())
      return res.status(400).json({ message: "Message text is required" });

    const message = await Message.create({
      projectId: req.params.projectId,
      sender: req.user._id,
      text: text.trim(),
    });

    const populated = await message.populate("sender", "username email");

    res.status(201).json({ message: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
