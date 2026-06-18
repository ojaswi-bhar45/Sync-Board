const { z } = require("zod");

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
    const first = result.error.issues[0];
    return res.status(400).json({ error: first.message });
    }
    req.body = result.data;
    next();
  };
}

const schemas = {
  signup: z.object({
    username: z.string().min(1, "Username is required").max(50),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),

  login: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),

  createProject: z.object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().min(1, "Description is required").max(2000),
    note: z.string().max(2000).optional().default(""),
    techStack: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .default([]),
  }),

  editProject: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(2000).optional(),
    note: z.string().max(2000).optional(),
  }),

  addDashboardProject: z.object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().min(1, "Description is required").max(2000),
    note: z.string().max(2000).optional().default(""),
  }),

  comment: z.object({
    text: z.string().min(1, "Comment text is required").max(1000),
  }),

  joinRequest: z.object({
    note: z.string().max(500).optional().default(""),
  }),

  updateRequest: z.object({
    status: z.enum(["accepted", "rejected"], {
      errorMap: () => ({ message: 'Status must be "accepted" or "rejected"' }),
    }),
  }),

  progress: z.object({
    progress: z
      .number({ required_error: "Progress is required" })
      .min(0, "Progress must be at least 0")
      .max(100, "Progress must be at most 100"),
  }),

  sendMessage: z.object({
    text: z.string().min(1, "Message text is required").max(5000),
  }),

  createCanvasElement: z.object({
    type: z.enum(["sticky", "idea"]).optional().default("sticky"),
    color: z.string().optional().default("yellow"),
    top: z.number().optional(),
    left: z.number().optional(),
    rotation: z.number().optional(),
    title: z.string().max(500).optional().default(""),
    content: z.string().max(5000).optional().default(""),
    badge: z.string().max(100).optional().default(""),
    desc: z.string().max(2000).optional().default(""),
    progress: z.number().min(0).max(100).optional().default(0),
  }),

  updateCanvasElement: z.object({
    title: z.string().max(500).optional(),
    content: z.string().max(5000).optional(),
    color: z.string().optional(),
    top: z.number().optional(),
    left: z.number().optional(),
    rotation: z.number().optional(),
    badge: z.string().max(100).optional(),
    desc: z.string().max(2000).optional(),
    progress: z.number().min(0).max(100).optional(),
  }),

  updateProfile: z.object({
    username: z.string().min(1).max(50).optional(),
    contactNumber: z.string().max(20).optional().nullable(),
    address: z.string().max(500).optional().nullable(),
    linkedInProfile: z.string().max(500).optional().nullable(),
    githubProfile: z.string().max(500).optional().nullable(),
  }),
};

module.exports = { validate, schemas };
