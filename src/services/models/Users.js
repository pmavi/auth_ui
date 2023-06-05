const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({

    email:{
        type:String,
        unique:true
    },
    password:{
        type:String
    },
    first_name:String,
   last_name:String,
   terms:{
    type:Boolean,
    default:false
   },
   loggedIn:{
    type:Boolean,
    default:false
   },
   token:String,
   reset_password_expires:Date
},{timestamp:true});

const Users = mongoose.model("Users", UserSchema);

module.exports = Users;
