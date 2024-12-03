const express = require("express");
const app = express.Router();
const User = require("../Models/users");
const multer = require("multer");
const fs = require("fs");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

// File upload setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "_" + file.originalname);
    },
});
const uploads = multer({ storage }).single("image");

// Add user
app.post("/add", uploads, async (req, res) => {
    const { name, email, phone } = req.body;

    if (!req.file) {
        if (req.session) {
            req.session.message = {
                type: "danger",
                message: "Image upload failed. Please try again!",
            };
        }
        return res.redirect("/add");
    }

    const user = new User({
        name,
        email,
        phone,
        image: req.file.filename,
    });

    try {
        await user.save();
        if (req.session) {
            req.session.message = {
                type: "success",
                message: "User added successfully!",
            };
        }
        res.redirect("/");
    } catch (err) {
        console.error(err);
        fs.unlinkSync("uploads/" + req.file.filename); // Remove uploaded image if save fails
        if (req.session) {
            req.session.message = {
                type: "danger",
                message: "Failed to add user!",
            };
        }
        res.status(500).redirect("/");
    }
});

// Render Add User page
app.get("/add", (req, res) => {
    res.render("add_users", {
        title: "Add User",
    });
});

// Listing users
app.get("/", async (req, res) => {
    try {
        const users = await User.find().exec();
         const message = req.session.message; // Corrected from res.session
         delete req.session.message; // Corrected from res.session
        res.render("index", {
            title: "Home Page",
            users: users,
            message: message
        });
    } catch (err) {
        console.error(err);
        if (req.session) {
            req.session.message = {
                type: "danger",
                message: "Failed to load users!",
            };
        }
        res.redirect("/");
    }
});

// Delete user
app.get("/delete/:id", async (req, res) => {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
        if (req.session) {
            req.session.message = {
                type: "danger",
                message: "Invalid user ID!",
            };
        }
        return res.redirect("/");
    }

    try {
        const result = await User.findOneAndDelete({ _id: id });

        if (result && result.image !== "") {
            fs.unlinkSync("uploads/" + result.image); // Remove the image file
            console.log("Image removed");
        }

        if (req.session) {
            req.session.message = {
                type: "success",
                message: "Record deleted successfully!",
            };
        }
        res.redirect("/");
    } catch (err) {
        console.error(err);
        if (req.session) {
            req.session.message = {
                type: "danger",
                message: "Failed to delete the record!",
            };
        }
        res.redirect("/");
    }
});



// Edit a user route
app.get("/edit/:id", async (req, res) => {
    console.log("ok")
    try {
      const id = req.params.id;
      const user = await User.findById(id).exec();
  
      if (!user) {
        return res.redirect("/");
      }
  
      res.render("edit_users", {
        title: "Edit User",
        user: user,
      });
    } catch (err) {
      console.error(err);
      res.redirect("/");
    }
  });
  app.post("/update/:id", uploads, async (req, res) => {
    const id = req.params.id;
    const newImage = req.file ? req.file.filename : req.body.old_image;
  
    try {
      const updatedUser = await User.findByIdAndUpdate(
        id,
        {
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
          image: newImage,
        },
        { new: true }
      );
  
      if (!updatedUser) {
        throw new Error("User not found");
      }
  
      // Remove the previous image file if a new image was uploaded
      if (req.file) {
        try {
          fs.unlinkSync("./uploads/${req.body.old_image}");
        } catch (err) {
          console.log(err);
        }
      }
   
      req.session.message = {
        type: "success",
        message: "User updated successfully",
      };
      res.redirect("/");    
    } catch (err) {
      console.error(err);
      req.session.message = {
        type: "danger",
        message: err.message,
      };
      res.redirect("/");
    }
  });

module.exports = app;
