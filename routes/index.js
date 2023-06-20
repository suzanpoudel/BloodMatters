const express = require("express");
const router = express.Router();

const {
  welcome,
  getUsers,
  getUserById,
  getErrorPage,
} = require("../controllers/index.controller");

const {
  ensureAuthenticated,
  forwardAuthenticatedUser,
} = require("../config/auth");

// Welcome Page
router.get("/", ensureAuthenticated, welcome);

router.get("/errorpage", ensureAuthenticated, getErrorPage);

router.get("/userslist", ensureAuthenticated, getUsers);

router.get("/profile/:id", ensureAuthenticated, getUserById);

module.exports = router;
