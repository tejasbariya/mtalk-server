import express from 'express';
import * as profileService from '../services/profileService.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

// Get public user profile
router.get('/:userId', async (req, res) => {
    try {
        const user = await profileService.getUserProfile(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const reviews = await profileService.getUserReviews(req.params.userId);
        const libraryStats = await profileService.getUserLibraryStats(req.params.userId);
        const isFriend = req.user 
            ? await profileService.checkFriendship(req.user.id, req.params.userId)
            : false;
        
        res.json({
            user,
            reviews,
            libraryStats,
            isFriend
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

// Get current user's profile (protected)
router.get('/me/profile', requireAuth, async (req, res) => {
    try {
        const user = await profileService.getUserProfile(req.user.id);
        const stats = await profileService.getUserStats(req.user.id);
        
        res.json({ user, stats });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

export default router;