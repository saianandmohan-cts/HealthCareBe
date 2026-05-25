const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({

  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  
  doctorId: {
    type: String, 
    required: true
  },
  date: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    required: true
  },
  prescriptions: [
    {
      medicineName: { type: String, required: true },
      dosage: { type: String, required: true },
      route: { type: String, required: true },
      frequency: { type: String, required: true }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Consultations', consultationSchema);