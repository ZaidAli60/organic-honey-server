const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    orderNumber: { type: Number, unique: true }, // NEW
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    items: [
        {
            id: String,
            title: String,
            price: Number,
            quantity: Number,
            imageURL: String
        }
    ],
    total: { type: Number, required: true },
    status: { type: String, default: "Pending" }, // NEW FIELD
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
