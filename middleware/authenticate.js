import jwt from 'jsonwebtoken';

const authenticate = (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token required',
      hint: 'Format: "Bearer <token>" or cookie',
    });
  }

  jwt.verify(token, process.env.ACCESS_SECRET, (err, decoded) => {
    if (err) {
      const message = err.name === 'TokenExpiredError'
        ? 'Token expired. Please log in again'
        : 'Invalid token';

      return res.status(403).json({
        success: false,
        message,
        error: err.name,
      });
    }

    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role || 'user',
    };

    next();
  });
};

export default authenticate;
