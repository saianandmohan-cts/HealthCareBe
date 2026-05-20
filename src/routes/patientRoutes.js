const express = require('express');
const router = express.Router();

const { getPatientDashboard, updatePatient, downloadPrescriptionData, viewPrescription} = require('../controllers/patientController');
const { bookAppointment, modifyAppointment, getById } = require('../controllers/appointmentController');
const { authMiddleware } = require('../middleware/auth');


router.get('/dashboard/:patientId',authMiddleware ,getPatientDashboard)
router.patch('/updatePatient/:patientId',authMiddleware ,updatePatient)
router.post('/book-appointment',authMiddleware ,bookAppointment);
router.patch('/modify-appointment/:appointmentId',authMiddleware ,modifyAppointment)
router.get('/getById/:appointmentId',authMiddleware ,getById);


router.get('/download-prescription/:consultationId',authMiddleware ,downloadPrescriptionData)
router.get('/view-prescription/:consultationId',authMiddleware ,viewPrescription)

module.exports=router;