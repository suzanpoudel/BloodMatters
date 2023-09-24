const passport = require("passport");
const moment = require("moment");
const cloudinary = require("cloudinary");
const nodemailer = require("nodemailer")

require("../../handlers/cloudinary");

const { User, Post } = require("../../models/User");
const Activity = require('../../models/Activity')
const BloodBank = require("../../models/Bloodbank")

exports.getAdminDashboard = async (req, res) => {

  try {
    
    const userCount = await User.find({isAdmin:false}).count().exec()
    const postCount = await Post.find({}).count().exec()
    const activityCount = await Activity.find({}).count().exec()
    const bloodBankCount = await BloodBank.find({}).count().exec()
    const bloodGrpCount = []
    const bloodGrpLabels = []
    const activityStatusCount = []
    const activityStatusLabels = []
  
    //get count of each blood groups
    const blood_grp_count_result = await User.aggregate([
      {
          $group: {
              _id: {
                  bloodgroup: '$bloodgroup'
              },
              count: {
                  $sum: 1
              }
          }
      },
      {
        $project: {
            bloodgroup: '$bloodgroup.bloodgroup',
            count: '$count'
        }
    }
  ]);

  //get count of activity status
  const activity_status_count_result = await Activity.aggregate([
    {
        $group: {
            _id: {
                status: '$status'
            },
            count: {
                $sum: 1
            }
        }
    },
    {
      $project: {
          status: '$status.status',
          count: '$count'
      }
  }
]);


//sort with specific order
// const sortedResult =  result.sort((a, b) => {
  //   return bloodGroupsOrder.indexOf(a.bloodgroup) - bloodGroupsOrder.indexOf(b.bloodgroup);
  // });

  //push data to respective array
  blood_grp_count_result.forEach(item => {
    bloodGrpCount.push(item.count)
    bloodGrpLabels.push(item._id.bloodgroup)
  })

  activity_status_count_result.forEach(item => {
    activityStatusCount.push(item.count)
    activityStatusLabels.push(item._id.status)
  })
  
  // console.log(blood_grp_count_result);
  // console.log(bloodGrpCount);
  // console.log(bloodGrpLabels);
  
  console.log(activity_status_count_result);


    res.render("./admin/dashboard", {
      userCount,
      postCount,
      activityCount,
      bloodBankCount,
      bloodGrpCount,
      bloodGrpLabels,
      activityStatusCount,
      activityStatusLabels,
      user: req.user,
    });
  } catch (err) {
    console.log(err)
    res.send('Something went wrong')
  }
}



exports.getAdminProfile = async (req, res) =>
  res.render("./admin/profile", {
    user: req.user,
    moment,
  });

exports.adminGetCreatePost = async (req, res) => {
  res.render("./admin/createpost", {
    user: req.user,
  });
};

exports.adminCreatePost = async (req, res) => {
  const { title, body, image } = req.body;

  let errors = [];

  if (!title || !body) {
    errors.push({
      msg: "Please fill in all required fields",
    });
  }

  if (errors.length > 0) {
    res.render("createpost", {
      errors,
      title,
      body,
      user: req.user,
    });
  } else {
    
    try {
          const users = await User.find({}) 
          const emailList = []
          users.forEach(user=>{
          emailList.push(user.email)
        })
     
         //mail : setup 
         let transporter = await nodemailer.createTransport({
          service: 'gmail',
          host: 'smtp.gmail.com',
          auth: {
            user: `${process.env.ADMIN_EMAIL}`,
            pass: process.env.APP_PASSWORD
          }
        })

      if (req.file) {
        const result = await cloudinary.v2.uploader.upload(req.file.path);
        if (!result) {
          req.flash(
            "error_msg",
            "Error encountered while uploading image to Cloudinary"
          );
          return res.redirect("/admin/post/info");
        }
        const post = new Post({
          creator: req.user._id,
          title: title,
          body: body,
          postType: "info",
          imageUrl: result?.secure_url,
        });

     //mail output   
    const output = `
                      <p>New Post!</p>
                      <h2>${post.title}</h2>
                      <h4>${post.body}</h4>
                      ${post.imageUrl}
                      <p>Posted by : <b>${req.user.name}</b><span> on <b>${moment(
                        post.createdAt
                      ).format("YYYY-MM-DD")}</b></span> </p> `
      
      
                      let details = {
                        from : `${process.env.ADMIN_EMAIL}`,
                        to : [...emailList],
                        // to : 'bloodmatters001@gmail.com',
                        subject : "BloodMatters Post",
                        html: `${output}`
                    }
                
                    await transporter.sendMail(details)
    
      await post.save();

      } else {
        const post = new Post({
          creator: req.user._id,
          title: title,
          body: body,
          imageUrl: null,
        });

         //mail output
        const output = `
                      <p>New Post!</p>
                      <h2>${post.title}</h2>
                      <h4>${post.body}</h4>
                      <p>Posted by : <b>${req.user.name}</b><span> on <b>${moment(
                        post.createdAt
                      ).format("YYYY-MM-DD")}</b></span> </p> `

        
      let details = {
        from : `${process.env.ADMIN_EMAIL}`,
        to : [...emailList],
        // to : 'bloodmatters001@gmail.com',
        subject : "BloodMatters Post",
        html: `${output}`
    }

       await transporter.sendMail(details)
                      
        await post.save();
      }



      req.flash("success_msg", "Post uploaded successfully!!");
      res.redirect("/admin/post/info");
    } catch (err) {
      console.log(err);
      req.flash("error_msg", "Something went wrong");
      res.redirect("/admin/create/post");
    }
  }
};

