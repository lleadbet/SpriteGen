var express = require('express');
var router = express.Router();
const Subreddit = require('../models/subredditModel.js');

router.get('/:srName/options',ensureLoggedIn(),function(req, res, next) {
  if(req.params.srName && req.user.associatedSubreddits.includes(req.params.srName)){
    Subreddit.findOne({subredditName:req.params.srName, moderators:req.user.username, dateDeleted:null}, function(err,sr){
      if(err){
        res.send("Error retrieving subreddits.");
      }
      res.render('subredditOptions',{
        title: 'Stan the Flair Man',
        s:sr,
        user:req.user
      });
    })
  }
  else{
    next();
  }
},unauthorizedAccess());

router.post('/:srName/options',ensureLoggedIn(),function(req, res, next) {
  if(req.params.srName && req.user.associatedSubreddits.includes(req.params.srName)){
    Subreddit.findOne({subredditName:req.params.srName, moderators:req.user.username, dateDeleted:null}, function(err,sr){
      if(err){
        res.send("Error retrieving subreddits.");
      }
      var isGenFlairClassesSet = (req.body.genFlairClasses == 'true');
      var ishighResSet = (req.body.highRes == 'true');
      var isprependCustomSet = (req.body.prependCustom == 'true');
      var updateFlair =
      sr.options = {genFlairClasses: isGenFlairClassesSet, highRes:ishighResSet, prependCustom:isprependCustomSet};

      sr.save(function(err, uSr){
        if(err){res.status(500).send('Internal Server Error')}
        else{
          console.log(uSr);
          res.status(200);
          res.redirect('/subreddits/'+req.params.srName);
        }
      });
    })
  }
  else{
    next();
  }
},unauthorizedAccess());

/* GET home page. */
router.get('/:srName?',ensureLoggedIn(),function(req, res, next) {
  if(req.params.srName && req.user.associatedSubreddits.includes(req.params.srName)){
    Subreddit.find({subredditName:req.params.srName, moderators:req.user.username, dateDeleted:null}, function(err,sr){
      if(err){
        res.send("Error retrieving subreddits.");
      }
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
