const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    name:{ type: String, index: true },
    email:String,
    age:Number
})

const UserModel = mongoose.model("users",UserSchema)
module.exports = UserModel 