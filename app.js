const express = require ('express'); 
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');

const availabilityRoutes = require('./src/routes/doc_availabilityRoutes');

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(cookieParser());

const authRoutes = require ('./src/routes/authRoutes');
const patientRoutes = require ('./src/routes/patientRoutes');
const doctorRoutes = require ('./src/routes/doctorRoutes');


app.use('/login', authRoutes); 

app.use('/patient',patientRoutes);
app.use('/doctor',doctorRoutes);
app.use('/api/availability', availabilityRoutes);




module.exports = app ; 


