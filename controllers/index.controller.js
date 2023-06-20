const { User, Post } = require("../models/User");
const moment = require("moment");

exports.welcome = async (req, res) => {
  res.render("index");
};

exports.getErrorPage = async (req, res) => {
  res.render("errorpage", {
    user: req.user,
  });
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false });
    res.render("./user/userslist", {
      user: req.user,
      users: users,
      moment,
    });
  } catch (err) {
    res.status(400).json({ err });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const profile = await User.findOne({ _id: req.params.id });
    console.log(profile);
    res.render("./user/userinfo", {
      user: req.user,
      profile,
      moment,
    });
  } catch (err) {
    // res.status(404).send("User not found!!");
    req.flash("error_msg", "Sorry! User not found");
    res.redirect("/userslist");
  }
};
