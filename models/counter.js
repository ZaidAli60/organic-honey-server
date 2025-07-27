// models/counter.js
const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    value: { type: Number, default: 100 },
});

module.exports = mongoose.model("Counter", counterSchema);
