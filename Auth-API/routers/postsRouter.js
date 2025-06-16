import express from 'express';
import { identifier } from '../middlewares/identification.js';
import {getPost, createPost, singlePost, updatePost, deletePost} from '../controllers/postsController.js'
const router = express.Router();

router.get('/all-post', getPost);
router.get('/single-post', singlePost);
router.post('/create-post', identifier, createPost);

router.put('/update-post', identifier, updatePost);
router.delete('/delete-post',identifier, deletePost);



export default router;
