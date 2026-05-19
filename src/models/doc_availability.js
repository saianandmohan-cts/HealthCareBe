const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
    time: {
        type: String, 
        required: true
    },
    isBooked: {
        type: Boolean,
        default: false 
    },
    isAvailable: {
        type:Boolean,
        default: true
    }
});

const availabilitySchema = new mongoose.Schema({
    doctorId: {
        type: String, 
        required: true
    },
    date: {
        type: Date, 
        required: true
    },
    slots: [slotSchema] 
}, {
    timestamps: true 
});

availabilitySchema.index({ doctorId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Availability', availabilitySchema);