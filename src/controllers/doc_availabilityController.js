const Availability = require('../models/doc_availability');

exports.setAvailability = async (req, res, next) => {
    try {
        const { doctorId, date, slots } = req.body; 

        if (!doctorId || !date) {
            return res.status(400).json({ success: false, message: "Doctor ID and Date are required" });
        }

        const baseDate = new Date(date);
        const year = baseDate.getFullYear();
        const month = baseDate.getMonth(); // 0-11
        const day = baseDate.getDate();

        const targetDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayOfWeek = days[targetDate.getUTCDay()];

        const availability = await Availability.findOneAndUpdate(
            { doctorId: String(doctorId), date: targetDate },
            { 
                doctorId: String(doctorId), 
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
      const dateStr = String(targetDate).split('T')[0];
      const dateParts = dateStr.split('-'); // ["2026", "05", "29"]
      
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; 
        const day = parseInt(dateParts[2], 10);
        
        const parsedDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
        query.date = parsedDate;
      }
    }

    console.log("🚀 MongoDB Query Target Hit window:", JSON.stringify(query));

    const records = await Availability.find(query).sort({ date: 1 });

    if (records && records.length > 0) {
      return res.status(200).json({
        success: true,
        status: "success",
        data: records 
      });
    }

    return res.status(200).json({
      success: true,
      status: "success",
      message: "No Availability Slots Present for this date",
      data: []
    });

  } catch (err) {
    next(err);
  }
};