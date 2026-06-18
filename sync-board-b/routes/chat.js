const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const Message = require("../models/Message");
const Project = require("../models/Project");
const { validate, schemas } = require("../middlewares/validate");

async function requireMember(req, res, next) {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const userId = req.user._id.toString();
    const isOwner = project.userId.toString() === userId;
    const isMember = project.members.some((m) => m.toString() === userId);

    if (!isOwner && !isMember)
      return res.status(403).json({ error: "You are not a member of this project" });

    req.project = project;
    next();
  } catch (error) {
    next(error);
  }
}

router.get("/:projectId", auth, requireMember, async (req, res, next) => {
  try {
    const messages = await Message.find({ projectId: req.params.projectId })
      .populate("sender", "username email")
      .sort({ timestamp: 1 })
      .limit(200);

    res.json({ messages });
  } catch (error) {
    next(error);
  }
});

router.post("/:projectId", auth, requireMember, validate(schemas.sendMessage), async (req, res, next) => {
  try {
    const { text } = req.body;

    const message = await Message.create({
      projectId: req.params.projectId,
      sender: req.user._id,
      text: text.trim(),
    });

    const populated = await message.populate("sender", "username email");

    const io = req.app.get("io");
    if (io) {
      io.to(`project:${req.params.projectId}`).emit("chat:message", populated);
    }

    res.status(201).json({ message: populated });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
