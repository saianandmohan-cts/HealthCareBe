const express = require('express');
const { setAvailability, getAvailableSlots } = require('../controllers/doc_availabilityController');
const router = express.Router();

// Doctor dashboard calls this to edit/save availability
router.post('/set', setAvailability);

// Book/Modify appointment calls this to get slots for dropdown
router.get('/slots', getAvailableSlots);

module.exports = router;