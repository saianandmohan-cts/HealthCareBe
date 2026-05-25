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

    const appointmentId = Date.now().toString();    

    const appointment = await Appointment.create({ 
      appointmentId, 
      doctorId, 
      patient: patientData._id, 
      date: new Date(date), 
      time, 
      mode,
      reason,
      status: "Scheduled" 
    });

    try {
      const searchDate = new Date(date);
      searchDate.setHours(0,0,0,0);
      
      await Availability.updateOne(
          { doctorId: String(doctorId), date: searchDate, "slots.time": time },
          { $set: { "slots.$.isBooked": true } }
      );
    } catch (slotErr) {}

    try {
      await Doctor.updateOne(
          { doctorId: String(doctorId) },
          { $push: { appointments: appointment._id } } 
      );
    } catch (docErr) {}

    return res.status(201).json({ 
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
    if (date) updates.date = date;
    if (time) updates.time = time;
    if (status) updates.status = status;
    if (mode) updates.mode = mode;     
    if (reason) updates.reason = reason; 

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    const updatedAppointment = await Appointment.findOneAndUpdate(
      { appointmentId: appointmentId },
      { $set: updates },
      { new: true }
    );

    if (date || time) {
      try {
        const oldDate = new Date(oldAppointment.date);
        oldDate.setHours(0,0,0,0);
        await Availability.updateOne(
            { doctorId: String(oldAppointment.doctorId), date: oldDate, "slots.time": oldAppointment.time },
            { $set: { "slots.$.isBooked": false } }
        );

        const newDate = new Date(updatedAppointment.date);
        newDate.setHours(0,0,0,0);
        await Availability.updateOne(
            { doctorId: String(updatedAppointment.doctorId), date: newDate, "slots.time": updatedAppointment.time },
            { $set: { "slots.$.isBooked": true } }
        );
      } catch (slotErr) {}
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