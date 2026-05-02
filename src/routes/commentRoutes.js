import express from 'express';
import * as commentService from '../services/commentService.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

// Add comment to review
router.post('/review/:reviewId', requireAuth, async (req, res) => {
    try {
        const { content } = req.body;
        const comment = await commentService.createCommentOnReview(
            req.user.id,
            req.params.reviewId,
            content
        );
        res.json(comment);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
});

// Get comments for review
router.get('/review/:reviewId', async (req, res) => {
    try {
        const comments = await commentService.getCommentsForReview(req.params.reviewId);
        res.json(comments);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching comments' });
    }
});

// Upvote comment
router.post('/:commentId/upvote', requireAuth, async (req, res) => {
    try {
        const comment = await commentService.upvoteComment(req.params.commentId, req.user.id);
        res.json(comment);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
});

// Downvote comment
router.post('/:commentId/downvote', requireAuth, async (req, res) => {
    try {
        const comment = await commentService.downvoteComment(req.params.commentId, req.user.id);
        res.json(comment);
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
});

export default router;