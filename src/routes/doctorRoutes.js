const express = require('express');
const router = express.Router();

const {
    getDoctor,
    getAllDoctorInfo,
    getDoctorById,
    deleteAppointment,
    getAllAppointments,
    getUpcomingAppointments,
    getAvailabilitySlots,
    getPastAppointments,
    updateAvailabilitySlots,
    createPrescription } = require('../controllers/doctorController');
const { verifyDoctor } = require('../middleware/auth');

// router.get('/profile',profileInfo);


router.get('/allDoctor' ,getAllDoctorInfo);
router.get('/getDoctorById/:id' ,getDoctorById);

router.get('/getDoctor',verifyDoctor ,getDoctor);



//add this in doctor Controller

router.delete('/deleteAppointment/:id',verifyDoctor ,deleteAppointment);



router.get('/allAppointments',verifyDoctor ,getAllAppointments);

router.get('/upcomingAppointments',verifyDoctor ,getUpcomingAppointments);

router.get('/pastAppointments',verifyDoctor ,getPastAppointments);

router.get('/availability' ,getAvailabilitySlots);
router.put('/availability' ,updateAvailabilitySlots);

router.post('/consultations', verifyDoctor,createPrescription);



module.exports=router;