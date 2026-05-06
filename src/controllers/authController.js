import * as authService from '../services/authService.js';

export const register = async (req, res) => {
    try {
        const result = await authService.registerUser(req.body);
        return res.json(result);
    } catch (err) {
        console.error('[REGISTER]', err.message);
        return res.status(err.status || 500).json({ message: err.message || 'Registration failed.' });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email?.trim() || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }
        const result = await authService.loginUser(email.toLowerCase().trim(), password);
        return res.json(result);
    } catch (err) {
        console.error('[LOGIN]', err.message);
        return res.status(err.status || 500).json({ message: err.message || 'Login failed. Please try again.' });
    }
};

export const getCurrentUser = async (req, res) => {
    try {
        const user = await authService.getUserById(req.user.id);
        return res.json({ user });
    } catch (err) {
        return res.status(err.status || 500).json({ message: err.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const updatedUser = await authService.updateUser(req.user.id, req.body);
        return res.json({ user: updatedUser });
    } catch (err) {
        console.error('[UPDATE ME]', err.message);
        return res.status(err.status || 500).json({ message: err.message || 'Failed to update profile.' });
    }
};

export const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);
        const users = await authService.searchByUsername(q, req.user.id);
        res.json(users);
    } catch (err) {
        console.error('[SEARCH USERS]', err.message);
        res.status(500).json({ message: 'Search failed' });
    }
};

export const deleteAccount = async (req, res) => {
    try {
        await authService.deleteUser(req.user.id);
        return res.json({ message: 'Account permanently deleted.' });
    } catch (err) {
        console.error('[DELETE ACCOUNT]', err.message);
        return res.status(err.status || 500).json({ message: err.message || 'Could not delete account. Please try again.' });
    }
};