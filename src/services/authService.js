import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken, safeUser } from '../utils/authUtils.js';

export const registerUser = async (userData) => {
    // Assuming your register logic is here
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

export const searchByUsername = async (query) => {
    const users = await User.find({
        username: new RegExp(query, 'i')
    })
        .select('username avatar karma')
        .limit(10);

    return users;
};

export const deleteUser = async (userId) => {
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
        throw { status: 404, message: 'User not found.' };
    }
    return true;
};