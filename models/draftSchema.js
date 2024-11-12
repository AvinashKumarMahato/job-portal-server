const mongoose = require('mongoose');

const DraftSchema = new mongoose.Schema({
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

const Drafts = mongoose.model('drafts', DraftSchema);
module.exports = Drafts;
