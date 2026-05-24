const bcrypt = require('bcrypt');
const Patient = require('../models/patient');
const Doctor = require('../models/doctor');
const { generateToken, setAuthCookie, clearAuthCookie } = require('../middleware/auth');

exports.registerPatient = async (req, res) => {
  try {
    const { name, age, gender, contactNumber, email, password, address, medicalHistory, allergy } = req.body;

    const existingPatient = await Patient.findOne({ email });
    if (existingPatient) {
      return res.status(400).json({ success: false, message: 'Patient already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const lastPatient = await Patient.findOne().sort({ patientId: -1 });
    const newPatientId = lastPatient ? Number(lastPatient.patientId) + 1 : 1;

    const newPatient = new Patient({
      patientId: String(newPatientId), name, age, gender, contactNumber, email,
      password: hashedPassword, address,
      medicalHistory: medicalHistory || [], allergy: allergy || []
    });

    await newPatient.save();

    return res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      patient: { patientId: newPatient.patientId, name: newPatient.name, email: newPatient.email }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.loginPatient = async (req, res) => {
  try {
    console.log("📥 BACKEND RECEIVED BODY:", req.body);
    const { email, password } = req.body;

    // 1. Check if user exists
    const user = await Patient.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    
    // ❌ OLD DISCONNECTED CHECK: (Hata diya)
    // if (user.password !== password) { return res.status(400).json({ message: 'Invalid password' }); }

    // ✅ NEW SYNCHRONIZED CHECK: Plain text password ko hashed password se compare karein
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // ✅ Token payload compilation
    const token = generateToken({ 
      userId: user._id, 
      pId: user.patientId, 
      pemail: user.email, 
      role: "PATIENT" 
    });
    setAuthCookie(res, token);

    return res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error("CRITICAL LOGIN ERROR TRACE:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

exports.loginDoctor = async (req, res) => {
  try {
    const { doctorId, password } = req.body;
    const doctor = await Doctor.findOne({ doctorId });
    if (!doctor) {
      return res.status(400).json({ success: false, status: "not_found", message: "Doctor not found" });
    }

    if (doctor.password !== password) {
       return res.status(400).json({ success: false, status: "error", message: "Invalid password" });
    }

    // ✅ FIX: Token pipeline standard output array synced
    const token = generateToken({ 
      userId: doctor._id, 
      dId: doctor.doctorId, 
      demail: doctor.email, 
      role: "DOCTOR" 
    });
    setAuthCookie(res, token);

    return res.status(200).json({ success: true, status: "success", message: "Doctor login successful" });
  } catch (error) {
    console.error("CRITICAL DOCTOR LOGIN ERROR TRACE:", error);
    return res.status(500).json({ success: false, status: "error", message: "Internal Server Error", error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No session token found' });
    }

    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === 'DOCTOR') {
      const doctor = await Doctor.findOne({ doctorId: decoded.dId }).select('-password');
      if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found' });
      
      return res.status(200).json({ success: true, role: 'DOCTOR', user: doctor });
    } else {
      const patient = await Patient.findOne({ patientId: decoded.pId });
      if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' });
      
      return res.status(200).json({
        success: true,
        role: 'PATIENT',
        user: { id: patient.patientId, patientId: patient.patientId, name: patient.name, email: patient.email }
      });
    }
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Session expired or invalid token', error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    clearAuthCookie(res);
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Logout failed', error: error.message });
  }
};