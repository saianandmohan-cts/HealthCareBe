const express = require("express");

require('dotenv').config();

const app=require('./app')
const connectDB = require('./src/config/db.config');


// Connect to MongoDB
connectDB();


app.listen(5000, () => {
  console.log("🚀 Server Running at Port 5000");
});
