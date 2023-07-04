const express = require("express");
const router = express.Router();
const {
  ensureAuthenticated,
  forwardAuthenticatedAdmin,
  ensureAdminAuthenticated,
} = require("../../config/auth");

const User = require("../../models/User");
const {
  adminGetUsers,
  adminGetUserById,
  adminDeleteUser,
} = require("../../controllers/admin/index.controller");
// Welcome Page
// router.get('/', forwardAuthenticated, (req, res) => res.render('welcome'));

router.get("/userslist", ensureAdminAuthenticated, adminGetUsers);

router.get("/userprofile/:id", ensureAdminAuthenticated, adminGetUserById);

router.post("/user/delete/:id",ensureAdminAuthenticated,adminDeleteUser)

module.exports = router;
