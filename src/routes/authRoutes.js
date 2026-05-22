const express = require('express');
const router = express.Router();

const {
  loginPatient,
  getMe,
  logoutPatient,
  loginDoctor
} = require('../controllers/authController');



router.post('/', loginPatient);

router.get('/me',getMe)

router.post('/doctor',loginDoctor);

router.post('/logout',logoutPatient)

module.exports = router;