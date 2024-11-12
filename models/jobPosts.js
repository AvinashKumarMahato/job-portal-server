const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    jobTitle: {
        type: String,
        required: true
    },
    companyName: {
        type: String,
        required: true
    },
    jobDescription: {
        type: String,
        required: true
    },
    interviewAddress: {
        type: String,
        required: true
    },
    slotBookingLink: { type: String, required: false, validate: {
        validator: function(v) {
            return !v || /https?:\/\/.+/.test(v); // Accept null or valid URL
        },
        message: props => `${props.value} is not a valid URL!`
    }}, 
    contactPerson: {
        type: String,
        required: false
    },
    interviewDate: {
        type: Date,  // Use Date for better handling
        required: true
    },
    startTime: {
        type: Date,  // Changed to Date for better time handling
        required: true
    },
    endTime: {
        type: Date,  // Changed to Date for better time handling
        required: false
    }
}, { timestamps: true });


// // Create an index on the interviewDate field for sorting
// PostSchema.index({ interviewDate: -1 });  // -1 for descending order

// Optionally, create an index on createdAt for sorting by creation date
PostSchema.index({ createdAt: -1 });  // -1 for descending order


const Posts = mongoose.model('posts', PostSchema);
module.exports = Posts;
