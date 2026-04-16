import express from 'express';
import LibraryEntry from '../models/LibraryEntry.js';
import Title from '../models/Title.js';
import { auth } from '../middleware/auth.js';

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

export default router;
