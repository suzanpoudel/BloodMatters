const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");

// Load User model
const User = require("../models/User");
const {
  getLogin,
  getRegister,
  getDashboard,
  getProfile,
  registerUser,
  updateUserStatus,
  getRequestBloodForm,
  userRequestBlood,
  userGetRequestors,
} = require("../controllers/user.controller");
const { ensureAuthenticated } = require("../config/auth");

// Login Page
router.get("/login", getLogin);

// Register Page
router.get("/register", getRegister);

// Dashboard
router.get("/dashboard", ensureAuthenticated, getDashboard);

//Profile
router.get("/profile", getProfile);

//Request blood form
router.get("/requestblood", ensureAuthenticated, getRequestBloodForm);

//Request blood
router.post("/requestblood", ensureAuthenticated, userRequestBlood);

//Get Requestors
router.get("/donateblood/requestors", ensureAuthenticated, userGetRequestors);

//Update Status
router.post("/updatestatus/:id", ensureAuthenticated, updateUserStatus);

// Register
router.post("/register", registerUser);

// Login
// router.post('/login', (req, res, next) => {
//   passport.authenticate('local', {
//     successRedirect: '/dashboard',
//     failureRedirect: '/users/login',
//     failureFlash: true
//   })(req, res, next);
// });
router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/users/login",
    failureFlash: true,
  }),
  (req, res) => {
    console.log(req.user);
    if (req.user.isAdmin == false) {
      res.redirect("/users/dashboard");
    } else {
      req.flash("error_msg", "Access denied");
      res.redirect("/users/login");
    }
  }
);

// Logout
router.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.flash("success_msg", "You are logged out");
    res.redirect("/users/login");
  });
});

module.exports = router;
