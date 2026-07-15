const PERMISSION_LEVELS = {
  owner: { level: 3, label: "Owner" },
  admin: { level: 2, label: "Admin" },
  member: { level: 1, label: "Member" },
};

const TEAM_ROLES = {
  frontend: "Frontend Developer",
  backend: "Backend Developer",
  fullstack: "Full Stack Developer",
  uiux: "UI/UX Designer",
  devops: "DevOps Engineer",
  qa: "QA Engineer",
  ml: "ML Engineer",
  mobile: "Mobile Developer",
  other: "Other",
};

function toIdString(value) {
  if (!value) return null;
  if (value._id) return value._id.toString();
  return value.toString();
}

function getMemberRecord(project, userId) {
  const uid = userId.toString();

  if (toIdString(project.userId) === uid) {
    return { permission: "owner", teamRole: null, joinedAt: project.timestamp };
  }

  const member = project.members.find((m) => toIdString(m.userId) === uid);
  if (!member) return null;

  return {
    permission: member.permission,
    teamRole: member.teamRole,
    joinedAt: member.joinedAt,
  };
}

function getPermissionLevel(permission) {
  return PERMISSION_LEVELS[permission]?.level || 0;
}

function hasPermission(userPermission, requiredPermission) {
  return getPermissionLevel(userPermission) >= getPermissionLevel(requiredPermission);
}

function canManageMember(actorPermission, targetPermission) {
  if (actorPermission === "owner") return true;
  if (actorPermission === "admin" && targetPermission === "member") return true;
  return false;
}

module.exports = {
  PERMISSION_LEVELS,
  TEAM_ROLES,
  getMemberRecord,
  getPermissionLevel,
  hasPermission,
  canManageMember,
};
