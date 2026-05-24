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

// =========================================================================
// ✅ FIXED: UPCOMING APPOINTMENTS (Clean Mongoose Populate Integration)
// =========================================================================
exports.getUpcomingAppointments = async (req, res, next) => {
  try {
    const currentDoctorId = req.doctor.dId;
    
    // Yahan humne direct standard populate lagaya h jo automatic matching object join karega
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
        const patientData = app.patient; // Populate se direct object extracted

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


// =========================================================================
// ✅ SYSTEM FIXED: PAST APPOINTMENTS WITH CAST PROTECTION SHIELD
// =========================================================================
exports.getPastAppointments = async (req, res, next) => {
  try {
    const currentDoctorId = req.doctor.dId;
    console.log("📥 FETCHING PAST APPOINTMENTS FOR DOCTOR REFERENCE:", currentDoctorId);

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

        // ✅ STRIP WHITESPACES & DEFEND CAST ERROR
        const cleanInternalId = String(app._id).trim();
        const cleanCustomId = app.appointmentId ? String(app.appointmentId).trim() : '';

        let consultation = null;

        // Condition 1: Query only if it's a valid 24-char hex string
        if (cleanInternalId.match(/^[0-9a-fA-F]{24}$/)) {
          consultation = await Consultations.findOne({ appointmentId: cleanInternalId });
        }

        // Condition 2: Fallback bypass using sequential keys safely
        if (!consultation && cleanCustomId.match(/^[0-9a-fA-F]{24}$/)) {
          consultation = await Consultations.findOne({ appointmentId: cleanCustomId });
        }

        // Condition 3: Custom schema structural fallback
        if (!consultation) {
          consultation = await Consultations.findOne({ consultationId: !isNaN(cleanCustomId) ? Number(cleanCustomId) : 0 });
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
    return res.status(200).json({ success: true, status: "success", count: finalCleanList.length, data: finalCleanList });

  } catch (err) {
    console.error("❌ CRITICAL ERROR IN DOCTOR PORTAL PAST APPOINTMENTS:", err);
    next(err);
  }
};

// =========================================================================
// ✅ SYSTEM FIXED: UNBREAKABLE PRESCRIPTION CREATION
// =========================================================================
exports.createPrescription = async (req, res) => {
  try {
    const { consultationId, doctorId, date, appointmentId, notes, prescriptions } = req.body;
    console.log("📥 [DOCTOR ENGINE] PRESCRIPTION PAYLOAD RECEIVED:", req.body);

    if (!doctorId || !appointmentId || !date) {
      return res.status(400).json({ success: false, status: "error", message: "Required fields missing." });
    }

    // Trim raw string values safely
    const cleanApptId = String(appointmentId).trim();

    const currentAppt = await Appointment.findOne({ appointmentId: cleanApptId }) || 
                        (cleanApptId.match(/^[0-9a-fA-F]{24}$/) ? await Appointment.findById(cleanApptId) : null);

    if (!currentAppt) {
      return res.status(404).json({ success: false, status: "error", message: "Associated appointment details not found." });
    }

    const uniqueId = consultationId || Math.floor(100000 + Math.random() * 900000);
    
    const newConsultation = new Consultations({
      consultationId: uniqueId,
      appointmentId: currentAppt._id, 
      patient: currentAppt.patient,   
      doctorId: doctorId || currentAppt.doctorId || "D001",
      date: date || currentAppt.date,
      notes: notes || "No clinical description recorded.",
      prescriptions: (prescriptions || []).map(p => ({
        medicineName: p.medicineName || p.name || 'General Medicine',
        dosage: String(p.dosage || 'N/A'),
        route: p.route || 'Oral',
        frequency: String(p.frequency || 'As directed')
      }))
    });

    const savedConsultation = await Consultations.create(newConsultation);
    
    currentAppt.status = 'Completed';
    await currentAppt.save();

    return res.status(201).json({ success: true, status: "success", message: "Prescription saved successfully!", data: savedConsultation });

  } catch (error) {
    console.error("❌ BACKEND VALIDATION FAILURE IN CREATION:", error);
    return res.status(500).json({ success: false, status: "error", message: "Internal server error while saving prescription.", error: error.message });
  }
};

// =========================================================================
// ✅ SYSTEM FIXED: GET PRESCRIPTION FOR DOCTOR VIEW INTERFACE (NO CAST ERRORS)
// =========================================================================
exports.getPrescriptionByAppointment = async (req, res) => {
  try {
    const cleanId = String(req.params.appointmentId).trim();
    console.log("📥 [DOCTOR VIEW CHANNELS] FETCHING FOR APPOINTMENT:", cleanId);

    const appt = await Appointment.findOne({ appointmentId: cleanId }) || 
                 (cleanId.match(/^[0-9a-fA-F]{24}$/) ? await Appointment.findById(cleanId) : null);

    if (!appt) {
      return res.status(404).json({ success: false, message: "Appointment not found." });
    }

    // Guarding query layer with safe string conversions to prevent crash loops
    const consultation = await Consultations.findOne({ appointmentId: appt._id });

    if (!consultation) {
      return res.status(200).json({ success: true, data: { notes: "No notes added", prescriptions: [] } });
    }

    return res.status(200).json({
      success: true,
      status: "success",
      data: {
        notes: consultation.notes || "No notes recorded.",
        prescriptions: (consultation.prescriptions || []).map(p => ({
          medicineName: p.medicineName || p.name,
          dosage: p.dosage,
          route: p.route,
          frequency: p.frequency
        }))
      }
    });

  } catch (error) {
    console.error("❌ DOCTOR PORTAL VIEW FETCH FAILURE:", error);
    return res.status(500).json({ success: false, error: error.message });
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

// =========================================================================
// ✅ FIXED: UNBREAKABLE DYNAMIC PRESCRIPTION CREATION
// =========================================================================
// exports.createPrescription = async (req, res) => {
//   try {
//     const { consultationId, doctorId, date, appointmentId, notes, prescriptions } = req.body;
//     console.log("📥 [DOCTOR ENGINE] PRESCRIPTION PAYLOAD RECEIVED:", req.body);

//     if (!doctorId || !appointmentId || !date) {
//       return res.status(400).json({ success: false, status: "error", message: "Required fields missing." });
//     }

//     // 1. ✅ CRITICAL RELATIONAL DATA FETCH:
//     // Mongoose query se dynamic active appointment record nikalenge
//     const currentAppt = await Appointment.findOne({ appointmentId: appointmentId }) || 
//                         await Appointment.findById(appointmentId);

//     if (!currentAppt) {
//       return res.status(404).json({ 
//         success: false, 
//         status: "error", 
//         message: "Associated appointment details not found for creating prescription." 
//       });
//     }

//     // 2. Duplicate Validation via consultationId standard
//     const uniqueId = consultationId || Math.floor(100000 + Math.random() * 900000);
//     const existingConsultation = await Consultations.findOne({ consultationId: uniqueId });
//     if (existingConsultation) {
//       return res.status(400).json({ success: false, status: "error", message: `Consultation ID #${uniqueId} already exists.` });
//     }

//     // 3. ✅ SAFE RELATIONAL OBJECT MAPPING
//     // Required paths code architecture validation bypass karne ke liye database links automate kiye
//     const newConsultation = new Consultations({
//       consultationId: uniqueId,
//       appointmentId: currentAppt._id, // Strict dynamic link to internal MongoDB ObjectId standard
//       patient: currentAppt.patient,   // ✅ RESOLVED: Linked active relational patient _id node dynamically!
//       doctorId: doctorId || currentAppt.doctorId || "D001",
//       date: date || currentAppt.date,
//       notes: notes || "No clinical description recorded.",
//       prescriptions: (prescriptions || []).map(p => ({
//         medicineName: p.medicineName || p.name || 'General Medicine',
//         dosage: String(p.dosage || 'N/A'),
//         route: p.route || 'Oral',
//         frequency: String(p.frequency || 'As directed')
//       }))
//     });

//     const savedConsultation = await Consultations.create(newConsultation);
//     console.log("🚀 PRESCRIPTION SAVED SUCCESSFULLY ON REFERENCE BLOCK:", savedConsultation._id);

//     // 4. ✅ STATUS SYNC PIPELINE:
//     // Treatment complete hote hi, automatic appt status completed stack par patch trigger karega
//     currentAppt.status = 'Completed';
//     await currentAppt.save();

//     return res.status(201).json({ 
//       success: true, 
//       status: "success", 
//       message: "Prescription saved and appointment status synced as Completed successfully!", 
//       data: savedConsultation 
//     });

//   } catch (error) {
//     console.error("❌ BACKEND VALIDATION FAILURE IN CREATION:", error);
//     return res.status(500).json({ 
//       success: false, 
//       status: "error", 
//       message: "Internal server error while saving prescription.", 
//       error: error.message 
//     });
//   }
// };