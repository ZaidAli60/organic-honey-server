const mongoose = require("mongoose")
const { Schema } = mongoose


const schema = new Schema({
    uid: { type: String, required: false, unique: true }, // Google user 'sub' or custom uid
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false }, // optional for social login
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    fullName: { type: String, default: "" },
    address: { type: String, default: "" },
    shortBio: { type: String, default: "" },
    photoURL: { type: String, default: "" },
    photoPublicId: { type: String, default: "" },
    isEmailVerified: { type: Boolean, default: false },
    status: { type: String, default: "active" },
    roles: { type: [String], default: ["user"] },
    createdBy: { type: String, default: "" },
}, { timestamps: true });


const Users = mongoose.model("users", schema)

module.exports = Users