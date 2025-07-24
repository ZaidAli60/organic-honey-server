const mongoose = require("mongoose")
const { Schema } = mongoose

const schema = new Schema({
    id: { type: String, required: true, unique: true },
    text: { type: String, required: true, default: "" },
    btnText: { type: String, required: true, default: "" },
    btnUrl: { type: String, required: true, default: "" },
    order: { type: Number, required: true },
    photoURL: { type: String, default: "" },
    photoPublicId: { type: String, default: "" },
    status: { type: String, default: "active" },
    createdBy: { type: String, required: true },
}, { timestamps: true })

const Announcements = mongoose.model("announcements", schema)

module.exports = Announcements