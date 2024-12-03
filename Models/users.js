const mongoose = require("mongoose");

// Define the schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ensures no duplicate emails
    },
    phone: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true, // Stores the filename of the uploaded image
    },
});

// Create the model
const User = mongoose.model("User", userSchema);

// Export the model
module.exports = User;
