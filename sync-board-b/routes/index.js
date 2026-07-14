const router = require("express").Router();

router.use("/auth", require("./authRoutes"));
router.use("/projects", require("./project"));
router.use("/projects", require("./feed"));
router.use("/chat", require("./chat"));
router.use("/canvas", require("./canvas"));
router.use("/tasks", require("./tasks"));
router.use("/profile", require("./profile"));

module.exports = router;
