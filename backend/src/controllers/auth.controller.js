import User from "../models/user.model.js";
import { redis } from "../lib/redis.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt.js";
import { setAuthCookies, clearAuthCookies } from "../utils/cookies.js";

// Store refresh token in Redis
const storeRefreshToken = async (userId, token) => {
  await redis.set(`refresh:${userId}`, token, "EX", 7 * 24 * 60 * 60);
};

// Helper for generating & setting tokens
const issueTokens = async (res, user) => {
  const payload = { userId: user._id, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  await storeRefreshToken(user._id, refreshToken);
  setAuthCookies(res, accessToken, refreshToken);
  return { accessToken, refreshToken };
};

export const register = async (req, res) => {
  try {
    const { email, password, name, role, department, hospital } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already in use" });

    const user = await User.create({
      email,
      password,
      name,
      role,
      department,
      hospital,
    });

    const { accessToken } = await issueTokens(res, user);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: user.toObject({ getters: true, versionKey: false }),
      token: accessToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during registration" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, isActive: true });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: "Invalid credentials" });

    const { accessToken } = await issueTokens(res, user);

    res.json({
      success: true,
      message: "Login successful",
      user,
      token: accessToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during login" });
  }
};

export const refresh = async (req, res) => {
  try {
    const refreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken || null;
    if (!refreshToken)
      return res.status(401).json({ error: "No refresh token provided" });

    const decoded = verifyRefreshToken(refreshToken);
    const stored = await redis.get(`refresh:${decoded.userId}`);
    if (stored !== refreshToken)
      return res.status(403).json({ error: "Invalid refresh token" });

    const newAccess = generateAccessToken({
      userId: decoded.userId,
      role: decoded.role,
    });
    setAuthCookies(res, newAccess, refreshToken);
    res.json({ success: true, accessToken: newAccess });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(403).json({ error: "Invalid refresh token" });
  }
};

export const logout = async (req, res) => {
  try {
    await redis.del(`refresh:${req.user?.userId}`);
    clearAuthCookies(res);
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error during logout" });
  }
};

export const getMe = async (req, res) => {
  const user = await User.findById(req.user?.userId).select("-password");
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ success: true, user });
};


export const updateProfile = async (
  req,
  res
) => {
  try {
    const { name, department, hospital } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user?.userId,
      { name, department, hospital },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          hospital: user.hospital,
        },
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update profile",
    });
  }
};

export const changePassword = async (
  req,
  res
) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user?.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({
        success: false,
        error: "Current password is incorrect",
      });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to change password",
    });
  }
};