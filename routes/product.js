const express = require("express")
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
// const Users = require("../models/auth")
const Product = require("../models/product");
const { verifySuperAdmin, verifyToken } = require("../middlewares/auth")
const { getRandomId } = require("../config/global");
const { deleteFileFromCloudinary } = require("../config/cloudinary");

const storage = multer.memoryStorage()
const upload = multer({ storage })
const router = express.Router()

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, MONGODB_NAME } = process.env
cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET })


// Use upload.single("image") to just upload image and wherever word is req.files["image"]. replace it with only req.file
router.post("/create", verifySuperAdmin, upload.fields([{ name: "image" }]), async (req, res) => {
    try {
        const { uid } = req
        let formData = req.body

        let imageURL = "", imagePublicId = ""
        if (req.files['image'] && req.files['image'][0]) {
            await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: MONGODB_NAME + '/product' },
                    (error, result) => {
                        if (error) { return reject(error); }
                        imageURL = result.secure_url; imagePublicId = result.public_id;
                        resolve();
                    }
                )
                uploadStream.end(req.files['image'][0].buffer);
            });
        }

        const images = { imageURL, imagePublicId }


        formData = { ...formData, uid, id: getRandomId(), ...images }

        const newProduct = new Product(formData)
        await newProduct.save()

        res.status(201).json({ message: "A new product has been successfully added", isError: false, product: newProduct })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong while creating the product", isError: true, error })
    }
})

router.get("/all/:status", verifyToken, async (req, res) => {
    try {

        const { status = "" } = req.params

        let query = {}
        if (status) { query.status = status }

        const products = await Product.find(query).sort({ sortOrder: 1 })

        res.status(200).json({ message: "Products fetched for super admin", isError: false, products })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong while getting the product", isError: true, error })
    }
})

router.get("/single/:id", verifySuperAdmin, async (req, res) => {
    try {
        const { id } = req.params

        let query = {}
        if (id) { query.id = id }

        const product = await Product.findOne(query)
        res.status(200).json({ message: "Product fetched for super admin", isError: false, product })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong while getting the product", isError: true, error })
    }
})

router.patch("/update/:id", verifySuperAdmin, upload.fields([{ name: "image" }]), async (req, res) => {
    try {
        const { id } = req.params
        let formData = req.body

        const product= await Product.findOne({ id });
        if (!product) { return res.status(404).json({ message: "Product not found", isError: true }) }

        let { imageURL, imagePublicId } = product
        if (req.files['image'] && req.files['image'][0]) {
            await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: MONGODB_NAME + '/Product' },
                    (error, result) => {
                        if (error) { return reject(error); }
                        imageURL = result.secure_url; imagePublicId = result.public_id;
                        resolve();
                    }
                )
                uploadStream.end(req.files['image'][0].buffer);
            });
        }
       

        const images = { imageURL, imagePublicId}

        const newData = { ...formData, ...images}

        const updatedProduct = await Product.findOneAndUpdate({ id }, { $set: newData }, { new: true })

        res.status(200).json({ message: "The product has been successfully updated", isError: false, product: updatedProduct })

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Something went wrong while updating the product", isError: true, error })
    }
})


router.delete('/delete/:id', verifySuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findOne({ id });
        if (!product) {
            return res.status(404).json({ message: 'Product not found', isError: true });
        }

        // Delete associated Cloudinary images
        if (product.imagePublicId) await deleteFileFromCloudinary(product.imagePublicId);
        if (product.bannerPublicId) await deleteFileFromCloudinary(product.bannerPublicId);

        // Delete the product from DB
        await Product.deleteOne({ id });

        res.status(200).json({
            message: 'Product and associated images deleted successfully',
            isError: false,
        });

    } catch (error) {
        console.error('Delete Product Error:', error);
        res.status(500).json({
            message: 'An error occurred while deleting the product',
            isError: true,
            error,
        });
    }
});

module.exports = router