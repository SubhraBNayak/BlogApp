/*
    @Blogger database schema file
*/

const { json } = require('express');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectID = Schema.ObjectId;

const User = new Schema({
    email : String,
    password : String,
    online : {type:Boolean, default:false}
})

const Blog = new Schema({
    userOID : ObjectID,
    authorEmail : String,
    likeCounter : {type:Number, default:0},
    dislikeCounter : {type:Number, default:0},
    commentCounter : {type:Number, default:0},
    title : {type:String, required: true},
    subtitle : {type:String, required: false},
    content : {type:String, required: true},
    Index : {type:Number}
})

const BlogIndex = new Schema({
    Index : {type:Number}
})

const UserModel = mongoose.model('user', User);
const BlogModel = mongoose.model('blog', Blog);
const BlogIndexModel = mongoose.model('blogindex', BlogIndex);

module.exports = {
    UserModel,
    BlogModel,
    BlogIndexModel
}
