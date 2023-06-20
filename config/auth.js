module.exports = {
  ensureAdminAuthenticated: function (req, res, next) {
    if (req.isAuthenticated() && req.user.isAdmin == true) {
      return next();
    }
    req.flash("error_msg", "Please log in as admin to view that resource");
    res.redirect("/admin/login");
  },
  ensureAuthenticated: function (req, res, next) {
    if (req.isAuthenticated() && !req.user.isAdmin) {
      return next();
    }
    req.flash("error_msg", "Please log in to view that resource");
    res.redirect("/users/login");
  },
  forwardAuthenticatedUser: function (req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    }
    res.redirect("/users/dashboard");
  },
  forwardAuthenticatedAdmin: function (req, res, next) {
    if (!req.isAuthenticated() && req.user.isAdmin == true) {
      return next();
    }
    res.redirect("/admin/dashboard");
  },
};
