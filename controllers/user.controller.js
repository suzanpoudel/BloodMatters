const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const moment = require("moment");

const { User, Post } = require("../models/User");

exports.getDashboard = async (req, res) => {
  try {
    const posts = await Post.find({ postType: "info" })
      .sort({ updatedAt: "desc" })
      .populate("creator", "-password -isAdmin -date -_v")
      .exec();
    res.render("./user/dashboard", {
      user: req.user,
      posts,
      moment,
    });
  } catch (err) {
    console.log(err);
    res.flash("error_msg", "Something went wrong");
    res.redirect("/errorpage");
  }
};

exports.getProfile = async (req, res) =>
  res.render("./user/profile", {
    user: req.user,
    moment,
  });

exports.getLogin = async (req, res) => {
  res.render("login");
};

exports.getRegister = async (req, res) => {
  res.render("register");
};

exports.updateUserStatus = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });

    if (req.body) {
      user.status = req.body.status;
    } else {
      user.status = "Idle";
    }
    await user.save();

    const posts = await Post.deleteMany({ creator: req.user._id });
    req.flash(
      "success_msg",
      "Status updated successfully! All requests have been cleared!"
    );
    res.redirect("/users/profile");
  } catch (err) {
    console.log(err);
    res.send("Internal server error");
  }
};

exports.getRequestBloodForm = async (req, res) => {
  res.render("./user/requestblood", {
    user: req.user,
    moment,
  });
};

exports.userRequestBlood = async (req, res) => {
  const { desc, title } = req.body;
  const userAge = moment().diff(req.user.dob, "years");

  try {
    const userPosts = await Post.findOne({ creator: req.user._id });

    if (userPosts) {
      req.flash("error_msg", "Sorry! You have already requested for blood");
      return res.redirect("/users/requestblood");
    }

    if (!desc) {
      req.flash("error_msg", "Please enter description!");
      return res.redirect("/users/requestblood");
    }
    if (userAge < 18 || userAge > 60) {
      req.flash(
        "error_msg",
        "Sorry! You are not eligible to donate blood (Eligibility : 18 - 60 years)"
      );
      return res.redirect("/users/requestblood");
    }
    const post = new Post({
      creator: req.user._id,
      title: "Blood request",
      body: desc,
      postType: "request",
      imageUrl: null,
    });

    await User.findOneAndUpdate(
      { _id: req.user._id },
      { status: "Recipent" },
      { new: true }
    );
    await post.save();

    req.flash("success_msg", "Blood request successful!");
    res.redirect("/users/requestblood");
  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Something went wrong");
    res.redirect("/users/requestblood");
  }
};

exports.userGetRequestors = async (req, res) => {
  try {
    const posts = await Post.find({ postType: "request" })
      .sort({ updatedAt: "desc" })
      .populate("creator", "-password -isAdmin -date -_v")
      .exec();

    const filteredPosts = posts.filter(
      (post) =>
        post.creator.status == "Recipent" &&
        post.creator.bloodgroup == req.user.bloodgroup &&
        post.creator._id != req.user._id
    );

    if (req.user.status == "Recipent") {
      req.flash("error_msg", "Please change status to donate!");
      return res.redirect("/users/dashboard");
    }

    res.render("./user/requestors", {
      user: req.user,
      posts: filteredPosts,
      moment,
    });
  } catch (err) {
    console.log(err);
    res.flash("error_msg", "Something went wrong");
    res.redirect("/users/dashboard");
  }
};

exports.registerUser = async (req, res) => {
  const {
    name,
    email,
    password,
    password2,
    dob,
    gender,
    address,
    bloodgroup,
    phonenumber,
  } = req.body;
  let errors = [];

  if (
    !name ||
    !email ||
    !password ||
    !password2 ||
    !bloodgroup ||
    !phonenumber ||
    !address ||
    !dob ||
    !gender
  ) {
    errors.push({ msg: "Please enter all fields" });
    console.log(req.body);
  }

  if (password != password2) {
    errors.push({ msg: "Passwords do not match" });
  }

  const phonePattern = /^(01\d{7}|98\d{8})$/;
  function validatePhone(phone) {
    // Test the phone number against the pattern and return the result
    return phonePattern.test(phone);
  }

  const emailPattern =
    /^[a-zA-Z0-9_.+-]+@(gmail|yahoo|outlook|hotmail|proton)\.com$/;
  function validateEmail(email) {
    // Test the phone number against the pattern and return the result
    return emailPattern.test(email);
  }

  if (validateEmail(email) == false) {
    errors.push({ msg: "Invalid email" });
  }

  if (password.length < 6) {
    errors.push({ msg: "Password must be at least 6 characters!!" });
  }

  if (validatePhone(phonenumber) == false) {
    errors.push({ msg: "Invalid phone number" });
  }

  if (errors.length > 0) {
    res.render("register", {
      errors,
      name,
      email,
      password,
      password2,
      dob,
      gender,
      address,
      bloodgroup,
      phonenumber,
    });
  } else {
    User.findOne({ email: email }).then((user) => {
      if (user) {
        errors.push({ msg: "Email already exists" });
        res.render("register", {
          errors,
          name,
          email,
          password,
          password2,
          dob,
          gender,
          address,
          bloodgroup,
          phonenumber,
        });
      } else {
        const newUser = new User({
          name,
          email,
          password,
          dob,
          gender,
          address,
          bloodgroup,
          phonenumber,
        });

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then((user) => {
                req.flash(
                  "success_msg",
                  "You are now registered and can log in"
                );
                res.redirect("/users/login");
              })
              .catch((err) => console.log(err));
          });
        });
      }
    });
  }
};
