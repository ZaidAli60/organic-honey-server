const mongoose = require("mongoose")
const { Schema } = mongoose

const schema = new Schema({
    id: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, },
    phone: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    country: { type: Object, default: { name: "" } },
    province: { type: Object, default: { name: "" } },
    city: { type: Object, default: { name: "" } },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, default: "text" },
    isRead: { type: Boolean, default: false },
    status: { type: String, default: "received" },
}, { timestamps: true })

const Messages = mongoose.model("messages", schema)

module.exports = Messages