const mongoose = require("mongoose");
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
    let projects = await Project.find({ userId: req.user._id }).sort({ timestamp: -1 });
    res.json(projects);
  } catch (error) {
    res.json({ message: error.message });
  }
});

module.exports = router;
