import express from 'express';
import LibraryEntry from '../models/LibraryEntry.js';
import Title from '../models/Title.js';
import Review from '../models/Review.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const entries = await LibraryEntry.find({ user: req.user.id }).populate('title');
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { titleId, status, titleDetails } = req.body;

    // 1. Find or create the Title document
    const savedTitle = await Title.findOneAndUpdate(
      { apiId: String(titleId) },
      {
        title: titleDetails.title,
        coverImage: titleDetails.coverImage,
        status: titleDetails.status,
        source: 'ANILIST'
      },
      { upsert: true, new: true }
    );

    // 2. Find or create the LibraryEntry linking user + title
    const entry = await LibraryEntry.findOneAndUpdate(
      { user: req.user.id, title: savedTitle._id },
      { status },
      { upsert: true, new: true }
    ).populate('title');

    res.json(entry);
  } catch (err) {
    console.error('[LIBRARY_ADD]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /api/library/review ──────────────────────────────────
router.post('/review', auth, async (req, res) => {
  try {
    const { titleId, content, rating } = req.body;

    // Find corresponding title in DB via apiId
    const title = await Title.findOne({ apiId: String(titleId) });
    if (!title) {
      return res.status(404).json({ message: 'Title not found in database. Please add it to your library first.' });
    }

    const review = await Review.create({
      user: req.user.id,
      title: title._id,
      content,
      rating
    });

    res.json(review);
  } catch (err) {
    console.error('[REVIEW_POST]', err.message);
    res.status(500).json({ message: 'Failed to post review' });
  }
});

// ── GET /api/library/reviews/:titleId ─────────────────────────
router.get('/reviews/:titleId', async (req, res) => {
  try {
    const apiId = String(req.params.titleId);

    const title = await Title.findOne({ apiId });
    if (!title) {
      return res.json([]);
    }

    const reviews = await Review.find({ title: title._id })
      .populate('user', 'username avatar karma')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error('[REVIEWS_GET]', err.message);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

export default router;
