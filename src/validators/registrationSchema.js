
const { checkSchema } = require('express-validator');  // JOI


const registrationSchema = checkSchema({
  username: {
    in: ['body'],
    isLength: {
      options: { min: 3 },
      errorMessage: 'username must be at least 3 characters'
    },
    custom: {
      options: value => {
        if (value === 'admin') {
          throw new Error('Username "admin" is not allowed');
        }
        return true;
      }
    }
  },
  email: {
    in: ['body'],
    isEmail: {
      errorMessage: 'Invalid email format'
    }
  },
  password: {
    in: ['body'],
    custom: {
      options: value => {
        const regex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!regex.test(value)) {
          throw new Error('Password must be at least 8 characters, include a number and an uppercase letter');
        }
        return true;
      }
    }
  },
  confirmPassword: {
    in: ['body'],
    custom: {
      options: (value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match');
        }
        return true;
      }
    }
  },

  // Nested address object
  'address.street': {
    in: ['body'],
    isString: true,
    notEmpty: {
      errorMessage: 'Street is required'
    }
  },
  'address.city': {
    in: ['body'],
    isString: true,
    notEmpty: {
      errorMessage: 'City is required'
    }
  },
  'address.zip': {
    in: ['body'],
    isPostalCode: {
      options: 'IN', 
      errorMessage: 'Invalid ZIP code'
    }
  },

  // Nested preferences object
  'preferences.newsletter': {
    in: ['body'],
    isBoolean: {
      errorMessage: 'Newsletter preference must be true or false'
    },
    optional: true
  },
  'preferences.topics': {
    in: ['body'],
    isArray: {
      errorMessage: 'Topics must be an array'
    },
    optional: true
  },
  'preferences.topics.*': {
    in: ['body'],
    isString: {
      errorMessage: 'Each topic must be a string'
    }
  }
});

module.exports = registrationSchema;
