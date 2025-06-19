import Blog from '../models/blog.js';
import Category from '../models/category.js';

// Get All Blogs
export const getAllBlogs = async (_req, res) => {
  try {
    const blogs = await Blog.find()
      .populate('author', 'name profilePicture')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });

    res.status(200).json(blogs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch blogs' });
  }
};

// Create Blog with image and category
export const createBlog = async (req, res) => {
  const { title, description, category: categorySlug } = req.body;

  if (!req.user?.id) {
    return res.status(401).json({ message: 'Unauthorized: No user info found' });
  }

  if (!categorySlug) {
    return res.status(400).json({ message: 'Category is required' });
  }

  try {
    const category = await Category.findOne({ slug: categorySlug });
    if (!category) {
      return res.status(400).json({ message: 'Category not found' });
    }

    const image = req.file ? req.file.filename : null;

    const newBlog = new Blog({
      title,
      description,
      author: req.user.id,
      image,
      category: category._id,
    });

    await newBlog.save();
    res.status(201).json(newBlog);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create blog' });
  }
};


// Get Single Blog by ID
export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'name profilePicture')
      .populate('category', 'name slug');

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blog', error });
  }
};

// Get Blogs by Category Slug
export const getBlogsByCategorySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug || slug.trim() === '') {
      return res.status(400).json({ message: 'Category slug is required' });
    }

    let category = await Category.findOne({ slug });

    if (!category) {
      category = await Category.findOne({ slugHistory: slug });
    }

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const blogs = await Blog.find({ category: category._id })
      .populate('author', 'name profilePicture')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });

    res.status(200).json(blogs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch blogs by category' });
  }
};

// Get Blogs by User
export const getBlogsByUser = async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.params.userId })
      .populate("author", "name")
      .populate("category", "name"); 

    res.status(200).json(blogs);
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).json({ message: "Server error" });
  }
};



// Get Comments for a blog
export const getComments = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate("comments.user", "name profilePicture"); // 🧠 Key step!

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json(blog.comments);
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).json({ message: "Error fetching comments" });
  }
};


//  Add a comment
export const addComment = async (req, res) => {
  const { comment } = req.body;

  if (!comment || comment.trim() === '') {
    return res.status(400).json({ message: 'Comment text is required' });
  }

  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    const newComment = {
      comment,
      user: req.user.id,
      createdAt: new Date(),
    };

    blog.comments.push(newComment);
    await blog.save();

    await blog.populate("comments.user", "name profilePicture");

    const lastComment = blog.comments[blog.comments.length - 1];

    res.status(201).json(lastComment);
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ message: 'Failed to add comment' });
  }
};



// Update comment

export const updateComment = async (req, res) => {
  try {
    const { blogId, commentId } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim() === "") {
      return res.status(400).json({ error: "Comment text is required." });
    }

    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ error: "Blog not found." });

    const existingComment = blog.comments.id(commentId);
    if (!existingComment) {
      return res.status(404).json({ error: "Comment not found." });
    }

    if (existingComment.user.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to edit this comment." });
    }

    existingComment.comment = comment;
    existingComment.updatedAt = new Date();

    await blog.save();

  
    await blog.populate("comments.user", "name profilePicture");

    const updatedComment = blog.comments.id(commentId);

    res.status(200).json(updatedComment);
  } catch (error) {
    console.error("Update Comment Error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};
