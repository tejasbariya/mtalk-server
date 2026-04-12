import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';

// ── helper ────────────────────────────────────────────────────
const signToken = (userId) =>
  jwt.sign({ user: { id: userId } }, JWT_SECRET, { expiresIn: '7d' });

const safeUser = (u) => ({
  id: u._id,
  username: u.username,
  email: u.email,
  karma: u.karma,
  avatar: u.avatar,
  bio: u.bio,
});

// ── POST /api/auth/register ───────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    if (!/^[a-z0-9_]{3,20}$/i.test(username)) {
      return res.status(400).json({ message: 'Username must be 3-20 characters (letters, numbers, underscores only).' });
    }

    const [emailTaken, usernameTaken] = await Promise.all([
      User.findOne({ email: email.toLowerCase() }),
      User.findOne({ username: username.toLowerCase() }),
    ]);
    if (emailTaken)    return res.status(400).json({ message: 'That email is already registered.' });
    if (usernameTaken) return res.status(400).json({ message: 'That username is already taken.' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
    });

    return res.status(201).json({ token: signToken(user._id), user: safeUser(user) });
  } catch (err) {
    console.error('[REGISTER]', err.message);
    return res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(400).json({ message: 'No account found with that email.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Incorrect password.' });

    return res.json({ token: signToken(user._id), user: safeUser(user) });
  } catch (err) {
    console.error('[LOGIN]', err.message);
    return res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const bearer = req.header('Authorization');
    if (!bearer?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }
    const decoded = jwt.verify(bearer.split(' ')[1], JWT_SECRET);
    const user = await User.findById(decoded.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.json({ user: safeUser(user) });
  } catch {
    return res.status(401).json({ message: 'Session expired. Please sign in again.' });
  }
});

export default router;
