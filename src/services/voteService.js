import Review from '../models/Review.js';
import KarmaLog from '../models/KarmaLog.js';

export const upvoteReview = async (reviewId, userId) => {
    const review = await Review.findById(reviewId);
    if (!review) {
        throw { status: 404, message: 'Review not found' };
    }
    
    review.upvotes = (review.upvotes || 0) + 1;
    await review.save();
    
    // Award karma to review author
    await KarmaLog.create({
        user: review.user,
        amount: 5,
        reason: 'Review Upvoted',
        referenceId: review._id
    });
    
    return review;
};

export const downvoteReview = async (reviewId, userId) => {
    const review = await Review.findById(reviewId);
    if (!review) {
        throw { status: 404, message: 'Review not found' };
    }
    
    review.downvotes = (review.downvotes || 0) + 1;
    await review.save();
    
    // Deduct karma from review author
    await KarmaLog.create({
        user: review.user,
        amount: -2,
        reason: 'Review Downvoted',
        referenceId: review._id
    });
    
    return review;
};