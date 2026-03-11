const mongoose = require('mongoose');
require('dotenv').config();
const dbsring = process.env.DBSTRING;

const connectDB = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(dbsring,{});
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Database connection failed:', error);
        
    }
}
module.exports = connectDB;