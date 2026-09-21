import Notification from "../models/Notification.js";
export const listNotifications = async (req, res) =>
  res.json({
    success: true,
    data: await Notification.find({ user: req.user.userId }).sort({ createdAt: -1 }).limit(50),
  });
export const readNotification = async (req, res) => {
  const notice = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user.userId },
    { read: true },
    { new: true }
  );
  if (!notice) return res.status(404).json({ success: false, message: "Notification not found" });
  res.json({ success: true, data: notice });
};
