import jwt from 'jsonwebtoken';

export const isTokenExpired = (token) => {
  try {
    const { exp } = jwt.decode(token);
    return Date.now() >= exp * 1000;
  } catch (err) {
    return true;
  }
};
