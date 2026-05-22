const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = require("express").Router();

//Register
router.post("/signup", async (req, res) => {
  try {
    let { name, email, password } = req.body;

    let isUser = await User.findOne({ email });
    if (isUser) return res.json({ message: "User is already exits" });

    if (!name || !email || !password)
      return res.json({ message: "Please enter all the fields" });

    //hashed password

    let hashedPassword = await bcrypt.hash(password, 10);

    //create user
    let user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.json({ message: "User regiestered successfully", user });
  } catch (err) {
    res.json({ message: err.message });
  }
});

//Login

router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password)
      return res.json({ message: "Please check your email and password " });

    let user = await User.findOne({ email });
    if (!user) return res.json({ message: "User is not registered here" });

    let isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ message: "Invalid password" });

    //generate token after verifying the user password

    let token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.json({ message: "User logged in successfully", token, user });
  } catch (err) {
    res.json({ message: err.message });
  }
});


module.exports = router;