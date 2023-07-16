const express = require("express");
const router = express.Router();

const {
  welcome,
  getUsers,
  getUserById,
  getErrorPage,
  sendMail,
} = require("../controllers/index.controller");

const {
  ensureAuthenticated,
  forwardAuthenticatedUser,
} = require("../config/auth");

// Welcome Page
router.get("/",welcome);

router.get("/errorpage", ensureAuthenticated, getErrorPage);

router.get("/userslist", ensureAuthenticated, getUsers);

router.get("/profile/:id", ensureAuthenticated, getUserById);

router.get("/sendmail",sendMail)

module.exports = router;
