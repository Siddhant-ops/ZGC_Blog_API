const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
    blog_id: {
        type: String,
        required: true,
        unique: false,
        index: false
    },
    username: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("CommentSchema", CommentSchema, "comments");