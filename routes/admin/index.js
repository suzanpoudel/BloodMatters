const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticatedAdmin,ensureAdminAuthenticated } = require('../../config/auth');

const User = require('../../models/User');
// Welcome Page
// router.get('/', forwardAuthenticated, (req, res) => res.render('welcome'));

// Dashboard
router.get('/dashboard', ensureAdminAuthenticated, (req, res) =>
  res.render('./admin/dashboard', {
    user: req.user
  })
);

module.exports = router;
