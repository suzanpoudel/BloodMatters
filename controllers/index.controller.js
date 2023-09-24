const { User, Post } = require("../models/User");
const moment = require("moment");
const nodemailer = require('nodemailer')


exports.welcome = async (req, res) => {
  res.render("index");
};

exports.contactPage = async (req, res) => {
  res.render("contact");
};

exports.aboutus = async (req, res) => {
  res.render("aboutus");
};

exports.submitContactForm = async(req,res)=>{
  try {

    //get form values 
    const {name,email,phonenumber,address,msg} = req.body

    let errors = [];

  if (
    !name ||
    !email ||
    !phonenumber ||
    !address ||
    !msg
  ) {
    errors.push({ msg: "Please enter all fields" });
    console.log(req.body);
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

  if (validatePhone(phonenumber) == false) {
    errors.push({ msg: "Invalid phone number" });
  }

  if (errors.length > 0) {
    res.render("contact", {
      errors,
      name,
      email,
      address,
      phonenumber,
      msg
    });
  } else {

    let transporter = await nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      auth: {
        user: 'bloodmatters001@gmail.com',
        pass: process.env.APP_PASSWORD
      }
    })

    const output = `
                      <p>New Contact Request</p>
                      <h3>Contact Details</h3>
                      <ul>
                        <li>Name : <b>${name}</b></li>
                        <li>Email : <b>${email}</b></li>
                        <li>Phonenumber : <b>${phonenumber}</b></li>
                        <li>Address : <b>${address}</b></li>
                        <li>Message : <b>${msg?msg:null}</b></li>
                          </ul>
      `;
    
    let details = {
        from : `${email}`,
        to : `bloodmatters001@gmail.com`,
        subject : "Contact Request",
        html: `${output}`
    }
    
    let info = await transporter.sendMail(details)
    
    if(!info){
      req.flash('Failed to submit contact details')
      return res.redirect('/contact')
    }
    req.flash("success_msg", "Success! Your contact details was sent. Thank you for your reqeust!");
    res.redirect("/contact");
  }
}catch(err){
console.log(err);
res.send('Something went wrong')
}
}


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

