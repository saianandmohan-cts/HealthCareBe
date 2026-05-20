const Availability = require('../models/doc_availability');

// 1. DOCTOR DASHBOARD: Doctor apne slots create ya update karega
exports.setAvailability = async (req, res, next) => {
    try {
        const { doctorId, date, slots } = req.body; // slots format: [{time: "09:00 AM"}, {time: "09:30 AM"}]

        // Date ko standard date format mein convert karo (time strip karke)
        const targetDate = new Date(date);
        targetDate.setHours(0,0,0,0);

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeek = days[targetDate.getDay()];

        // Agar us din ki availability pehle se hai toh overwrite/update karo, nahi toh nayi banao
        const availability = await Availability.findOneAndUpdate(
            { doctorId, date: targetDate },
            { 
                doctorId, 
                date: targetDate, 
                dayOfWeek, 
                slots 
            },
            { new: true, upsert: true } // upsert: true se agar nahi mila toh naya create ho jayega
        );

        return res.status(200).json({
            message: "Availability slots updated successfully",
            status: true,
            data: availability
        });
    } catch (err) {
        next(err);
    }
};

// 2. BOOK/MODIFY APPOINTMENT: Patient ke liye slots load karna
exports.getAvailableSlots = async (req, res, next) => {
    try {
        const { doctorId, date } = req.query;
        
        
        const searchDateStr = date.split('T')[0]; 
        const allAvailabilities = await Availability.find({ doctorId: String(doctorId) });

        
        const availability = allAvailabilities.find(a => {
            const dbDateStr = new Date(a.date).toISOString().split('T')[0];
            return dbDateStr === searchDateStr;
        });


        if (!availability) {
            return res.status(200).json({
                message: "No availability found for this date",
                status: false,
                slots: [] // Frontend crash nahi hoga, empty slots dega
            });
        }

        return res.status(200).json({
            status: true,
            slots: availability.slots
        });
    } catch (err) {
        next(err);
    }
};