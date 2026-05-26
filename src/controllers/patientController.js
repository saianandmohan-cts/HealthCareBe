const Patient = require('../models/patient');
const Appointment = require('../models/appointment');
const Consultations = require('../models/Consultations');
const Doctor = require('../models/doctor');
const { generatePrescriptionPDF } = require('../utils/pdfGenerator'); 

exports.getPatientDashboard = async (req, res, next) => {
    try {
        const patientId = req.user && req.user.pId ? String(req.user.pId) : null;

        if (!patientId) {
            return res.status(401).json({ 
                success: false, 
                message: "Session expired! Login Again." 
            });
        }

        const patientList = await Patient.findOne({ patientId: patientId });

        if (!patientList) {
            return res.status(404).json({ success: false, message: 'Patient not Found' });
        }

        const appointments = await Appointment.find({ patient: patientList._id }).populate('patient').populate('doctorId');;

        return res.status(200).json({
            message: 'Patient Dashboard Fetched Successfully',
            patientList,
            appointments
        });
    
    } catch (err) {
        next(err);
    }
};

exports.viewPrescription = async (req, res) => {
    try {
        const id = req.params.consultationId || req.query.consultationId;

        const consultation = await Consultations.findOne({ appointmentId: id }).populate('patient') ||
                             await Consultations.findById(id).populate('patient');
        
        if (!consultation) {
            return res.status(404).json({ success: false, message: "Prescription not found." });
        }

        const doctorData = await Doctor.findOne({ doctorId: consultation.doctorId });
        const patientData = consultation.patient; 

        const responseData = {
            consultationId: consultation._id, 
            date: consultation.date,
            patient: {
                name: patientData ? patientData.name : 'Unknown Patient',
                age: patientData ? patientData.age : 'N/A',
                phone: patientData ? patientData.contactNumber : 'N/A',
                email: patientData ? patientData.email : 'N/A',
                gender: patientData ? patientData.gender : 'Not Specified',
                address: patientData ? patientData.address : 'N/A',
                allergies: patientData ? patientData.allergy.join(', ') : 'None',
                condition: consultation.notes 
            },
            medications: consultation.prescriptions,
            physician: {
                name: doctorData ? doctorData.name : 'Unknown Doctor',
                department: doctorData ? doctorData.department : 'General'
            }
        };

        return res.status(200).json(responseData);
    } catch (e) {
        return res.status(500).json({ success: false, error: e.message });
    }
};

exports.updatePatient = async (req, res) => {
  try {
    const patientId = String(req.params.patientId);
    const updates = {};

    if (req.body.email) updates.email = req.body.email;
    if (req.body.contactNumber) updates.contactNumber = req.body.contactNumber;
    if (req.body.address) updates.address = req.body.address;
    if (req.body.allergy) updates.allergy = req.body.allergy;

    const updatedPatient = await Patient.findOneAndUpdate({ patientId }, { $set: updates }, { new: true });
    return res.status(201).json({ message: "Patient updated successfully", patient: updatedPatient });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const downloadPrescriptionLogic = async (req, res) => {
    try {
        const id = req.params.consultationId || req.params.id || req.query.consultationId || req.query.id;
        console.log("📥 [PDF ENGINE] STARTING BINARY PIPELINE FOR ID:", id);

        if (!id) {
            return res.status(400).json({ success: false, message: "ID parameter missing." });
        }

        let consultation = null;

        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            consultation = await Consultations.findOne({ appointmentId: id }) ||
                           await Consultations.findOne({ appointmentId: String(id) }) ||
                           await Consultations.findById(id);
        }

        if (!consultation && !isNaN(id)) {
            consultation = await Consultations.findOne({ consultationId: Number(id) });
        }

        if (!consultation) {
            const tempAppt = await Appointment.findOne({ appointmentId: String(id) });
            if (tempAppt) {
                consultation = await Consultations.findOne({ appointmentId: tempAppt._id }) ||
                               await Consultations.findOne({ appointmentId: String(tempAppt._id) });
            }
        }

        if (!consultation) {
            console.log("❌ [PDF ENGINE] NOT FOUND IN DB:", id);
            return res.status(404).json({ success: false, message: "No prescription documentation matches this key reference." });
        }

        const appointment = await Appointment.findById(consultation.appointmentId).populate('patient') ||
                            await Appointment.findOne({ appointmentId: consultation.appointmentId }).populate('patient');
        
        if (!appointment) {
            return res.status(404).json({ success: false, message: "Associated Appointment not found" });
        }

        const doctorData = await Doctor.findOne({ doctorId: appointment.doctorId });
        const patientData = appointment.patient; 

        const pdfPayload = {
            consultationId: consultation._id ? String(consultation._id) : String(consultation.consultationId),
            id: consultation._id ? String(consultation._id) : String(consultation.consultationId),
            consultation: consultation,
            pName: patientData ? patientData.name : 'Unknown Patient',
            pAge: patientData ? patientData.age : 'N/A',
            pGender: patientData ? patientData.gender : 'Not Specified',
            pPhone: patientData ? patientData.contactNumber : 'N/A',
            dName: doctorData ? doctorData.name : 'Unknown Doctor',
            pDate: consultation.date || new Date().toLocaleDateString(),
            notes: consultation.notes || "General clinical history review details",
            
            patient: {
                name: patientData ? patientData.name : 'Unknown Patient',
                age: patientData ? patientData.age : 'N/A',
                gender: patientData ? patientData.gender : 'Not Specified',
                phone: patientData ? patientData.contactNumber : 'N/A',
                address: patientData ? patientData.address : 'N/A',
                allergies: patientData && patientData.allergy ? patientData.allergy.join(', ') : 'None recorded',
                condition: consultation.notes || "General Follow-up"
            },
            physician: {
                name: doctorData ? doctorData.name : 'Unknown Doctor',
                department: doctorData ? doctorData.department : 'General Medicine'
            },
            prescriptions: (consultation.prescriptions || []).map(p => ({
                medicineName: p.medicineName || p.name || 'General Medicine',
                dosage: p.dosage || 'N/A',
                route: p.route || 'Oral',
                frequency: p.frequency || 'N/A'
            }))
        };

        try {
            console.log("🚀 COMPILING PDF DATA THROUGH PIPELINE RENDERER...");
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Prescription_${consultation._id || id}.pdf`);
            
            return generatePrescriptionPDF(res, pdfPayload);
        } catch (pdfBuilderErr) {
            console.error("🚨 ASYNC PDF ENGINE CRASHED INTERNALLY:", pdfBuilderErr);
            res.setHeader('Content-Type', 'application/json');
            return res.status(500).json({ 
                success: false, 
                message: "PDF generatePrescriptionPDF library ke andar crash ho gaya.", 
                error: pdfBuilderErr.message 
            });
        }

    } catch (error) {
        console.error("❌ CRITICAL ERROR IN CONTROLLER BLOCK:", error);
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({ success: false, error: error.message });
    }
};

exports.downloadPrescriptionData = downloadPrescriptionLogic;
exports.downloadPrescriptionFile = downloadPrescriptionLogic;