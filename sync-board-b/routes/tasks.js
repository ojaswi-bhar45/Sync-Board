const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const Task = require("../models/Task");
const Project = require("../models/Project");
const { validate, schemas } = require("../middlewares/joi");
const { success, error } = require("../utils/response");
const { getMemberRecord } = require("../utils/permissions");

async function requireMember(req, res, next) {
  try {
    const project = await Project.findById(req.params.projectId || req.body.projectId);
    if (!project) return error(res, "Project not found", "NOT_FOUND", 404);

    const record = getMemberRecord(project, req.user._id);
    if (!record) {
      return error(res, "You are not a member of this project", "FORBIDDEN", 403);
    }

    req.project = project;
    req.userPermission = record.permission;
    next();
  } catch (err) {
    next(err);
  }
}

async function requireTaskProject(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return error(res, "Task not found", "NOT_FOUND", 404);

    const project = await Project.findById(task.projectId);
    if (!project) return error(res, "Project not found", "NOT_FOUND", 404);

    const record = getMemberRecord(project, req.user._id);
    if (!record) {
      return error(res, "You are not a member of this project", "FORBIDDEN", 403);
    }

    req.task = task;
    req.project = project;
    req.userPermission = record.permission;
    next();
  } catch (err) {
    next(err);
  }
}

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

router.post("/", auth, validate(schemas.createTask), requireMember, async (req, res, next) => {
  try {
    if (req.userPermission === "member") {
      return error(res, "Only the owner or admin can create tasks", "FORBIDDEN", 403);
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

router.patch("/:id", auth, validate(schemas.editTask), requireTaskProject, async (req, res, next) => {
  try {
    if (req.userPermission === "member") {
      return error(res, "Only the owner or admin can edit tasks", "FORBIDDEN", 403);
    }

    Object.assign(req.task, req.body);
    await req.task.save();

    const populated = await req.task.populate([
      { path: "assignedTo", select: "username email" },
      { path: "createdBy", select: "username email" },
    ]);

    const io = req.app.get("io");
    if (io) {
      io.to(`project:${req.task.projectId}`).emit("task:updated", populated);
    }

    success(res, { task: populated }, "Task updated");
  } catch (err) {
    next(err);
  }
});

router.patch(
  "/:id/status",
  auth,
  validate(schemas.updateTaskStatus),
  requireTaskProject,
  async (req, res, next) => {
    try {
      req.task.status = req.body.status;
      req.task.order = req.body.order;
      await req.task.save();

      const populated = await req.task.populate([
        { path: "assignedTo", select: "username email" },
        { path: "createdBy", select: "username email" },
      ]);

      const io = req.app.get("io");
      if (io) {
        io.to(`project:${req.task.projectId}`).emit("task:updated", populated);
      }

      success(res, { task: populated }, "Task status updated");
    } catch (err) {
      next(err);
    }
  },
);

router.delete("/:id", auth, requireTaskProject, async (req, res, next) => {
  try {
    if (req.userPermission === "member") {
      return error(res, "Only the owner or admin can delete tasks", "FORBIDDEN", 403);
    }

    const projectId = req.task.projectId.toString();
    await req.task.deleteOne();

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
