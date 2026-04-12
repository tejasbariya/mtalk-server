import express from 'express';
import LibraryEntry from '../models/LibraryEntry.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

router.get('/', auth, async (req, res) => {
  try {
    const entries = await LibraryEntry.find({ user: req.user.id }).populate('title');
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
