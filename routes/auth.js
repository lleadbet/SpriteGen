var express = require('express');
var router = express.Router();
var passport = require('passport'),
    RedditStrategy = require('passport-reddit').Strategy;

var crypto = require('crypto');

/* GET home page. */
router.get('/reddit', function(req, res, next) {
  req.session.state = crypto.randomBytes(32).toString('hex');
  console.log(req.session.state);
  passport.authenticate('reddit', {
    state: req.session.state,
  })(req, res, next);
});

router.get('/reddit/callback', function(req, res, next){
  // Check for origin via state token
  if (req.query.state == req.session.state){
    passport.authenticate('reddit', {
      successRedirect: '/',
      failureRedirect: '/login'
    })(req, res, next);
  }
  else {
    next( new Error(403) );
  }
});

router.get('/profile', function(req, res, next) {
  res.json(req.user);
});

  router.get('/logout', function(req, res, next){
    req.logout();
    res.redirect('/');
  })

module.exports = router;
