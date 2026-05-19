const mongoose = require('mongoose');

const doctorSchema= new mongoose.Schema({
  doctorId :{
    type:String,
    unique:true,
    index:true,
    required:true
  },
  name:{
    type: String,
    required:true
  },

  //Devang added
  password :{
    type: String,
    required : true
  },

  
  experience: {
    type: Number,
    min: 0,
    max: 99,
    required: true
  },
  department:{
    type:String,
    required:true,
  },
  contactNumber: { 
        type: String,
        match: /^[0-9]{10}$/ ,
        required:true
  },
  profilePic:{
    type:String,
    default:"www.url.in"
  },

  degree:[{type:String}],
 
  //Devang added
  role: {
    type: String,
    default: 'DOCTOR'
  },

  appointments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultations"
    }
  ]

},{timestamps:true})

const Doctor = mongoose.model('Doctor',doctorSchema);

module.exports = Doctor;
