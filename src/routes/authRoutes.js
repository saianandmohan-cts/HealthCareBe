const express = require('express');
const router = express.Router();

const {
  loginPatient,
  loginDoctor, 
  getMe,
  logout,
  registerPatient
} = require('../controllers/authController');


router.post('/register', registerPatient)
router.post('/', loginPatient);        
router.post('/doctor', loginDoctor);   
router.get('/me', getMe);              
router.post('/logout', logout);        
module.exports = router;