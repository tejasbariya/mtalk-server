import * as chatService from '../services/chatService.js';
import DOMPurify from 'isomorphic-dompurify';

// Tracking object to manage room members in-memory
const roomMembers = {};

const validateSendMessage = (data) => {
    if (!data.room || typeof data.room !== 'string') {
        throw new Error('Invalid room');
    }
    if (!data.text || typeof data.text !== 'string') {
        throw new Error('Invalid text');
    }
    if (data.text.length > 2000) {
        throw new Error('Message too long (max 2000 chars)');
    }
    return true;
};

export const setupChatSockets = (io) => {
    io.on('connection', (socket) => {

        // Using the unified join_room from  hybrid setup
        socket.on('join_room', (data) => {
            const room = data.room;
            socket.join(room);

            if (data.user && data.user.username) {
                if (!roomMembers[room]) roomMembers[room] = {};
                roomMembers[room][socket.id] = data.user;
                io.to(room).emit('room_members', Object.values(roomMembers[room]));
            }
        });

        socket.on('send_message', async (data) => {
            
            try {
                validateSendMessage(data);
                const room = data.room;
                const clean = DOMPurify.sanitize(data.text);
                // Reject empty messages
                if (!clean.trim()) return;

                // Use the shared service to save the DB record
                const populatedMessage = await chatService.saveMessage(room, data.user.id, data.text);

                // Instantly push the new message to everyone in the room
                io.to(room).emit('receive_message', populatedMessage);
            } catch (err) {
                console.error('[SOCKET_SEND_ERROR]', err);
            }
        });

        socket.on('disconnecting', () => {
            socket.rooms.forEach(room => {
                if (roomMembers[room] && roomMembers[room][socket.id]) {
                    delete roomMembers[room][socket.id];
                    io.to(room).emit('room_members', Object.values(roomMembers[room]));
                }
            });
        });
    });
};