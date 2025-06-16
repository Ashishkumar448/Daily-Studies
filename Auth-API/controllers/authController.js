import jwt from 'jsonwebtoken';
import { acceptCodeSchema, signinSchema, signupSchema , changePasswordSchema, acceptForgetPasswordCodeSchema} from "../middlewares/validator.js";
import User from "../models/usersModel.js";
import { dohash, doHashValidation, hmacProcess } from "../utils/hashing.js";
import transport from '../middlewares/sendMail.js';

export const signup = async (req, res) => {
    const { email, password } = req.body;
    try {
        const { error, value } = signupSchema.validate({ email, password });

        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message })
        }
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(401).json({ success: false, message: "user already exists" });
        }

        const hashedPassword = await dohash(password, 12);
        const newUser = new User({
            email,
            password: hashedPassword,
        });
        const result = await newUser.save();
        result.password = undefined;
        res.status(201).json({
            success: true, message: "your account has been created successfully",
            result,
        })

    } catch (error) {
        console.log(error);
    }
};

export const signin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const { error, value } = signinSchema.validate({ email, password });
        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message })
        }

        const existingUser = await User.findOne({ email }).select('+password');
        if (!existingUser) {
            return res.status(401).json({ success: false, message: "user doesn't exists" });
        }
        const result = await doHashValidation(password, existingUser.password);
        if (!result) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign({
            userId: existingUser._id,
            email: existingUser.email,
            verified: existingUser.verified,
        }, process.env.TOKEN_SECRET, {
            expiresIn: '8h'
        });

        res.cookie('Authorization', 'bearer' + token, { expires: new Date(Date.now() + 8 * 3600000), httpOnly: process.env.NODE_ENV === 'production', secure: process.env.NODE_ENV === 'production' }).json({ success: true, token, message: 'logged in successfully' });
    } catch (error) {
        console.log(error);
    }
};

export const signout = async (req, res) => {
    res.clearCookie('Authorization').status(200).json({ success: true, message: "Logged out successfully" })
}

export const sendVerificationCode = async (req, res) => {
    const { email } = req.body;
    try {
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (!existingUser) {
            return res.status(404).json({ success: false, message: "user doesn't exists" });
        }
        if (existingUser.verified) {
            return res.status(400).json({ success: false, message: "You are now verified!" });
        }

        const codeValue = Math.floor(Math.random() * 1000000).toString();
        let info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject: "Verification code for app",
            html: '<h1>' + codeValue + '</h1>'
        })

        if (info.accepted[0] === existingUser.email) {
            const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET)
            existingUser.verificationCode = hashedCodeValue;
            existingUser.verificationCodeValidation = Date.now();
            await existingUser.save()
            return res.status(200).json({ success: true, message: "code sent !" })
        }
        res.status(400).json({ success: false, message: "code sending failed !" })


    } catch (error) {
        console.log(error);

    }
}

export const verifyVerificationCode = async (req, res) => {
    const { email, providedCode } = req.body;
    try {
        const { error, value } = acceptCodeSchema.validate({ email, providedCode });
        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message })
        }
        const codeValue = providedCode.toString();
        const existingUser = await User.findOne({ email }).select("+verificationCode +verificationCodeValidation");
        if (!existingUser) {
            return res.status(401).json({ success: false, message: "user doesn't exists" });
        }
        if (existingUser.verified) {
            return res.status(400).json({ success: false, message: "You are already verified" });
        }

        if (
            typeof existingUser.verificationCode !== 'string' ||
            typeof existingUser.verificationCodeValidation !== 'number'
        ) {
            return res.status(400).json({
                success: false,
                message: "Verification code not set or invalid"
            });
        }



        if (Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000) {
            return res.status(400).json({ success: false, message: "Code has been expired" });
        }
        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
        if (hashedCodeValue === existingUser.verificationCode) {
            existingUser.verified = true;
            existingUser.verificationCode = undefined;
            existingUser.verificationCodeValidation = undefined;
            await existingUser.save();
            return res.status(200).json({ success: true, message: "Your account has been verified !" });
        }
        return res.status(400).json({ success: false, message: "unexpected error occured!" });
    } catch (error) {
        console.log(error);

    }
};

export const changePassword = async (req, res) =>{
    const {userId , verified} = req.user;
    const {oldPassword,newPassword} = req.body;
    try {
        const { error, value } = changePasswordSchema.validate({ oldPassword, newPassword });
        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message })
        }
        if(!verified){
             return res.status(401).json({ success: false, message: "You are not verified !" })
        }
        const existingUser = await User.findOne({_id:userId}).select('+password ');
        if (!existingUser) {
            return res.status(401).json({ success: false, message: "user doesn't exists" });
        }
        const result = await doHashValidation(oldPassword, existingUser.password)
        if(!result){
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        const hashedPassword = await dohash(newPassword,12);
        existingUser.password = hashedPassword;
        await existingUser.save();
        return res.status(200).json({ success: true, message: "Password updated!" });

    } catch (error) {
        console.log(error);
        
    }
}



export const sendForgotPasswordCode = async (req, res) => {
    const { email } = req.body;
    try {
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (!existingUser) {
            return res.status(404).json({ success: false, message: "user doesn't exists" });
        }
        
        const codeValue = Math.floor(Math.random() * 1000000).toString();
        let info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject: "Forgot password code for app",
            html: '<h1>' + codeValue + '</h1>'
        })

        if (info.accepted[0] === existingUser.email) {
            const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET)
            existingUser.forgotPasswordCode = hashedCodeValue;
            existingUser.forgotPasswordCodeValidation = Date.now();
            await existingUser.save()
            return res.status(200).json({ success: true, message: "code sent !" })
        }
        res.status(400).json({ success: false, message: "code sending failed !" })


    } catch (error) {
        console.log(error);

    }
}

export const verifyForgotPasswordCode = async (req, res) => {
    const { email, providedCode , newPassword } = req.body;
    try {
        const { error, value } = acceptForgetPasswordCodeSchema.validate({ email, providedCode , newPassword});
        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message })
        }
        const codeValue = providedCode.toString();
        const existingUser = await User.findOne({ email }).select("+forgotPasswordCode +forgotPasswordCodeValidation");
        if (!existingUser) {
            return res.status(401).json({ success: false, message: "user doesn't exists" });
        }
        

        if ( !existingUser.forgotPasswordCode || !existingUser.forgotPasswordCodeValidation ) {
            return res.status(400).json({
                success: false,
                message: "Verification code not set or invalid"
            });
        }



        if (Date.now() - existingUser.forgotPasswordCodeValidation > 5 * 60 * 1000) {
            return res.status(400).json({ success: false, message: "Code has been expired" });
        }
        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
        if (hashedCodeValue === existingUser.forgotPasswordCode) {
            const hashedPassword = await dohash(newPassword, 12);
            existingUser.password = hashedPassword;
            existingUser.forgotPasswordCode = undefined;
            existingUser.forgotPasswordCodeValidation = undefined;
            await existingUser.save();
            return res.status(200).json({ success: true, message: "Your account has been verified !" });
        }
        return res.status(400).json({ success: false, message: "unexpected error occured!" });
    } catch (error) {
        console.log(error);

    }
};
