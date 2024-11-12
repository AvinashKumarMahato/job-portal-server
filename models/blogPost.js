// models/BlogPost.js
const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: Object, // Store the JSON format content
    required: true,
  },
}, { timestamps: true });

const BlogPost = mongoose.model('blogPosts', blogPostSchema);
module.exports = BlogPost;
