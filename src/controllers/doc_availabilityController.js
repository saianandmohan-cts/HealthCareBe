const Availability = require('../models/doc_availability');
const Appointment = require('../models/appointment'); 

exports.setAvailability = async (req, res, next) => {
    try {
        const { doctorId, date, slots } = req.body; 

        console.log("📥 Incoming Save Payload:", { doctorId, date, slotsCount: slots?.length });

        if (!doctorId || !date) {
            return res.status(400).json({ success: false, message: "Doctor ID and Date are required" });
        }

        const dateStr = String(date).split('T')[0];
        const dateParts = dateStr.split('-'); 
        
        let targetDate;
        if (dateParts.length === 3) {
            const year = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1; 
            const day = parseInt(dateParts[2], 10);
            targetDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
        } else {
            targetDate = new Date(date);
            targetDate.setUTCHours(0, 0, 0, 0);
        }

        console.log("🚀 Target Date Normalized for Save (UTC):", targetDate.toISOString());

        const query = { doctorId: String(doctorId), date: targetDate };
        const updateData = { doctorId: String(doctorId), date: targetDate, slots: slots };

        const availability = await Availability.findOneAndUpdate(
            query,
            updateData,
            { new: true, upsert: true, runValidators: true } 
        );

        console.log("✅ Availability updated in MongoDB");

        const unavailableTimes = slots
            .filter(slot => slot.isAvailable === false || slot.isAvailable === 'false')
            .map(slot => slot.time); // e.g., ["09:00", "11:00"]

        if (unavailableTimes.length > 0) {
            console.log(`⚠️ Doctor made these slots unavailable: ${unavailableTimes}. Cleaning booked appointments...`);

            const appointmentFilter = {
                doctorId: String(doctorId),
                date: dateStr, 
                time: { $in: unavailableTimes },
                status: { $regex: /^scheduled$/i }
            };

            const cancelResult = await Appointment.updateMany(
                appointmentFilter,
                { $set: { status: 'Cancelled' } }
            );

            console.log(`🚨 Conflict Clean Up Success: ${cancelResult.modifiedCount} appointments auto-cancelled.`);
        }

        return res.status(200).json({
            success: true,
            status: true,
            message: "Availability updated & conflict appointments clean cancelled successfully!",
            data: availability
        });

    } catch (err) {
        console.error("🚨 CRITICAL ERROR inside setAvailability backend:", err.message);
        return res.status(500).json({
            success: false,
            message: "Database transaction failed",
            error: err.message
        });
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
      const dateParts = dateStr.split('-'); 
      
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; 
        const day = parseInt(dateParts[2], 10);
        
        const parsedDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
        query.date = parsedDate;
      }
    }

    console.log("🔍 MongoDB Query Target Hit window:", JSON.stringify(query));

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