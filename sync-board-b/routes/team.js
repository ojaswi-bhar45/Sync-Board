const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const Project = require("../models/Project");
const User = require("../models/User");
const { validate, schemas } = require("../middlewares/joi");
const { success, error } = require("../utils/response");
const {
  getMemberRecord,
  hasPermission,
  canManageMember,
} = require("../utils/permissions");

async function requireProjectAccess(req, res, next) {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return error(res, "Project not found", "NOT_FOUND", 404);

    const record = getMemberRecord(project, req.user._id);
    if (!record) {
      return error(res, "You are not a member of this project", "FORBIDDEN", 403);
    }

    req.project = project;
    req.userPermission = record.permission;
    next();
  } catch (err) {
    next(err);
  }
}

function requireMinPermission(minPermission) {
  return (req, res, next) => {
    if (!hasPermission(req.userPermission, minPermission)) {
      return error(res, "Insufficient permissions", "FORBIDDEN", 403);
    }
    next();
  };
}

router.get("/:projectId/members", auth, requireProjectAccess, async (req, res, next) => {
  try {
    const project = req.project;

    const ownerUser = await User.findById(project.userId).select("username email");
    const memberUserIds = project.members.map((m) => m.userId);
    const memberUsers = await User.find({ _id: { $in: memberUserIds } }).select("username email");

    const userMap = {};
    for (const u of memberUsers) {
      userMap[u._id.toString()] = u;
    }

    const members = project.members.map((m) => {
      const user = userMap[m.userId.toString()];
      return {
        user,
        permission: m.permission,
        teamRole: m.teamRole,
        joinedAt: m.joinedAt,
      };
    });

    const ownerInMembers = project.members.some(
      (m) => m.userId.toString() === project.userId.toString(),
    );

    if (!ownerInMembers) {
      members.unshift({
        user: ownerUser,
        permission: "owner",
        teamRole: null,
        joinedAt: project.timestamp,
      });
    } else {
      const ownerIdx = members.findIndex((m) => m.permission === "owner");
      if (ownerIdx > 0) {
        const [ownerMember] = members.splice(ownerIdx, 1);
        members.unshift(ownerMember);
      }
    }

    success(res, { members, userPermission: req.userPermission });
  } catch (err) {
    next(err);
  }
});

