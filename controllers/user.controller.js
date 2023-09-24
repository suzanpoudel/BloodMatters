const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const moment = require("moment");
const nodemailer = require("nodemailer")

const { User, Post } = require("../models/User");
const Activity = require("../models/Activity");
const BloodBank = require("../models/Bloodbank");

exports.getDashboard = async (req, res) => {
  try {
    const posts = await Post.find({ postType: "info" })
      .sort({ updatedAt: "desc" })
      .populate("creator", "-password -isAdmin -date -_v")
      .exec();
    res.render("./user/dashboard", {
      user: req.user,
      posts,
      moment,
    });
  } catch (err) {
    console.log(err);
    res.flash("error_msg", "Something went wrong");
    res.redirect("/errorpage");
  }
};

exports.getProfile = async (req, res) =>
  res.render("./user/profile", {
    user: req.user,
    moment,
  }
  );

exports.getLogin = async (req, res) => {
  res.render("login");
};

exports.getRegister = async (req, res) => {
  res.render("register");
};

exports.updateUserStatus = async (req, res) => {
  try {
    const user = await User.findOne({ _id : req.user._id });

    if (req.body) {
      user.status = req.body.status;
    } else {
      user.status = "Idle";
    }
    await user.save();

    const post = await Post.findOneAndDelete({ creator: req.user._id });

    if(post){
      const activity = await Activity.findOneAndUpdate(
        {postId:post._id},
        {status : 'Cancelled'},
        {new : true}
        )

        await activity.save()
    }


    req.flash(
      "success_msg",
      "Status updated successfully! All requests have been cleared!"
    );
    res.redirect("/users/profile");
  } catch (err) {
    console.log(err);
    res.send("Internal server error");
  }
};

exports.getRequestBloodForm = async (req, res) => {
  const userPosts = await Post.findOne({ creator: req.user._id });  
  let hasPost = false

  userPosts ? hasPost = true : hasPost
  console.log(hasPost);

  res.render("./user/requestblood", {
    user: req.user,
    hasPost,
    moment,
  });
};

exports.userRequestBlood = async (req, res, next) => {
  const { desc, title } = req.body;
  const userAge = moment().diff(req.user.dob, "years");
  const userPosts = await Post.findOne({ creator: req.user._id });  

  try {
    if (userPosts) {
      req.flash("error_msg", "Sorry! You have already requested for blood");
      return res.redirect("/users/requestblood");
    }

    if (!desc) {
      req.flash("error_msg", "Please enter description!");
      return res.redirect("/users/requestblood");
    }
    if (userAge < 18 || userAge > 60) {
      req.flash(
        "error_msg",
        "Sorry! You are not eligible to request/donate blood (Eligibility : 18 - 60 years)"
      );
      return res.redirect("/users/requestblood");
    }
    const post = new Post({
      creator: req.user._id,
      title: "Blood request",
      body: desc,
      postType: "request",
      imageUrl: null,
    });

    //send mail
    let transporter = await nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      auth: {
        user: `${process.env.ADMIN_EMAIL}`,
        pass: process.env.APP_PASSWORD
      }
    })

    const output = `
                      <p>You have a new blood request <span style="color:green;">[${req.user.bloodgroup}]</span></p>
                      <h3>Request Details</h3>
                      <ul>
                        <li>Id : <b>${req.user.id}</b></li>
                        <li>Name : <b>${req.user.name}</b></li>
                        <li>Bloodgroup : <b>${req.user.bloodgroup}</b></li>
                        <li>Phonenumber : <b>${req.user.phonenumber}</b></li>
                        <li>Request Date  : <b>${moment(
                          post.createdAt
                        ).format("YYYY-MM-DD")}</b></li>
                        <li>Request Description : <b>${post.body}</b></li>
                          </ul>
      `;
    
    const users = await User.find({}) 
    const emailList = []
    // users.forEach(user=>{
    //   emailList.push(user.email)
    // })
    const compatibilityMatrix = { // x -> can receive blood from -> [...]
      "O-": ["O-"],
      "O+": [ "O+","O-"],
      "A-": ["A-","O-"],
      "A+": ["A+","A-","O+","O-"],
      "B-": ["B-","O-"],
      "B+": ["B+", "B-","O+","O-"],
      "AB-": ["AB-","A-","B-","O-"],
      "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]
    };  
    
    const currentUserBloodGroup = req.user.bloodgroup
    compatibleBloodGroup = compatibilityMatrix[currentUserBloodGroup]

    const filteredUsers = users.filter(
      (user) => 
        user.status == "Doner" &&
        compatibleBloodGroup.includes(user.bloodgroup)
      );

    filteredUsers.forEach(user => {
      emailList.push(user.email)
    })

    let details = {
        from : `${process.env.ADMIN_EMAIL}`,
        to : [...emailList],
        // to : 'bloodmatters001@gmail.com',
        subject : "Blood Request",
        html: `${output}`
    }
    
    let info = await transporter.sendMail(details)

    if(!info){
      req.flash('Failed to send email')
      return res.redirect('/users/requestblood')
    }

    await post.save();

    const activity = new Activity({
      sender : req.user.id,
      receiver : null,
      type : 'Request',
      postId : post._id
    }) 

    await activity.save()

    await User.findOneAndUpdate(
      { _id: req.user._id },
      { status: "Recipent" },
      { new: true }
    );

    req.flash("success_msg", "Blood request successful!");
    res.redirect("/users/requestblood");
  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Something went wrong");
    res.redirect("/users/requestblood");
  }
};

