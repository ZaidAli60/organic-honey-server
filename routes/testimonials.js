const express = require("express")
const multer = require("multer")
const Testimonials = require("../models/testimonials")
const { verifyToken } = require("../middlewares/auth")
const { getRandomId } = require("../config/global")
const { cloudinary, deleteFileFromCloudinary } = require("../config/cloudinary")

const storage = multer.memoryStorage()
const upload = multer({ storage })
const router = express.Router()

const { MONGODB_NAME } = process.env

router.post("/add", verifyToken, upload.single("image"), async (req, res) => {
    try {

        const { uid } = req
        let formData = req.body

        let photoURL = "", photoPublicId = "", id = getRandomId()
        if (req.file) {
            await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: MONGODB_NAME + '/testimonials' },
                    (error, result) => {
                        if (error) { return reject(error); }
                        photoURL = result.secure_url; photoPublicId = result.public_id;
                        resolve();
                    }
                )
                uploadStream.end(req.file.buffer);
            });
        }

        const newData = { ...formData, id, createdBy: uid, photoURL, photoPublicId }

        const testimonial = new Testimonials(newData)
        await testimonial.save()

        res.status(201).json({ message: "A new testimonial has been successfully added", isError: false, testimonial })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong while adding the new testimonial", isError: true, error })
    }
})

router.get("/all", verifyToken, async (req, res) => {
    try {

        const { status = "" } = req.query
        let query = {}
        if (status) { query.status = status }

        const testimonials = await Testimonials.find(query)

        res.status(200).json({ testimonials })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong. Internal server error.", isError: true, error })
    }
})

router.get("/single-with-id/:id", verifyToken, upload.single("image"), async (req, res) => {
    try {

        const { id } = req.params

        const testimonial = await Testimonials.findOne({ id })

        res.status(200).json({ testimonial })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong. Internal server error.", isError: true, error })
    }
})

router.patch("/update/:id", verifyToken, upload.single("image"), async (req, res) => {
    try {

        const { id } = req.params
        let formData = req.body

        const testimonial = await Testimonials.findOne({ id });
        if (!testimonial) { return res.status(404).json({ message: "Testimonial not found" }) }

        let { photoURL = "", photoPublicId = "" } = testimonial
        if (req.file) {
            await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: MONGODB_NAME + '/testimonials' },
                    async (error, result) => {
                        if (error) { return reject(error); }
                        photoURL = result.secure_url; photoPublicId = result.public_id;
                        // await deleteFileFromCloudinary(member.photoPublicId)
                        resolve();
                    }
                )
                uploadStream.end(req.file.buffer);
            });
        }

        const newData = { ...formData, photoURL, photoPublicId }

        const updatedTestimonial = await Testimonials.findOneAndUpdate({ id }, newData, { new: true })
        if (!updatedTestimonial) { return res.status(404).json({ message: "testimonial didn't update" }) }


        res.status(200).json({ message: "A testimonial has been successfully updated", isError: false, testimonial: updatedTestimonial })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong while updating the testimonial", isError: true, error })
    }
})

router.delete("/single/:id", verifyToken, async (req, res) => {
    try {

        const { id } = req.params

        const deletedTestimonial = await Testimonials.findOneAndDelete({ id })

        await deleteFileFromCloudinary(deletedTestimonial.photoPublicId)

        res.status(200).json({ message: "A testimonial has been successfully deleted", isError: false })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong while deleting the testimonial", isError: true, error })
    }
})

module.exports = router