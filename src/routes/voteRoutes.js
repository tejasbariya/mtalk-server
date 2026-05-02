import express from 'express';
import * as voteService from '../services/voteService.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

// Upvote review
router.post('/review/:reviewId/upvote', requireAuth, async (req, res) => {
    try {
        const review = await voteService.upvoteReview(req.params.reviewId, req.user.id);
        res.json(review);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
});

// Downvote review
router.post('/review/:reviewId/downvote', requireAuth, async (req, res) => {
    try {
        const review = await voteService.downvoteReview(req.params.reviewId, req.user.id);
        res.json(review);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
});

export default router;