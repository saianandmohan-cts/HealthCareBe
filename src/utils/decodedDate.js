const jwt = require('jsonwebtoken');

function decodedData(req, res) {
  
  const token = req.cookies?.token;

  if (!token) {
  
    res.status(401).json({ success: false, message: 'No session token provided' });
    return null;
  }

  try {
  
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded; 
  } catch (err) {
    res.status(401).json({ success: false, message: 'Session expired or invalid token' });
    return null;
  }
}

module.exports = { decodedData };