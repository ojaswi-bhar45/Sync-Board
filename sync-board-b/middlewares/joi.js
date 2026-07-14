const Joi = require("joi");
const { error: sendError } = require("../utils/response");

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return sendError(res, "Validation failed", "VALIDATION_ERROR", 400, error.details.map(d => d.message));
    }
    req.body = value;
    next();
  };
}

const schemas = {
  signup: Joi.object({
    username: Joi.string().min(1).max(50).required().messages({
      "any.required": "Username is required",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Invalid email address",
    }),
    password: Joi.string().min(6).required().messages({
      "string.min": "Password must be at least 6 characters",
    }),
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Invalid email address",
    }),
    password: Joi.string().required().messages({
      "any.required": "Password is required",
    }),
  }),

  createProject: Joi.object({
    title: Joi.string().min(1).max(200).required().messages({
      "any.required": "Title is required",
    }),
    description: Joi.string().min(1).max(2000).required().messages({
      "any.required": "Description is required",
    }),
    note: Joi.string().max(2000).optional().allow("").default(""),
    techStack: Joi.alternatives()
      .try(Joi.string(), Joi.array().items(Joi.string()))
      .optional()
      .default([]),
    status: Joi.string()
      .valid("planning", "active", "completed")
      .optional()
      .default("planning"),
    isOpenForCollaboration: Joi.boolean().optional().default(true),
    lookingFor: Joi.array().items(Joi.string()).optional().default([]),
  }),

  editProject: Joi.object({
    title: Joi.string().min(1).max(200).optional(),
    description: Joi.string().min(1).max(2000).optional(),
    note: Joi.string().max(2000).optional().allow(""),
    status: Joi.string()
      .valid("planning", "active", "completed")
      .optional(),
    isOpenForCollaboration: Joi.boolean().optional(),
    lookingFor: Joi.array().items(Joi.string()).optional(),
  }),

  addDashboardProject: Joi.object({
    title: Joi.string().min(1).max(200).required().messages({
      "any.required": "Title is required",
    }),
    description: Joi.string().min(1).max(2000).required().messages({
      "any.required": "Description is required",
    }),
    note: Joi.string().max(2000).optional().allow("").default(""),
    status: Joi.string()
      .valid("planning", "active", "completed")
      .optional()
      .default("planning"),
    isOpenForCollaboration: Joi.boolean().optional().default(true),
    lookingFor: Joi.array().items(Joi.string()).optional().default([]),
  }),

  updateProjectSettings: Joi.object({
    status: Joi.string()
      .valid("planning", "active", "completed")
      .optional(),
    isOpenForCollaboration: Joi.boolean().optional(),
    lookingFor: Joi.array().items(Joi.string()).optional(),
  }),

  comment: Joi.object({
    text: Joi.string().min(1).max(1000).required().messages({
      "any.required": "Comment text is required",
    }),
  }),

  joinRequest: Joi.object({
    note: Joi.string().max(500).optional().allow("").default(""),
  }),

  updateRequest: Joi.object({
    status: Joi.string()
      .valid("accepted", "rejected")
      .required()
      .messages({ "any.only": 'Status must be "accepted" or "rejected"' }),
  }),

  progress: Joi.object({
    progress: Joi.number().min(0).max(100).required().messages({
      "any.required": "Progress is required",
      "number.min": "Progress must be at least 0",
      "number.max": "Progress must be at most 100",
    }),
  }),

  sendMessage: Joi.object({
    text: Joi.string().min(1).max(5000).required().messages({
      "any.required": "Message text is required",
    }),
  }),

  createCanvasElement: Joi.object({
    type: Joi.string().valid("sticky", "idea").optional().default("sticky"),
    color: Joi.string().optional().default("yellow"),
    top: Joi.number().optional(),
    left: Joi.number().optional(),
    rotation: Joi.number().optional(),
    title: Joi.string().max(500).optional().allow("").default(""),
    content: Joi.string().max(5000).optional().allow("").default(""),
    badge: Joi.string().max(100).optional().allow("").default(""),
    desc: Joi.string().max(2000).optional().allow("").default(""),
    progress: Joi.number().min(0).max(100).optional().default(0),
  }),

  updateCanvasElement: Joi.object({
    title: Joi.string().max(500).optional().allow(""),
    content: Joi.string().max(5000).optional().allow(""),
    color: Joi.string().optional(),
    top: Joi.number().optional(),
    left: Joi.number().optional(),
    rotation: Joi.number().optional(),
    badge: Joi.string().max(100).optional().allow(""),
    desc: Joi.string().max(2000).optional().allow(""),
    progress: Joi.number().min(0).max(100).optional(),
  }),

  updateProfile: Joi.object({
    username: Joi.string().min(1).max(50).optional(),
    contactNumber: Joi.string().max(20).optional().allow(null),
    address: Joi.string().max(500).optional().allow(null),
    linkedInProfile: Joi.string().max(500).optional().allow(null),
    githubProfile: Joi.string().max(500).optional().allow(null),
  }),
  createTask: Joi.object({
    projectId: Joi.string().hex().length(24).required(),
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(2000).optional().allow("").default(""),
    status: Joi.string()
      .valid("backlog", "todo", "progress", "review", "done")
      .optional()
      .default("backlog"),
    priority: Joi.string()
      .valid("low", "medium", "high", "urgent")
      .optional()
      .default("medium"),
    labels: Joi.array().items(Joi.string().trim().max(30)).optional().default([]),
    assignedTo: Joi.string().hex().length(24).optional().allow(null),
    dueDate: Joi.date().optional().allow(null),
  }),
  editTask: Joi.object({
    title: Joi.string().min(1).max(200).optional(),
    description: Joi.string().max(2000).optional().allow(""),
    priority: Joi.string()
      .valid("low", "medium", "high", "urgent")
      .optional(),
    labels: Joi.array().items(Joi.string().trim().max(30)).optional(),
    assignedTo: Joi.string().hex().length(24).optional().allow(null),
    dueDate: Joi.date().optional().allow(null),
  }),
  updateTaskStatus: Joi.object({
    status: Joi.string()
      .valid("backlog", "todo", "progress", "review", "done")
      .required(),
    order: Joi.number().required(),
  }),

  updatePermission: Joi.object({
    permission: Joi.string().valid("admin", "member").required(),
  }),

  updateTeamRole: Joi.object({
    teamRole: Joi.string()
      .valid("frontend", "backend", "fullstack", "uiux", "devops", "qa", "ml", "mobile", "other")
      .required(),
  }),

  inviteMember: Joi.object({
    identifier: Joi.string().min(1).max(100).required(),
  }),
};

module.exports = { validate, schemas };
