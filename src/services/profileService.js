import User from '../models/User.js';
import Review from '../models/Review.js';
import LibraryEntry from '../models/LibraryEntry.js';
import FriendRequest from '../models/FriendRequest.js';

export const getUserProfile = async (userId) => {
    const user = await User.findById(userId).select('-password');
    return user ? {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        banner: user.banner,
        bio: user.bio,
        karma: user.karma,
        createdAt: user.createdAt
    } : null;
};

export const getUserReviews = async (userId, limit = 10) => {
    return await Review.find({ user: userId })
        .populate('title', 'title coverImage')
        .sort({ createdAt: -1 })
        .limit(limit);
};

export const getUserLibraryStats = async (userId) => {
    const reading = await LibraryEntry.countDocuments({ user: userId, status: 'Reading' });
    const completed = await LibraryEntry.countDocuments({ user: userId, status: 'Completed' });
    const planToRead = await LibraryEntry.countDocuments({ user: userId, status: 'Plan to Read' });
    
    return { reading, completed, planToRead };
};

export const getUserStats = async (userId) => {
    const totalReviews = await Review.countDocuments({ user: userId });
    const totalLibraryEntries = await LibraryEntry.countDocuments({ user: userId });
    const friends = await User.findById(userId).select('friends');
    
    return {
        totalReviews,
        totalLibraryEntries,
        friendsCount: friends?.friends?.length || 0
    };
};

export const checkFriendship = async (userId1, userId2) => {
    const friendship = await FriendRequest.findOne({
        $or: [
            { sender: userId1, receiver: userId2 },
            { sender: userId2, receiver: userId1 }
        ],
        status: 'ACCEPTED'
    });
    return !!friendship;
};