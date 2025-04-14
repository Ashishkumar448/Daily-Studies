import express from "express";
import { test,createPost,getAllPosts,getSinglePost,deletePost, updatePost } from '../controllers/post.controller.js'
const router = express.Router();


router.get('/helloWorld', test);
router.post('/createPost', createPost);
router.get('/getallposts', getAllPosts);
router.get('/getsinglepost', getSinglePost);
router.delete('/deletepost', deletePost);
router.put('/updatepost', updatePost);

export default router;