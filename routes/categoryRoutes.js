
import express from 'express';
import { getAllCategories, createCategory, updateCategory } from '../controllers/categoryController.js';
import authenticate from '../middleware/authenticate.js';


const router = express.Router();


router.get('/', getAllCategories);


router.post('/', authenticate  ,createCategory);

router.put('/:id', updateCategory);

export default router;
