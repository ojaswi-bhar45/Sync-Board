const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { validate, schemas } = require("../middlewares/validate");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again in 15 minutes." },
});

router.use(authLimiter);

router.post("/signup", validate(schemas.signup), async (req, res, next) => {
  try {
    let { username, email, password } = req.body;

    let isUser = await User.findOne({ email });
    if (isUser) return res.status(409).json({ error: "User already exists" });

    let hashedPassword = await bcrypt.hash(password, 10);

    let user = await User.create({ username, email, password: hashedPassword });

    let token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.status(201).json({ message: "User registered successfully", token, user: userWithoutPassword });
  } catch (err) {
    next(err);
  }
});

router.post("/login", validate(schemas.login), async (req, res, next) => {
  try {
    let { email, password } = req.body;

    let user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    let isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid email or password" });

    let token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({ message: "User logged in successfully", token, user: userWithoutPassword });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
