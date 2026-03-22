import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoschema=new Schema({
    videoFile:{
        type:String,
        required:true
    },
    thumbnail:{
        type:String,
        required:true,
    },
    owner:{
        type:mongoose.Types.ObjectId,
        ref:"User",
    },
    title:{
        type:String,
        required:true,
    },
    discription:{
        type:String,
    },
    duration:{
        type:Number,
        required:true
    },
    views:{
        type:Number,
        default:0
    },
    isPublished:{
        type:Boolean,
        required:true,
        default:true
    },


},{timestamps:true})

videoschema.plugin(mongooseAggregatePaginate )
export const Video=mongoose.model("Video",videoschema)