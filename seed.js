import dotenv from 'dotenv';
dotenv.config();

import connectDB from './config/db.js';
import seedCategories from './seedCategories.js';

connectDB()
  .then(() => seedCategories())
  .catch(console.error);