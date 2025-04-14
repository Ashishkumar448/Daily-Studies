import postModel from "../models/post.model.js";

const test = (req, res, next) => {
    res.send("Hello World ashish");
};

const createPost = async (req, res, next) => {
    try {
        const newPost = new postModel(req.body);
        await newPost.save();
        res.status(201).json({
            success: true,
            post: newPost
        });
        res.redirect('/api/v1/getallposts');
        return; // Add return to prevent next() from being called after redirect
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

};

const getAllPosts = async (req, res, next) => {
    try {
        const posts = await postModel.find();
        res.status(200).json({
            success: true,
            posts
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
    next();
};

const getSinglePost = async (req, res, next) => {
    try {
        const {postId} = req.query;
        if (!postId) {
            return res.status(400).json({ message: "Post ID is required" });
        }
        const post = await postModel.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        res.status(200).json({
            success: true,
            post
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
    next();
};

const deletePost = async (req, res, next) => {
    try {
        const { postId } = req.body;
        if (!postId) {
            return res.status(400).json({ message: "Post ID is required" });
        }
        const post = await postModel.findByIdAndDelete(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        res.status(200).json({ message: "Post deleted successfully", success: true, post });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
    next();
};

const updatePost = async (req, res, next) => {
    try {
        const { postId } = req.body;
        if (!postId) {
            return res.status(400).json({ message: "Post ID is required" });
        }
        const updatedPost = await postModel.findByIdAndUpdate(postId, req.body, { new: true });
        if (!updatedPost) {
            return res.status(404).json({ message: "Post not found" });
        }
        res.status(200).json({ message: "Post updated successfully", success: true, post: updatedPost });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
    next();
};

export{
    test, createPost, getAllPosts, getSinglePost, deletePost, updatePost,
}