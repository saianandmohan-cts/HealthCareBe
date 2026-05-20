const express = require('express');
const router = express.Router();
const {
  registerPatient
} = require('../controllers/authController');

// const {validationResult } = require ('express-validator');

// const registrationRules = require ('../validators/registrationRules.js')
// const registrationSchema = require ('../validators/registrationSchema.js')

// router.post('/rule', registrationRules, (req, res) =>{

//     const validationError = validationResult(req)
    
//     if(!validationError.isEmpty()){
//         res.status(200).json({statusCode : 400, error : validationError.array()})
//     }else {
//         res.status(200).json({statusCode : 200, message : 'user created!!'})
//     }
// })

// router.post('/schema', registrationSchema, (req, res) =>{

//     const validationError = validationResult(req)
    
//     if(!validationError.isEmpty()){
//         res.status(200).json({statusCode : 400, error : validationError.array()})
//     }else {
//         res.status(200).json({statusCode : 200, message : 'user created!!'})
//     }
// })


router.post('/reg', registerPatient);


module.exports = router;

