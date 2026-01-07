export default function selfOrAdmin(getTargetUserId) {
  return function (req, res, next) {
    const requester = req.user;
    if (!requester) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (requester.role === "admin") return next();

    const targetUserId = Number(getTargetUserId(req));
    if (!Number.isFinite(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({ message: "Invalid target user" });
    }

    if (Number(requester.userId) !== targetUserId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
}
