const mongoose = require("mongoose")

const { MONGODB_USERNAME, MONGODB_PASSWORD, MONGODB_NAME } = process.env
// mongodb+srv://zaidali:organic@cluster0.qmehy3e.mongodb.net/
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        // Already connected or connecting
        return;
    }

    try {
        await mongoose.connect(
            `mongodb+srv://zaidali:organic@cluster0.qmehy3e.mongodb.net/`,
            { dbName: "development" }
        );
        console.log("✅ MongoDB connected");
    } catch (error) {
        console.error("❌ MongoDB error:", error);
        throw error;
    }
};



module.exports = { connectDB }