exports.userGetRequestors = async (req, res) => {
  try {
    
    if (req.user.status == "Recipent") {
      req.flash("error_msg", "Please change status to donate!");
      return res.redirect("/users/profile");
    }


    // console.log(interactedUsersId)
    //UserModel.aggregate([ $match: { id: { $nin: <my_arr>}}])
    const posts = await Post.find({ postType: "request" }) 
      .sort({ updatedAt: "desc" })
      .populate("creator", "-password -isAdmin -date -_v")
      .exec();

      let postCreatorsId = []
      let activeReqCreatorId = []

      posts.forEach(post => postCreatorsId.push(post.creator._id))
      console.log('Post creators list',postCreatorsId);

      const activeRequests = await Activity.find(
        {
          sender : req.user.id,
          receiver: {$in : postCreatorsId},
          status : {$in : ['Pending','Accepted','Declined']}
        })
        .populate('receiver').select("receiver").exec()

      activeRequests.forEach(request => activeReqCreatorId.push(request.receiver._id.toString()))

      activeReqCreatorId = [... new Set(activeReqCreatorId)]
      console.log('Active post creators list',activeReqCreatorId);

      const compatibilityMatrix = {     // x -> can give blood to -> [...]
        "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
        "O+": [ "O+", "A+", "B+" , "AB+"],
        "A-": ["A-","A+","AB-", "AB+"],
        "A+": ["A+","AB+"],
        "B-": ["B-", "B+", "AB-", "AB+"],
        "B+": ["B+", "AB+"],
        "AB-": ["AB-","AB+"],
        "AB+": ["AB+"]
      };  
      
      const currentUserBloodGroup = req.user.bloodgroup
      compatibleBloodGroup = compatibilityMatrix[currentUserBloodGroup]
      
    const filteredPosts = posts.filter(
      (post) => 
        post.creator.status == "Recipent" &&
        compatibleBloodGroup.includes(post.creator.bloodgroup) &&
        !activeReqCreatorId.includes(post.creator._id.toString())
      );


    res.render("./user/requestors", {
      activeReq : activeReqCreatorId,
      user: req.user,
      posts: filteredPosts,
      moment,
    });
  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Something went wrong");
    res.redirect("/users/dashboard");
  }
};

exports.userDonateBlood = async(req,res)=>{
 
  try{
    const senderId = req.user.id
    const postId = req.params.id
    const post = await Post.findOne({_id:postId}).populate("creator", "-password -isAdmin -date -__v").exec()
    const receiverId = post.creator._id
    const userAge = moment().diff(req.user.dob, "years");

    //age validation 
    if (userAge < 18 || userAge > 60) {
      req.flash(
        "error_msg",
        "Sorry! You are not eligible to donate blood (Eligibility : 18 - 60 years)"
      );
      return res.redirect("/users/donateblood/requestors");
    }

    //check if notification exists for that sender
    const donationRequest = await Activity.find({sender : senderId, receiver:receiverId})
    let l = ['Completed','Cancelled']
    const pendingRequest = donationRequest.filter(donation => !(l.includes(donation.status)) )
    
    if(pendingRequest.length != 0){
      req.flash('error_msg',"Donation request already sent!")
      return res.redirect('/users/donateblood/requestors')
    }

    await User.findOneAndUpdate(
      { _id: req.user._id },
      { status: "Doner" },
      { new: true }
    );
    //save notification
    const activity = new Activity({
      sender : senderId,
      receiver : receiverId,
      type : 'Donate'
    })
    await activity.save()

    if(!activity){
      req.flash('error_msg',"Something went wrong!")
      return res.redirect('/users/donateblood')
    }
    req.flash('success_msg',"Notification successfully sent!")
    res.redirect('/users/notifications')

  }catch(err){
    console.log(err)
    req.flash('error_msg',"Internal Server Error!")
    res.redirect('/users/donateblood/requestors')
  }
}

