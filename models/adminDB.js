const mongoose = require('mongoose')

// Login Schema
const AdminSchema = new mongoose.Schema({
    email: String,
    password: String
})

// Login Model
const AdminModel = mongoose.model("admins", AdminSchema)
module.exports = AdminModel