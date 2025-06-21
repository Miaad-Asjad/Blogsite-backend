import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getAllBlogs,
  createBlog,
  getComments,
  addComment,
  updateComment,  
  getBlogById,
  getBlogsByUser,
  getBlogsByCategorySlug,
  deleteBlog,
  updateBlog,
} from '../controllers/blogController.js';
import authenticate from '../middleware/authenticate.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/'),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});


const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
    if (!allowed.includes(ext)) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

//Get all blogs
router.get('/', getAllBlogs);

router.post(
  '/',
  authenticate,
  upload.single('image'),
  (req, res, next) => {
    const { title, description, category } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Title, description, and category are required.' });
    }
    next();
  },
  createBlog
);

// TinyMCE image upload endpoint
router.post('/upload-image', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded' });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.status(200).json({ location: fileUrl }); 
});

// Get blogs by category slug
router.get('/category/:slug', getBlogsByCategorySlug);

// Get blogs by user
router.get('/user/:userId', getBlogsByUser);

// Get blog details by ID
router.get('/:id', getBlogById);

// Comments
router.get('/:id/comments', getComments); 
router.post('/:id/comments', authenticate, addComment); 
router.put('/:id/comments/:commentId', authenticate, updateComment); 
router.put("/blogs/:id", verifyAccessToken, updateBlog);
router.delete("/blogs/:id", verifyAccessToken, deleteBlog);


export default router;
