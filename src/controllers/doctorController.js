const Doctor = require('../models/doctor');
const Appointment = require('../models/appointment');
const Availability = require('../models/doc_availability');
const Consultations = require('../models/Consultations');

// GET: All doctors
exports.getAllDoctorInfo = async (req, res, next) => {
  try {
    const allDoctor = await Doctor.find({});
    if (allDoctor.length > 0) {
      return res.status(200).json({
        success: true,
        status: "success",
        data: allDoctor
      });
    } else {
      return res.status(404).json({
        success: false,
        status: "not_found",
        message: "No Doctor Data Found in Database"
      });
    }
  } catch (error) {
    next(error);
  }
};

// GET: Current doctor info
exports.getDoctor = async (req, res, next) => {
  try {
    const currentDoctorId = req.doctor.dId;
    const doctorInfo = await Doctor.findOne({ doctorID: currentDoctorId }).select('-password');

    if (doctorInfo) {
      return res.status(200).json({
        success: true,
        status: "success",
        data: doctorInfo
      });
    } else {
      return res.status(404).json({
        success: false,
        status: "not_found",
        message: "Doctor Not Found"
      });
    }
  } catch (err) {
    next(err);
  }
};

// GET: Doctor by ID
exports.getDoctorById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const doctorInfo = await Doctor.findOne({ doctorId: id }).select('-password');

    if (doctorInfo) {
      return res.status(200).json({
        success: true,
        status: "success",
        data: doctorInfo
      });
    } else {
      return res.status(404).json({
        success: false,
        status: "not_found",
        message: `Doctor with Id: ${id} is not in database`
      });
    }
  } catch (err) {
    next(err);
  }
};

// DELETE: Appointment
exports.deleteAppointment = async (req, res, next) => {
  try {
    const appointmentId = req.params.id;
    const result = await Appointment.deleteOne({ appointmentId });

    if (result.deletedCount > 0) {
      return res.status(200).json({
        success: true,
        status: "success",
        message: `Appointment ${appointmentId} deleted successfully`
      });
    } else {
      return res.status(404).json({
        success: false,
        status: "not_found",
        message: `Appointment ${appointmentId} doesn't exist`
      });
    }
  } catch (err) {
    next(err);
  }
};

// GET: All appointments for a doctor
exports.getAllAppointments = async (req, res, next) => {
  try {
    const doctorId = req.params.doctorId;
    const allAppointments = await Appointment.find({ doctorId });

    if (allAppointments.length > 0) {
      return res.status(200).json({
        success: true,
        status: "success",
        message: "Appointments fetched successfully",
        data: allAppointments
      });
    } else {
      return res.status(404).json({
        success: false,
        status: "not_found",
        message: "No Appointments Available"
      });
    }
  } catch (err) {
    next(err);
  }
};

// GET: Upcoming appointments
exports.getUpcomingAppointments = async (req, res, next) => {
  try {
    const currentDoctorId = req.doctor.dId;
    const nowDate = new Date();

    const upcomingAppointments = await Appointment.find({
      doctorId: String(currentDoctorId),
      $or: [
        { date: { $gt: nowDate } },
        {
          date: {
            $gte: new Date(nowDate.setHours(0, 0, 0, 0)),
            $lt: new Date(nowDate.setHours(23, 59, 59, 999))
          },
          time: { $gt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }
        }
      ],
      status: "Scheduled"
    })
      .populate("patient", "name patientId medicalHistory allergy")
      .sort({ date: 1, time: 1 });

    return res.status(200).json({
      success: true,
      status: "success",
      data: upcomingAppointments
    });
  } catch (err) {
    next(err);
  }
};

// GET: Past appointments
exports.getPastAppointments = async (req, res, next) => {
  try {
    const currentDoctorId = req.doctor.dId;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentTimeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const pastAppointments = await Appointment.find({
      doctorId: String(currentDoctorId),
      $or: [
        { date: { $lt: startOfToday } },
        { date: startOfToday, time: { $lt: currentTimeString } }
      ],
      status: "Completed"
    })
      .populate("patient", "name patientId medicalHistory allergy")
      .sort({ date: -1, time: -1 });

    return res.status(200).json({
      success: true,
      status: "success",
      count: pastAppointments.length,
      data: pastAppointments
    });
  } catch (err) {
    next(err);
  }
};

// GET: Availability slots
exports.getAvailabilitySlots = async (req, res, next) => {
  try {
    const currentDoctorId = req.doctor.dId;
    const records = await Availability.find({ doctorId: currentDoctorId }).sort({ date: 1 });

    if (!records || records.length === 0) {
      return res.status(404).json({
        success: false,
        status: "not_found",
        message: "No Availability Slot Present"
      });
    }

    return res.status(200).json({
      success: true,
      status: "success",
      data: records
    });
  } catch (err) {
    next(err);
  }
};

// POST: Create prescription
exports.createPrescription = async (req, res) => {
  try {
    const { consultationId, doctorId, date, appointmentId, notes, prescriptions } = req.body;

    if (!consultationId || !doctorId || !appointmentId || !date) {
      return res.status(400).json({
        success: false,
        status: "error",
        message: "Required fields missing (Consultation ID, Doctor ID, Appointment ID, Date)."
      });
    }

    const existingConsultation = await Consultations.findOne({ consultationId });
    if (existingConsultation) {
      return res.status(400).json({
        success: false,
        status: "error",
        message: `Consultation ID #${consultationId} already exists.`
      });
    }

    const newConsultation = new Consultations({
      consultationId,
      doctorId,
      date,
      appointmentId,
      notes,
      prescriptions
    });

    const savedConsultation = await Consultations.create(newConsultation);

    return res.status(201).json({
      success: true,
      status: "success",
      message: "Prescription saved successfully!",
      data: savedConsultation
    });
  } catch (error) {
    console.error("Create Prescription Error:", error);
    return res.status(500).json({
      success: false,
      status: "error",
      message: "Internal server error while saving prescription.",
      error: error.message
    });
  }
};
