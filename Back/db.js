/*
    @Blogger database schema file
*/

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectID = Schema.ObjectID;

const User = new Schema({
    email : String,
    password : String,
    online : {type:Boolean, default:false}
})

const UserModel = mongoose.model('user', User);

module.exports = {
    UserModel
}