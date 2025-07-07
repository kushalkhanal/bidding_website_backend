const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
     
        email: { type: String, required: true, unique: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        password: { type: String, required: true },
        
        
        nepaliNumber: { 
            type: String, 
            required: true,
            unique: true,
            // Optional but recommended: Add validation for a 10-digit number
            match: [/^\d{10}$/, 'Please fill a valid 10-digit mobile number'] 
        },
        // -----------------------------

        role: { type: String, enum: ['user', 'admin'], default: 'user' },
        wallet: { type: Number, default: 0 },
        profileImage: { type: String, default: '/uploads/default-avatar.png' },
        location: { type: String, default: '', maxLength: 100 },
    }, 
    { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);