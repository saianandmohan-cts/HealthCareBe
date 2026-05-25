const express = require('express');
const router = express.Router();
const {
  registerPatient
} = require('../controllers/authController');

router.post('/reg', registerPatient);


module.exports = router;

