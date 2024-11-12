const mongoose = require('mongoose');

const draftBlogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: Object, // Store the JSON format content
    required: true,
  },
}, { timestamps: true });

const DraftBlogPost = mongoose.model('draftBlogPosts', draftBlogPostSchema);
module.exports = DraftBlogPost;
