import Notification from '../models/notificationModel.js';

// Get all notifications for the logged-in user
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 }) // Newest first
      .limit(20); // Only fetch the latest 20 to save bandwidth
    
    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.status(200).json({ success: true, notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Mark a specific notification (or all) as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.body;
    
    if (notificationId) {
       await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    } else {
       // Mark all as read
       await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};