exports.userGetActivity = async(req,res)=>{

  try {
      const activities = await Activity.find({
        $or : [
          {
            'receiver' : req.user.id
          },
          {
            'sender':req.user.id
          }

        ]
      }).sort({ updatedAt: "desc" }).populate("sender").populate("receiver").exec()
      res.render('./user/activity',{
        activities,
        user: req.user,
        moment
      })

  } catch (err) {
    console.log(err)
    req.flash('error_msg',"Internal Server Error!")
    res.redirect('/users/dashboard')
  }
}

exports.confirmRequest = async(req,res)=>{
  try {
    const activityId = req.params.id
    await Activity.findOneAndUpdate(
      { _id: activityId },
      { status: "Accepted" },
      { new: true }
    );
    req.flash('success_msg',"Request accepted!")
    res.redirect('/users/notifications')
  } catch (err) {
    console.log(err)
    req.flash('error_msg',"Internal Server Error!")
    res.redirect('/users/notifications')
  }
}

exports.declineRequest = async(req,res)=>{
  try {
    const activityId = req.params.id
    await Activity.findOneAndUpdate(
      { _id: activityId },
      { status: "Declined" },
      { new: true }
    );
    req.flash('success_msg',"Request declined!")
    res.redirect('/users/notifications')
  } catch (err) {
    console.log(err)
    req.flash('error_msg',"Internal Server Error!")
    res.redirect('/users/notifications')
  }
}

exports.cancelRequest = async(req,res)=>{
  try {
    const activityId = req.params.id
    await Activity.findOneAndUpdate(
      { _id: activityId },
      { status: "Cancelled" },
      { new: true }
    );
    req.flash('success_msg',"Donation cancelled!")
    res.redirect('/users/notifications')
  } catch (err) {
    console.log(err)
    req.flash('error_msg',"Internal Server Error!")
    res.redirect('/users/notifications')
  }
}

exports.completeRequest = async(req,res)=>{
  try {
    const activityId = req.params.id
    await Activity.findOneAndUpdate(
      { _id: activityId },
      { status: "Completed" },
      { new: true }
    );
    await Post.findOneAndDelete({creator : req.user.id})
    req.flash('success_msg',"Blood request cleared")
    await User.findOneAndUpdate(
      { _id: req.user._id },
      { status: "Idle" },
      { new: true }
    )
    req.flash('success_msg',"Status set to Idle")
    req.flash('success_msg',"Donation process completed!")
    res.redirect('/users/notifications')
  } catch (err) {
    console.log(err)
    req.flash('error_msg',"Internal Server Error!")
    res.redirect('/users/notifications')
  }
}

//Blood banks
exports.getBloodBank = async (req, res) => {
  try {
    const banks = await BloodBank.find({})
      .sort({ name : 'asc'})
      .exec();
    res.render("./user/bloodbanks", {
      user: req.user,
      banks,
      moment,
    });
  } catch (err) {
    console.log(err);
    res.flash("error_msg", "Something went wrong");
    res.redirect("/errorpage");
  }
};


exports.registerUser = async (req, res) => {
  const {
    name,
    email,
    password,
    password2,
    dob,
    gender,
    address,
    bloodgroup,
    phonenumber,
  } = req.body;
  let errors = [];

  if (
    !name ||
    !email ||
    !password ||
    !password2 ||
    !bloodgroup ||
    !phonenumber ||
    !address ||
    !dob ||
    !gender
  ) {
    errors.push({ msg: "Please enter all fields" });
    console.log(req.body);
  }

  if (password != password2) {
    errors.push({ msg: "Passwords do not match" });
  }

  let dob1 = new Date(dob)
 
  if(dob1 >= Date.now()){
    errors.push({msg:"Invalid Date of Birth!"})
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

  if (password.length < 6) {
    errors.push({ msg: "Password must be at least 6 characters!!" });
  }

  if (validatePhone(phonenumber) == false) {
    errors.push({ msg: "Invalid phone number" });
  }

  if (errors.length > 0) {
    res.render("register", {
      errors,
      name,
      email,
      password,
      password2,
      dob,
      gender,
      address,
      bloodgroup,
      phonenumber,
    });
  } else {
    User.findOne({ email: email }).then((user) => {
      if (user) {
        errors.push({ msg: "Email already exists" });
        res.render("register", {
          errors,
          name,
          email,
          password,
          password2,
          dob,
          gender,
          address,
          bloodgroup,
          phonenumber,
        });
      } else {
        const newUser = new User({
          name,
          email,
          password,
          dob,
          gender,
          address,
          bloodgroup,
          phonenumber,
        });

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then((user) => {
                req.flash(
                  "success_msg",
                  "You are now registered and can log in"
                );
                res.redirect("/users/login");
              })
              .catch((err) => console.log(err));
          });
        });
      }
    });
  }
};
