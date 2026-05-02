import LibraryEntry from '../models/LibraryEntry.js';
import Title from '../models/Title.js';
import Review from '../models/Review.js';

export const getEntriesByUser = async (userId) => {
    return await LibraryEntry.find({ user: userId }).populate('title');
};

export const upsertEntryAndTitle = async (userId, titleId, status, titleDetails) => {
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
        { user: userId, title: savedTitle._id },
        { status },
        { upsert: true, new: true }
    ).populate('title');

    return entry;
};

export const createReview = async (userId, apiId, content, rating) => {
    const title = await Title.findOne({ apiId: String(apiId) });
    if (!title) {
        throw { status: 404, message: 'Title not found in database.' };
    }

    const review = await Review.create({
        user: userId,
        title: title._id,
        content,
        rating
    });

    const reviews = await Review.find({ title: title._id });
    const avg = reviews.length 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;
    
    await Title.findByIdAndUpdate(title._id, {
        averageRating: avg,
        totalRatings: reviews.length
    });

    return review;
};

export const getReviewsForTitle = async (apiId) => {
    const title = await Title.findOne({ apiId: String(apiId) });
    if (!title) return [];

    return await Review.find({ title: title._id })
        .populate('user', 'username avatar karma')
        .sort({ createdAt: -1 });
};

export const removeReview = async (reviewId, userId) => {
    const review = await Review.findById(reviewId);
    if (!review) throw { status: 404, message: 'Review not found' };

    // Only allow deletion if user owns the review
    if (review.user.toString() !== userId) {
        throw { status: 403, message: 'Unauthorized' };
    }

    const titleId = review.title;
    await review.deleteOne();

    const reviews = await Review.find({ title: titleId });
    const avg = reviews.length 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;
    
    await Title.findByIdAndUpdate(titleId, {
        averageRating: avg,
        totalRatings: reviews.length
    });

    return true;
};