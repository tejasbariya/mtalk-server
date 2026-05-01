import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
  const bearer = req.header('Authorization');
  
  if (!bearer?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied.' });
  }

  const token = bearer.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_in_production');
    req.user = decoded.user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is not valid or has expired.' });
  }
};

export default auth;
