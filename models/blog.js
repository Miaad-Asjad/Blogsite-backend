import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    comment: { type: String, required: true }, 
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
      required: true,
    },
  },
  { timestamps: true } 
);

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    image: {
      type: String,
    },
    comments: [commentSchema], 

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
  },
  { timestamps: true } 
);

const Blog = mongoose.model('Blog', blogSchema);
export default Blog;
