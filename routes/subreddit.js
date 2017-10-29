var express = require('express');
var router = express.Router();
const Subreddit = require('../models/subredditModel.js');
const validator = require('validator');
const Queue = require('../models/queueModel.js');
const Sprite = require('../models/spriteModel');

router.get('/:srName/options',ensureLoggedIn(),function(req, res, next) {
  if(req.params.srName && req.user.associatedSubreddits.includes(req.params.srName)){
    req.session.subredditName = req.params.srName;
    Subreddit.findOne({subredditName:req.params.srName, moderators:req.user.username, dateDeleted:null}, function(err,sr){
      if(err){
        res.send("Error retrieving subreddits.");
      }
      res.render('subredditOptions',{
        title: 'Stan the Flair Man',
        subreddit:sr,
        user:req.user,
        sessionSR: req.session.subredditName
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
      var isGroupByLeague = (req.body.groupByLeague == 'true');

      var updatedHROption = (ishighResSet != sr.options.highRes);
      console.log(updatedHROption);

      sr.options = {genFlairClasses: isGenFlairClassesSet, highRes:ishighResSet, prependCustom:isprependCustomSet, groupByLeague:isGroupByLeague};

      sr.save(function(err, uSr){
        if(err){res.status(500).send('Internal Server Error')}
        else{
          if(updatedHROption){
            Sprite.find({subredditName:req.params.srName, dateDeleted:null},function(err,sprites){
              if(err){res.send("error")}
              sprites.forEach(function(s){
                new Queue({
                  fileName:s.fileName,
                  subreddit:req.params.srName,
                  highRes:ishighResSet,
                  includedFaded:false,
                  spriteID:s.paddedID,
                  dateAdded:new Date()
                }).save(function(err, qi){
                  if(err){console.log(err)}
                  else{console.log("queue item created");}
                  });
              })
            })

          }
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
    req.session.subredditName = req.params.srName;
    Subreddit.find({subredditName:req.params.srName, moderators:req.user.username, dateDeleted:null}, function(err,sr){
      if(err){
        res.send("Error retrieving subreddits.");
      }
      res.render('subreddit',
      {
        title: 'Sam the Flair Man',
        subreddits:sr,
        user:req.user,
        sessionSR: req.session.subredditName
      });

    })
  }
  else{
    Subreddit.find({dateDeleted:null, moderators:req.user.username}, function(err,sr){
      if(err){
        res.send("Error retrieving subreddits.");
      }
      else{
        res.render('subreddit',
        {
          title: 'Sam the Flair Man',
          subreddits:sr,
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
