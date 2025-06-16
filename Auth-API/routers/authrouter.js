import express from 'express';
import {signup,signin, signout, sendVerificationCode, verifyVerificationCode, changePassword, sendForgotPasswordCode, verifyForgotPasswordCode} from '../controllers/authController.js'
import { identifier } from '../middlewares/identification.js';
const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/signout', identifier, signout);

router.patch('/send-verification-code',  sendVerificationCode);
router.patch('/verify-verification-code',identifier, verifyVerificationCode);
router.patch('/change-password',identifier, changePassword);
router.patch('/send-forgot-password-code', sendForgotPasswordCode);
router.patch('/verify-forgot-password-code', verifyForgotPasswordCode);


export default router;
