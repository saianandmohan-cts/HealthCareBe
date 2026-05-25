const Doctor = require('../models/doctor');
const Appointment = require('../models/appointment');
const Availability = require('../models/doc_availability');
const mongoose = require('mongoose');
const Consultations = require('../models/Consultations');

exports.getAllDoctorInfo = async (req, res, next) => {
  try {
    const allDoctor = await Doctor.find({});
    if (allDoctor.length > 0) {
      return res.status(200).json({ success: true, status: "success", data: allDoctor });
    } else {
      return res.status(404).json({ success: false, status: "not_found", message: "No Doctor Data Found in Database" });
    }
  } catch (error) {
    next(error);
  }
};

exports.getDoctor = async (req, res, next) => {
    try {
        const currentDoctorId = req.doctor.dId;
        const doctorInfo = await Doctor.findOne({ doctorId: currentDoctorId });
        
        if (doctorInfo) {
          return res.status(200).json({ success: true, status: "success", data: doctorInfo });
        } else {
          return res.status(404).json({ success: false, status: "not_found", message: "Doctor Not Found" });
        }
    } catch (err) {
        next(err);
    }
};

exports.getDoctorById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const doctorInfo = await Doctor.findOne({ doctorId: id }).select('-password');

    if (doctorInfo) {
      return res.status(200).json({ success: true, status: "success", data: doctorInfo });
    } else {
      return res.status(404).json({ success: false, status: "not_found", message: `Doctor with Id: ${id} is not in database` });
    }
  } catch (err) {
    next(err);
  }
};

exports.deleteAppointment = async (req, res, next) => {
  try {
    const appointmentId = req.params.id;
    const result = await Appointment.deleteOne({ appointmentId });

    if (result.deletedCount > 0) {
      return res.status(200).json({ success: true, status: "success", message: `Appointment ${appointmentId} deleted successfully` });
    } else {
      return res.status(404).json({ success: false, status: "not_found", message: `Appointment ${appointmentId} doesn't exist` });
    }
  } catch (err) {
    next(err);
  }
};

exports.getAllAppointments = async (req, res, next) => {
  try {
    const doctorId = req.params.doctorId;
    const allAppointments = await Appointment.find({ doctorId }).populate('patient');

    if (allAppointments.length > 0) {
      return res.status(200).json({ success: true, status: "success", message: "Appointments fetched successfully", data: allAppointments });
    } else {
      return res.status(404).json({ success: false, status: "not_found", message: "No Appointments Available" });
    }
  } catch (err) {
    next(err);
  }
};

exports.getUpcomingAppointments = async (req, res, next) => {
  try {
    const currentDoctorId = req.doctor.dId;
    
    const appointments = await Appointment.find({
      doctorId: String(currentDoctorId),
      status: "Scheduled"
    }).populate('patient').sort({ date: 1, time: 1 });

    const todayStr = new Date().toISOString().split('T')[0];
    const populatedAppointments = [];

    for (const app of appointments) {
      const appDateStr = new Date(app.date).toISOString().split('T')[0];

      if (appDateStr >= todayStr) {
        const appObj = app.toObject();
        const patientData = app.patient; 

        appObj.patient = patientData ? {
          name: patientData.name,
          patientId: patientData.patientId,
          medicalHistory: patientData.medicalHistory?.join(", ") || "None",
          allergy: patientData.allergy?.join(", ") || "No known allergies"
        } : { name: "Unknown Patient", patientId: "N/A", medicalHistory: "None", allergy: "None" };
        
        appObj.date = appDateStr;
        populatedAppointments.push(appObj);
      }
    }

    return res.status(200).json({ success: true, status: "success", data: populatedAppointments });
  } catch (err) {
    next(err);
  }
};

