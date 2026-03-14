const mongoose = require('mongoose');
require('dotenv').config();
const logger = require('../src/utils/logger');
const dbsring = process.env.DBSTRING;

const connectDB = async () => {
    try {
        logger.info('Connecting to database...');
        await mongoose.connect(dbsring,{});
        logger.info('Database connected successfully');
    } catch (error) {
        logger.error('Database connection failed:', error?.message || error);
        
    }
}
module.exports = connectDB;
