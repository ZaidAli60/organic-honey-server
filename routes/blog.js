const express = require("express")
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
// const Users = require("../models/auth")
const Blog = require("../models/blog");
const { verifySuperAdmin, verifyToken } = require("../middlewares/auth")
const { getRandomId } = require("../config/global");
const { deleteFileFromCloudinary } = require("../config/cloudinary");

const storage = multer.memoryStorage()
const upload = multer({ storage })
const router = express.Router()

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, MONGODB_NAME } = process.env
cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET })


// Use upload.single("image") to just upload image and wherever word is req.files["image"]. replace it with only req.file
router.post("/create", verifySuperAdmin, upload.fields([{ name: "image" }, { name: "banner" }]), async (req, res) => {
    try {
        const { uid } = req
        let formData = req.body

        let imageURL = "", imagePublicId = "", bannerURL = "", bannerPublicId = ""
        if (req.files['image'] && req.files['image'][0]) {
            await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: MONGODB_NAME + '/blog' },
                    (error, result) => {
                        if (error) { return reject(error); }
                        imageURL = result.secure_url; imagePublicId = result.public_id;
                        resolve();
                    }
                )
                uploadStream.end(req.files['image'][0].buffer);
            });
        }
        if (req.files['banner'] && req.files['banner'][0]) {
            await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: MONGODB_NAME + '/blog' },
                    (error, result) => {
                        if (error) { return reject(error); }
                        bannerURL = result.secure_url; bannerPublicId = result.public_id;
                        resolve();
                    }
                )
                uploadStream.end(req.files['banner'][0].buffer);
            });
        }

        const images = { imageURL, imagePublicId, bannerURL, bannerPublicId }


        formData = { ...formData, uid, id: getRandomId(), ...images }

        const newBlog = new Blog(formData)
        await newBlog.save()

        res.status(201).json({ message: "A new blog has been successfully added", isError: false, blog: newBlog })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong while creating the blog", isError: true, error })
    }
})

router.get("/all/:status", verifyToken, async (req, res) => {
    try {

        const { status = "" } = req.params

        let query = {}
        if (status) { query.status = status }

        const blogs = await Blog.find(query).sort({ sortOrder: 1 })

        res.status(200).json({ message: "Blogs fetched for super admin", isError: false, blogs })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong while getting the Blog", isError: true, error })
    }
})

router.get("/single/:id", verifySuperAdmin, async (req, res) => {
    try {
        const { id } = req.params

        let query = {}
        if (id) { query.id = id }

        const blog = await Blog.findOne(query)
        res.status(200).json({ message: "Blog fetched for super admin", isError: false, blog })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong while getting the blog", isError: true, error })
    }
})

router.patch("/update/:id", verifySuperAdmin, upload.fields([{ name: "image" }, { name: "banner" }]), async (req, res) => {
    try {
        const { id } = req.params
        let formData = req.body

        const course = await Blog.findOne({ id });
        if (!course) { return res.status(404).json({ message: "Blog not found", isError: true }) }

        let { imageURL, imagePublicId, bannerURL, bannerPublicId } = course
        if (req.files['image'] && req.files['image'][0]) {
            await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: MONGODB_NAME + '/Blog' },
                    (error, result) => {
                        if (error) { return reject(error); }
                        imageURL = result.secure_url; imagePublicId = result.public_id;
                        resolve();
                    }
                )
                uploadStream.end(req.files['image'][0].buffer);
            });
        }
        if (req.files['banner'] && req.files['banner'][0]) {
            await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: MONGODB_NAME + '/Blog' },
                    (error, result) => {
                        if (error) { return reject(error); }
                        bannerURL = result.secure_url; bannerPublicId = result.public_id;
                        resolve();
                    }
                )
                uploadStream.end(req.files['banner'][0].buffer);
            });
        }

        const images = { imageURL, imagePublicId, bannerURL, bannerPublicId }

        const newData = { ...formData, ...images}

        const updatedBlog = await Blog.findOneAndUpdate({ id }, { $set: newData }, { new: true })

        res.status(200).json({ message: "The blog has been successfully updated", isError: false, blog: updatedBlog })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong while updating the blog", isError: true, error })
    }
})


router.delete('/delete/:id', verifySuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const blog = await Blog.findOne({ id });
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found', isError: true });
        }

        // Delete associated Cloudinary images
        if (blog.imagePublicId) await deleteFileFromCloudinary(blog.imagePublicId);
        if (blog.bannerPublicId) await deleteFileFromCloudinary(blog.bannerPublicId);

        // Delete the blog from DB
        await Blog.deleteOne({ id });

        res.status(200).json({
            message: 'Blog and associated images deleted successfully',
            isError: false,
        });

    } catch (error) {
        console.error('Delete Blog Error:', error);
        res.status(500).json({
            message: 'An error occurred while deleting the blog',
            isError: true,
            error,
        });
    }
});

module.exports = router