const Availability = require('../models/doc_availability');

exports.setAvailability = async (req, res, next) => {
    try {
        const { doctorId, date, slots } = req.body; 

        const targetDate = new Date(date);
        targetDate.setHours(0,0,0,0);

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeek = days[targetDate.getDay()];

        const availability = await Availability.findOneAndUpdate(
            { doctorId, date: targetDate },
            { 
                doctorId, 
                date: targetDate, 
                dayOfWeek, 
                slots 
            },
            { new: true, upsert: true } 
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

exports.getAvailabilitySlots = async (req, res, next) => {
  try {
    const targetDoctorId = req.query.doctorId || (req.doctor ? req.doctor.dId : null);
    const targetDate = req.query.date;

    if (!targetDoctorId) {
      return res.status(400).json({ success: false, message: "Doctor ID is required" });
    }

    let query = { doctorId: String(targetDoctorId) };

    if (targetDate) {
      const isoDateString = new Date(targetDate).toISOString().split('T')[0];
      const parsedDate = new Date(`${isoDateString}T00:00:00.000Z`);
      query.date = parsedDate;
    }

    const records = await Availability.find(query).sort({ date: 1 });

    if (records && records.length > 0) {
      return res.status(200).json({
        success: true,
        status: "success",
        data: records[0] 
      });
    }

    return res.status(404).json({
      success: false,
      status: "not_found",
      message: "No Availability Slots Present for this date"
    });

  } catch (err) {
    next(err);
  }
};