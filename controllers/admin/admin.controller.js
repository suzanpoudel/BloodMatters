const passport = require("passport");
const moment = require("moment");
const cloudinary = require("cloudinary");

require("../../handlers/cloudinary");

const { User, Post } = require("../../models/User");

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
    res.render("uploadreport", {
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
