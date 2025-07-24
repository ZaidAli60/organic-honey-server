const mongoose = require("mongoose")
const { Schema } = mongoose

const schema = new Schema({
    uid: { type: String, required: true, unique: true },
    registrationNumber: { type: String, unique: true, default: "" },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
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
    createdBy: { type: String, required: false, default: "" },
}, { timestamps: true })

// Pre-save middleware to generate the registration number
schema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            // Find the latest registration number
            const lastUser = await this.constructor.findOne().sort({ registrationNumber: -1 });

            let newRegNumber = 1; // Default for the first user
            if (lastUser && lastUser.registrationNumber) {
                newRegNumber = (parseInt(lastUser.registrationNumber, 10) + 1).toString().padStart(lastUser.registrationNumber.length, "0")
            }

            // Assign the new registration number
            this.registrationNumber = newRegNumber;
            next();
        } catch (err) {
            next(err);
        }
    } else {
        next();
    }
});

const Users = mongoose.model("users", schema)

module.exports = Users