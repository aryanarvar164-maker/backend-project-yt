import dotenv from 'dotenv'
import connectDB from './db/index.js'
// import mongoose from "mongoose";
// import {DB_NAME} from "./constants"

dotenv.config({ path: '../.env' })

connectDB()
.then(()=>{
    app.on("err",(err)=>{
        console.log("error in express connectiondb ",err);
        throw err
        
    })
    app.listen(process.env.PORT||8000,() => {
  console.log(`Example app listening on port ${process.env.PORT}`) })
})
.catch((err)=>{
    console.log("connection from db was failed !!!",err);
    
})

/*    approach one => direct in main file (index.js)
import express from "express"

const app=express()

//m-1 not recommended
// function DBconnection(){}

// DBconnection()

//m-2 industry approach by using ify and add ; before start for safe
;(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        app.on("error",(error)=>{
            console.log("error will ocuur",error);
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`app was listning on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.error("error: ",error)
    }
})()

*/