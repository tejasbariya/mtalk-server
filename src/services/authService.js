import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { generateToken, safeUser } from '../utils/authUtils.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import Comment from '../models/Comment.js';
import ChatMessage from '../models/ChatMessage.js';
import FriendRequest from '../models/FriendRequest.js';
import Notification from '../models/Notification.js';
import LibraryEntry from '../models/LibraryEntry.js';

export const registerUser = async (userData) => {
    const { username, email, password } = userData;

    // Validate inputs
    if (!username || !email || !password) {
        throw { status: 400, message: 'Username, email, and password are required.' };
    }

    if (!/^[a-z0-9_]{3,20}$/i.test(username.trim())) {
        throw { status: 400, message: 'Username must be 3-20 characters (letters, numbers, underscores only).' };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.toLowerCase().trim())) {
        throw { status: 400, message: 'Invalid email format.' };
    }

    if (password.length < 12 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        throw { status: 400, message: 'Password must be 12+ characters with uppercase and numbers.' };
    }

    // Check uniqueness
    const [existingUser, existingEmail] = await Promise.all([
        User.findOne({ username: username.toLowerCase() }),
        User.findOne({ email: email.toLowerCase() })
    ]);

    if (existingUser) {
        throw { status: 400, message: 'Username already taken.' };
    }

    if (existingEmail) {
        throw { status: 400, message: 'Email already registered.' };
    }

    // Hash and save
    const hashed = await bcrypt.hash(password, 12);
    const newUser = await User.create({
        username: username.trim().toLowerCase(),
        email: email.toLowerCase().trim(),
        password: hashed
    });

    return {
        token: generateToken(newUser._id),
        user: safeUser(newUser)
    };
};

export const loginUser = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) throw { status: 400, message: 'No account found with that email.' };

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw { status: 400, message: 'Incorrect password.' };

    return { token: generateToken(user._id), user: safeUser(user) };
};

export const getUserById = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw { status: 404, message: 'User not found.' };
    return safeUser(user);
};

export const updateUser = async (userId, updates) => {
    const user = await User.findById(userId);
    if (!user) throw { status: 404, message: 'User not found.' };

    const { username, bio, avatar, banner } = updates;

    if (username !== undefined) {
        const trimmedUsername = username.trim();
        if (!/^[a-z0-9_]{3,20}$/i.test(trimmedUsername)) {
            throw { status: 400, message: 'Username must be 3-20 characters (letters, numbers, underscores only).' };
        }

        // Check uniqueness if username changed
        if (trimmedUsername.toLowerCase() !== user.username.toLowerCase()) {
            const usernameTaken = await User.findOne({ username: trimmedUsername.toLowerCase() });
            if (usernameTaken) {
                throw { status: 400, message: 'That username is already taken.' };
            }
        }
        user.username = trimmedUsername;
    }

    if (bio !== undefined) user.bio = bio.trim();
    if (avatar !== undefined) user.avatar = avatar.trim();
    if (banner !== undefined) user.banner = banner.trim();

    await user.save();
    return safeUser(user);
};

export const searchByUsername = async (query, currentUserId) => {
   const users = await User.find({
        username: new RegExp(query, 'i'),
        _id: { $ne: currentUserId } // Exclude the searcher from the results
    })
    .select('username avatar karma')
    .limit(10)
    .lean();

    // Attach relationship status to each user
    for (let u of users) {
        const isFriend = await User.exists({ _id: currentUserId, friends: u._id });
        if (isFriend) {
            u.relation = 'FRIEND';
            continue;
        }

        const req = await FriendRequest.findOne({
            $or: [
                { sender: currentUserId, receiver: u._id },
                { sender: u._id, receiver: currentUserId }
            ],
            status: { $in: ['PENDING', 'ACCEPTED'] } 
        });

        if (req) {
            u.relation = req.sender.toString() === currentUserId.toString() ? 'REQUEST_SENT' : 'REQUEST_RECEIVED';
        } else {
            u.relation = 'NONE';
        }
    }

    return users;
};

export const deleteUser = async (userId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        await Promise.all([
            Review.deleteMany({ user: userId }, { session }),
            Comment.deleteMany({ user: userId }, { session }),
            ChatMessage.deleteMany({ user: userId }, { session }),
            FriendRequest.deleteMany({ 
                $or: [{ sender: userId }, { receiver: userId }] 
            }, { session }),
            Notification.deleteMany({ 
                $or: [{ from: userId }, { to: userId }] 
            }, { session }),
            LibraryEntry.deleteMany({ user: userId }, { session }),
            User.findByIdAndDelete(userId, { session })
        ]);

        await session.commitTransaction();
        return true;
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        await session.endSession();
    }
};