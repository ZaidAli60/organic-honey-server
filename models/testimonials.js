const mongoose = require("mongoose")
const { Schema } = mongoose

const schema = new Schema({
    id: { type: String, required: true, unique: true },
    fullName: { type: String, required: true, default: "" },
    review: { type: String, required: true, default: "" },
    designation: { type: String, required: true, default: "" },
    star: { type: Number, required: true, default: "" },
    category: { type: String, required: true, default: "client" },
    photoURL: { type: String, default: "" },
    photoPublicId: { type: String, default: "" },
    status: { type: String, default: "active" },
    order: { type: Number, required: true },
    createdBy: { type: String, required: true },
}, { timestamps: true })

const Testimonials = mongoose.model("testimonials", schema)

module.exports = Testimonials