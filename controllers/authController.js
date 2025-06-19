import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import hbs from 'nodemailer-express-handlebars';
import User from '../models/User.js';
import crypto from "crypto"; 


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.use('compile', hbs({
  viewEngine: {
    extname: '.hbs',
    partialsDir: path.resolve(__dirname, '../views/emails'),
    defaultLayout: false,
  },
  viewPath: path.resolve(__dirname, '../views/emails'),
  extName: '.hbs',
}));


const sendMailPromise = (options) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(options, (err, info) => {
      if (err) reject(err);
      else resolve(info);
    });
  });
};

// JWT Generators
const generateAccessToken = (user) =>
  jwt.sign({ id: user._id, username: user.username }, process.env.ACCESS_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (user) =>
  jwt.sign({ id: user._id, username: user.username }, process.env.REFRESH_SECRET, { expiresIn: '7d' });

const generateVerificationCode = () => Math.floor(100000 + Math.random() * 900000).toString();



export const registerUser = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    
    const profilePicture = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
      : "";

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already in use" });
    }

    
    const verificationCode = generateVerificationCode(); 
    const hashedCode = await bcrypt.hash(verificationCode, 10);

    const newUser = new User({
      name,
      username,
      email,
      password,
      profilePicture,
      emailVerificationCode: hashedCode,
      emailVerificationCodeExpires: Date.now() + 10 * 60 * 1000, s
    });

    await newUser.save();

    
    await sendVerificationEmail(email, verificationCode, name);

    res.status(201).json({
      message: "Registration successful. Please check your email for verification code.",
    });

  } catch (error) {
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};



export const verifyEmail = async (req, res) => {
  const { userId, code } = req.body;

  try {
    const user = await User.findById(userId).select("+emailVerificationCode +emailVerificationCodeExpires");
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.emailVerificationCode || !user.emailVerificationCodeExpires)
      return res.status(400).json({ message: 'Verification code not set' });

    if (user.emailVerificationCodeExpires < Date.now())
      return res.status(400).json({ message: 'Verification code has expired' });

    const isMatch = await bcrypt.compare(code.trim(), user.emailVerificationCode.toString());
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid verification code' });

    user.isVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationCodeExpires = undefined;
    await user.save();

    await sendMailPromise({
      from: `"WordSphere Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Welcome to WordSphere!',
      template: 'welcome',
      context: { name: user.name },
    });

    res.status(200).json({ message: 'Email verified successfully. You can now login.' });

  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ message: 'Server error during verification' });
  }
};

export const resendVerificationCode = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (user.isVerified)
      return res.status(400).json({ message: "Email already verified" });

    const rawCode = generateVerificationCode();
    const hashedCode = await bcrypt.hash(rawCode, 10);

    user.emailVerificationCode = hashedCode;
    user.emailVerificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendMailPromise({
      from: `"WordSphere Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Resend: Your WordSphere Verification Code',
      html: `<p>Your new verification code is: <strong>${rawCode}</strong></p><p>This code will expire in 10 minutes.</p>`
    });

    res.status(200).json({ message: "New verification code sent" });

  } catch (err) {
    console.error("Error in resending verification:", err);
    res.status(500).json({ message: "Server error while resending code" });
  }
};


export const loginUser = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    let user = identifier.includes("@")
      ? await User.findOne({ email: identifier.toLowerCase() }).select("+password")
      : await User.findOne({ username: identifier.toLowerCase() }).select("+password");

    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.isVerified) return res.status(401).json({ message: "Please verify your email first" });

    const isMatch = await user.comparePassword(password.trim());
if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });


    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

   await sendMailPromise({
  from: `"WordSphere Security" <${process.env.EMAIL_USER}>`,
  to: user.email,
  subject: 'New Login to WordSphere',
  template: 'loginAlert',
  context: { name: user.name },
});


    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }).status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("Error in login:", err);
    res.status(500).json({ message: "Server error while logging in" });
  }
};

export const refreshAccessToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: 'Refresh token required' });

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token)
      return res.status(403).json({ message: 'Invalid refresh token' });

    const newAccessToken = generateAccessToken(user);
    res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
};

export const logoutUser = (_req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });

  res.status(200).json({ message: "Logged out successfully" });
};

export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'No account with this email' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = expires;
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  await sendMailPromise({
  from: `"WordSphere Support" <${process.env.EMAIL_USER}>`,
  to: email,
  subject: 'Password Reset Request',
  template: 'resetPassword',
  context: { name: user.name, resetLink:resetUrl },
});


    res.status(200).json({ message: 'Reset email sent if account exists' });
  } catch (err) {
    console.error("Reset email error:", err);
    res.status(500).json({ message: 'Error sending reset email' });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.query;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpires"); 

    if (!user) return res.status(400).json({ message: 'Token invalid or expired' });

    user.password = password.trim(); 
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: 'Server error while resetting password' });
  }
};

