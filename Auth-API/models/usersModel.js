
import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    email:{
        type:String,
        required:[true , "E-mail is required"],
        trim:true,
        unique:[true ,"E-mail must be unique"],
        minLength:[5,"E-mail must have 5 chars"],
        lowercase:true,
    },
    password:{
        type:String,
        required:[true, "password must be provided"],
        trim:true,
        select:false,
    },
    verified:{
        type:Boolean,
        default:false,
    },
    verificationCode:{
        type:String,
        select:false,
    },
    verificationCodeValidation:{
        type:Number,
        select:false,
    },
    forgotPasswordCode:{
        type:String,
        select:false,
    },
    forgotPasswordCodeValidation:{
        type:Number,
        select:false,
    }
},{
    timestamps:true,
});

export default mongoose.model('User', userSchema);
