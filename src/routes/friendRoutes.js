import express from 'express';
import * as friendService from '../services/friendService.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

// Send friend request
router.post('/request/:receiverId', requireAuth, async (req, res) => {
    try {
        const request = await friendService.sendFriendRequest(req.user.id, req.params.receiverId);
        res.json(request);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
});

// Accept friend request
router.post('/accept/:requestId', requireAuth, async (req, res) => {
    try {
        const friendship = await friendService.acceptFriendRequest(req.params.requestId, req.user.id);
        res.json(friendship);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
});

// Decline friend request
router.post('/decline/:requestId', requireAuth, async (req, res) => {
    try {
        await friendService.declineFriendRequest(req.params.requestId, req.user.id);
        res.json({ message: 'Friend request declined' });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
});

// Get pending requests
router.get('/pending', requireAuth, async (req, res) => {
    try {
        const requests = await friendService.getPendingRequests(req.user.id);
        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching requests' });
    }
});

// Get friends list
router.get('/list', requireAuth, async (req, res) => {
    try {
        const friends = await friendService.getFriendsList(req.user.id);
        res.json(friends);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching friends' });
    }
});

export default router;