const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    reset_link: {
        type: String,
        required: false
    },
    blogs: [String]
}, {
    timestamps: true
});

module.exports = mongoose.model("UserSchema", UserSchema, "users");