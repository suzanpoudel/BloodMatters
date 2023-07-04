const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
// Load User model
const User = require("../../models/User");

//multer
const upload = require("../../handlers/multer");

const {
  forwardAuthenticatedAdmin,
  ensureAdminAuthenticated,
} = require("../../config/auth");
const {
  getAdminDashboard,
  getAdminProfile,
  adminGetCreatePost,
  adminCreatePost,
  adminEditPost,
  adminDeletePost,
  adminGetInfoPost,
  adminGetRequestors,
  adminGet_BB_Form,
  adminCreate_BB_Post,
  AdminGet_BB_Post,
  adminEdit_BB_Post,
  adminDelete_BB_Post,
} = require("../../controllers/admin/admin.controller");

// Login Page
router.get("/login", async (req, res) => res.render("./admin/login"));

// Dashboard
router.get("/dashboard", ensureAdminAuthenticated, getAdminDashboard);

//Profile
router.get("/profile", ensureAdminAuthenticated, getAdminProfile);

//Create Post
router.get("/create/post", ensureAdminAuthenticated, adminGetCreatePost);

router.post(
  "/create/post",
  ensureAdminAuthenticated,
  upload.single("image"),
  adminCreatePost
);

router.get("/post/info", ensureAdminAuthenticated, adminGetInfoPost);

router.post("/post/edit/:id", ensureAdminAuthenticated, adminEditPost);

router.post("/post/delete/:id", ensureAdminAuthenticated, adminDeletePost);

router.get("/post/requestors", ensureAdminAuthenticated, adminGetRequestors);

//Blood Bank Centers
router.get("/bb-form",ensureAdminAuthenticated, adminGet_BB_Form)
router.post("/bb-form",ensureAdminAuthenticated, adminCreate_BB_Post)
router.get("/bloodbanks",ensureAdminAuthenticated, AdminGet_BB_Post)
router.post("/bloodbank/edit/:id",ensureAdminAuthenticated,adminEdit_BB_Post)
router.post("/bloodbank/delete/:id",ensureAdminAuthenticated,adminDelete_BB_Post)


// Login
// router.post('/login', (req, res, next) => {
//   passport.authenticate('local', {
//     successRedirect: '/admin/dashboard',
//     failureRedirect: '/admin/login',
//     failureFlash: true
//   })(req, res, next);
// });
router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/admin/login",
    failureFlash: true,
  }),
  function (req, res) {
    console.log(req.user);
    if (req.user.isAdmin == true) {
      res.redirect("/admin/dashboard");
    } else {
      req.flash("error_msg", "Access denied");
      res.redirect("/admin/login");
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
    res.redirect("/admin/login");
  });
});

module.exports = router;
