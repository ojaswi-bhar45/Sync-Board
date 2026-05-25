const Project = require("../models/Project");
const auth = require("../middlewares/auth");
const router = require("express").Router();

router.get("/feed", async (req, res) => {
  try {
    const projects = await Project.find({ visibility: "public" })
      .populate("userId", "username email")
      .populate("comments.user", "username email")
      .sort({ timestamp: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/create", auth, async (req, res) => {
  try {
    let { title, description, techStack, note } = req.body;
    if (!title || !description)
      return res.status(400).json({ message: "Title and description are required" });

    if (typeof techStack === "string") {
      techStack = techStack.split(",").map((s) => s.trim()).filter(Boolean);
    }

    const project = await Project.create({
      title,
      description,
      note,
      techStack: techStack || [],
      userId: req.user._id,
    });

    const populated = await project.populate("userId", "username email");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/like/:id", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project)
      return res.status(404).json({ message: "Project not found" });

    const userId = req.user._id;
    const index = project.likes.indexOf(userId);

    if (index === -1) {
      project.likes.push(userId);
    } else {
      project.likes.splice(index, 1);
    }

    await project.save();
    res.json({ likes: project.likes, likesCount: project.likes.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/comment/:id", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text)
      return res.status(400).json({ message: "Comment text is required" });

    const project = await Project.findById(req.params.id);
    if (!project)
      return res.status(404).json({ message: "Project not found" });

    project.comments.push({
      user: req.user._id,
      text,
      createdAt: new Date(),
    });

    await project.save();

    const updated = await Project.findById(req.params.id)
      .populate("comments.user", "username email");

    res.status(201).json({ comments: updated.comments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/request/:id", auth, async (req, res) => {
  try {
    const { note } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project)
      return res.status(404).json({ message: "Project not found" });

    const alreadyRequested = project.joinRequest.some(
      (r) => r.user.toString() === req.user._id.toString(),
    );
    if (alreadyRequested)
      return res.status(400).json({ message: "Already requested to join" });

    const isMember = project.members.some(
      (m) => m.toString() === req.user._id.toString(),
    );
    if (isMember)
      return res.status(400).json({ message: "You are already a member" });

    project.joinRequest.push({
      user: req.user._id,
      note: note || "",
      status: "pending",
      createdAt: new Date(),
    });

    await project.save();
    res.status(201).json({ message: "Collaboration request sent" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