router.patch(
  "/:projectId/members/:userId/permission",
  auth,
  requireProjectAccess,
  requireMinPermission("owner"),
  validate(schemas.updatePermission),
  async (req, res, next) => {
    try {
      const project = req.project;
      const { permission } = req.body;
      const targetUserId = req.params.userId;

      if (targetUserId === req.user._id.toString()) {
        return error(res, "You cannot change your own permission", "BAD_REQUEST", 400);
      }

      if (project.userId.toString() === targetUserId) {
        return error(res, "Cannot change the owner's permission", "BAD_REQUEST", 400);
      }

      const member = project.members.find((m) => m.userId.toString() === targetUserId);
      if (!member) {
        return error(res, "Member not found", "NOT_FOUND", 404);
      }

      member.permission = permission;
      await project.save();

      success(res, { permission: member.permission }, "Permission updated");
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/:projectId/members/:userId/role",
  auth,
  requireProjectAccess,
  requireMinPermission("admin"),
  validate(schemas.updateTeamRole),
  async (req, res, next) => {
    try {
      const project = req.project;
      const { teamRole } = req.body;
      const targetUserId = req.params.userId;

      if (project.userId.toString() === targetUserId) {
        return error(res, "Cannot change the owner's role", "BAD_REQUEST", 400);
      }

      const member = project.members.find((m) => m.userId.toString() === targetUserId);
      if (!member) {
        return error(res, "Member not found", "NOT_FOUND", 404);
      }

      const actorRecord = getMemberRecord(project, req.user._id);
      const targetPermission = member.permission;

      if (!canManageMember(actorRecord.permission, targetPermission)) {
        return error(res, "Insufficient permissions to change this member's role", "FORBIDDEN", 403);
      }

      member.teamRole = teamRole;
      await project.save();

      success(res, { teamRole: member.teamRole }, "Team role updated");
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/:projectId/members/:userId/promote",
  auth,
  requireProjectAccess,
  requireMinPermission("owner"),
  async (req, res, next) => {
    try {
      const project = req.project;
      const targetUserId = req.params.userId;

      if (targetUserId === req.user._id.toString()) {
        return error(res, "You are already the owner", "BAD_REQUEST", 400);
      }

      const member = project.members.find((m) => m.userId.toString() === targetUserId);
      if (!member) {
        return error(res, "Member not found", "NOT_FOUND", 404);
      }

      if (member.permission === "admin") {
        return error(res, "Member is already an admin", "BAD_REQUEST", 400);
      }

      member.permission = "admin";
      await project.save();

      success(res, { permission: member.permission }, "Member promoted to admin");
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/:projectId/members/:userId/demote",
  auth,
  requireProjectAccess,
  requireMinPermission("owner"),
  async (req, res, next) => {
    try {
      const project = req.project;
      const targetUserId = req.params.userId;

      if (targetUserId === req.user._id.toString()) {
        return error(res, "Cannot demote yourself", "BAD_REQUEST", 400);
      }

      const member = project.members.find((m) => m.userId.toString() === targetUserId);
      if (!member) {
        return error(res, "Member not found", "NOT_FOUND", 404);
      }

      if (member.permission === "member") {
        return error(res, "Member is already at the lowest level", "BAD_REQUEST", 400);
      }

      member.permission = "member";
      await project.save();

      success(res, { permission: member.permission }, "Admin demoted to member");
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/:projectId/members/:userId",
  auth,
  requireProjectAccess,
  requireMinPermission("admin"),
  async (req, res, next) => {
    try {
      const project = req.project;
      const targetUserId = req.params.userId;

      if (targetUserId === req.user._id.toString()) {
        return error(res, "Cannot remove yourself", "BAD_REQUEST", 400);
      }

      if (project.userId.toString() === targetUserId) {
        return error(res, "Cannot remove the owner", "BAD_REQUEST", 400);
      }

      const memberIndex = project.members.findIndex(
        (m) => m.userId.toString() === targetUserId,
      );
      if (memberIndex === -1) {
        return error(res, "Member not found", "NOT_FOUND", 404);
      }

      const actorRecord = getMemberRecord(project, req.user._id);
      const targetPermission = project.members[memberIndex].permission;

      if (!canManageMember(actorRecord.permission, targetPermission)) {
        return error(res, "Insufficient permissions to remove this member", "FORBIDDEN", 403);
      }

      project.members.splice(memberIndex, 1);
      await project.save();

      success(res, null, "Member removed");
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/:projectId/invite",
  auth,
  requireProjectAccess,
  requireMinPermission("admin"),
  validate(schemas.inviteMember),
  async (req, res, next) => {
    try {
      const project = req.project;
      const { identifier } = req.body;

      const targetUser = await User.findOne({
        $or: [{ email: identifier }, { username: identifier }],
      });

      if (!targetUser) {
        return error(res, "User not found", "NOT_FOUND", 404);
      }

      if (project.userId.toString() === targetUser._id.toString()) {
        return error(res, "User is the project owner", "BAD_REQUEST", 400);
      }

      const isAlreadyMember = project.members.some(
        (m) => m.userId.toString() === targetUser._id.toString(),
      );
      if (isAlreadyMember) {
        return error(res, "User is already a member", "BAD_REQUEST", 400);
      }

      const hasPendingRequest = project.joinRequest.some(
        (r) => r.user.toString() === targetUser._id.toString() && r.status === "pending",
      );
      if (hasPendingRequest) {
        return error(res, "User already has a pending request", "BAD_REQUEST", 400);
      }

      project.members.push({
        userId: targetUser._id,
        permission: "member",
        teamRole: "other",
        joinedAt: new Date(),
      });

      await project.save();

      success(res, null, "Member invited", 201);
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
