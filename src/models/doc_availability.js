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
    dayOfWeek: {
        type: String, 
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    slots: [slotSchema] 
}, {
    timestamps: true 
});

// Ek doctor ek date par do baar availability nahi bana sakta (Duplicate entries se bachayega)
availabilitySchema.index({ doctorId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Availability', availabilitySchema);