exports.adminGetInfoPost = async (req, res) => {
  try {
    const posts = await Post.find({ postType: "info" })
      .sort({ updatedAt: "desc" })
      .populate("creator", "-password -isAdmin -date -_v")
      .exec();
    res.render("./admin/posts", {
      user: req.user,
      posts,
      moment,
    });
  } catch (err) {
    console.log(err);
    res.flash("error_msg", "Something went wrong");
    res.redirect("/admin/post/info");
  }
};

exports.adminEditPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findOne({ _id: postId });
    if (!post) {
      req.flash("error_msg", "Something went wrong!");
      res.redirect("/admin/post/info");
    }
    post.title = req.body.title;
    post.body = req.body.body;
    await post.save();
    req.flash("success_msg", "Post successfully updated");
    res.redirect("/admin/post/info");
  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Something went wrong");
    res.redirect("/admin/post/info");
  }
};

exports.adminDeletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    await Post.findOneAndDelete({ _id: postId });
    req.flash("success_msg", "Post successfully deleted!");
    res.redirect("/admin/post/info");
  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Something went wrong!");
    res.redirect("/admin/post/info");
  }
};


exports.adminGet_BB_Form = async (req, res) => {  // BB -> BloodBank
  res.render("./admin/bloodbankpost", {
    user: req.user,
  });
};

exports.adminCreate_BB_Post = async (req, res) => {
  const { name, address, contact, o_pos,o_neg,a_pos,a_neg,b_pos,b_neg,ab_pos,ab_neg } = req.body;
  console.log(req.body);
  let errors = [];

  if (!name || !address || !contact || !o_pos || !o_neg || !a_pos || !a_neg || !b_pos || !b_neg || !ab_pos || !ab_neg) {
    errors.push({
      msg: "Please fill in all required fields",
    });
  }
  
  if (errors.length > 0) {
    res.render("./admin/bloodbankpost", {
      errors,
      name,
      address,
      contact,
      o_neg,o_pos,a_neg,a_pos,b_neg,b_pos,ab_neg,ab_pos,
      user: req.user,
    });
  } else {
    try {
        const bb_upload = new BloodBank({
          name: name,
          address: address,
          contact: contact,
          bloodgroup : [
            {type : "o_pos",quantity:o_pos},
            {type : "o_neg",quantity:o_neg},
            {type : "a_pos",quantity:a_pos},
            {type : "a_neg",quantity:a_neg},
            {type : "b_pos",quantity:b_pos},
            {type : "b_neg",quantity:b_neg},
            {type : "ab_pos",quantity:ab_pos},
            {type : "ab_neg",quantity:ab_neg},
          ]
        });
        await bb_upload.save();
        req.flash("success_msg", "Blood Bank uploaded successfully!!");
        res.redirect("/admin/bb-form");
    } catch (err) {
      console.log(err);
      req.flash("error_msg", "Something went wrong");
      res.redirect("/admin/bb-form");
    }
  }
};

//Blood banks
exports.AdminGet_BB_Post = async (req, res) => {
  try {
    const banks = await BloodBank.find({})
      .sort({ name : 'asc'})
      .exec();
    res.render("./admin/bloodbanks", {
      user: req.user,
      banks,
      moment,
    });
  } catch (err) {
    console.log(err);
    res.flash("error_msg", "Something went wrong");
    res.redirect("/admin/dashboard");
  }
};

exports.adminEdit_BB_Post = async (req, res) => {

  const bankPostId = req.params.id
  const { name, address, contact, o_pos,o_neg,a_pos,a_neg,b_pos,b_neg,ab_pos,ab_neg } = req.body;

    try {
        const bankPost = await BloodBank.findOneAndUpdate({
          name: name,
          address: address,
          contact: contact,
          bloodgroup : [
            {type : "o_pos",quantity:o_pos},
            {type : "o_neg",quantity:o_neg},
            {type : "a_pos",quantity:a_pos},
            {type : "a_neg",quantity:a_neg},
            {type : "b_pos",quantity:b_pos},
            {type : "b_neg",quantity:b_neg},
            {type : "ab_pos",quantity:ab_pos},
            {type : "ab_neg",quantity:ab_neg},
          ]
        });
        await bankPost.save();
        req.flash("success_msg", "Blood bank content updated successfully!!");
        res.redirect("/admin/bloodbanks");
    } catch (err) {
      console.log(err);
      req.flash("error_msg", "Something went wrong");
      res.redirect("/admin/bloodbanks");
    }
  }

exports.adminDelete_BB_Post = async (req, res) => {
  try {
    const bankPostId = req.params.id;
    await BloodBank.findOneAndDelete({ _id: bankPostId });
    req.flash("success_msg", "Blood Bank successfully deleted!");
    res.redirect("/admin/bloodbanks");
  } catch (err) {
    console.log(err);
    req.flash("error_msg", "Something went wrong!");
    res.redirect("/admin/bloodbanks");
  }
};


exports.adminGetRequestors = async (req, res) => {
  try {
    const posts = await Post.find({ postType: "request" })
      .sort({ updatedAt: "desc" })
      .populate("creator", "-password -isAdmin -date -_v")
      .exec();

    // const result = posts[0].creator.name;
    // console.log(result);
    const filteredPosts = posts.filter(
      (post) => post.creator.status == "Recipent"
    );

    res.render("./admin/requestors", {
      user: req.user,
      posts: filteredPosts,
      moment,
    });
  } catch (err) {
    console.log(err);
    res.flash("error_msg", "Something went wrong");
    res.redirect("/admin/post/info");
  }
};
