import express from 'express';
import * as chatService from '../services/chatService.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

router.get('/:room', requireAuth, async (req, res) => {
    try {
        const room = req.params.room;   
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const skip = (page - 1) * limit;
        const messages = await chatService.getRoomHistory(room, skip, limit);
        const total = await ChatMessage.countDocuments({ room });
        
        res.json({ messages, page, total, pages: Math.ceil(total / limit) });
    } catch (err) {
        console.error('[CHAT_API_ERROR]', err);
        res.status(500).json({ message: 'Failed to load chat history.' });
    }
});

export default router;