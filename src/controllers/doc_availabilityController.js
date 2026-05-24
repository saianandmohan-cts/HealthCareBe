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
exports.getAvailabilitySlots = async (req, res, next) => {
  try {
    // Agar URL me doctorId query me aa rahi hai (Patient side se), toh wo lo, nahi toh logged-in doctor ki ID lo
    const targetDoctorId = req.query.doctorId || (req.doctor ? req.doctor.dId : null);
    const targetDate = req.query.date;

    if (!targetDoctorId) {
      return res.status(400).json({ success: false, message: "Doctor ID is required" });
    }

    let query = { doctorId: String(targetDoctorId) };

    // Agar patient ne specific date select ki hai, toh date filter bhi jodo
    if (targetDate) {
      const isoDateString = new Date(targetDate).toISOString().split('T')[0];
      const parsedDate = new Date(`${isoDateString}T00:00:00.000Z`);
      query.date = parsedDate;
    }

    console.log("Fetching slots with query:", query);
    const records = await Availability.find(query).sort({ date: 1 });

    // Agar pure din ka object mila hai, toh uski key structured data format me bhejein
    // Taaki frontend ka slotsArray loop safely chal sake
    if (records && records.length > 0) {
      return res.status(200).json({
        success: true,
        status: "success",
        data: records[0] // Pehla matching day record bhej rahe hain jisme slots array hai
      });
    }

    return res.status(404).json({
      success: false,
      status: "not_found",
      message: "No Availability Slots Present for this date"
    });

  } catch (err) {
    console.error("Error in getAvailabilitySlots:", err);
    next(err);
  }
};