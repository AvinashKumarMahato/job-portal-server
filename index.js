const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AdminModel = require("./models/adminDB");
const Posts = require("./models/jobPosts");
const Drafts = require("./models/draftSchema")
const ContactMessage = require("./models/ContactMessage")
const BlogPost = require("./models/blogPost");
const DraftBlogPost = require("./models/draftBlogPost");
require('dotenv').config();
const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB using the URI from the .env file
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected successfully"))
    .catch(err => console.error("MongoDB connection error:", err));

const jwtSecret = process.env.JWT_SECRET;

// Function to create an admin user
const createAdmin = async () => {
    const existingAdmin = await AdminModel.findOne({ email: process.env.ADMIN_EMAIL });

    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
        const newAdmin = new AdminModel({
            email: process.env.ADMIN_EMAIL,
            password: hashedPassword
        });
        await newAdmin.save();
        console.log("Admin created successfully");
    } else {
        console.log("Admin already exists");
    }
};

// Call the function to create the admin if it doesn't exist
createAdmin();


// POST login endpoint
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await AdminModel.findOne({ email: email });

        if (user) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '1h' });
                return res.json({ message: "Success", token });
            } else {
                return res.status(401).json({ message: "Incorrect password" });
            }
        } else {
            return res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});

// Create Job Post endpoint
app.post('/api/posts', async (req, res) => {
    const {
        jobTitle,
        companyName,
        jobDescription,
        interviewAddress,
        slotBookingLink,
        contactPerson,
        interviewDate,
        startTime,
        endTime
    } = req.body;

    const formData = new Posts({
        jobTitle,
        companyName,
        jobDescription,
        interviewAddress,
        slotBookingLink: slotBookingLink || undefined,  // Set to undefined if not provided
        contactPerson: contactPerson || undefined,      // Set to undefined if not provided
        interviewDate: new Date(interviewDate),         // Ensure it's a Date
        startTime: new Date(startTime),                  // Ensure it's a Date
        endTime: endTime ? new Date(endTime) : null     // Ensure it's a Date or null
    });

    try {
        await formData.save();
        res.status(201).json({ message: "Post created successfully." }); // 201 Created
    } catch (err) {
        console.error("Database Insertion Error:", err);
        res.status(500).json({ message: "Failed to insert data." });
    }
});

// Create Draft endpoint
app.post('/api/drafts', async (req, res) => {
    const {
        jobTitle,
        companyName,
        jobDescription,
        interviewAddress,
        slotBookingLink,
        contactPerson,
        interviewDate,
        startTime,
        endTime
    } = req.body;

    const formData = new Drafts({
        jobTitle,
        companyName,
        jobDescription,
        interviewAddress,
        slotBookingLink: slotBookingLink || undefined,  // Set to undefined if not provided
        contactPerson: contactPerson || undefined,      // Set to undefined if not provided
        interviewDate: new Date(interviewDate),         // Ensure it's a Date
        startTime: new Date(startTime),                  // Ensure it's a Date
        endTime: endTime ? new Date(endTime) : null     // Ensure it's a Date or null
    });

    try {
        await formData.save();
        res.status(201).json({ message: "Draft created successfully." }); // 201 Created
    } catch (err) {
        console.error("Database Insertion Error:", err);
        res.status(500).json({ message: "Failed to create draft." });
    }
});

