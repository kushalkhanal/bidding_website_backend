// File: backend/middlewares/uploadMiddleware.js

const multer = require('multer');
const path = require('path');

// --- Reusable Helper Functions ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        // This provides a specific error if the file is not an image
        cb(new Error('Error: Please upload images only (jpeg, jpg, png, gif).'));
    }
}

// --- Middleware #1: For SINGLE Profile Image Uploads ---
const profileImageUpload = (req, res, next) => {
    const upload = multer({
        storage,
        limits: { fileSize: 2000000 }, // 2MB
        fileFilter: (req, file, cb) => {
            checkFileType(file, cb);
        }
    }).single('profileImage'); // Expects a single file from the 'profileImage' field

    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'Profile image is too large. Max 2MB.' });
            }
            return res.status(400).json({ message: err.message });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        // If there's no file, or if there's no error, just proceed.
        // The controller will handle the logic of whether a file was required.
        next();
    });
};


// --- Middleware #2: For MULTIPLE Product Image Uploads ---
const productImagesUpload = (req, res, next) => {
    const upload = multer({
        storage,
        limits: { fileSize: 5000000 }, // 5MB
        fileFilter: (req, file, cb) => {
            checkFileType(file, cb);
        }
    }).array('productImages', 5); // Expects up to 5 files from the 'productImages' field

    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'One or more images are too large. Max 5MB per file.' });
            }
            return res.status(400).json({ message: err.message });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};

// --- Export both middleware functions ---
module.exports = {
    profileImageUpload,
    productImagesUpload
};