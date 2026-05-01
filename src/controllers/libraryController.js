import * as libraryService from '../services/libraryService.js';

export const getUserLibrary = async (req, res) => {
    try {
        const entries = await libraryService.getEntriesByUser(req.user.id);
        res.json(entries);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const addLibraryEntry = async (req, res) => {
    try {
        const { titleId, status, titleDetails } = req.body;
        const entry = await libraryService.upsertEntryAndTitle(req.user.id, titleId, status, titleDetails);
        res.json(entry);
    } catch (err) {
        console.error('[LIBRARY_ADD]', err);
        res.status(500).json({ message: 'Server error' });
    }
};

export const addReview = async (req, res) => {
    try {
        const { titleId, content, rating } = req.body;
        const review = await libraryService.createReview(req.user.id, titleId, content, rating);
        res.json(review);
    } catch (err) {
        console.error('[REVIEW_POST]', err.message);
        res.status(err.status || 500).json({ message: err.message || 'Failed to post review' });
    }
};

export const getTitleReviews = async (req, res) => {
    try {
        const reviews = await libraryService.getReviewsForTitle(req.params.titleId);
        res.json(reviews);
    } catch (err) {
        console.error('[REVIEWS_GET]', err.message);
        res.status(500).json({ message: 'Error fetching reviews' });
    }
};

export const deleteReview = async (req, res) => {
    try {
        await libraryService.removeReview(req.params.reviewId, req.user.id);
        res.json({ message: 'Review deleted successfully' });
    } catch (err) {
        console.error('[REVIEW_DELETE]', err.message);
        res.status(err.status || 500).json({ message: err.message || 'Failed to delete review' });
    }
};