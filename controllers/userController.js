import User from '../models/User.js';
import bcrypt from 'bcryptjs';

export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(userId).select('name email profilePicture username');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};


export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; 

    const user = await User.findById(userId).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, username, email, password } = req.body;

    if (name) user.name = name;
    if (username) user.username = username;
    if (email) user.email = email;

    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    if (req.file) {
      user.profilePicture = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    await user.save();

    const { password: _, ...safeUser } = user.toObject(); 

    res.status(200).json({
      message: "Profile updated successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ message: "Profile update failed", error: error.message });
  }
};

