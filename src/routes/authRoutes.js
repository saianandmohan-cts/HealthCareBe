const express = require('express');
const router = express.Router();

const {
  loginPatient,
  loginDoctor, 
  getMe,
  logout,
  registerPatient,
  registerDoctor
} = require('../controllers/authController');


router.post('/register', registerPatient)

router.post('/', loginPatient);   
     
router.post('/doctor', loginDoctor); 
router.post('/register-doctor',registerDoctor);  
router.get('/me', getMe);              
router.post('/logout', logout);        
module.exports = router;