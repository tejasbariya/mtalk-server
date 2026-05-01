import express from 'express';
import * as authController from '../controllers/authController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/search', authController.searchUsers);

// Protected Routes
router.get('/me', requireAuth, authController.getCurrentUser);
router.put('/me', requireAuth, authController.updateProfile);
router.delete('/me', requireAuth, authController.deleteAccount);

export default router;