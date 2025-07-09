
const multer = require('multer');
const path = require('path');

function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Images Only!'));
    }
}

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});


const profileImageUpload = multer({
    storage: storage,
    limits: { fileSize: 2000000 }, // 2MB
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('profileImage'); // Expects ONE file from a field named 'profileImage'

const productImagesUpload = multer({
    storage: storage,
    limits: { fileSize: 2000000 }, // 2MB per file
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).array('productImages', 5); // Expects MULTIPLE files (up to 5) from a field named 'productImages'
// -----------------------------


module.exports = {
    profileImageUpload,
    productImagesUpload
};