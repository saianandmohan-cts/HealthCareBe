const mongoose=require("mongoose");

const patientSchema=new mongoose.Schema({
    patientId: { 
        type: String, 
        unique: true 
    },
    
    name: { 
        type: String, 
        required: true ,
        trim:true 
    },
    
    age: { type: Number ,
        required:true
    },
    gender: { 
            type: String,
            enum: ["Male", "Female", "Other"] 
        },
    contactNumber: { 
        type: String,
         match: /^[0-9]{10}$/ ,
        required:true
    },
    email: { 
        type: String ,
        required:true,
        lowercase:true,
        trim:true,
        unique:true,
        index:true,
        match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
    },
    password: {
        type: String,
        minlength:8,
        required:true,
    },
    address: { type: String },

    medicalHistory: { type: [String], default: [] },  
        
    allergy: { type: [String], default: [] },

    doctorAssigned: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor"
    }],

    consultations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Consultations"
    }],

},

{ timestamps: true });

const Patient= mongoose.model("Patient",patientSchema);

module.exports = Patient;