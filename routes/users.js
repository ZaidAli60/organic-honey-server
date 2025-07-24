const express = require("express")
const bcrypt = require("bcrypt")
const multer = require("multer")
const Users = require("../models/auth")
const { verifySuperAdmin, verifyToken } = require("../middlewares/auth")
const { getRandomId, hasRole, getUser } = require("../config/global")
const { cloudinary, deleteFileFromCloudinary } = require("../config/cloudinary")

const storage = multer.memoryStorage()
const upload = multer({ storage })
const router = express.Router()

const { MONGODB_NAME } = process.env


router.get("/all", verifySuperAdmin, async (req, res) => {
    try {
        const users = await Users.find({}) // Fetch all users

        res.status(200).json({ users })

    } catch (error) {
        console.error(error)
        res.status(500).json({ 
            message: "Something went wrong. Internal server error.", 
            isError: true, 
            error 
        })
    }
})


router.post("/add", verifySuperAdmin, upload.single("image"), async (req, res) => {
    try {

        const { uid } = req
        let formData = req.body
        let { roles, cnic, email, campusId, country = "{}", province = "{}", city = "{}", emergencyContact = "{}" } = formData

        const user = await Users.findOne({ $or: [{ cnic }, { email }] });
        if (user) { return res.status(401).json({ message: user.cnic === cnic ? "CNIC is already in use" : "Email is already in use", isError: true }) }

        const hashedPassword = await bcrypt.hash(cnic + email, 10)

        let photoURL = "", photoPublicId = "", newUserUID = getRandomId()
        if (req.file) {
            await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: MONGODB_NAME + '/users' }, // Optional: specify a folder in Cloudinary
                    (error, result) => {
                        if (error) { return reject(error); }
                        photoURL = result.secure_url; photoPublicId = result.public_id;
                        resolve();
                    }
                )
                uploadStream.end(req.file.buffer);
            });
        }

        country = JSON.parse(country)
        province = JSON.parse(province)
        city = JSON.parse(city)
        emergencyContact = JSON.parse(emergencyContact)

        const newUserData = { ...formData, uid: newUserUID, createdBy: uid, password: hashedPassword, country, province, city, emergencyContact, photoURL, photoPublicId }

        if (roles[0] === "owner") {
            newUserData.campusIds = [campusId]
            delete newUserData.campusId
        }

        const newUser = new Users(newUserData)
        await newUser.save()

        // const userWithCampus = { ...newUser.toObject() }

        // if (campusId) {
        //     const campus = await Campuses.findOne({ id: campusId })
        //     userWithCampus.campus = campus.toObject()
        // }

        res.status(201).json({ message: "A new user has been successfully added", isError: false, user: newUser })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong while adding the new user", isError: true, error })
    }
})

router.get("/all", verifyToken, async (req, res) => {
    try {

        const { uid } = req

        const { status = "" } = req.query
        let query = { roles: { $nin: ["student", "superAdmin"] } }
        if (status) { query.status = status }

        const user = await getUser({ uid }, res, "roles campusIds")

        if (!hasRole(user, ["superAdmin", "owner"])) { return res.status(401).json({ message: "Permission denied." }) }
        if (hasRole(user, ["owner"])) { query.campusId = { $in: user.campusIds } }

        const allUsers = await Users.find(query).select("-password").exec()

        const users = []
        for (let item of allUsers) {
            const user = { ...item.toObject() }
            if (user.campusId) {
                const campus = await Campuses.findOne({ id: user.campusId })
                user.campus = campus.toObject()
            }
            users.push(user)
        }

        res.status(200).json({ users })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong. Internal server error.", isError: true, error })
    }
})
router.get("/owners/all/:status", verifySuperAdmin, async (req, res) => {
    try {

        const { status = "" } = req.params
        let query = { roles: { $in: ["owner"] } }
        if (status) { query.status = status }

        const allUsers = await Users.find(query).select("-password").exec()

        const users = allUsers
        // for (let item of allUsers) {
        //     const user = { ...item.toObject() }
        //     if (user.campusId) {
        //         const campus = await Campuses.findOne({ id: user.campusId })
        //         user.campus = campus.toObject()
        //     }
        //     users.push(user)
        // }

        res.status(200).json({ users })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong. Internal server error.", isError: true, error })
    }
})

