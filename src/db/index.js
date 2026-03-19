import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB=async ()=>{
    try {
        const connectioninstances=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        console.log(`mongoDB connected !! DB host ${connectioninstances.connection.host}`);
        
    } catch (error) {
        console.log("error will occur in mogodb connection failed",error);
        process.exit(1)
    }
}

export default connectDB