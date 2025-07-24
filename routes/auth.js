const express = require("express")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const Users = require("../models/auth")
const { verifyToken } = require("../middlewares/auth")
const { getRandomId } = require("../config/global")
const { OAuth2Client } = require('google-auth-library');
const router = express.Router()

const { JWT_SECRET_KEY } = process.env


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google-login', async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub, email, name, picture, email_verified } = payload;

        // Check if user already exists
        let user = await Users.findOne({ email });

        if (!user) {
            // Create new user
            user = new Users({
                uid: sub,
                email,
                fullName: name,
                photoURL: picture,
                isEmailVerified: email_verified,
                password: '', // no password for Google users
                roles: ['user'],
            });

            await user.save();
        }

        // Generate JWT token (optional)
        const authToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        res.status(200).json({
            token: authToken,
            user,
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(401).json({ message: 'Google authentication failed' });
    }
});



router.post("/register", async (req, res) => {
    try {

        const { firstName, lastName, fullName, email, password } = req.body

        const user = await Users.findOne({ email })
        if (user) { return res.status(401).json({ message: "Email is already in use", isError: true }) }

        const hashedPassword = await bcrypt.hash(password, 10)
        const uid = getRandomId()

        const newUserData = { firstName, lastName, fullName, email, password: hashedPassword, uid, createdBy: uid }

        const newUser = new Users(newUserData)
        await newUser.save()

        res.status(201).json({ message: "User registered successfully", isError: false, user: newUser })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong. Internal server error.", isError: true, error })
    }
})

router.post("/create-account", async (req, res) => {
    try {
        const { email, password, firstName, lastName, fullName, id, addedBy } = req.body;

        if (!email || !password || !firstName || !lastName || !id || !addedBy) {
            return res.status(400).json({ message: "All required fields must be filled." });
        }

        const existingUser = await Users.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "This email is already registered." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new Users({
            uid: getRandomId(),
            email,
            password: hashedPassword,
            firstName,
            lastName,
            fullName,
            roles: ["admin"], // ✅ Set role to admin
            createdBy: addedBy // ✅ Save who invited them
        });

        // ✅ Update the Admins collection to set status = "active"
        await Admins.findOneAndUpdate(
            { email },
            { status: "active" }
        );
        await newUser.save();

        return res.status(201).json({ message: "Admin account created successfully." });
    } catch (err) {
        console.error("Error creating admin:", err);
        return res.status(500).json({ message: "Internal server error." });
    }
});

router.post("/login", async (req, res) => {
    try {

        const { email, password } = req.body

        const user = await Users.findOne({ email })
        if (!user) { return res.status(404).json({ message: "User not found" }) }

        const match = await bcrypt.compare(password, user.password)

        if (match) {

            const { uid } = user

            const token = jwt.sign({ uid }, JWT_SECRET_KEY, { expiresIn: "1d" })

            res.status(200).json({ message: "User loggedin successfully", isError: false, token })
        } else {
            return res.status(404).json({ message: "Password is incorrect" })
        }

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong. Internal server error.", isError: true, error })
    }
})


router.get("/user", verifyToken, async (req, res) => {
    try {
        const { uid } = req;

        const user = await Users.findById(uid).select("-password").exec(); // 🔧 FIXED

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ user });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ message: "Something went wrong. Internal server error.", isError: true, error });
    }
});


router.patch("/change-password", verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) { return res.status(400).json({ message: "Please enter all fields", isError: true }); }

        const { uid } = req

        const user = await Users.findOne({ uid }).select("password").exec()
        if (!user) { return res.status(404).json({ message: "User not found", isError: true }) }

        const match = await bcrypt.compare(currentPassword, user.password)

        if (!match) { return res.status(401).json({ message: "Invalid current password", isError: true }); }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await Users.updateOne({ uid }, { password: hashedPassword });

        return res.status(200).json({ message: "Your password has been successfully changed.", isError: false });

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong. Internal server error.", isError: true, error })
    }
})

router.patch("/user-change-password", verifyToken, async (req, res) => {
    try {
        const { newPassword, uid } = req.body;

        if (!uid || !newPassword) { return res.status(400).json({ message: "Please enter all fields", isError: true }); }

        const user = await Users.findOne({ uid }).select("password").exec()
        if (!user) { return res.status(404).json({ message: "User not found", isError: true }) }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await Users.updateOne({ uid }, { password: hashedPassword });

        return res.status(200).json({ message: "User password has been successfully changed.", isError: false });

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong. Internal server error.", isError: true, error })
    }
})

module.exports = router