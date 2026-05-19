require("dotenv").config()
const express = require ('express'); 
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');

const availabilityRoutes = require('./src/routes/doc_availabilityRoutes');

app.use(cors({
    origin:'http://localhost:4200',
    credentials:true
}))

// Set the request Body 
app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(cookieParser());

//MIDDLEWARES
const logger = require('./src/middleware/logger')
const errorhandler = require('./src/middleware/errorHandler');

//ROUTES
const authRoutes = require ('./src/routes/authRoutes');
const registrationRoutes = require ('./src/routes/registrationRoutes');
const patientRoutes = require ('./src/routes/patientRoutes');
const doctorRoutes = require ('./src/routes/doctorRoutes');

//LOGGER 
//app.use(logger)

//Sujay
 app.use('/login', authRoutes);
 app.use('/registration', registrationRoutes);

//Devang + Sai
app.use('/patient',patientRoutes);

//Sahil
app.use('/doctor',doctorRoutes);
app.use('/api/availability', availabilityRoutes);


// Error handling
//app.use(errorhandler)


module.exports = app ; 


