const jwt = require("jsonwebtoken")
const Users = require("../models/auth")

const { JWT_SECRET } = process.env

// const verifyToken = (req, res, next) => {

//     const authHeader = req.headers.authorization
//     const token = authHeader?.split(" ")[1]
//     if (!token) return res.status(401).json({ message: "Access token missing" });

//     jwt.verify(token, JWT_SECRET, async (error, result) => {
//         if (!error) {
//             req.uid = result.uid
//             next()
//         } else {
//             console.error(error)
//             return res.status(401).json({ message: "Unauthorized or user doesn't have access" })
//         }
//     })
// }


const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.uid = decoded.id; // `id` must match what you encoded in the login route
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

const verifySuperAdmin = (req, res, next) => {

    const token = req.headers.authorization?.split(" ")[1]
    if (!token) return res.status(401).json({ message: "Access token missing" });

    jwt.verify(token, JWT_SECRET, async (error, result) => {
        if (!error) {
            req.uid = result.uid
            try {
                // const userExists = await Users.exists({ uid: result.uid, roles: "superAdmin" })
                const userExists = await Users.exists({ uid: result.uid, roles: { $in: ["superAdmin", "admin"] } });

                if (!userExists) { return res.status(401).json({ message: "Unauthorized or user doesn't have access", isError: true }) }
                // req.superAdmin = user
                next()
            } catch (error) {
                console.error(error)
                res.status(500).json({ message: "Error at verifySuperAdmin", isError: true })
            }
        } else {
            console.error(error)
            return res.status(401).json({ message: "Unauthorized" })
        }
    })
}

module.exports = { verifyToken, verifySuperAdmin }