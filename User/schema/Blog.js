const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    comments: [String]
}, {
    timestamps: true
});

module.exports = mongoose.model("BlogSchema", BlogSchema, "blogs");