var express = require('express');
var router = express.Router();
const Subreddit = require('../models/subredditModel.js');

/* GET home page. */
router.get('/:srName?',ensureLoggedIn(),function(req, res, next) {
  if(req.params.srName && req.user.associatedSubreddits.includes(req.params.srName)){
    Subreddit.find({subredditName:req.params.srName, moderators:req.user.username, dateDeleted:null}, function(err,sr){
      if(err){
        res.send("Error retrieving subreddits.");
      }
      console.log(sr);
      res.render('subreddit',
      {
        title: 'Sam the Flair Man',
        subreddits:sr,
        user:req.user
      });

    })
  }
  else{
    Subreddit.find({dateDeleted:null, moderators:req.user.username}, function(err,subreddits){
      if(err){
        res.send("Error retrieving subreddits.");
      }
      else{
        res.render('subreddit',
        {
          title: 'Sam the Flair Man',
          subreddits:subreddits,
          user:req.user
        });
      }
    })
  }
},unauthorizedAccess());

function ensureLoggedIn() {
  return function(req, res, next) {
    // isAuthenticated is set by `deserializeUser()`
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      res.status(401);
      res.redirect('/');
    } else {
      next()
    }
  }
}

function unauthorizedAccess(){
  return function(req,res,next){
    res.status(401).send({
      success: false,
      message: 'You are not authorized to access this page.'
    });
  }
}

module.exports = router;
