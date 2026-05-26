const Appointment = require('../models/appointment');
const Patient = require('../models/patient'); 


exports.validateSingleAppointmentPerDay = async (req, res, next) => {
  try {
    const { patient_id, date } = req.body;

    if (!patient_id || !date) {
      return next(); 
    }

    const patientData = await Patient.findOne({ patientId: String(patient_id) });
    
    if (!patientData) {
      return next();
    }

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const endOfDate = new Date(checkDate.getTime() + 86400000);

    const alreadyBookedToday = await Appointment.findOne({
      patient: patientData._id, 
      date: { $gte: checkDate, $lt: endOfDate },
      status: { $ne: "Cancelled" }
    });

    if (alreadyBookedToday) {
      return res.status(400).json({
        success: false,
        message: `You already have an active appointment scheduled for date (${date}). Multiple bookings per day are restricted.`
      });
    }

    next(); 
  } catch (err) {
    console.error("Validation Engine Crash Catch:", err.message);
    return res.status(500).json({ message: "Validation Error: " + err.message });
  }
};