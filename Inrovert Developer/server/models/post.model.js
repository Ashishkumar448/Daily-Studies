import mongoose from "mongoose";

const postSchema = mongoose.Schema({
    topic:{
        type:String,
        required:[true,"Topic is required"]
    },
    question:{
        type:String,
        required:[true,"question is required"]
    },
    answer:{
        type:String,
        required:[true,"Answer is required"]
    }
});

const postModel= mongoose.model("QuestionPost",postSchema);
export default postModel;