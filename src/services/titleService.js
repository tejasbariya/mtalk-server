import Title from '../models/Title.js';
import Review from '../models/Review.js';
import LibraryEntry from '../models/LibraryEntry.js';

export const getTitles = async (filters = {}, skip = 0, limit = 20) => {
    return await Title.find(filters)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
};

export const countTitles = async (filters = {}) => {
    return await Title.countDocuments(filters);
};

export const getTitleByApiId = async (apiId) => {
    return await Title.findOne({ apiId: String(apiId) });
};

export const getReviewsForTitle = async (apiId) => {
    const title = await Title.findOne({ apiId: String(apiId) });
    if (!title) return [];
    
    return await Review.find({ title: title._id })
        .populate('user', 'username avatar karma')
        .sort({ createdAt: -1 })
        .limit(10);
};

export const getUserLibraryEntry = async (userId, titleId) => {
    return await LibraryEntry.findOne({ user: userId, title: titleId });
};