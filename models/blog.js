const mongoose = require("mongoose")
const { Schema } = mongoose

const schema = new Schema({
    uid: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    author: { type: String, default: "" },
    description: { type: String, default: "" },
    blogContent: { type: String, default: "" },
    sortOrder: { type: Number, required: true },
    status: { type: String, default: "active" },
    imageURL: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    bannerURL: { type: String, default: "" },
    bannerPublicId: { type: String, default: "" },
}, { timestamps: true })

const Blog = mongoose.model("blog", schema)

module.exports = Blog