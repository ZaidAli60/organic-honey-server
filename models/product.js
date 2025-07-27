const mongoose = require("mongoose")
const { Schema } = mongoose

const schema = new Schema({
    uid: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    description: { type: String, default: "" },
    sortOrder: { type: Number, required: true },
    status: { type: String, default: "active" },
    imageURL: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
}, { timestamps: true })

const Product = mongoose.model("product", schema)

module.exports = Product