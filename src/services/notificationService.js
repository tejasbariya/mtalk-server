import Notification from '../models/Notification.js';

export const createNotification = async (userId, type, message, link = null) => {
    return await Notification.create({
        user: userId,
        type,
        message,
        link,
        read: false
    });
};

export const getUserNotifications = async (userId, skip = 0, limit = 20) => {
    return await Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};

export const countNotifications = async (userId) => {
    return await Notification.countDocuments({ user: userId });
};

export const markAsRead = async (notifId, userId) => {
    const notif = await Notification.findById(notifId);
    if (!notif || notif.user.toString() !== userId) {
        throw { status: 403, message: 'Unauthorized' };
    }
    
    notif.read = true;
    await notif.save();
    return notif;
};

export const markAllAsRead = async (userId) => {
    await Notification.updateMany(
        { user: userId, read: false },
        { read: true }
    );
};