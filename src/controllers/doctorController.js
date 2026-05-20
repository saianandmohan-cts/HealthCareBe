const Doctor = require('../models/doctor');
const Appointment = require('../models/appointment');
const Availability= require('../models/doc_availability');
const Consultations = require('../models/Consultations');
const {decodedData} = require('../utils/decodedDate');




exports.getAllDoctorInfo = async(req,res,next)=>{
    try {
        const allDoctor = await Doctor.find({});

        if (allDoctor.length > 0) {
            return res.status(200).json(allDoctor);
        } else {
            return res.status(404).json({
                message: "No Doctor Data Found in Database",
                status: false
        });
    }
  } catch (error) {
        next(error);
  }
}

exports.getDoctor=async(req,res,next)=>{
    try{
        const currentDoctorId = req.doctor.dId;
        
        const doctorInfo= await Doctor.findOne({doctorID:currentDoctorId}).select('-password');
        
        if(doctorInfo){
            return res.status(200).json(doctorInfo)
        }else {
            return res.status(404).json({
                message:`Doctor Not Found`
            })
        }
    }catch(err){
        next(err);
    }
}

exports.getDoctorById = async(req,res,next)=>{
    try{
        const id= req.params.id;
        const doctorInfo= await Doctor.findOne({doctorId:id}).select('-password');
        if(doctorInfo){
            return res.status(200).json(doctorInfo);
        }else {
            return res.status(404).json({
                message: `Doctor with Id: ${id} is not in database`,
                status: false
            })
        }
    }catch(err){
        next(err);
    }
}

exports.deleteAppointment = async(req,res,next) =>{
    try{
        const appointmentId= req.params.id;
        const result = await Appointment.deleteOne({appointmentId :appointmentId});

        if(result.deletedCount >0){
            return res.status(200).json({
                message:`Appointment : ${appointmentId} deleted successfully`,
                status:true
            })
        }else {
            return res.status(404).json({
                message: `Appointment ${appointmentId} doesnt exists`,
                status:false
            })
        }
    }catch(err){
        next(err)
    }
}

exports.getAllAppointments = async(req,res,next)=>{
    try{
        const doctorId= req.params.doctorId;

        const allAppointments = await Appointment.find({doctorId:doctorId});
        if(allAppointments.length>0){
            return res.status(200).json({
                message:"Appointments Fetched Sucessfully",
                status:true,
                data: allAppointments
            })
        }
        else {
            return res.status(404).json({
                message:"No Appointments Available",
                status:false,
            })
        }
    }
    catch(err){
        next(err)
    }
}


exports.getUpcomingAppointments = async(req,res,next)=>{
    try{
        const currentDoctorId = req.doctor.dId;
        const nowDate= new Date();

        const upcomingAppointments = await Appointment.find({
            doctorId: String(currentDoctorId),
            $or:[
                {date:{$gt:nowDate}},
                {
                    date:{
                        $gte: new Date(nowDate.setHours(0,0,0,0)),
                        $lt: new Date(nowDate.setHours(23,59,59,999))
                    },
                    time: { $gt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }
                }
            ],
            status:"Scheduled"
        }).populate("patient", "name patientId medicalHistory allergy")
        .sort({
            date:1,
            time:1
        })

        return res.status(200).json(upcomingAppointments);

    }catch(err){
        next(err)
    }
}

exports.getPastAppointments = async(req,res,next)=>{
    try{

        const currentDoctorId = req.doctor.dId;
        const now= new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const currentTimeString = now.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        const pastAppointments = await Appointment.find({
            doctorId:String(currentDoctorId),
            $or:[
                { date: { $lt: startOfToday } },
                {
                    date: startOfToday, 
                    time: { $lt: currentTimeString }
                }
            ],
            status:"Completed"
        }).populate("patient", "name patientId medicalHistory allergy")
        .sort({
            date:-1,
            time:-1
        })

        return res.status(200).json({
            success: true,
            count: pastAppointments.length,
            data: pastAppointments
        });

    }catch(err){
        next(err)
    }
}

exports.getAvailabilitySlots= async(req,res,next)=>{
    try{
        const currentDoctorId = req.doctor.dId;
        const records=await Availability.find({doctorId:currentDoctorId}).sort({date:1});
        if(record.length===0 || !records){
            return res.status(404).json({
                message:"No Availablity Slot Present"
            })
        }
        res.json(records);
    }
    catch(err){
        next(err);
    }
};


// POST: Naya Prescription / Consultation create karne ke liye
exports.createPrescription = async (req, res) => {
    try {
        const { consultationId, doctorId, date, appointmentId, notes, prescriptions } = req.body;

        // 1. Core strict schema properties validation check
        if (!consultationId || !doctorId || !appointmentId || !date) {
            return res.status(400).json({
                success: false,
                message: "Kripya sabhi zaroori fields (Consultation ID, Doctor ID, Appointment ID, Date) bharein."
            });
        }

        // 2. Avoid indexing duplicates inside database collections
        const existingConsultation = await Consultations.findOne({ consultationId });
        if (existingConsultation) {
            return res.status(400).json({
                success: false,
                message: `Consultation ID #${consultationId} pehle se registered hai.`
            });
        }

        // 3. New database schema allocation injection mapping
        // 'prescriptions' frontend se direct [ { medicineName, dosage, route, frequency } ] array shape mein receive hoga
        const newConsultation = new Consultations({
            consultationId,
            doctorId,
            date,
            appointmentId,
            notes,
            prescriptions
        });

        // 4. Persistence handling logic 
        const savedConsultation = await Consultations.create(newConsultation);

        // 5. Send verified JSON packet execution states to our angular success callback
        return res.status(201).json({
            success: true,
            message: "Prescription successfully save ho gaya hai!",
            data: savedConsultation
        });

    } catch (error) {
        console.error("Create Prescription Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server par prescription save karte waqt internal error aayi.",
            error: error.message
        });
    }
};