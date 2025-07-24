const express = require("express")
const multer = require("multer")
const Announcements = require("../models/announcements")
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
                    { folder: MONGODB_NAME + '/announcements' },
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

        const announcements = new Announcements(newData)
        await announcements.save()

        res.status(201).json({ message: "A new announcement has been successfully added", isError: false, announcements })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong while adding the new announcement", isError: true, error })
    }
})

router.get("/all", verifyToken, async (req, res) => {
    try {

        const { status = "" } = req.query
        let query = {}
        if (status) { query.status = status }

        const announcements = await Announcements.find(query)

        res.status(200).json({ announcements })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong. Internal server error.", isError: true, error })
    }
})
router.get("/single-with-id/:id", verifyToken, upload.single("image"), async (req, res) => {
    try {

        const { id } = req.params

        const announcement = await Announcements.findOne({ id })

        res.status(200).json({ announcement })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong. Internal server error.", isError: true, error })
    }
})

router.patch("/update/:id", verifyToken, upload.single("image"), async (req, res) => {
    try {

        const { id } = req.params
        let formData = req.body

        const announcement = await Announcements.findOne({ id });
        if (!announcement) { return res.status(404).json({ message: "announcement not found" }) }

        let { photoURL = "", photoPublicId = "" } = announcement
        if (req.file) {
            await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: MONGODB_NAME + '/announcements' },
                    async (error, result) => {
                        if (error) { return reject(error); }
                        photoURL = result.secure_url; photoPublicId = result.public_id;
                        await deleteFileFromCloudinary(announcement.photoPublicId)
                        resolve();
                    }
                )
                uploadStream.end(req.file.buffer);
            });
        }

        const newData = { ...formData, photoURL, photoPublicId }

        const updatedAnnouncement = await Announcements.findOneAndUpdate({ id }, newData, { new: true })
        if (!updatedAnnouncement) { return res.status(404).json({ message: "Announcement didn't update" }) }


        res.status(200).json({ message: "A announcement has been successfully updated", isError: false, announcement: updatedAnnouncement })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong while updating the new announcement", isError: true, error })
    }
})

router.delete("/single/:id", verifyToken, async (req, res) => {
    try {

        const { id } = req.params

        const deletedAnnouncement = await Announcements.findOneAndDelete({ id })

        await deleteFileFromCloudinary(deletedAnnouncement.photoPublicId)

        res.status(200).json({ message: "A announcement has been successfully deleted", isError: false })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong while deleting the announcement", isError: true, error })
    }
})

module.exports = router