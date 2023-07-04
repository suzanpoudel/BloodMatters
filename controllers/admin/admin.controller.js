const passport = require("passport");
const moment = require("moment");
const cloudinary = require("cloudinary");

require("../../handlers/cloudinary");

const { User, Post } = require("../../models/User");
const BloodBank = require("../../models/Bloodbank")

exports.getAdminDashboard = async (req, res) =>
  res.render("./admin/dashboard", {
    user: req.user,
  });

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
        await post.save();
      } else {
        const post = new Post({
          creator: req.user._id,
          title: title,
          body: body,
          imageUrl: null,
        });
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

exports.adminGet_BB_Post = async (req, res) => {
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

exports.adminEdit_BB_Post = async (req, res) => {
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

exports.adminDelete_BB_Post = async (req, res) => {
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
