const Appointment = require('../models/appointment');
const Availability = require('../models/doc_availability'); 
const Doctor = require('../models/doctor');            
const Patient = require('../models/patient'); 

exports.bookAppointment = async (req, res) => {
  try {
    const { patient_id, doctorId, date, time, mode, reason } = req.body; 
    
    if (!patient_id || !doctorId || !date || !time || !mode || !reason) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const patientData = await Patient.findOne({ patientId: String(patient_id) });
    if (!patientData) {
        return res.status(404).json({ message: "Patient not found in database" });
    }

   
    const checkDate = new Date(date);
    checkDate.setUTCHours(0, 0, 0, 0);

   
    const startOfTargetDay = new Date(checkDate);
    const endOfTargetDay = new Date(checkDate);
    endOfTargetDay.setUTCHours(23, 59, 59, 999);

    const existingBooking = await Appointment.findOne({ 
      doctorId: String(doctorId), 
      date: { $gte: startOfTargetDay, $lte: endOfTargetDay }, 
      time,
      status: "Scheduled" 
    });

    if (existingBooking) {
      return res.status(400).json({ 
        success: false, 
        message: "This specific time slot has just been booked by another patient. Please select another slot!" 
      });
    }

    const appointmentId = Date.now().toString();    

   
    const appointment = await Appointment.create({ 
      appointmentId, 
      doctorId: String(doctorId), 
      patient: patientData._id, 
      date: checkDate, 
      time, 
      mode,
      reason,
      status: "Scheduled" 
    });

    try {
      await Availability.updateOne(
          { doctorId: String(doctorId), date: checkDate, "slots.time": time },
          { $set: { "slots.$.isBooked": true } }
      );
    } catch (slotErr) {
      console.error("Availability sync failed:", slotErr.message);
    }

    try {
      await Doctor.updateOne(
          { doctorId: String(doctorId) },
          { $push: { appointments: appointment._id } } 
      );
    } catch (docErr) {
      console.error("Doctor profile sync failed:", docErr.message);
    }

    return res.status(201).json({ 
      success: true,
      message: "Appointment booked successfully", 
      appointment 
    });

  } catch (err) {
    return res.status(500).json({ message: "Server Error: " + err.message });
  }
};

exports.modifyAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.appointmentId;
    const { date, time, status, mode, reason } = req.body;

    const oldAppointment = await Appointment.findOne({ appointmentId: appointmentId });
    if (!oldAppointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    const updates = {};
    if (date) {
      const updateDateNormalized = new Date(date);
      updateDateNormalized.setUTCHours(0, 0, 0, 0);
      updates.date = updateDateNormalized;
    }
    if (time) updates.time = time;
    if (status) updates.status = status;
    if (mode) updates.mode = mode;    
    if (reason) updates.reason = reason; 

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    if (date || time) {
      const targetDate = updates.date || new Date(oldAppointment.date);
      const targetTime = updates.time || oldAppointment.time;

      const startOfTargetDay = new Date(targetDate);
      startOfTargetDay.setUTCHours(0, 0, 0, 0);
      
      const endOfTargetDay = new Date(targetDate);
      endOfTargetDay.setUTCHours(23, 59, 59, 999);

      const doctorConflict = await Appointment.findOne({
        doctorId: String(oldAppointment.doctorId),
        date: { $gte: startOfTargetDay, $lte: endOfTargetDay },
        time: targetTime,
        status: "Scheduled",
        appointmentId: { $ne: appointmentId }
      });

      if (doctorConflict) {
        return res.status(400).json({ 
          success: false, 
          message: "The doctor is already booked at this specific time slot. Please choose another time!" 
        });
      }

      const patientConflict = await Appointment.findOne({
        patient: oldAppointment.patient,
        date: { $gte: startOfTargetDay, $lte: endOfTargetDay },
        time: targetTime,
        status: "Scheduled",
        appointmentId: { $ne: appointmentId }
      });

      if (patientConflict) {
        return res.status(400).json({ 
          success: false, 
          message: "You already have another appointment scheduled at this exact time! Please select a different slot." 
        });
      }
    }

    const updatedAppointment = await Appointment.findOneAndUpdate(
      { appointmentId: appointmentId },
      { $set: updates },
      { new: true }
    );

    if (date || time) {
      try {
        const oldDateNormalized = new Date(oldAppointment.date);
        oldDateNormalized.setUTCHours(0, 0, 0, 0);
        await Availability.updateOne(
            { doctorId: String(oldAppointment.doctorId), date: oldDateNormalized, "slots.time": oldAppointment.time },
            { $set: { "slots.$.isBooked": false } }
        );

        const newDateNormalized = new Date(updatedAppointment.date);
        newDateNormalized.setUTCHours(0, 0, 0, 0);
        await Availability.updateOne(
            { doctorId: String(updatedAppointment.doctorId), date: newDateNormalized, "slots.time": updatedAppointment.time },
            { $set: { "slots.$.isBooked": true } }
        );
      } catch (slotErr) {
        console.error("Availability sync error:", slotErr.message);
      }
    }

    res.status(200).json({ success: true, message: "Appointment updated successfully", data: updatedAppointment });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const appointmentId = req.params.appointmentId;
    const appointment = await Appointment.findOne({ appointmentId: appointmentId });
    if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
    }
    return res.status(200).json(appointment);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};