const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  doctorId: {
    type: String,
    unique: true,
    index: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  experience: {
    type: Number,
    min: 0,
    max: 99,
    required: true
  },
  department: {
    type: String,
    required: true,
  },
  contactNumber: { 
    type: String,
    match: /^[0-9]{10}$/,
    required: true
  },
  profilePic: {
    type: String,
    default: "www.url.in"
  },
  degree: [{ type: String }],
  role: {
    type: String,
    default: 'DOCTOR'
  },
  // Sahi Reference: Kyunki controller isme Appointment ki ID push karta hai
  appointments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment"
    }
  ]
}, { timestamps: true });

const Doctor = mongoose.model('Doctor', doctorSchema);
module.exports = Doctor;