
import express from 'express';
import { getUserProfile } from '../controllers/userController.js';

const router = express.Router();

router.get('/:userId', getUserProfile);

export default router;
