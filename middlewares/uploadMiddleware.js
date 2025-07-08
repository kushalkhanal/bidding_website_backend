const multer = require('multer');
const path = require('path');

// This function checks if the uploaded file is an image
function checkFileType(file, cb) {
    // Allowed extensions
    const filetypes = /jpeg|jpg|png|gif/;
    // Check the extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check the mimetype
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Images Only!')); // Send an error if it's not an image
    }
}

// Configure how files are stored
const storage = multer.diskStorage({
    destination: './uploads/', // The folder where files will be saved
    filename: function(req, file, cb) {
        // Create a unique filename to avoid name conflicts
        // It will look like: profileImage-168... .jpg
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Initialize the upload variable with our configuration
const upload = multer({
    storage: storage,
    limits: { fileSize: 2000000 }, // Limit file size to 2MB
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
}).single('profileImage'); // This defines that we expect a single file from a form field named 'profileImage'

module.exports = upload;