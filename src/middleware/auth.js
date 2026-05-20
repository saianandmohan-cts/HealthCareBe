const jwt = require("jsonwebtoken");


exports.authMiddleware = (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 🔒 ROLE GUARD: Agar token Doctor ka hai aur rasta Patient ka hai, toh block karo!
        if (decoded.role && decoded.role !== 'PATIENT') {
            return res.status(403).json({ success: false, message: "Access Denied: Patients Only Route" });
        }

        req.user = {
            pId: decoded.pId,
            pemail: decoded.pemail
        };
        next();
    }
    catch (err) {
        let errmsg = "Invalid Token";
        if (err.name === 'TokenExpiredError') {
            errmsg = "Token Expired! Please Login Again.";
        }
        return res.status(401).json({ success: false, message: errmsg });
    }
};


exports.verifyDoctor = (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access Denied: No active session' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 🔒 ROLE GUARD: Check karo ki token doctor ka hi hai na!
        if (decoded.role !== 'DOCTOR') {
            return res.status(403).json({ success: false, message: 'Access Denied: Unauthorized Role' });
        }

        req.doctor = decoded; // Doctor details ko request object me attach kar diya
        next(); // Agle controller code ko chalne do
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired session token' });
    }
};