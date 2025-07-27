const express = require("express");
const router = express.Router();
const Order = require("../models/orders");
const Counter = require("../models/counter");
const { verifySuperAdmin } = require("../middlewares/auth")
const { getRandomId } = require("../config/global");


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
            id: getRandomId()
        });

        await newOrder.save();
        res.status(200).json({ message: "Order placed successfully", orderNumber });
    } catch (err) {
        console.error("Order creation failed:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// 🟢 GET /orders - Get all orders (super admin only)
router.get("/all", verifySuperAdmin, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }); // Most recent first
        res.status(200).json(orders);
    } catch (error) {
        console.error("Failed to fetch orders:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// routes/orders.js

router.delete('/delete/:id', verifySuperAdmin, async (req, res) => {
    try {
        const id = req.params.id;

        const deletedOrder = await Order.findOneAndDelete({ id }); // Use custom id field

        if (!deletedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({ message: "Order deleted successfully" });
    } catch (err) {
        console.error("Error deleting order:", err);
        res.status(500).json({ message: "Server error while deleting order" });
    }
});



module.exports = router;