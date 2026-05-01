import ChatMessage from '../models/ChatMessage.js';

export const getRoomHistory = async (room) => {
    const messages = await ChatMessage.find({ room })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('user', 'username avatar karma');

    return messages.reverse();
};

// Used by Sockets (when a live message is sent)
export const saveMessage = async (room, userId, text) => {
    const newMessage = await ChatMessage.create({
        room,
        user: userId,
        text
    });
    return await ChatMessage.findById(newMessage._id)
        .populate('user', 'username avatar karma');
};