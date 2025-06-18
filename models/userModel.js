const mongoose = require("mongoose");
const UserSchmena = new mongoose.Schema(
    {
        username: {
            type: String,
            require: true,
            unique: true
        },
        email:
        {
            type: String,
            require: true,
            unique: true
        },
        firstName: {
            type: String,

        },
        lastName: {
            type: String,

        },
        password: {
            type: String,
            require: true
        },
        role: {
            type: String,
            enum: [user, admin],
            default: user,
        },
        wallet: {
            type: Number,
            default: 0
        }
    }, { timestamps: true }
);
module.exports = mongoose.model(
    "User", UserSchmena
)