const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { validate, schemas } = require("../middlewares/joi");
const { success, error } = require("../utils/response");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again in 15 minutes.", code: "RATE_LIMITED" },
});

router.use(authLimiter);

router.post("/signup", validate(schemas.signup), async (req, res, next) => {
  try {
    let { username, email, password } = req.body;

    let isUser = await User.findOne({ email });
    if (isUser) return error(res, "User already exists", "DUPLICATE_EMAIL", 409);

    let hashedPassword = await bcrypt.hash(password, 10);

    let user = await User.create({ username, email, password: hashedPassword });

    let token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const { password: _, ...userWithoutPassword } = user.toObject();
    success(res, { token, user: userWithoutPassword }, "User registered successfully", 201);
  } catch (err) {
    next(err);
  }
});

router.post("/login", validate(schemas.login), async (req, res, next) => {
  try {
    let { email, password } = req.body;

    let user = await User.findOne({ email });
    if (!user) return error(res, "Invalid email or password", "INVALID_CREDENTIALS", 401);

    let isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return error(res, "Invalid email or password", "INVALID_CREDENTIALS", 401);

    let token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const { password: _, ...userWithoutPassword } = user.toObject();
    success(res, { token, user: userWithoutPassword }, "User logged in successfully");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
