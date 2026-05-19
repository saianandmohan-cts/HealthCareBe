const Appointment = require('../models/appointment');
const Availability = require('../models/doc_availability'); 
const Doctor = require('../models/doctor');            


exports.bookAppointment = async (req, res) => {
  try {
    console.log("== BACKEND HIT RECEIVED == ", req.body); 

    const { patient_id, doctorId, date, time, mode, reason } = req.body; 
    
    if (!patient_id || !doctorId || !date || !time || !mode || !reason) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // Unique ID generation
    const count = await Appointment.countDocuments();
    const appointmentId = Date.now().toString();    

    // ✅ STEP 1: Main Appointment Document Create karo
    const appointment = await Appointment.create({ 
      appointmentId, 
      doctorId, 
      patient: patient_id, // Custom ID '1' will be saved cleanly as String
      date: new Date(date), 
      time, 
      mode,
      reason,
      status: "Scheduled" 
    });

    console.log("🎯 Main Appointment Document Saved:", appointment);

    // ✅ STEP 2: Baaki tables ka update safe block me daal diya taaki server 500 error na de!
    try {
      const searchDate = new Date(date);
      searchDate.setHours(0,0,0,0);
      
      await Availability.updateOne(
          { doctorId: String(doctorId), date: searchDate, "slots.time": time },
          { $set: { "slots.$.isBooked": true } }
      );
    } catch (slotErr) {
      console.error("Availability slot lock failed but skipping crash:", slotErr.message);
    }

    try {
      await Doctor.updateOne(
          { doctorId: String(doctorId) },
          { $push: { appointments: appointment._id } }
      );
    } catch (docErr) {
      console.error("Doctor array update failed but skipping crash:", docErr.message);
    }

    // ✅ STEP 3: Return clean success response to Frontend
    return res.status(201).json({ 
      message: "Appointment booked successfully", 
      appointment 
    });

  } catch (err) {
    console.error("❌ CRITICAL BOOKING ERROR:", err.message);
    return res.status(500).json({ message: "Server Error: " + err.message });
  }
};


exports.modifyAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.appointmentId;
    
    // ✅ FIX 1: Body se date, time, status ke sath mode aur reason bhi extract kiya
    const { date, time, status, mode, reason } = req.body;

    // Purani appointment details nikalte hain taaki pata chale purana slot kaunsa khali karna hai
    const oldAppointment = await Appointment.findOne({ appointmentId: appointmentId });
    if (!oldAppointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    const updates = {};
    if (date) updates.date = date;
    if (time) updates.time = time;
    if (status) updates.status = status;
    if (mode) updates.mode = mode;     // ✅ Added updatable field
    if (reason) updates.reason = reason; // ✅ Added updatable field

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    // Appointment ko Update kiya database mein
    const updatedAppointment = await Appointment.findOneAndUpdate(
      { appointmentId: appointmentId },
      { $set: updates },
      { new: true }
    );

    // ✅ Availability Slot management
    if (date || time) {
      try {
        // 1. Purane doctor/date/time wale slot ko wapas FREE karo (isBooked: false)
        const oldDate = new Date(oldAppointment.date);
        oldDate.setHours(0,0,0,0);
        await Availability.updateOne(
            { doctorId: String(oldAppointment.doctorId), date: oldDate, "slots.time": oldAppointment.time },
            { $set: { "slots.$.isBooked": false } }
        );

        // 2. Naye dynamic date/time wale slot ko LOCK karo (isBooked: true)
        const newDate = new Date(updatedAppointment.date);
        newDate.setHours(0,0,0,0);
        await Availability.updateOne(
            { doctorId: String(updatedAppointment.doctorId), date: newDate, "slots.time": updatedAppointment.time },
            { $set: { "slots.$.isBooked": true } }
        );
      } catch (slotErr) {
        console.error("Availability update failed during modification, skipping crash:", slotErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: "Appointment updated successfully",
      data: updatedAppointment
    });

  } catch (err) {
    console.error("Error updating appointment:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message
    });
  }
};


exports.getById = async (req, res) => {
  try {
    const appointmentId = req.params.appointmentId;
    
    // Database se appointmentId matching record nikalenge
    const appointment = await Appointment.findOne({ appointmentId: appointmentId });
    
    if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
    }
    
    // Safe standard payload return
    return res.status(200).json(appointment);
  } catch (err) {
    console.error("Error in getById controller:", err.message);
    return res.status(500).json({ message: err.message });
  }
};