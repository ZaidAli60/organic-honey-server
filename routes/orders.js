const express = require("express");
const router = express.Router();
const Order = require("../models/orders");
const Counter = require("../models/counter");

const getNextOrderNumber = async () => {
    const counter = await Counter.findOneAndUpdate(
        { name: "orderNumber" },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
    );

    return counter.value;
};

// POST /orders - place an order
router.post("/", async (req, res) => {
    try {
        const { fullName, email, phone, address, items, total } = req.body;

        // Basic validation
        if (!fullName || !email || !phone || !address || !items || !total) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const orderNumber = await getNextOrderNumber(); // Get next order number

        const newOrder = new Order({
            orderNumber,
            fullName,
            email,
            phone,
            address,
            items,
            total,
        });

        await newOrder.save();
        res.status(200).json({ message: "Order placed successfully", orderNumber });
    } catch (err) {
        console.error("Order creation failed:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;