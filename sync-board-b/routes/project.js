const Project = require("../models/Project");
const auth = require("../middlewares/auth");
const router = require("express").Router();
const { validate, schemas } = require("../middlewares/joi");
const { success, error } = require("../utils/response");

router.post("/add-projects", auth, validate(schemas.addDashboardProject), async (req, res, next) => {
  let { title, description, note } = req.body;
  try {
    const newProject = new Project({
      title,
      description,
      note,
      userId: req.user._id,
    });
    await newProject.save();
    success(res, newProject, "Project created", 201);
  } catch (error) {
    next(error);
  }
});

router.get("/project", auth, async (req, res, next) => {
  try {
    let projects = await Project.find({ userId: req.user._id }).sort({
      timestamp: -1,
    });
    success(res, projects);
  } catch (error) {
    next(error);
  }
});

router.patch("/edit-project/:id", auth, validate(schemas.editProject), async (req, res, next) => {
  let updates = {};
  if (req.body.title !== undefined) updates.title = req.body.title;
  if (req.body.description !== undefined) updates.description = req.body.description;
  if (req.body.note !== undefined) updates.note = req.body.note;
  try {
    let project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updates,
      { new: true },
    );
    if (!project)
      return error(res, "Project not found", "NOT_FOUND", 404);
    success(res, project, "Project updated");
  } catch (error) {
    next(error);
  }
});

router.delete("/delete/:id", auth, async (req, res, next) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!project)
      return error(res, "Project not found", "NOT_FOUND", 404);
    success(res, null, "Project deleted");
  } catch (error) {
    next(error);
  }
});

router.patch("/pin/:id", auth, async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
    if (!project)
      return error(res, "Project not found", "NOT_FOUND", 404);
    project.pinned = !project.pinned;
    await project.save();
    success(res, { pinned: project.pinned, _id: project._id });
  } catch (error) {
    next(error);
  }
});

router.patch("/progress/:id", auth, validate(schemas.progress), async (req, res, next) => {
  try {
    const { progress } = req.body;
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { progress },
      { new: true },
    );
    if (!project)
      return error(res, "Project not found", "NOT_FOUND", 404);
    success(res, { progress: project.progress, _id: project._id });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
