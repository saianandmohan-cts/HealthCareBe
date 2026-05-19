const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    appointmentId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    doctorId: {
        type: String,
        required: true
    },
    patient: {
        type: String,
        ref: "Patient",
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {        
        type: String,
        required: true
    },
    mode: {
        type: String,
        required: true,
        enum: ["In-person", "Online"]
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["Completed", "Scheduled", "Cancelled"], // Cancelled option add kiya future use ke liye
        required: true
    },
}, { timestamps: true });

const Appointment = mongoose.model('Appointment', AppointmentSchema);
module.exports = Appointment;