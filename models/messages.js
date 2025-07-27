const mongoose = require("mongoose")
const { Schema } = mongoose

const schema = new Schema({
    id: { type: String, required: true, unique: true },
    name: String,
    email: String,
    message: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    isRead: { type: Boolean, default: false },
    status: { type: String, default: "received" },
}, { timestamps: true })

const Messages = mongoose.model("messages", schema)

module.exports = Messages