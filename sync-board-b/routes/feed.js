const Project = require("../models/Project");
const auth = require("../middlewares/auth");
const router = require("express").Router();
const { validate, schemas } = require("../middlewares/joi");
const { success, error } = require("../utils/response");
const { getMemberRecord } = require("../utils/permissions");

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

  if (query.status) {
    filter.status = query.status;
  }

  if (query.open === "true") {
    filter.isOpenForCollaboration = true;
  } else if (query.open === "false") {
    filter.isOpenForCollaboration = false;
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
            localField: "members.userId",
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
            members: {
              $map: {
                input: "$members",
                as: "m",
                in: {
                  userId: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$memberUsers",
                          as: "mu",
                          cond: { $eq: ["$$mu._id", "$$m.userId"] },
                        },
                      },
                      0,
                    ],
                  },
                  permission: "$$m.permission",
                  teamRole: "$$m.teamRole",
                  joinedAt: "$$m.joinedAt",
                },
              },
            },
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

    success(res, {
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
    let { title, description, techStack, note, status, isOpenForCollaboration, lookingFor } = req.body;

    if (typeof techStack === "string") {
      techStack = techStack.split(",").map((s) => s.trim()).filter(Boolean);
    }

    const project = await Project.create({
      title,
      description,
      note,
      techStack: techStack || [],
      userId: req.user._id,
      status: status || "planning",
      isOpenForCollaboration: isOpenForCollaboration !== undefined ? isOpenForCollaboration : true,
      lookingFor: lookingFor || [],
    });

    const populated = await project.populate("userId", "username email");
    success(res, populated, "Project created", 201);
  } catch (error) {
    next(error);
  }
});

router.put("/like/:id", auth, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project)
      return error(res, "Project not found", "NOT_FOUND", 404);

    const userId = req.user._id;
    const index = project.likes.indexOf(userId);

    if (index === -1) {
      project.likes.push(userId);
    } else {
      project.likes.splice(index, 1);
    }

    await project.save();
    success(res, { likes: project.likes, likesCount: project.likes.length });
  } catch (error) {
    next(error);
  }
});

router.post("/comment/:id", auth, validate(schemas.comment), async (req, res, next) => {
  try {
    const { text } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project)
      return error(res, "Project not found", "NOT_FOUND", 404);

    project.comments.push({
      user: req.user._id,
      text,
      createdAt: new Date(),
    });

    await project.save();

    const updated = await Project.findById(req.params.id)
      .populate("comments.user", "username email");

    success(res, { comments: updated.comments }, "Comment added", 201);
  } catch (error) {
    next(error);
  }
});

router.post("/request/:id", auth, validate(schemas.joinRequest), async (req, res, next) => {
  try {
    const { note } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project)
      return error(res, "Project not found", "NOT_FOUND", 404);

    if (project.status === "completed")
      return error(res, "This project is completed and no longer accepting members", "PROJECT_COMPLETED", 400);

    if (project.isOpenForCollaboration === false)
      return error(res, "This project is not accepting collaborators", "COLLABORATION_CLOSED", 400);

    if (project.userId.toString() === req.user._id.toString())
      return error(res, "You cannot request to join your own project", "SELF_REQUEST", 400);

    const alreadyRequested = project.joinRequest.some(
      (r) => r.user.toString() === req.user._id.toString(),
    );
    if (alreadyRequested)
      return error(res, "Already requested to join", "DUPLICATE_REQUEST", 400);

    const isMember = project.members.some(
      (m) => m.userId.toString() === req.user._id.toString(),
    );
    if (isMember)
      return error(res, "You are already a member", "ALREADY_MEMBER", 400);

    project.joinRequest.push({
      user: req.user._id,
      note: note || "",
      status: "pending",
      createdAt: new Date(),
    });

    await project.save();
    success(res, null, "Collaboration request sent", 201);
  } catch (error) {
    next(error);
  }
});

router.get("/incoming-requests", auth, async (req, res, next) => {
  try {
    const projects = await Project.find({
      $or: [
        { userId: req.user._id },
        { "members.userId": req.user._id, "members.permission": "admin" },
      ],
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

    success(res, { incoming });
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

    success(res, { outgoing });
  } catch (error) {
    next(error);
  }
});

router.put("/request/:projectId/:requestId", auth, validate(schemas.updateRequest), async (req, res, next) => {
  try {
    const { status } = req.body;

    const project = await Project.findById(req.params.projectId);
    if (!project)
      return error(res, "Project not found", "NOT_FOUND", 404);

    const record = getMemberRecord(project, req.user._id);
    if (!record || (record.permission !== "owner" && record.permission !== "admin")) {
      return error(res, "Only the owner or admin can manage requests", "FORBIDDEN", 403);
    }

    const request = project.joinRequest.id(req.params.requestId);
    if (!request)
      return error(res, "Request not found", "NOT_FOUND", 404);

    request.status = status;

    if (status === "accepted") {
      const isAlreadyMember = project.members.some(
        (m) => m.userId.toString() === request.user.toString(),
      );
      if (!isAlreadyMember) {
        project.members.push({
          userId: request.user,
          permission: "member",
          teamRole: "other",
          joinedAt: new Date(),
        });
      }
    }

    await project.save();
    success(res, null, `Request ${status}`);
  } catch (error) {
    next(error);
  }
});

router.get("/my-teams", auth, async (req, res, next) => {
  try {
    const projects = await Project.find({
      $or: [
        { userId: req.user._id },
        { "members.userId": req.user._id },
      ],
    }).populate("userId", "username email").populate("members.userId", "username email");

    const teams = projects.map((project) => {
      const record = getMemberRecord(project, req.user._id);
      return {
        _id: project._id,
        title: project.title,
        description: project.description,
        userId: project.userId,
        techStack: project.techStack,
        status: project.status,
        timestamp: project.timestamp,
        members: project.members,
        userPermission: record?.permission || "member",
      };
    });

    success(res, { teams });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
