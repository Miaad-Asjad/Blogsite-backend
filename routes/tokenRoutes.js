import { Router } from "express";
import jwt from "jsonwebtoken"; // 
const router = Router();

const REFRESH_SECRET = process.env.REFRESH_SECRET || "your_refresh_secret_key";
const ACCESS_SECRET = process.env.ACCESS_SECRET || "your_access_secret_key";


router.post("/refresh-token", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token missing" });
  }

  try {
   
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

    const accessToken = jwt.sign(
      { userId: decoded.userId },
      ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ accessToken });
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
});

export default router;
