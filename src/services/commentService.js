import Comment from '../models/Comment.js';
import Review from '../models/Review.js';

export const createCommentOnReview = async (userId, reviewId, content) => {
    const review = await Review.findById(reviewId);
    if (!review) {
        throw { status: 404, message: 'Review not found' };
    }
    
    if (!content || content.trim().length < 2) {
        throw { status: 400, message: 'Comment too short' };
    }
    
    const comment = await Comment.create({
        user: userId,
        review: reviewId,
        content: content.trim()
    });
    
    return await comment.populate('user', 'username avatar karma');
};

export const getCommentsForReview = async (reviewId) => {
    return await Comment.find({ review: reviewId })
        .populate('user', 'username avatar karma')
        .sort({ createdAt: -1 });
};

export const upvoteComment = async (commentId, userId) => {
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw { status: 404, message: 'Comment not found' };
    }
    
    comment.upvotes = (comment.upvotes || 0) + 1;
    await comment.save();
    
    return comment;
};

export const downvoteComment = async (commentId, userId) => {
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw { status: 404, message: 'Comment not found' };
    }
    
    comment.downvotes = (comment.downvotes || 0) + 1;
    await comment.save();
    
    return comment;
};