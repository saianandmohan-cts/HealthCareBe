const bcrypt = require('bcrypt');
const Patient = require('../models/patient');
const jwt = require("jsonwebtoken")

exports.registerPatient = async (req, res) => {
  try {
    const {
      name,
      age,
      gender,
      contactNumber,
      email,
      password,
      address,
      medicalHistory,
      allergy
    } = req.body;

    
    const existingPatient = await Patient.findOne({ email });

    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: 'Patient already exists with this email'
      });
    }

  
    const hashedPassword = await bcrypt.hash(password, 10);

   
    const lastPatient = await Patient.findOne().sort({ patientId: -1 });

    const newPatientId = lastPatient ? lastPatient.patientId + 1 : 1;


    const newPatient = new Patient({
      patientId: newPatientId,
      name,
      age,
      gender,
      contactNumber,
      email,
      password: hashedPassword,
      address,

      
      medicalHistory: medicalHistory || [],
      allergy: allergy || []
    });

    
    await newPatient.save();

   
    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      patient: {
        patientId: newPatient.patientId,
        name: newPatient.name,
        email: newPatient.email
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};




exports.loginPatient = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Patient.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: 'User not found'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: 'Invalid password'
      });
    }

    const payload = {
        pId : user.patientId,
        pemail: user.email
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn : process.env.JWT_EXPIRY})

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV ==='production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    }

    res.cookie('token',token,cookieOptions);



    res.status(200).json({
      message: 'Login successful',
    });

  }catch (error) {
    console.error(" CRITICAL LOGIN ERROR TRACE:", error); // Yeh aapko terminal me exact wajah batayega
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message // Frontend ko bhi pata chal jayega
    });
}
};


exports.getMe = async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ success: false, message: 'No session token found' });
    }

    // Token decode karenge
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Database se patient ka live profile data nikalenge
    const user = await Patient.findOne({ patientId: decoded.pId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User session invalid or not found' });
    }

    // Sirf safe public data frontend ko return karenge
    return res.status(200).json({
      success: true,
      user: {
        id: user.patientId,
        patientId: user.patientId,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Session expired or invalid token',
      error: error.message
    });
  }
};



exports.logoutPatient = async (req, res) => {
  try {
    // Cookie ko clear karne ke liye hum use turant expire kar dete hain
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};