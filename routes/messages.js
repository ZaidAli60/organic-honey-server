const express = require("express")
const Messages = require("../models/messages");
const { verifySuperAdmin } = require("../middlewares/auth")
const { getRandomId } = require("../config/global");

const router = express.Router()

router.post("/create", async (req, res) => {
    try {

        let formData = req.body

        const message = new Messages({ ...formData, id: getRandomId() })
        await message.save()

        res.status(201).json({ message: "Your message has been successfully received", isError: false, message })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong while sending the message", isError: true, error })
    }
})

router.get("/all", verifySuperAdmin, async (req, res) => {
    try {

        const { status = "" } = req.query
        let query = {}
        if (status) { query.status = status }

        const messages = await Messages.find(query).sort({ createdAt: -1 }).exec()

        res.status(200).json({ message: "Messages fetched for super admin", isError: false, messages })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong while getting the messages", isError: true, error })
    }
})
router.get("/all-unread", verifySuperAdmin, async (req, res) => {
    try {

        let query = { isRead: false }

        const messages = await Messages.countDocuments(query)

        res.status(200).json({ message: "Messages fetched for super admin", isError: false, messages })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong while getting the messages", isError: true, error })
    }
})

router.patch("/update/:id", verifySuperAdmin, async (req, res) => {
    try {

        const { id } = req.params
        let { status } = req.body

        const newData = { status }

        const updatedMessage = await Messages.findOneAndUpdate({ id }, { $set: newData }, { new: true })

        res.status(200).json({ message: "The message has been successfully updated", isError: false, message: updatedMessage })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong while updating the message", isError: true, error })
    }
})
router.patch("/update-read/:id", verifySuperAdmin, async (req, res) => {
    try {

        const { id } = req.params

        const newData = { isRead: true }

        const updatedMessage = await Messages.findOneAndUpdate({ id }, { $set: newData }, { new: true })

        res.status(200).json({ message: "The message has been successfully marked as read", isError: false, message: updatedMessage })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong while updating the message", isError: true, error })
    }
})

router.delete("/single/:id", verifySuperAdmin, async (req, res) => {
    try {

        const { id } = req.params

        await Messages.findOneAndDelete({ id })

        res.status(200).json({ message: "The message has been successfully deleted", isError: false })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong while deleting the message", isError: true, error })
    }
})

module.exports = router