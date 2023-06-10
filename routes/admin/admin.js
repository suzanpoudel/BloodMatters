const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
// Load User model
const User = require('../../models/User');
const { forwardAuthenticatedAdmin,ensureAdminAuthenticated } = require('../../config/auth');

// Login Page
router.get('/login', async (req, res) => res.render('./admin/login'));

router.get('/profile', ensureAdminAuthenticated, (req, res) =>
  res.render('./admin/profile', {
    user: req.user
  })
);


// Login
// router.post('/login', (req, res, next) => {
//   passport.authenticate('local', {
//     successRedirect: '/admin/dashboard',
//     failureRedirect: '/admin/login',
//     failureFlash: true
//   })(req, res, next);
// });
router.post('/login',passport.authenticate('local', {
      failureRedirect: '/admin/login',
      failureFlash: true
    }),function(req, res){
        console.log(req.user)
      if(req.user.isAdmin == true) {
        res.redirect('/admin/dashboard');
    }else{
        req.flash('error_msg', 'Access denied');
        res.redirect('/admin/login');
    };
  });

// Logout
router.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/admin/login');
  });
  
});

module.exports = router;
