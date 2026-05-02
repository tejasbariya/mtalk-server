import express from 'express';
import * as notificationService from '../services/notificationService.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

// Get user notifications
router.get('/', requireAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        
        const notifications = await notificationService.getUserNotifications(req.user.id, skip, limit);
        const total = await notificationService.countNotifications(req.user.id);
        
        res.json({
            notifications,
            page,
            total,
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching notifications' });
    }
});

// Mark notification as read
router.post('/:notifId/read', requireAuth, async (req, res) => {
    try {
        const notif = await notificationService.markAsRead(req.params.notifId, req.user.id);
        res.json(notif);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
});

// Mark all as read
router.post('/read-all', requireAuth, async (req, res) => {
    try {
        await notificationService.markAllAsRead(req.user.id);
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ message: 'Error updating notifications' });
    }
});

export default router;