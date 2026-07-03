const User = require("../models/User");
const auth = require("../middlewares/auth");
const router = require("express").Router();
const { validate, schemas } = require("../middlewares/joi");
const { success } = require("../utils/response");

router.get("/", auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    success(res, { user });
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
    success(res, { user: updatedProfile }, "Profile updated successfully");
  } catch (error) {
    next(error);
  }
});

module.exports = router;
