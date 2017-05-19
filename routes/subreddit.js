var express = require('express');
var router = express.Router();
const Subreddit = require('../models/subredditModel.js');

/* GET home page. */
router.get('/:srName?',ensureLoggedIn(),function(req, res, next) {
  if(req.params.srName){
    Subreddit.find({subredditName:req.params.srName, moderators:req.user.username, dateDeleted:null}, function(err,sr){
      if(err){
        res.send("error");
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
        res.send("error");
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
});

function ensureLoggedIn() {
  return function(req, res, next) {
    // isAuthenticated is set by `deserializeUser()`
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      res.status(401).send({
        success: false,
        message: 'You need to be authenticated to access this page!'
      })
    } else {
      next()
    }
  }
}

module.exports = router;
