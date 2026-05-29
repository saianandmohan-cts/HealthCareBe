const jwt = require('jsonwebtoken');

function decodedData(req) {
  const token = req.cookies?.token;
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null; 
  }
}

module.exports = { decodedData };