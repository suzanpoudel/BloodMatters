const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticatedUser } = require('../config/auth');

// Welcome Page
router.get('/', (req, res) => res.render('index'));

module.exports = router;
