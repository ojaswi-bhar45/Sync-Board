const User = require("../models/User");
const auth = require("../middlewares/auth");
const router = require("express").Router();
const { validate, schemas } = require("../middlewares/joi");

router.get("/", auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

router.patch("/edit", auth, validate(schemas.updateProfile), async (req, res, next) => {
  let { username, contactNumber, address, linkedInProfile, githubProfile } =
    req.body;
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      { username, contactNumber, address, linkedInProfile, githubProfile },
      { returnDocument: "after" },
    );
    let updatedProfile = await User.findById(req.user._id).select("-password");
    res.json({ message: "Profile updated successfully", user: updatedProfile });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
