const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = require("express").Router();

router.post("/signup", async (req, res) => {
  try {
    let { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ error: "Please enter all the fields" });

    let isUser = await User.findOne({ email });
    if (isUser) return res.status(409).json({ error: "User already exists" });

    let hashedPassword = await bcrypt.hash(password, 10);

    let user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    let token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.status(201).json({ message: "User registered successfully", token, user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Please check your email and password" });

    let user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "User is not registered here" });

    let isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid password" });

    let token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({ message: "User logged in successfully", token, user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
