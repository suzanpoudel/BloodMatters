const { User, Post } = require("../models/User");
const moment = require("moment");
const nodemailer = require('nodemailer')


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

exports.sendMail = async(req,res,post)=>{
  try {
    let transporter = await nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      auth: {
        user: 'bloodmatters001@gmail.com',
        pass: process.env.APP_PASSWORD
      }
    })

    const output = `
                      <p>You have a new blood request</p>
                      <h3>Request Details</h3>
                      <ul>
                        <li>Requestor Id : ${req.user.id}</li>
                        <li>Requestor Name : ${req.user.fname} ${
        req.user.lname
      }</li>
                        <li>Request Date  : ${moment(
                          post.createdAt
                        ).format("YYYY-MM-DD")}</li>
                        <li>Request Description : ${post.reason}
                          </ul>
      `;
    
    let details = {
        from : '"BloodMatters",<bloodmatters001@gmail.com>',
        to : "sujansapkota7777@gmail.com,sujanp020391@nec.edu.np,sujantest777@gmail.com",
        subject : "Blood Request",
        text : 'Testing mail service for bloodmatter'
    
    }
    
    let info = await transporter.sendMail(details)
    res.send(info)

}catch(err){
console.log(err);
res.send('Something went wrong')
}
}

