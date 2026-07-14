const Project = require("../models/Project");
const auth = require("../middlewares/auth");
const router = require("express").Router();
const { validate, schemas } = require("../middlewares/joi");
const { success, error } = require("../utils/response");
const { getMemberRecord } = require("../utils/permissions");

router.patch("/settings/:id", auth, validate(schemas.updateProjectSettings), async (req, res, next) => {
  const { status, isOpenForCollaboration, lookingFor } = req.body;
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return error(res, "Project not found", "NOT_FOUND", 404);

    const record = getMemberRecord(project, req.user._id);
    if (!record || (record.permission !== "owner" && record.permission !== "admin")) {
      return error(res, "Only the owner or admin can update settings", "FORBIDDEN", 403);
    }

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (isOpenForCollaboration !== undefined) updates.isOpenForCollaboration = isOpenForCollaboration;
    if (lookingFor !== undefined) updates.lookingFor = lookingFor;

    const updated = await Project.findByIdAndUpdate(req.params.id, updates, { new: true });
    success(res, updated, "Project settings updated");
  } catch (error) {
    next(error);
  }
});

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
  if (req.body.status !== undefined) updates.status = req.body.status;
  if (req.body.isOpenForCollaboration !== undefined) updates.isOpenForCollaboration = req.body.isOpenForCollaboration;
  if (req.body.lookingFor !== undefined) updates.lookingFor = req.body.lookingFor;
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
