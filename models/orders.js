const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
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
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
