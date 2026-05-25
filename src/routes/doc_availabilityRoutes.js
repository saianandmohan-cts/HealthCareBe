const express = require('express');
const { setAvailability, getAvailabilitySlots } = require('../controllers/doc_availabilityController');

const router = express.Router();


router.post('/set', setAvailability);


router.get('/slots', getAvailabilitySlots);

module.exports = router;