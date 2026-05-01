import express from 'express';
import * as chatService from '../services/chatService.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

router.get('/:room', requireAuth, async (req, res) => {
    try {
        const messages = await chatService.getRoomHistory(req.params.room);
        res.json(messages);
    } catch (err) {
        console.error('[CHAT_API_ERROR]', err);
        res.status(500).json({ message: 'Failed to load chat history.' });
    }
});

export default router;