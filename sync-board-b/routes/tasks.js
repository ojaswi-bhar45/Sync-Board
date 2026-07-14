const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const Task = require("../models/Task");
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
    req.isOwner = isOwner;
    next();
  } catch (err) {
    next(err);
  }
}

// GET all tasks for a project
router.get("/:projectId", auth, requireMember, async (req, res, next) => {
  try {
    const tasks = await Task.find({ projectId: req.params.projectId })
      .populate("assignedTo", "username email")
      .populate("createdBy", "username email")
      .sort({ order: 1 });

    success(res, { tasks });
  } catch (err) {
    next(err);
  }
});

// POST create a task (owner only)
router.post("/", auth, validate(schemas.createTask), async (req, res, next) => {
  try {
    const project = await Project.findById(req.body.projectId);
    if (!project) return error(res, "Project not found", "NOT_FOUND", 404);

    if (project.userId.toString() !== req.user._id.toString()) {
      return error(res, "Only the project owner can create tasks", "FORBIDDEN", 403);
    }

    const lastTask = await Task.findOne({
      projectId: req.body.projectId,
      status: req.body.status || "backlog",
    }).sort({ order: -1 });

    const order = lastTask ? lastTask.order + 1 : 0;

    const task = await Task.create({
      ...req.body,
      createdBy: req.user._id,
      order,
    });

    const populated = await task.populate([
      { path: "assignedTo", select: "username email" },
      { path: "createdBy", select: "username email" },
    ]);

    const io = req.app.get("io");
    if (io) {
      io.to(`project:${req.body.projectId}`).emit("task:created", populated);
    }

    success(res, { task: populated }, "Task created", 201);
  } catch (err) {
    next(err);
  }
});

// PATCH update a task (owner only)
router.patch("/:id", auth, validate(schemas.editTask), async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return error(res, "Task not found", "NOT_FOUND", 404);

    const project = await Project.findById(task.projectId);
    if (project.userId.toString() !== req.user._id.toString()) {
      return error(res, "Only the project owner can edit tasks", "FORBIDDEN", 403);
    }

    Object.assign(task, req.body);
    await task.save();

    const populated = await task.populate([
      { path: "assignedTo", select: "username email" },
      { path: "createdBy", select: "username email" },
    ]);

    const io = req.app.get("io");
    if (io) {
      io.to(`project:${task.projectId}`).emit("task:updated", populated);
    }

    success(res, { task: populated }, "Task updated");
  } catch (err) {
    next(err);
  }
});

// PATCH update task status and order (owner + members)
router.patch(
  "/:id/status",
  auth,
  validate(schemas.updateTaskStatus),
  async (req, res, next) => {
    try {
      const task = await Task.findById(req.params.id);
      if (!task) return error(res, "Task not found", "NOT_FOUND", 404);

      const project = await Project.findById(task.projectId);
      if (!project) return error(res, "Project not found", "NOT_FOUND", 404);

      const userId = req.user._id.toString();
      const isOwner = project.userId.toString() === userId;
      const isMember = project.members.some((m) => m.toString() === userId);

      if (!isOwner && !isMember) {
        return error(res, "You are not a member of this project", "FORBIDDEN", 403);
      }

      task.status = req.body.status;
      task.order = req.body.order;
      await task.save();

      const populated = await task.populate([
        { path: "assignedTo", select: "username email" },
        { path: "createdBy", select: "username email" },
      ]);

      const io = req.app.get("io");
      if (io) {
        io.to(`project:${task.projectId}`).emit("task:updated", populated);
      }

      success(res, { task: populated }, "Task status updated");
    } catch (err) {
      next(err);
    }
  },
);

// DELETE a task (owner only)
router.delete("/:id", auth, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return error(res, "Task not found", "NOT_FOUND", 404);

    const project = await Project.findById(task.projectId);
    if (project.userId.toString() !== req.user._id.toString()) {
      return error(res, "Only the project owner can delete tasks", "FORBIDDEN", 403);
    }

    const projectId = task.projectId.toString();
    await task.deleteOne();

    const io = req.app.get("io");
    if (io) {
      io.to(`project:${projectId}`).emit("task:deleted", {
        taskId: req.params.id,
        projectId,
      });
    }

    success(res, null, "Task deleted");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
