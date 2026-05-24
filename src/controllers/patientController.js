const Patient = require('../models/patient');
const Appointment = require('../models/appointment');
const Consultations = require('../models/Consultations');
const Doctor = require('../models/doctor');

const { generatePrescriptionPDF } = require('../utils/pdfGenerator'); 
const mongoose = require('mongoose'); // ✅ TOP PAR YEH REQUIRMENT CHECK KAR LENA


// =========================================================================
// 1. GET PATIENT DASHBOARD
// =========================================================================
exports.getPatientDashboard = async (req, res, next) => {
    try {
        const patientId = req.user && req.user.pId ? String(req.user.pId) : null;

        if (!patientId) {
            return res.status(401).json({ 
                success: false, 
                message: "Session expired ya token mil nahi raha hai. Kripya fir se login karein." 
            });
        }

        const patientList = await Patient.findOne({ patientId: patientId });

        if (!patientList) {
            return res.status(404).json({ success: false, message: 'Patient not Found inside database' });
        }

        // ✅ FIX: String matching ki jagah Patient ke real MongoDB _id se find karega
        const appointments = await Appointment.find({ patient: patientList._id });

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
        // Frontend se seedhe Appointment ya Consultation ki Hex _id aayegi
        const id = req.params.consultationId || req.query.consultationId;

        // ✅ 1. SINGLE CLEAN POPULATED QUERY
        // Mongoose automatic consultation ke sath sath full patient details dhoondh nikalega!
        const consultation = await Consultations.findOne({ appointmentId: id }).populate('patient') ||
                             await Consultations.findById(id).populate('patient');
        
        if (!consultation) {
            return res.status(404).json({ success: false, message: "Prescription not found." });
        }

        // ✅ 2. Fetch associated Doctor Info
        const doctorData = await Doctor.findOne({ doctorId: consultation.doctorId });
        const patientData = consultation.patient; 

        const responseData = {
            consultationId: consultation._id, // Core hex reference database token
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




// 4. UPDATE PATIENT PROFILE (Kept exact same)
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





// =========================================================================
// 2. DOWNLOAD PRESCRIPTION (PDF Generator - THE DETECTOR SHIELD)
// =========================================================================
const downloadPrescriptionLogic = async (req, res) => {
    try {
        const id = req.params.consultationId || req.params.id || req.query.consultationId || req.query.id;
        console.log("📥 [PDF ENGINE] STARTING BINARY PIPELINE FOR ID:", id);

        if (!id) {
            return res.status(400).json({ success: false, message: "ID parameter missing." });
        }

        let consultation = null;

        // Route A: Hex ObjectId mapping
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            consultation = await Consultations.findOne({ appointmentId: id }) ||
                           await Consultations.findOne({ appointmentId: String(id) }) ||
                           await Consultations.findById(id);
        }

        // Route B: Custom sequential integer check (e.g., 5001)
        if (!consultation && !isNaN(id)) {
            consultation = await Consultations.findOne({ consultationId: Number(id) });
        }

        // Route C: String code standard validation fallback (e.g., 'A1003')
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

        // Relational map fetching
        const appointment = await Appointment.findById(consultation.appointmentId).populate('patient') ||
                            await Appointment.findOne({ appointmentId: consultation.appointmentId }).populate('patient');
        
        if (!appointment) {
            return res.status(404).json({ success: false, message: "Associated Appointment not found" });
        }

        const doctorData = await Doctor.findOne({ doctorId: appointment.doctorId });
        const patientData = appointment.patient; 

        // ✅ CRITICAL STEP: Pehle hum payload ko ekdam safe flat structure denge taaki purani aur nayi dono keys templates ko mil sakein
        const pdfPayload = {
            id: consultation.consultationId || 5001,
            consultationId: consultation.consultationId || 5001,
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

        // ✅ CRITICAL SAFETY WRAPPER FOR STREAM GENERATOR
        try {
            console.log("🚀 COMPILING PDF DATA THROUGH PIPELINE RENDERER...");
            
            // Response headers tabhi set karein jab query fully validation clear kar chuki ho
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Prescription_${consultation.consultationId || id}.pdf`);
            
            // Trigger the pdf function
            return generatePrescriptionPDF(res, pdfPayload);
        } catch (pdfBuilderErr) {
            console.error("🚨 ASYNC PDF ENGINE CRASHED INTERNALLY:", pdfBuilderErr);
            
            // Stream override reset safely
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

// Unified dynamic bindings
exports.downloadPrescriptionData = downloadPrescriptionLogic;
exports.downloadPrescriptionFile = downloadPrescriptionLogic;
