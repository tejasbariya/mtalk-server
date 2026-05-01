import jwt from 'jsonwebtoken';

const generateToken = (userId) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is missing from environment variables');
    }

    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: '7d' } // Users stay logged in for 30 days
    );
};

const safeUser = (u) => ({
    id: u._id,
    username: u.username,
    email: u.email,
    karma: u.karma,
    avatar: u.avatar,
    banner: u.banner,
    bio: u.bio,
});

export {
    generateToken,
    safeUser,
}