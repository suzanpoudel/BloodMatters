const { User, Post } = require("../../models/User");
const moment = require("moment");

exports.adminGetUsers = async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false });
    res.render("./admin/userslist", {
      user: req.user,
      users: users,
      moment,
    });
  } catch (err) {
    res.status(400).json({ err });
  }
};

exports.adminGetUserById = async (req, res) => {
  try {
    const profile = await User.findOne({ _id: req.params.id });
    console.log(profile);
    res.render("./admin/userinfo", {
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

exports.adminDeleteUser = async (req, res) => {
  try {
    const userId = req.params.id
    const user = await User.findOneAndDelete({ isAdmin: false, _id: userId });
    if(!user){
      req.flash('error_msg',"User not found!")
       return res.redirect('/admin/dashboard')
    }
    req.flash('success_msg',"User account deleted successfully!")
    return res.redirect('/admin/dashboard')
  } catch (err) {
    console.log(err)
    return res.redirect('/admin/dashboard')
  }
};