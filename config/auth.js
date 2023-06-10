module.exports = {
  ensureAdminAuthenticated: function(req, res, next) {
    if (req.isAuthenticated() && req.user.isAdmin == true) {
      return next();
    }
    req.flash('error_msg', 'Please log in as admin to view that resource');
    res.redirect('/users/login');
  },
  ensureAuthenticated: function(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash('error_msg', 'Please log in to view that resource');
    res.redirect('/users/login');
  },
  forwardAuthenticatedUser: function(req, res, next) {
    if (!req.isAuthenticated() && req.user.isAdmin == false) {
      return next();
    }
    res.redirect('/dashboard');      
  },
  forwardAuthenticatedAdmin: function(req, res, next) {
    if (!req.isAuthenticated() && req.user.isAdmin == false) {
      return next();
    }
    res.redirect('/admin/dashboard');      
  }
};
