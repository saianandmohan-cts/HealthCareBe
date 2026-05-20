const Patient = require('../models/patient')
const Appointment = require('../models/appointment')
const Consultations = require('../models/Consultations');
const Doctor = require('../models/doctor');

exports.getPatientDashboard = async (req,res,next) =>{
    try{

        const patientId=String(req.params.patientId);

        if(String(req.user.pId) !== patientId){
            return res.status(403).json({message : "You are not authorized"});
        }

        const patientList = await Patient.findOne({patientId:patientId});

        if(!patientList){
            return res.status(404).json({message : 'Patient not Found'});
        }

        const appointments = await Appointment.find({patient:patientId});

        res.status(200).json({message:'Patient Dashboard Fetched Successfully',patientList,appointments});
    
    }catch(err){
        next(err);
    }
}

exports.updatePatient = async (req, res) => {
  try {
    const patientId=String(req.params.patientId)

    const updates = {};

    if (req.body.email) updates.email = req.body.email;
    if (req.body.contactNumber) updates.contactNumber = req.body.contactNumber;
    if (req.body.address) updates.address = req.body.address;
    if (req.body.allergy) updates.allergy = req.body.allergy;

    const updatedPatient = await Patient.findOneAndUpdate({patientId} , { $set: updates }, { new: true } );

    res.status(201).json({message: "Patient updated successfully", patient: updatedPatient });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// =========================================================================
// 1. DOWNLOAD PRESCRIPTION (Returns Raw Binary PDF Data for Direct Download)
// =========================================================================
exports.downloadPrescriptionData = async (req, res) => {
    try {
        const id = req.params.consultationId || req.params.id;
        const consultation = await Consultations.findOne({ consultationId: id });
        if (!consultation) {
            return res.status(404).json({ success: false, message: "Consultation record not found" });
        }

        const appointment = await Appointment.findOne({ appointmentId: consultation.appointmentId }) || await Appointment.findById(consultation.appointmentId);
        if (!appointment) {
            return res.status(404).json({ success: false, message: "Associated Appointment not found" });
        }

        const doctorData = await Doctor.findOne({ doctorId: appointment.doctorId });
        const patientData = await Patient.findOne({ patientId: appointment.patientId });

        const pName = patientData ? patientData.name : 'Unknown Patient';
        const pAge = patientData ? patientData.age : 'N/A';
        const pGender = patientData ? patientData.gender : 'Not Specified';
        const pPhone = patientData ? patientData.contactNumber : 'N/A';
        const dName = doctorData ? doctorData.name : 'Unknown Doctor';
        const pDate = consultation.date ? new Date(consultation.date).toLocaleDateString() : new Date().toLocaleDateString();

        // Natively tell the browser this is a downloadable PDF file attachment
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Prescription_${id}.pdf`);

        const pdfPayload = {
            id,
            consultation,
            pName: patientData ? patientData.name : 'Unknown Patient',
            pAge: patientData ? patientData.age : 'N/A',
            pGender: patientData ? patientData.gender : 'Not Specified',
            pPhone: patientData ? patientData.contactNumber : 'N/A',
            dName: doctorData ? doctorData.name : 'Unknown Doctor',
            pDate: consultation.date ? new Date(consultation.date).toLocaleDateString() : new Date().toLocaleDateString()
        };

        // Call modular pdf framework generator helper trigger
        generatePrescriptionPDF(res, pdfPayload);
    } catch (error) {
        console.error("Critical Binary Generation Error Flow:", error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: "Internal server error during PDF generation." });
        }
    }
};

// =========================================================================
// 2. VIEW PRESCRIPTION (Returns Clean JSON for Angular Template Rendering)
// =========================================================================
exports.viewPrescription = async (req, res) => {
    try {
        const id = req.params.consultationId || req.params.id;
        const consultation = await Consultations.findOne({ consultationId: id });
        
        if (!consultation) {
            return res.status(404).json({ success: false, message: "The requested prescription record does not exist." });
        }

        const appointment = await Appointment.findOne({ appointmentId: consultation.appointmentId }) || await Appointment.findById(consultation.appointmentId);
        if (!appointment) {
            return res.status(404).json({ success: false, message: "Associated appointment details could not be found." });
        }

        const doctorData = await Doctor.findOne({ doctorId: appointment.doctorId });
        const patientData = await Patient.findOne({ patientId: appointment.patientId });

        const responseData = {
            consultationId: consultation.consultationId,
            date: consultation.date ? new Date(consultation.date).toLocaleDateString() : 'N/A',
            patient: {
                name: patientData ? patientData.name : 'Unknown Patient',
                age: patientData ? patientData.age : 'N/A',
                phone: patientData ? patientData.contactNumber : 'N/A',
                email: patientData ? patientData.email : 'N/A',
                gender: patientData ? patientData.gender : 'Not Specified',
                address: patientData ? patientData.address : 'Address not on file',
                allergies: (patientData && patientData.allergy.length > 0) ? patientData.allergy.join(', ') : 'None recorded',
                condition: consultation.notes 
            },
            medications: consultation.prescriptions.map(p => ({
                name: p.medicineName,
                dosage: p.dosage,
                route: p.route,
                frequency: p.frequency
            })),
            physician: {
                name: doctorData ? doctorData.name : 'Unknown Doctor',
                department: doctorData ? doctorData.department : 'General'
            }
        };

        res.status(200).json(responseData);
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
};
