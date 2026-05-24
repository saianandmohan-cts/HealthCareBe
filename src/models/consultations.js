const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  // Automatic Unique Hex Reference directly linked to Appointment document
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  // Directly linked to Patient document for standalone analytics tracking
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  // Custom string identifier mapped with doctor schema fields
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