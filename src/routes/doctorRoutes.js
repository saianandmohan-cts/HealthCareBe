const express = require('express');
const router = express.Router();

const {
    getDoctor,
    getAllDoctorInfo,
    getDoctorById,
    getAllAppointments,
    getUpcomingAppointments,
    getAvailabilitySlots,
    getPastAppointments,
    updateAvailabilitySlots,
    createPrescription,
    markAsCompletedStandalone,
    cancelAppointment} = require('../controllers/doctorController');
const { verifyDoctor } = require('../middleware/auth');




router.get('/allDoctor' ,getAllDoctorInfo);
router.get('/getDoctorById/:id' ,getDoctorById);

router.get('/getDoctor',verifyDoctor ,getDoctor);





router.delete('/deleteAppointment/:id',verifyDoctor ,cancelAppointment);



router.get('/allAppointments',verifyDoctor ,getAllAppointments);

router.get('/upcomingAppointments',verifyDoctor ,getUpcomingAppointments);

router.get('/pastAppointments',verifyDoctor ,getPastAppointments);

router.get('/availability' ,getAvailabilitySlots);
router.put('/availability' ,updateAvailabilitySlots);

router.post('/consultations', verifyDoctor,createPrescription);

router.patch('/markAsCompleted/:appointmentId',markAsCompletedStandalone);



module.exports=router;