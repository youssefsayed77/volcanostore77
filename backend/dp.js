const mongoose = require('mongoose');


const dbURI = process.env.MONGODB_URI;

const connectDB = async () => {
    try {
        await mongoose.connect(dbURI);
        console.log("✅ MongoDB Connected... Volcano is active!");
    } catch (err) {
        console.error("❌ Connection Error:", err.message);
        process.exit(1);
    }
};

module.exports = connectDB;