exports.getPastAppointments = async (req, res, next) => {
  try {
    const currentDoctorId = req.doctor.dId;

    const appointments = await Appointment.find({
      doctorId: String(currentDoctorId)
    }).populate('patient').sort({ date: -1, time: -1 });

    const todayStr = new Date().toISOString().split('T')[0];
    
    const populatedPast = await Promise.all(appointments.map(async (app) => {
      const appDateStr = app.date ? new Date(app.date).toISOString().split('T')[0] : '';

      if (appDateStr < todayStr || app.status === "Completed" || app.status === "Cancelled") {
        const appObj = app.toObject();
        const patientData = app.patient;

        appObj.patient = patientData ? {
          name: patientData.name,
          patientId: patientData.patientId,
          medicalHistory: patientData.medicalHistory?.join(", ") || "None",
          allergy: patientData.allergy?.join(", ") || "No known allergies"
        } : { name: "Unknown Patient", patientId: "N/A", medicalHistory: "None", allergy: "None" };

        appObj.date = appDateStr;

        const cleanInternalId = app._id ? String(app._id).trim() : '';
        const cleanCustomId = app.appointmentId ? String(app.appointmentId).trim() : '';

        let consultation = null;
        const hexObjectIdPattern = /^[0-9a-fA-F]{24}$/;

        if (cleanInternalId && hexObjectIdPattern.test(cleanInternalId)) {
          consultation = await Consultations.findOne({ appointmentId: cleanInternalId });
        }

        if (!consultation && cleanCustomId && hexObjectIdPattern.test(cleanCustomId)) {
          consultation = await Consultations.findOne({ appointmentId: cleanCustomId });
        }

        if (!consultation) {
          const targetNum = !isNaN(cleanCustomId) ? Number(cleanCustomId) : (!isNaN(cleanInternalId) ? Number(cleanInternalId) : 0);
          if (targetNum > 0) {
            consultation = await Consultations.findOne({ consultationId: targetNum });
          }
        }

        if (consultation) {
          appObj.notes = consultation.notes || "No notes added";
          appObj.prescriptions = (consultation.prescriptions || []).map(p => ({
            medicineName: p.medicineName || p.name || 'General Medicine',
            dosage: p.dosage || 'N/A',
            route: p.route || 'Oral',
            frequency: p.frequency || 'As directed'
          }));
          appObj.consultationId = consultation.consultationId;
        } else {
          appObj.notes = "No notes added";
          appObj.prescriptions = [];
          appObj.consultationId = null;
        }
        return appObj;
      }
      return null; 
    }));

    const finalCleanList = populatedPast.filter(item => item !== null);

    return res.status(200).json({ 
      success: true, 
      status: "success", 
      count: finalCleanList.length, 
      data: finalCleanList 
    });

  } catch (err) {
    next(err);
  }
};

