import FriendRequest from '../models/FriendRequest.js';
import User from '../models/User.js';

export const sendFriendRequest = async (senderId, receiverId) => {
    if (senderId === receiverId) {
        throw { status: 400, message: 'Cannot send request to yourself' };
    }
    
    const existing = await FriendRequest.findOne({
        $or: [
            { sender: senderId, receiver: receiverId },
            { sender: receiverId, receiver: senderId }
        ]
    });
    
    if (existing) {
        throw { status: 400, message: 'Request already exists' };
    }
    
    const request = await FriendRequest.create({
        sender: senderId,
        receiver: receiverId,
        status: 'PENDING'
    });
    
    return await request.populate('sender', 'username avatar');
};

export const acceptFriendRequest = async (requestId, userId) => {
    const request = await FriendRequest.findById(requestId);
    
    if (!request || request.receiver.toString() !== userId) {
        throw { status: 403, message: 'Unauthorized' };
    }
    
    request.status = 'ACCEPTED';
    await request.save();
    
    // Add to both users' friend lists
    await User.findByIdAndUpdate(request.sender, {
        $addToSet: { friends: request.receiver }
    });
    await User.findByIdAndUpdate(request.receiver, {
        $addToSet: { friends: request.sender }
    });
    
    return request;
};

export const declineFriendRequest = async (requestId, userId) => {
    const request = await FriendRequest.findById(requestId);
    
    if (!request || request.receiver.toString() !== userId) {
        throw { status: 403, message: 'Unauthorized' };
    }
    
    request.status = 'DECLINED';
    await request.save();
    
    return request;
};

export const getPendingRequests = async (userId) => {
    return await FriendRequest.find({
        receiver: userId,
        status: 'PENDING'
    }).populate('sender', 'username avatar karma');
};

export const getFriendsList = async (userId) => {
    const user = await User.findById(userId).populate('friends', 'username avatar karma');
    return user?.friends || [];
};