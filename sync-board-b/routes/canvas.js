const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const CanvasElement = require("../models/CanvasElement");
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
    const elements = await CanvasElement.find({ projectId: req.params.projectId })
      .populate("createdBy", "username email")
      .sort({ createdAt: 1 });

    res.json({ elements });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:projectId", auth, requireMember, async (req, res) => {
  try {
    const { type, color, top, left, rotation, title, content, badge, desc, progress } = req.body;

    const element = await CanvasElement.create({
      projectId: req.params.projectId,
      type: type || "sticky",
      color: color || "yellow",
      top: top ?? 100 + Math.floor(Math.random() * 200),
      left: left ?? 100 + Math.floor(Math.random() * 300),
      rotation: rotation ?? (Math.random() - 0.5) * 6,
      title: title || "",
      content: content || "",
      badge: badge || "",
      desc: desc || "",
      progress: progress || 0,
      createdBy: req.user._id,
    });

    const populated = await element.populate("createdBy", "username email");
    res.status(201).json({ element: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:projectId/:elementId", auth, requireMember, async (req, res) => {
  try {
    const { title, content, color, top, left, rotation, badge, desc, progress } = req.body;

    const element = await CanvasElement.findById(req.params.elementId);
    if (!element) return res.status(404).json({ message: "Element not found" });

    const isCreator = element.createdBy.toString() === req.user._id.toString();
    const isOwner = req.project.userId.toString() === req.user._id.toString();

    if (!isCreator && !isOwner)
      return res.status(403).json({ message: "Not authorized to update this element" });

    if (title !== undefined) element.title = title;
    if (content !== undefined) element.content = content;
    if (color !== undefined) element.color = color;
    if (top !== undefined) element.top = top;
    if (left !== undefined) element.left = left;
    if (rotation !== undefined) element.rotation = rotation;
    if (badge !== undefined) element.badge = badge;
    if (desc !== undefined) element.desc = desc;
    if (progress !== undefined) element.progress = progress;

    await element.save();

    const populated = await element.populate("createdBy", "username email");
    res.json({ element: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:projectId/:elementId", auth, requireMember, async (req, res) => {
  try {
    const element = await CanvasElement.findById(req.params.elementId);
    if (!element) return res.status(404).json({ message: "Element not found" });

    const isCreator = element.createdBy.toString() === req.user._id.toString();
    const isOwner = req.project.userId.toString() === req.user._id.toString();

    if (!isCreator && !isOwner)
      return res.status(403).json({ message: "Not authorized to delete this element" });

    await CanvasElement.findByIdAndDelete(req.params.elementId);
    res.json({ message: "Element deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
