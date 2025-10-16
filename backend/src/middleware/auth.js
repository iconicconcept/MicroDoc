import jwt from "jsonwebtoken";
import { verifyRefreshToken, generateAccessToken } from "../lib/jwt.js";
import { redis } from "../lib/redis.js";
import { setAuthCookies } from "../utils/cookies.js";
import User from "../models/user.model.js";

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
      // Handle expired token
      if (err.name === "TokenExpiredError") {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
          return res.status(401).json({ error: "Session expired, please login again" });
        }

        try {
          const refreshDecoded = verifyRefreshToken(refreshToken);
          const stored = await redis.get(`refresh:${refreshDecoded.userId}`);
          if (stored !== refreshToken) {
            return res.status(403).json({ error: "Invalid refresh token" });
          }

          // Generate new tokens
          const payload = {
            userId: refreshDecoded.userId,
            role: refreshDecoded.role,
          };
          const newAccessToken = generateAccessToken(payload);
          setAuthCookies(res, newAccessToken, refreshToken);

          decoded = jwt.decode(newAccessToken);
          console.log("🔄 Access token refreshed automatically");
        } catch (refreshErr) {
          console.error("Refresh in middleware failed:", refreshErr);
          return res.status(401).json({ error: "Token expired, please login again" });
        }
      } else {
        throw err;
      }
    }

    const user = await User.findById(decoded.userId).select("-password");
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
};
export const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Access denied" });
  }  
}