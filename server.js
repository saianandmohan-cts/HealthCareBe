require('dotenv').config();

const Port = process.env.PORT
const app=require('./app')
const connectDB = require('./src/config/db.config');


connectDB();


app.listen(Port, () => {
  console.log("Server Running at Port 5000");
});
