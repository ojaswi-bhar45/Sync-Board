const User = require("../models/User");
const auth = require("../middlewares/auth");
const router = require("express").Router();

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error });
  }
});

router.patch("/edit", auth, async (req, res) => {
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
    res.status(500).json({ message: "Error updating profile", error });
  }
});

module.exports = router;




