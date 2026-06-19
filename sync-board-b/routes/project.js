const Project = require("../models/Project");
const auth = require("../middlewares/auth");
const router = require("express").Router();
const { validate, schemas } = require("../middlewares/joi");

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
    res.status(201).json(newProject);
  } catch (error) {
    next(error);
  }
});

router.get("/project", auth, async (req, res, next) => {
  try {
    let projects = await Project.find({ userId: req.user._id }).sort({
      timestamp: -1,
    });
    res.json(projects);
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
      return res.status(404).json({ error: "Project not found" });
    res.json(project);
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
      return res.status(404).json({ error: "Project not found" });
    res.json({ message: "Project deleted" });
  } catch (error) {
    next(error);
  }
});

router.patch("/pin/:id", auth, async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
    if (!project)
      return res.status(404).json({ error: "Project not found" });
    project.pinned = !project.pinned;
    await project.save();
    res.json({ pinned: project.pinned, _id: project._id });
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
      return res.status(404).json({ error: "Project not found" });
    res.json({ progress: project.progress, _id: project._id });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
