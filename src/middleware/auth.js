const jwt = require("jsonwebtoken");


const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 Day
};

exports.generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY || '1d' });
};


exports.setAuthCookie = (res, token) => {
    res.cookie('token', token, cookieOptions);
};


exports.clearAuthCookie = (res) => {
    res.clearCookie('token', {
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite
    });
};


exports.verifyPatient = (req, res, next) => {
    try {
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.role && decoded.role !== 'PATIENT') {
            return res.status(403).json({ success: false, message: "Access Denied: Patients Only Route" });
        }

        req.user = {
            pId: decoded.pId,
            pemail: decoded.pemail,
            role: decoded.role
        };
        next();
    } catch (err) {
        let errmsg = "Invalid Token";
        if (err.name === 'TokenExpiredError') {
            errmsg = "Token Expired! Please Login Again.";
        }
        return res.status(401).json({ success: false, message: errmsg });
    }
};


exports.verifyDoctor = (req, res, next) => {
    try {
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({ success: false, message: 'Access Denied: No active session' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.role !== 'DOCTOR') {
            return res.status(403).json({ success: false, message: 'Access Denied: Unauthorized Role' });
        }

        req.doctor = {
            dId: decoded.dId,
            demail: decoded.demail,
            role: decoded.role
        }; 
        next(); 
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired session token' });
    }
};