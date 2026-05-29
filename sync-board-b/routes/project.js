const Project = require("../models/Project");
const auth = require("../middlewares/auth");
const router = require("express").Router();

router.post("/add-projects", auth, async (req, res) => {
  let { title, description, note } = req.body;
  try {
    const newProject = new Project({
      title,
      description,
      note,
      userId: req.user._id,
    });
    await newProject.save();
    res.json(newProject);
  } catch (error) {
    res.json({ message: error.message });
  }
});

router.get("/project", auth, async (req, res) => {
  try {
    let projects = await Project.find({ userId: req.user._id }).sort({
      timestamp: -1,
    });
    res.json(projects);
  } catch (error) {
    res.json({ message: error.message });
  }
});

router.patch("/edit-project/:id", auth, async (req, res) => {
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
      return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;
