// id: 204415764,
//     lastName: 'SHERF',
//     firstName: 'NADAV',
//     driverExpires: 2027-02-06T22:00:00.000Z,
//     roshHaAyinCitizen: true,
//     carExpires: 2019-08-12T21:00:00.000Z,
//     carNumber: '9084138' }


const config = require("config");
const mongoose = require("mongoose");
require('mongoose-type-email');



const driverSchema = new mongoose.Schema({
    id: {
        type: Number,
        minLength:8,
        maxLength:10
    },
    firstName: String,
    lastName:String,
    roshHaAyinCitizen:Boolean,
    carNumber:{
        type: Number,
        minLength:6,
        maxLength:9
    },
    driverExpires:Date,
    carExpires:Date,
    email:mongoose.SchemaTypes.Email,
},
    {
    timestamps:true
});


const Driver = mongoose.model("Driver", driverSchema);

exports.Driver = Driver;