// Get All Job Posts
app.get('/getPosts', async (req, res) => {
    try {
        const posts = await Posts.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Job Drafts
app.get('/getDrafts', async (req, res) => {
    try {
        const drafts = await Drafts.find().sort({ createdAt: -1 });
        res.json(drafts)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
});

// Get Blog Drafts
app.get('/getBlogDrafts', async (req, res) => {
    try {
        const drafts = await DraftBlogPost.find().sort({ createdAt: -1 });
        res.json(drafts)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
});

// Get the posts to update
app.get('/update/:postId', async (req, res) => {
    const { postId } = req.params;

    try {
        const post = await Posts.findById(postId) || await Drafts.findById(postId);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json(post); // Send the found post as the response
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ message: 'An error occurred while fetching the post' });
    }
});
// post method for edit posts

app.put('/update/:postId', async (req, res) => {
    const { postId } = req.params;
    const updatedData = { ...req.body };

    try {
        // Check Drafts collection first
        let postToUpdate = await Drafts.findById(postId);

        if (!postToUpdate) {
            // If the post is not in Drafts, check the Posts collection
            postToUpdate = await Posts.findById(postId);
        }

        if (!postToUpdate) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Update times if provided as strings (HH:MM format)
        if (updatedData.startTime && typeof updatedData.startTime === 'string') {
            const [hours, minutes] = updatedData.startTime.split(':');
            const startTime = new Date(postToUpdate.interviewDate || new Date());
            startTime.setHours(parseInt(hours), parseInt(minutes), 0);
            updatedData.startTime = startTime;
        }
        if (updatedData.endTime && typeof updatedData.endTime === 'string') {
            const [hours, minutes] = updatedData.endTime.split(':');
            const endTime = new Date(postToUpdate.interviewDate || new Date());
            endTime.setHours(parseInt(hours), parseInt(minutes), 0);
            updatedData.endTime = endTime;
        }

        // Convert interviewDate to Date if provided as a string
        if (updatedData.interviewDate && typeof updatedData.interviewDate === 'string') {
            updatedData.interviewDate = new Date(updatedData.interviewDate);
        }

        // Create a new post document with updated data
        const updatedPost = {
            jobTitle: updatedData.jobTitle || postToUpdate.jobTitle,
            companyName: updatedData.companyName || postToUpdate.companyName,
            jobDescription: updatedData.jobDescription || postToUpdate.jobDescription,
            interviewAddress: updatedData.interviewAddress || postToUpdate.interviewAddress,
            slotBookingLink: updatedData.slotBookingLink || postToUpdate.slotBookingLink,
            contactPerson: updatedData.contactPerson || postToUpdate.contactPerson,
            interviewDate: updatedData.interviewDate || postToUpdate.interviewDate,
            startTime: updatedData.startTime || postToUpdate.startTime,
            endTime: updatedData.endTime || postToUpdate.endTime
        };

        // Save the updated post back to the correct collection
        if (postToUpdate instanceof Drafts) {
            // If the post was in Drafts, move it to the Posts collection
            const movedPost = new Posts(updatedPost);
            const savedPost = await movedPost.save();

            // Delete the post from Drafts
            await Drafts.findByIdAndDelete(postId);

            return res.json({ message: 'Draft post moved to posts successfully!', post: savedPost });
        } else {
            // If the post was already in Posts, update it directly
            Object.assign(postToUpdate, updatedPost);
            const savedPost = await postToUpdate.save();

            return res.json({ message: 'Post updated successfully!', post: savedPost });
        }

    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ message: 'An error occurred while updating the post', error });
    }
});



// POST route to send contact message
app.post('/contact', async (req, res) => {
    const { email, subject, message } = req.body;

    try {
        const newMessage = new ContactMessage({ email, subject, message });
        const savedMessage = await newMessage.save();
        res.status(201).json({ message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route to create a new blog post
app.post('/blogPosts', async (req, res) => {
    try {
        const newPost = await BlogPost.create(req.body);
        res.status(201).json(newPost);
    } catch (error) {
        console.error('Error saving post:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get All Blog Posts
app.get('/getBlogPosts', async (req, res) => {
    try {
        const posts = await BlogPost.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Read Full Blog
app.get('/blogPosts/:postId', async (req, res) => {
    const { postId } = req.params;

    try {
        const post = await BlogPost.findById(postId) || await Drafts.findById(postId) || await DraftBlogPost.findById(postId);

        if (!post) {
            return res.status(404).json({ message: 'Blog Post not found' });
        }

        res.status(200).json(post); // Send the found post as the response
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ message: 'An error occurred while fetching the post' });
    }
});

app.get('/search', async (req, res) => {
    const { query } = req.query;
    try {
        const jobs = await Posts.find({
            $or: [
                { jobTitle: new RegExp(query, 'i') },
                { jobDescription: new RegExp(query, 'i') },
                { companyName: new RegExp(query, 'i') },
                { interviewAddress: new RegExp(query, 'i') }
            ]
        });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: 'Error searching for jobs' });
    }
});

// Route to delete a blog post by ID
app.delete('/deletePost/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const deletedPost = await BlogPost.findByIdAndDelete(postId);

        if (!deletedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: 'An error occurred while deleting the post' });
    }
});

// Route to update an existing blog post by ID
app.put('/blogPosts/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Step 1: Check if the post already exists in BlogPost collection
        let updatedPost = await BlogPost.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        // Step 2: If not found in BlogPost, look for it in DraftBlogPost
        if (!updatedPost) {
            const draftPost = await DraftBlogPost.findById(id);

            if (draftPost) {
                // Step 3: Create a new post in BlogPost using the draft data
                const newPost = new BlogPost({
                    ...draftPost.toObject(), // Copy all fields from the draft
                    ...req.body // Apply any updates
                });

                updatedPost = await newPost.save();

                // Step 4: Delete the original draft from DraftBlogPost
                await DraftBlogPost.findByIdAndDelete(id);

                return res.status(200).json(updatedPost);
            } else {
                // Draft not found, return a 404 error
                return res.status(404).json({ message: 'Draft post not found' });
            }
        }

        // If updated in BlogPost, return the updated post
        res.status(200).json(updatedPost);

    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Route to delete a job post by ID
app.delete('/deleteJobPost/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const deletedPost = await Posts.findByIdAndDelete(postId);

        if (!deletedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: 'An error occurred while deleting the post' });
    }
});

// Save a new Blog draft
app.post('/draftBlogPost', async (req, res) => {
    try {
        const { title, content } = req.body;
        const draftPost = new DraftBlogPost({ title, content });
        await draftPost.save();
        res.status(201).json(draftPost);
    } catch (error) {
        console.error('Error saving draft:', error);
        res.status(500).json({ error: 'Failed to save draft' });
    }
});

//   Delete from draft
// Route to delete a job post by ID
app.delete('/deleteDraftJob/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const deletedPost = await Drafts.findByIdAndDelete(postId);

        if (!deletedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: 'An error occurred while deleting the post' });
    }
});
// Route to delete a Blog post by ID
app.delete('/deleteDraftBlog/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const deletedPost = await DraftBlogPost.findByIdAndDelete(postId);

        if (!deletedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: 'An error occurred while deleting the post' });
    }
});

// GET route to fetch messages with title, subject, and message fields
app.get("/messages", async (req, res) => {
    try {
      const messages = await ContactMessage.find({}, "email subject message");
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ error: "Error fetching messages" });
    }
  });

const PORT = process.env.PORT || 3001; // Fallback to 3001 if PORT is not defined
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
