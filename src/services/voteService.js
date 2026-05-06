import Review from '../models/Review.js';
import KarmaLog from '../models/KarmaLog.js';

// VoteService.js - Handles upvoting and downvoting of reviews, including karma adjustments

export const upvoteReview = async (reviewId, userId) => {
    const review = await Review.findById(reviewId);
    if (!review) {
        throw { status: 404, message: 'Review not found' };
    }

    const hasUpvoted = review.upvotes.includes(userId);
    const hasDownvoted = review.downvotes.includes(userId);

    if (hasUpvoted) {
        // Toggle vote off if already upvoted
        review.upvotes.pull(userId);
    } else {
        // Apply upvote
        review.upvotes.push(userId);
        if (hasDownvoted) review.downvotes.pull(userId); // Remove downvote if exists

        // Award karma
        await KarmaLog.create({
            user: review.user,
            amount: 5,
            reason: 'Review Upvoted',
            referenceId: review._id
        });
    }

    await review.save();
    return review;
};

export const downvoteReview = async (reviewId, userId) => {
    const review = await Review.findById(reviewId);
    if (!review) { throw { status: 404, message: 'Review not found' }; }

    const hasUpvoted = review.upvotes.includes(userId);
    const hasDownvoted = review.downvotes.includes(userId);

    if (hasDownvoted) {
        // Toggle vote off if already downvoted
        review.downvotes.pull(userId);
    } else {
        // Apply downvote
        review.downvotes.push(userId);
        if (hasUpvoted) review.upvotes.pull(userId); // Remove upvote if exists

        // Deduct karma
        await KarmaLog.create({
            user: review.user,
            amount: -2,
            reason: 'Review Downvoted',
            referenceId: review._id
        });
    }

    await review.save();
    return review;
};