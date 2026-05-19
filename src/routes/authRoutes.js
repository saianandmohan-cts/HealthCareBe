const express = require('express');
const router = express.Router();

const {
  loginPatient,
  getMe,
  logoutPatient
} = require('../controllers/authController');


router.post('/', loginPatient);

router.get('/me',getMe)

router.post('/logout',logoutPatient)

module.exports = router;