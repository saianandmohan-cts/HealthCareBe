const express = require('express');
const router = express.Router();

const { getPatientDashboard, updatePatient, downloadPrescriptionData, viewPrescription} = require('../controllers/patientController');
const { bookAppointment, modifyAppointment, getById } = require('../controllers/appointmentController');
const { verifyPatient } = require('../middleware/auth');


router.get('/dashboard/:patientId',verifyPatient ,getPatientDashboard)
router.patch('/updatePatient/:patientId',verifyPatient ,updatePatient)
router.post('/book-appointment',verifyPatient ,bookAppointment);
router.patch('/modify-appointment/:appointmentId',verifyPatient ,modifyAppointment)
router.get('/getById/:appointmentId',verifyPatient ,getById);


router.get('/download-prescription/:consultationId',verifyPatient ,downloadPrescriptionData)
router.get('/view-prescription/:consultationId',verifyPatient ,viewPrescription)

module.exports=router;