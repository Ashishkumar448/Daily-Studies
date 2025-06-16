import mongoose from "mongoose";

const postSchema = mongoose.Schema({
    title:{
        type:String,
        required:[true, "title is required"],
        trim:true
    },
    description:{
        type:String,
        required:[true, "Description is required"],
        trim:true
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    }
},{
    timestamps:true
});

export default mongoose.model('Post', postSchema);