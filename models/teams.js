const mongoose = require("mongoose")
const { Schema } = mongoose

const schema = new Schema({
    id: { type: String, required: true, unique: true },
    firstName: { type: String, required: true, default: "" },
    lastName: { type: String, required: true, default: "" },
    fullName: { type: String, required: true, default: "" },
    gender: { type: String, required: true, default: "" },
    email: { type: String, default: "" },
    shortBio: { type: String, default: "" },
    designation: { type: String, default: "" },
    role: { type: String, default: "" },
    photoURL: { type: String, default: "" },
    photoPublicId: { type: String, default: "" },
    status: { type: String, default: "active" },
    order: { type: Number, required: true },
    createdBy: { type: String, required: true },
}, { timestamps: true })

const Team = mongoose.model("teams", schema)

module.exports = Team