router.get("/user", verifyToken, async (req, res) => {
    try {

        const { uid } = req

        const user = await getUser({ uid }, res)

        res.status(200).json({ user })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong. Internal server error.", isError: true, error })
    }
})
router.get("/single-with-cnic/:cnic", verifyToken, upload.single("image"), async (req, res) => {
    try {

        const { cnic } = req.params

        const user = await getUser({ cnic })

        res.status(200).json({ user })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong. Internal server error.", isError: true, error })
    }
})

router.patch("/update", verifyToken, upload.single("image"), async (req, res) => {
    try {

        const { uid } = req
        let formData = req.body
        let { country = "{}", province = "{}", city = "{}", emergencyContact = "{}" } = formData

        const user = await Users.findOne({ uid });
        if (!user) { return res.status(404).json({ message: "User not found" }) }

        let { photoURL = "", photoPublicId = "" } = user
        if (req.file) {
            await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: MONGODB_NAME + '/users' }, // Optional: specify a folder in Cloudinary
                    (error, result) => {
                        if (error) { return reject(error); }
                        photoURL = result.secure_url; photoPublicId = result.public_id;
                        resolve();
                    }
                )
                uploadStream.end(req.file.buffer);
            });
        }

        country = JSON.parse(country)
        province = JSON.parse(province)
        city = JSON.parse(city)
        emergencyContact = JSON.parse(emergencyContact)

        const newData = { ...formData, country, province, city, emergencyContact, photoURL, photoPublicId }

        const updatedUser = await Users.findOneAndUpdate({ uid }, newData, { new: true })
        if (!updatedUser) { return res.status(404).json({ message: "User didn't update" }) }


        res.status(200).json({ message: "A user has been successfully updated", isError: false, user: updatedUser })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong while updating the new user", isError: true, error })
    }
})
router.patch("/update-with-cnic/:cnic", verifyToken, upload.single("image"), async (req, res) => {
    try {

        const { uid } = req
        const { cnic } = req.params
        let formData = req.body
        let { country = "{}", province = "{}", city = "{}", emergencyContact = "{}" } = formData

        const user = await Users.findOne({ cnic });
        if (!user) { return res.status(404).json({ message: "User not found" }) }

        let { photoURL = "", photoPublicId = "" } = user
        if (req.file) {
            await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: MONGODB_NAME + '/users' }, // Optional: specify a folder in Cloudinary
                    (error, result) => {
                        if (error) { return reject(error); }
                        photoURL = result.secure_url; photoPublicId = result.public_id;
                        resolve();
                    }
                )
                uploadStream.end(req.file.buffer);
            });
        }

        country = JSON.parse(country)
        province = JSON.parse(province)
        city = JSON.parse(city)
        emergencyContact = JSON.parse(emergencyContact)

        const newUserData = { ...formData, country, province, city, emergencyContact, photoURL, photoPublicId }

        const updatedUser = await Users.findOneAndUpdate({ createdBy: uid, cnic }, newUserData, { new: true })
        if (!updatedUser) { return res.status(404).json({ message: "Unauthorized or user not found" }) }

        // const userWithCampus = { ...updatedUser.toObject() }

        // if (userWithCampus.campusId) {
        //     const campus = await Campuses.findOne({ id: campusId })
        //     userWithCampus.campus = campus.toObject()
        // }

        res.status(200).json({ message: "A user has been successfully updated", isError: false, user: updatedUser })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong while updating the new user", isError: true, error })
    }
})
router.patch("/update-profile-photo", verifyToken, upload.single("image"), async (req, res) => {
    try {

        const { uid } = req

        const user = await Users.findOne({ uid });
        if (!user) { return res.status(404).json({ message: "User not found" }) }

        let { photoURL = "", photoPublicId = "" } = user
        if (req.file) {
            await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: MONGODB_NAME + '/users' }, // Optional: specify a folder in Cloudinary
                    (error, result) => {
                        if (error) { return reject(error); }
                        photoURL = result.secure_url; photoPublicId = result.public_id;
                        resolve();
                    }
                )
                uploadStream.end(req.file.buffer);
            });
        }

        // Delete old photo from cloudinary
        if (user.photoPublicId) { await deleteFileFromCloudinary(user.photoPublicId) }


        const newUserData = { photoURL, photoPublicId }

        const updatedUser = await Users.findOneAndUpdate({ uid }, newUserData, { new: true })
        if (!updatedUser) { return res.status(404).json({ message: "Unauthorized or user not found" }) }

        res.status(200).json({ message: "A user has been successfully updated", isError: false, user: updatedUser })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong while updating the new user", isError: true, error })
    }
})

module.exports = router