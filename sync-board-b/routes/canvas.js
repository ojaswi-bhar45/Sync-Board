const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const CanvasElement = require("../models/CanvasElement");
const Project = require("../models/Project");
const { validate, schemas } = require("../middlewares/joi");
const { success, error } = require("../utils/response");

async function requireMember(req, res, next) {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return error(res, "Project not found", "NOT_FOUND", 404);

    const userId = req.user._id.toString();
    const isOwner = project.userId.toString() === userId;
    const isMember = project.members.some((m) => m.toString() === userId);

    if (!isOwner && !isMember)
      return error(res, "You are not a member of this project", "FORBIDDEN", 403);

    req.project = project;
    next();
  } catch (error) {
    next(error);
  }
}

router.get("/:projectId", auth, requireMember, async (req, res, next) => {
  try {
    const elements = await CanvasElement.find({ projectId: req.params.projectId })
      .populate("createdBy", "username email")
      .sort({ createdAt: 1 });

    success(res, { elements });
  } catch (error) {
    next(error);
  }
});

router.post("/:projectId", auth, requireMember, validate(schemas.createCanvasElement), async (req, res, next) => {
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
    success(res, { element: populated }, "Element created", 201);
  } catch (error) {
    next(error);
  }
});

router.patch("/:projectId/:elementId", auth, requireMember, validate(schemas.updateCanvasElement), async (req, res, next) => {
  try {
    const { title, content, color, top, left, rotation, badge, desc, progress } = req.body;

    const element = await CanvasElement.findById(req.params.elementId);
    if (!element) return error(res, "Element not found", "NOT_FOUND", 404);

    const isCreator = element.createdBy.toString() === req.user._id.toString();
    const isOwner = req.project.userId.toString() === req.user._id.toString();

    if (!isCreator && !isOwner)
      return error(res, "Not authorized to update this element", "FORBIDDEN", 403);

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
    success(res, { element: populated }, "Element updated");
  } catch (error) {
    next(error);
  }
});

router.delete("/:projectId/:elementId", auth, requireMember, async (req, res, next) => {
  try {
    const element = await CanvasElement.findById(req.params.elementId);
    if (!element) return error(res, "Element not found", "NOT_FOUND", 404);

    const isCreator = element.createdBy.toString() === req.user._id.toString();
    const isOwner = req.project.userId.toString() === req.user._id.toString();

    if (!isCreator && !isOwner)
      return error(res, "Not authorized to delete this element", "FORBIDDEN", 403);

    await CanvasElement.findByIdAndDelete(req.params.elementId);
    success(res, null, "Element deleted");
  } catch (error) {
    next(error);
  }
});

module.exports = router;
