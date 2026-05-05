import express from 'express';
import * as libraryController from '../controllers/libraryController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

router.get('/', requireAuth, libraryController.getUserLibrary);
router.get('/check/:apiId', requireAuth, libraryController.checkLibraryStatus)
router.post('/', requireAuth, libraryController.addLibraryEntry);
router.post('/review', requireAuth, libraryController.addReview);
router.get('/reviews/:titleId', libraryController.getTitleReviews);
router.delete('/review/:reviewId', requireAuth, libraryController.deleteReview);

export default router;