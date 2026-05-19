
const {body } = require ('express-validator');

const isStrongPassword = value => {
  const regex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!regex.test(value)) {
    throw new Error('Password must be at least 8 characters, include a number and an uppercase letter');
  }
  return true;
};

const registrationRules = [
  
  body('userId').isLength({min : 5}).withMessage('User ID must be min 5 Characters'), 
  body('email').isEmail().withMessage('Invalid Email format'), 
  body('password').custom(isStrongPassword), 
  body('confirmPassword').custom((value , {req} ) => {
    if(value !== req.body.password) {
      throw new Error('Passwords do not match . Retry!!!')
    }
    return true;
  })
]


module.exports = registrationRules;
