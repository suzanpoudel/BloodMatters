const mongoose = require('mongoose')

const BloodBankSchema = new mongoose.Schema({

    name: {
        type : String,
        required : true
    },
    address: {
        type : String,
        required : true
    },
    contact: {
        type : String,
        required : true
    },
    bloodgroup: [{
        type: {
            type: String,
            enum: ['o_pos', 'o_neg', 'a_pos', 'a_neg', 'b_pos', 'b_neg', 'ab_pos', 'ab_neg'],
            required: true
        },
        quantity: {
            type: Number,
            required: true
        }
    }]

},{timestamps:true})

const BloodBank = mongoose.model('Bloodbank',BloodBankSchema)

module.exports = BloodBank