const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema({

    sender : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User'
    },
    receiver : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User'
    },
    status : {
        type : String,
        enum : ['Pending','Accepted','Declined','Completed','Cancelled'],
        default : 'Pending'
    },
    type : {
        type : String,
        enum : ['Donate','Request']
    },
    postId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Post'
    }


},{timestamps:true})

const Activity = mongoose.model('Activity',ActivitySchema)

module.exports = Activity