const Project = require("../models/Project");
const auth = require("../middlewares/auth");
const router = require("express").Router();
const { validate, schemas } = require("../middlewares/joi");

const TAG_FILTERS = {
  ai: [/ai/i, /machine learning/i, /llm/i, /deep learning/i, /neural/i, /gpt/i, /chatgpt/i, /tensorflow/i, /pytorch/i],
  webdev: [/react/i, /next/i, /vue/i, /node/i, /tailwind/i, /javascript/i, /typescript/i, /css/i, /html/i, /angular/i, /svelte/i, /express/i, /django/i, /flask/i],
};

function buildFilter(query) {
  const filter = { visibility: "public" };

  const tag = query.tag;
  if (tag && TAG_FILTERS[tag]) {
    filter.techStack = { $in: TAG_FILTERS[tag] };
  }

  const search = query.search;
  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [{ title: regex }, { description: regex }];
  }

  return filter;
}

function buildSort(query) {
  return query.sort === "trending" ? { likesCount: -1, timestamp: -1 } : { timestamp: -1 };
}

router.get("/feed", async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const skip = (page - 1) * limit;
    const filter = buildFilter(req.query);
    const sort = buildSort(req.query);

    const [projects, total] = await Promise.all([
      Project.aggregate([
        { $match: filter },
        { $addFields: { likesCount: { $size: { $ifNull: ["$likes", []] } } } },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userId",
          },
        },
        { $unwind: { path: "$userId", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "users",
            localField: "comments.user",
            foreignField: "_id",
            as: "commentUsers",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "members",
            foreignField: "_id",
            as: "memberUsers",
          },
        },
        {
          $addFields: {
            comments: {
              $map: {
                input: "$comments",
                as: "c",
                in: {
                  _id: "$$c._id",
                  text: "$$c.text",
                  createdAt: "$$c.createdAt",
                  user: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$commentUsers",
                          as: "cu",
                          cond: { $eq: ["$$cu._id", "$$c.user"] },
                        },
                      },
                      0,
                    ],
                  },
                },
              },
            },
            members: "$memberUsers",
          },
        },
        {
          $project: {
            commentUsers: 0,
            memberUsers: 0,
            likesCount: 0,
          },
        },
      ]),
      Project.countDocuments(filter),
    ]);

    res.json({
      projects,
      page,
      totalPages: Math.ceil(total / limit),
      total,
      hasMore: page * limit < total,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/create", auth, validate(schemas.createProject), async (req, res, next) => {
  try {
    let { title, description, techStack, note } = req.body;

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
    next(error);
  }
});

router.put("/like/:id", auth, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project)
      return res.status(404).json({ error: "Project not found" });

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
    next(error);
  }
});

router.post("/comment/:id", auth, validate(schemas.comment), async (req, res, next) => {
  try {
    const { text } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project)
      return res.status(404).json({ error: "Project not found" });

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
    next(error);
  }
});

router.post("/request/:id", auth, validate(schemas.joinRequest), async (req, res, next) => {
  try {
    const { note } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project)
      return res.status(404).json({ error: "Project not found" });

    if (project.userId.toString() === req.user._id.toString())
      return res.status(400).json({ error: "You cannot request to join your own project" });

    const alreadyRequested = project.joinRequest.some(
      (r) => r.user.toString() === req.user._id.toString(),
    );
    if (alreadyRequested)
      return res.status(400).json({ error: "Already requested to join" });

    const isMember = project.members.some(
      (m) => m.toString() === req.user._id.toString(),
    );
    if (isMember)
      return res.status(400).json({ error: "You are already a member" });

    project.joinRequest.push({
      user: req.user._id,
      note: note || "",
      status: "pending",
      createdAt: new Date(),
    });

    await project.save();
    res.status(201).json({ message: "Collaboration request sent" });
  } catch (error) {
    next(error);
  }
});

router.get("/incoming-requests", auth, async (req, res, next) => {
  try {
    const projects = await Project.find({
      userId: req.user._id,
      "joinRequest.status": "pending",
    }).populate("joinRequest.user", "username email");

    const incoming = [];
    for (const project of projects) {
      for (const r of project.joinRequest) {
        if (r.status === "pending") {
          incoming.push({
            requestId: r._id,
            projectId: project._id,
            projectTitle: project.title,
            projectStatus: project.status,
            user: r.user,
            note: r.note,
            status: r.status,
            createdAt: r.createdAt,
          });
        }
      }
    }

    res.json({ incoming });
  } catch (error) {
    next(error);
  }
});

router.get("/my-requests", auth, async (req, res, next) => {
  try {
    const projects = await Project.find({
      "joinRequest.user": req.user._id,
    }).populate("userId", "username email");

    const outgoing = [];
    for (const project of projects) {
      const myRequest = project.joinRequest.find(
        (r) => r.user.toString() === req.user._id.toString(),
      );
      if (myRequest) {
        outgoing.push({
          requestId: myRequest._id,
          projectId: project._id,
          projectTitle: project.title,
          projectStatus: project.status,
          owner: project.userId,
          note: myRequest.note,
          status: myRequest.status,
          createdAt: myRequest.createdAt,
        });
      }
    }

    res.json({ outgoing });
  } catch (error) {
    next(error);
  }
});

router.put("/request/:projectId/:requestId", auth, validate(schemas.updateRequest), async (req, res, next) => {
  try {
    const { status } = req.body;

    const project = await Project.findOne({
      _id: req.params.projectId,
      userId: req.user._id,
    });
    if (!project)
      return res.status(404).json({ error: "Project not found" });

    const request = project.joinRequest.id(req.params.requestId);
    if (!request)
      return res.status(404).json({ error: "Request not found" });

    request.status = status;

    if (status === "accepted") {
      const isAlreadyMember = project.members.some(
        (m) => m.toString() === request.user.toString(),
      );
      if (!isAlreadyMember) {
        project.members.push(request.user);
      }
    }

    await project.save();
    res.json({ message: `Request ${status}` });
  } catch (error) {
    next(error);
  }
});

router.get("/my-teams", auth, async (req, res, next) => {
  try {
    const projects = await Project.find({
      $or: [
        { userId: req.user._id },
        { members: req.user._id },
      ],
    }).populate("userId", "username email")
      .populate("members", "username");

    res.json({ teams: projects });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/members/:userId", auth, async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!project)
      return res.status(404).json({ error: "Project not found" });

    if (req.params.userId === req.user._id.toString())
      return res.status(400).json({ error: "Cannot remove yourself as owner" });

    const idx = project.members.indexOf(req.params.userId);
    if (idx === -1)
      return res.status(404).json({ error: "Member not found" });

    project.members.splice(idx, 1);
    await project.save();

    res.json({ message: "Member removed", members: project.members });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
