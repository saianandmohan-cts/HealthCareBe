const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    medicineName:{
        type:String,
        required:true,
    },
    dosage:{
        type: String,
        required:true,
    }, 
    route: {
        type: String,
        enum: ["Oral", "Injection"],
        required: true
    },
    frequency:{
        type:String,
        required:true
    }
},{
    timestamps:true
})

const ConsultationSchema = new mongoose.Schema({
    consultationId:{
        type: Number,
        required:true,
    },
    doctorId:{
        type: String,
        required:true,
    },
    date:{
        type: Date,
        required:true
    },
    appointmentId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Appointment",
        required:true
    },
    notes:{
        type:String
    },
    prescriptions:[prescriptionSchema]
},{timestamps:true});

const Consultations = mongoose.model('Consultations',ConsultationSchema);

module.exports = Consultations;