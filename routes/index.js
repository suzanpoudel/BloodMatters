const express = require("express");
const router = express.Router();

const {
  welcome,
  getUsers,
  getUserById,
  getErrorPage,
  contactPage,
  submitContactForm
} = require("../controllers/index.controller");

const {
  ensureAuthenticated,
  forwardAuthenticatedUser,
} = require("../config/auth");

// Welcome Page
router.get("/",welcome);

//contact us page
router.get("/contact",contactPage);
router.post("/submitcontact",submitContactForm)

//error page
router.get("/errorpage", ensureAuthenticated, getErrorPage);

router.get("/userslist", ensureAuthenticated, getUsers);
router.get("/profile/:id", ensureAuthenticated, getUserById);


module.exports = router;
