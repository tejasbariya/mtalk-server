import express from 'express';
import * as titleService from '../services/titleService.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

// Browse all titles with filters
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, genres, status, search } = req.query;
        const skip = (page - 1) * limit;
        
        const filters = {};
        if (genres) filters.genres = { $in: genres.split(',') };
        if (status) filters.status = status;
        if (search) filters.$text = { $search: search };
        
        const titles = await titleService.getTitles(filters, skip, limit);
        const total = await titleService.countTitles(filters);
        
        res.json({ 
            titles, 
            page, 
            total, 
            pages: Math.ceil(total / limit) 
        });
    } catch (err) {
        console.error('[TITLES_GET]', err.message);
        res.status(500).json({ message: 'Failed to fetch titles' });
    }
});

// Get single title with reviews & stats
router.get('/:apiId', async (req, res) => {
    try {
        const title = await titleService.getTitleByApiId(req.params.apiId);
        if (!title) {
            return res.status(404).json({ message: 'Title not found' });
        }
        
        const reviews = await titleService.getReviewsForTitle(req.params.apiId);
        const userLibraryEntry = req.user 
            ? await titleService.getUserLibraryEntry(req.user.id, title._id)
            : null;
        
        res.json({
            title,
            reviews,
            userLibraryEntry,
            averageRating: title.averageRating,
            totalRatings: title.totalRatings
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching title' });
    }
});

export default router;