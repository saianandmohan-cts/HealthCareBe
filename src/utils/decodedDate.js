const jwt = require('jsonwebtoken');

function decodedData(req, res) {
  // 🚀 PURE COOKIE UPDATE: Ab authorization header ke bajaye seedha cookies se 'token' nikalenge
  const token = req.cookies?.token;

  if (!token) {
    // Agar cookie nahi mili, toh user authenticated nahi hai
    res.status(401).json({ success: false, message: 'No session token provided' });
    return null;
  }

  try {
    // Cookie se nikale hue token ko direct verify karenge
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded; 
  } catch (err) {
    res.status(401).json({ success: false, message: 'Session expired or invalid token' });
    return null;
  }
}

module.exports = { decodedData }; // Named export taaki clean require ho sake