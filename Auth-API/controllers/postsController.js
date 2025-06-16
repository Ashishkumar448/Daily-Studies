import posts from "../models/postsModel.js";
import { createPostSchema } from "../middlewares/validator.js";


export const getPost = async (req, res) => {
    const { page } = req.query;
    const postsPerPage = 10;

    try {
        let pageNum = 0;
        if (page <= 1) {
            pageNum = 0;
        } else {
            pageNum = page - 1;
        }

        const result = await posts.find().sort({ createdAt: -1 }).skip(pageNum * postsPerPage).limit(postsPerPage).populate({
            path: 'userId',
            select: 'email'
        });
        res.status(200).json({ success: true, message: 'posts', data: result })
    } catch (error) {
        console.log(error);

    }

};



export const singlePost = async (req, res) => {
    const { _id } = req.query;
    try {

        const result = await posts.findOne({ _id }).populate({
            path: 'userId',
            select: 'email'
        });
        if (!existingPost) {
            return res.status(404).json({ success: false, message: 'post not found' })
        }
        res.status(200).json({ success: true, message: 'single  posts', data: result })
    } catch (error) {
        console.log(error);

    }
}

export const createPost = async (req, res) => {
    const { title, description } = req.body;
    const { userId } = req.user;

    try {
        const { error, value } = createPostSchema.validate({ title, description, userId });
        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message })
        }

        const result = await posts.create({
            title, description, userId,
        });
        res.status(201).json({ success: true, message: 'created', data: result })


    } catch (error) {
        console.log(error);
    }
};


export const updatePost = async (req, res) => {
    const {_id} = req.query;
    const { title, description } = req.body;
    const { userId } = req.user;

    try {
        const { error, value } = createPostSchema.validate({ title, description, userId });
        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message })
        }
        const existingPost = await posts.findOne({ _id });
        if (!existingPost) {
            return res.status(404).json({ success: false, message: 'post not found' })
        }
        if(existingPost.userId.toString() !== userId){
            return res.status(404).json({ success: false, message: 'Unauthorized' })
        }
        existingPost.title = title;
        existingPost.description = description;
        const result = await existingPost.save()
        res.status(200).json({ success: true, message: 'Post updated', data: result })


    } catch (error) {
        console.log(error);
    }
}

export const deletePost = async (req, res) => {
    const {_id} = req.query;
    const { userId } = req.user;

    try {
        const existingPost = await posts.findOne({ _id });
        if (!existingPost) {
            return res.status(404).json({ success: false, message: 'post already unavailable!' })
        }
        if(existingPost.userId.toString() !== userId){
            return res.status(404).json({ success: false, message: 'Unauthorized' })
        }
        
       await posts.deleteOne({_id})
        res.status(200).json({ success: true, message: 'Post deleted' })


    } catch (error) {
        console.log(error);
    }
}