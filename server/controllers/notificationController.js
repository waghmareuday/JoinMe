import Notification from '../models/notificationModel.js';

// Get all notifications for the logged-in user (paginated)
export const getMyNotifications = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user.id })
        .populate('sender', 'name')
        .populate('relatedEvent', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ recipient: req.user.id }),
      Notification.countDocuments({ recipient: req.user.id, isRead: false }),
    ]);

    res.status(200).json({ 
      success: true, 
      notifications, 
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Mark a specific notification (or all) as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.body;
    
    if (notificationId) {
       await Notification.findOneAndUpdate(
         { _id: notificationId, recipient: req.user.id },
         { isRead: true }
       );
    } else {
       await Notification.updateMany(
         { recipient: req.user.id, isRead: false },
         { isRead: true }
       );
    }

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete old read notifications
export const clearReadNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user.id, isRead: true });
    res.status(200).json({ success: true, message: 'Read notifications cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};