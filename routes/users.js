const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
// Load User model
const User = require('../models/User');
const { ensureAuthenticated, forwardAuthenticatedUser } = require('../config/auth');

// Login Page
router.get('/login', async (req, res) => res.render('login'));

// Register Page
router.get('/register', (req, res) => res.render('register'));

// Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) =>
  res.render('./user/dashboard', {
    user: req.user
  })
);

router.get('/profile', ensureAuthenticated, (req, res) =>
  res.render('./user/profile', {
    user: req.user
  })
);



// Register
router.post('/register', (req, res) => {
  const { name, email, password, password2,age,gender,address,bloodgroup,phonenumber } = req.body;
  let errors = [];

  if (!name || !email || !password || !password2 || !bloodgroup || !phonenumber || !address || !age || !gender) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (password != password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors,
      name,
      email,
      password,
      password2,
      age,gender,address,bloodgroup,phonenumber
    });
  } else {
    User.findOne({ email: email }).then(user => {
      if (user) {
        errors.push({ msg: 'Email already exists' });
        res.render('register', {
          errors,
          name,
          email,
          password,
          password2,
          age,gender,address,bloodgroup,phonenumber
        });
      } else {
        const newUser = new User({
          name,
          email,
          password,
          age,gender,address,bloodgroup,phonenumber
        });

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => {
                req.flash(
                  'success_msg',
                  'You are now registered and can log in'
                );
                res.redirect('/users/login');
              })
              .catch(err => console.log(err));
          });
        });
      }
    });
  }
});

// Login
// router.post('/login', (req, res, next) => {
//   passport.authenticate('local', {
//     successRedirect: '/dashboard',
//     failureRedirect: '/users/login',
//     failureFlash: true
//   })(req, res, next);
// });
router.post('/login',
  passport.authenticate('local', {
    failureRedirect: '/users/login',
    failureFlash: true
  }),function(req, res){
    console.log(req.user)
    if(req.user.isAdmin == false) {
      res.redirect('/users/dashboard');
  }else{
    req.flash('error_msg', 'Access denied');
    res.redirect('/users/login');
  };
})


// Logout
router.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
  });
  
});

module.exports = router;
