import jwt from 'jsonwebtoken';

const requireAuth = (req, res, next) => {
  const bearer = req.header('Authorization');
  
  if (!bearer?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }

  const token = bearer.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Session expired. Please sign in again.' });
  }
};

export { requireAuth };