const express = require("express")
const multer = require("multer")
const bcrypt = require("bcrypt")
const Teams = require("../models/teams")
const Testimonials = require("../models/testimonials")
const Announcements = require("../models/announcements")
const Blogs = require("../models/product");
const { cloudinary } = require("../config/cloudinary")
const Users = require("../models/auth")

const { getRandomId } = require("../config/global")
const Product = require("../models/product")

const storage = multer.memoryStorage()
const upload = multer({ storage })

const router = express.Router()

const { MONGODB_NAME } = process.env



router.get("/website-content", async (req, res) => {
    try {
        const { status = "" } = req.query; // Query parameter for status filtering

        const queries = [
            Testimonials.find({ status }),
            Teams.find({ status }),
            Announcements.find({ status })
        ];
        const [faqs, testimonials, teams, announcements] = await Promise.all(queries);

        res.status(200).json({ message: "Data fetched successfully", isError: false, faqs, testimonials, teams, announcements });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error", isError: true, error });
    }
});

router.post("/apply", upload.single("image"), async (req, res) => {
    try {

        let formData = req.body
        let { courseId, course = "{}", country = "{}", province = "{}", city = "{}", campusId, cnic, email, firstName, lastName, fullName, fatherName, fatherCNIC, gender, dob, age, phone, isSendSMS = true, whatsapp, bloodGroup, education, religion, hasLaptop, computerProficiency, address, photoURL = "", photoPublicId = "" } = formData

        country = JSON.parse(country)
        province = JSON.parse(province)
        city = JSON.parse(city)
        course = JSON.parse(course)

        let studentData = { country, province, city, campusId, cnic, email, firstName, lastName, fullName, fatherName, fatherCNIC, gender, dob, age, phone, isSendSMS, whatsapp, education, religion, address, bloodGroup }

        let newUserUID = getRandomId()
        if (req.file) {
            await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: MONGODB_NAME + '/users' },
                    (error, result) => {
                        if (error) { return reject(error); }
                        photoURL = result.secure_url; photoPublicId = result.public_id;
                        resolve();
                    }
                )
                uploadStream.end(req.file.buffer);
            });
        }

        let user = await Users.findOne({ $or: [{ cnic }] });

        if (!user) {

            const hashedPassword = await bcrypt.hash(cnic + email, 10)

            const newUserData = { ...studentData, uid: newUserUID, password: hashedPassword, photoURL, photoPublicId }

            const newUser = new Users(newUserData)
            await newUser.save()

            user = { ...newUser.toObject() }
        }

        const registrationNumber = `${course.abbreviation}-${course.batch}-${user.registrationNumber}`

        const newApplicationData = { ...studentData, registrationNumber, courseId, course, computerProficiency, hasLaptop, id: getRandomId(), photoURL, photoPublicId }

        const newApplication = new Applications(newApplicationData)
        await newApplication.save()

        const campus = await Campuses.findOne({ id: campusId })

        const application = { ...newApplication.toObject() }
        application.campus = campus.toObject()

        res.status(200).json({ message: "Application has been successfully submitted", isError: false, application })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong while submitting the application", isError: true, error })
    }
})

router.get('/get-forms', async (req, res) => {
    try {
        const { cnic } = req.query

        const allApplications = await Applications.find({ cnic })

        const applications = []
        for (let item of allApplications) {
            const application = { ...item.toObject() }
            if (application.campusId) {
                const campus = await Campuses.findOne({ id: application.campusId })
                application.campus = campus.toObject()
            }
            applications.push(application)
        }
        if (applications.length === 0) return res.status(200).json({ message: "Applications not found" })
        res.status(200).json({ message: "Data fetched successfully", isError: false, applications });

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong while get forms", isError: true, error })
    }
})

router.get('/get-result', async (req, res) => {
    try {

        const { registrationNumber } = req.query;

        const application = await Applications.findOne({ registrationNumber })

        if (!application) return res.status(200).json({ message: "Wrong registration number" })

        res.status(200).json({ message: "Data fetched successfully", isError: false, application })

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Something went wrong while get result", isError: true, error })
    }
})

router.get("/campuses-courses", async (req, res) => {
    try {
        const { country, province, city } = req.query;

        const campusQuery = { status: "active" }; // Default query to fetch active campuses

        if (country) campusQuery["country.name"] = country;
        if (province) campusQuery["province.name"] = province;
        if (city) campusQuery["city.name"] = city;

        const courseQuery = { status: "active", isAdmissionOpen: true }

        const queries = [
            Campuses.find(campusQuery).select("name id address city"),
            Courses.find(courseQuery).select("title id isAdmissionOpen lastDateOfAdmission batch learningTypes classSessionsForMales classSessionsForFemales paymentType netFee abbreviation type").sort({ title: 1 })
        ];

        const [campuses, courses] = await Promise.all(queries);

        // Filtering out past admission courses
        const today = new Date();
        const availableCourses = courses.filter(course => {
            return course.lastDateOfAdmission ? new Date(course.lastDateOfAdmission) >= today : true;
        });

        res.status(200).json({ message: "Data fetched successfully", isError: false, campuses, courses: availableCourses });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error", isError: true, error });
    }
})

router.get("/campuses", async (req, res) => {
    try {
        const { country, province, city } = req.query;

        const query = { status: "active" }; // Default query to fetch active campuses

        if (country) query["country.name"] = country;
        if (province) query["province.name"] = province;
        if (city) query["city.name"] = city;

        const campuses = await Campuses.find(query).select("name id address city");

        res.status(200).json({ message: "Campuses fetched successfully", isError: false, campuses });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error", isError: true, error });
    }
})


router.get("/products", async (req, res) => {
    try {
        const blogQuery = { status: "active" };

        const allProducts = await Product.find(blogQuery).select(
            "uid id title slug category price sortOrder description imageURL createdAt status"
        );

        // Extra condition to double-check blog status
        const activeProduct = allProducts.filter(product => product.status === "active");
        // console.log(activeBlogs);
        res.status(200).json({
            message: "Products fetched successfully",
            isError: false,
            products: activeProduct
        });

    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({
            message: "Internal Server Error",
            isError: true,
            error
        });
    }
});

router.get("/product/:slug", async (req, res) => {
    try {
        const { slug } = req.params;

        const product = await Product.findOne({ slug, status: "active" });

        if (!product) {
            return res.status(404).json({ message: "Product not found", isError: true });
        }

        // Check if it's a social media bot user-agent 

        const userAgent = req.headers['user-agent'] || '';
        const isBot = /facebookexternalhit|Twitterbot|LinkedInBot|Slackbot-LinkExpanding|TelegramBot/i.test(userAgent);

        if (isBot) {
            const html = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>${product.title}</title>
                    <meta property="og:title" content="${product.title}" />
                    <meta property="og:description" content="${product.description}" />
                    <meta property="og:image" content="${product.imageURL}" />
                    
                    <meta property="og:type" content="article" />
                    <meta name="twitter:card" content="summary_large_image" />
                    <meta name="twitter:title" content="${product.title}" />
                    <meta name="twitter:description" content="${product.description}" />
                    <meta name="twitter:image" content="${product.imageURL}" />
                </head>
                <body>
                    <script>
                     
                    </script>
                </body>
                </html>
            `;
            return res.send(html);
        }

        res.status(200).json({ message: "Product fetched", isError: false, product });

    } catch (error) {
        console.error("Error fetching product by slug:", error);
        res.status(500).json({ message: "Internal Server Error", isError: true });
    }
});


module.exports = router