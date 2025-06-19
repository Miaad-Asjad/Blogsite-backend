import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import path from 'path';

import connectDB from './config/db.js';
import './config/passport.js';

import blogRoutes from './routes/blogRoutes.js';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import tokenRoutes from './routes/tokenRoutes.js';
import userRoutes from './routes/userRoutes.js';


dotenv.config();
const app = express();


connectDB();


app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));


app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());


app.use('/api/blogs', blogRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth', tokenRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes)


app.get('/', (_req, res) => {
  res.send('API is running');
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