exports.getAvailabilitySlots = async (req, res, next) => {
  try {
    let targetDoctorId = req.query.doctorId;
    if (!targetDoctorId && req.doctor && req.doctor.dId) {
      targetDoctorId = req.doctor.dId;
    }
    if (!targetDoctorId) {
      targetDoctorId = "D001"; 
    }

    const targetDate = req.query.date;

    if (targetDate) {
      const isoDateString = new Date(targetDate).toISOString().split('T')[0];
      const parsedDate = new Date(`${isoDateString}T00:00:00.000Z`);

      const record = await mongoose.model('Availability').findOne({ 
        doctorId: String(targetDoctorId), 
        date: parsedDate 
      });

      if (record) {
        return res.status(200).json({ success: true, status: "success", data: record });
      } else {
        return res.status(200).json({ success: true, status: "success", data: { slots: [] } });
      }
    }
    
    const records = await mongoose.model('Availability').find({ doctorId: String(targetDoctorId) }).sort({ date: 1 });
    return res.status(200).json({ success: true, status: "success", data: records });

  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
};

exports.updateAvailabilitySlots = async (req, res, next) => {
  try {
    const { _id, doctorId, date, slots } = req.body;

    if (_id) {
      const updatedRecord = await mongoose.model('Availability').findByIdAndUpdate(
        _id,
        { $set: { slots: slots } },
        { new: true }
      );
      return res.status(200).json({ success: true, message: "Availability slots updated successfully", data: updatedRecord });
    }

    const isoDateString = new Date(date).toISOString().split('T')[0];
    const parsedDate = new Date(`${isoDateString}T00:00:00.000Z`);

    const updatedRecord = await mongoose.model('Availability').findOneAndUpdate(
      { doctorId: String(doctorId || "D001"), date: parsedDate },
      { $set: { slots: slots } },
      { new: true, upsert: true }
    );

    return res.status(200).json({ success: true, message: "Availability slots updated successfully", data: updatedRecord });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server internal error while saving slots", error: err.message });
  }
};

exports.createPrescription = async (req, res) => {
  try {
    const { consultationId, doctorId, date, appointmentId, notes, prescriptions } = req.body;

    if (!doctorId || !appointmentId || !date) {
      return res.status(400).json({ success: false, status: "error", message: "Required fields missing." });
    }

    const cleanApptId = String(appointmentId).trim();

    const currentAppt = await Appointment.findOne({ appointmentId: cleanApptId }) || 
                        (cleanApptId.match(/^[0-9a-fA-F]{24}$/) ? await Appointment.findById(cleanApptId) : null);

    if (!currentAppt) {
      return res.status(404).json({ success: false, status: "error", message: "Associated appointment details not found." });
    }

    const formattedPrescriptions = (prescriptions || []).map(p => ({
      medicineName: p.medicineName || p.name || 'General Medicine',
      dosage: String(p.dosage || 'N/A'),
      route: p.route || 'Oral',
      frequency: String(p.frequency || 'As directed')
    }));

    let existingConsultation = await Consultations.findOne({ appointmentId: currentAppt._id });

    if (existingConsultation) {
      existingConsultation.notes = notes || "No clinical description recorded.";
      existingConsultation.prescriptions = formattedPrescriptions;
      if (date) existingConsultation.date = date;

      const updatedConsultation = await existingConsultation.save();
      
      return res.status(200).json({ 
        success: true, 
        status: "success", 
        message: "Prescription updated successfully!", 
        data: updatedConsultation 
      });
    } else {
      const uniqueId = consultationId || Math.floor(100000 + Math.random() * 900000);
      
      const newConsultationData = {
        consultationId: uniqueId,
        appointmentId: currentAppt._id, 
        patient: currentAppt.patient,   
        doctorId: doctorId || currentAppt.doctorId || "D001",
        date: date || currentAppt.date,
        notes: notes || "No clinical description recorded.",
        prescriptions: formattedPrescriptions
      };

      const savedConsultation = await Consultations.create(newConsultationData);
      
      currentAppt.status = 'Completed';
      await currentAppt.save();

      return res.status(201).json({ 
        success: true, 
        status: "success", 
        message: "Prescription saved successfully!", 
        data: savedConsultation 
      });
    }

  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      status: "error", 
      message: "Internal server error while saving prescription.", 
      error: error.message 
    });
  }
};

exports.markAsCompletedStandalone = async (req, res, next) => {
  try {
    const cleanApptId = String(req.params.appointmentId || req.body.appointmentId).trim();

    if (!cleanApptId) {
      return res.status(400).json({ success: false, message: "Appointment reference target identification missing." });
    }

    const appointment = await Appointment.findOne({ appointmentId: cleanApptId }) ||
                        (cleanApptId.match(/^[0-9a-fA-F]{24}$/) ? await Appointment.findById(cleanApptId) : null);

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Target active appointment record not found." });
    }

    appointment.status = 'Completed';
    await appointment.save();

    let existingConsultation = await Consultations.findOne({ appointmentId: appointment._id }) ||
                               await Consultations.findOne({ appointmentId: String(appointment._id) });
                               
    if (!existingConsultation && appointment.appointmentId) {
      existingConsultation = await Consultations.findOne({ appointmentId: String(appointment.appointmentId).trim() });
    }
                                 
    if (!existingConsultation) {
      const emptyConsultation = new Consultations({
        consultationId: Math.floor(100000 + Math.random() * 900000),
        appointmentId: appointment._id, 
        patient: appointment.patient,    
        doctorId: appointment.doctorId || "D001",
        date: appointment.date || new Date().toISOString().split('T')[0],
        notes: "Take Rest and eat healthy", 
        prescriptions: [] 
      });
      
      await emptyConsultation.save();
    }

    return res.status(200).json({
      success: true,
      status: "success",
      message: "Appointment successfully synced into historical past consultations list grid."
    });

  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: "Internal application error on processing transition flow.", 
      error: error.message 
    });
  }
};