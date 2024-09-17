const mongoose = require('mongoose');
const { Schema } = mongoose;

const postSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title : {
        type: String,
        required: true,
        maxLength: 100,
    },
    description: {
        type: String,
        maxLength: 500,
    },
    media: [{
        url: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['image', 'video', 'pdf', 'other'],  
            required: true,
        },
    }],
    likes:  [{
        user:{
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        }
    }],
    comments: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        text: {
            type: String,
            required: true,
            maxLength: 300,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
