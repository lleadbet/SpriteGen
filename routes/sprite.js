const express = require('express');
const router = express.Router();
const Sprite = require('../models/spriteModel.js');
const Subreddit = require('../models/subredditModel.js');
const Queue = require('../models/queueModel.js');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const im = require('../imagemagick/imageMagick.js');
const crypto = require('crypto');
const mime = require('mime');
const validator = require('validator');

router.get('/delete/:id', ensureLoggedIn(), function(req,res,next){
  Sprite.findOne({_id:req.params.id}, function(err,sprite){
    if(err){
      res.send("error");
    }
    else{
      res.render('deleteSprite',
      {
        title: 'Express',
        sprite:sprite,
        user:req.user,
        sessionSR: req.session.subredditName
      });
    }
  })
},unauthorizedAccess());

router.post('/delete/:id', ensureLoggedIn(), function(req,res){
  Sprite.findOneAndUpdate({_id:req.params.id}, {dateDeleted:new Date()}, function(err, s){
    if(err){console.log(err)}
    else{
      Subreddit.findOne({moderators:req.user.username,subredditName:s.subredditName},function(err,sr){
        if(err){console.log(err)}
        else{
          fs.unlink(path.normalize(appRoot+"/public/flair/"+s.subredditName+"/sprites/flair-"+s.paddedID+".png"));
          im.generateFlairSheet(s.subredditName, sr.options.highRes);
          res.redirect('/sprites?=succesful');
        }
      })
    }
  })
});

router.get('/update/:id', ensureLoggedIn(), function(req,res){
  Sprite.findOne({_id:req.params.id}, function(err,sprite){
    if(err){
      res.send("error");
    }
    else{
      res.render('updateSprite',
      {
        title: 'Express',
        sprite:sprite,
        user:req.user,
        sessionSR: req.session.subredditName
      });
    }
  })
});

router.post('/update/:id', ensureLoggedIn(), function(req,res, next){
  if(!isNaN(req.params.id)){
    Sprite.findOne({_id:req.params.id}, function(err,sprite){
      if(err){
        res.send("error");
      }
      else{
        sprite.league=validator.escape(req.body.league);
        sprite.teamName=validator.escape(req.body.team);
        sprite.customCSSClass=validator.escape(req.body.customCSSClass);
        sprite.save(function(err, updatedSprite){
          if(err){res.redirect('/sprites?=' + err)}
          else{res.redirect('/sprites/'+sprite.subredditName)}
        })
      }
    })
  }
  else{
    res.send('invalid url');
  }
});

router.get('/new/:srName?', ensureLoggedIn(), function(req,res,next){
  if(req.params.srName){
    if(req.user.associatedSubreddits.includes(req.params.srName)){
      Subreddit.findOne({moderators:req.user.username, dateDeleted:null, subredditName:req.params.srName}, function(err, sr){
        if(err){
          res.send(err);
        }
        else{
          res.render('newSprite',{
            title: 'Stan',
            user:req.user,
            sub:req.params.srName,
            sr:sr,
            sessionSR: req.session.subredditName
          });
        }
      })
    }
    else{
      next();
    }
  }
  else{
    next();
  }
},unauthorizedAccess())

router.post('/new/:srName', ensureLoggedIn(), function(req,res){
  if(req.user.associatedSubreddits.includes(req.params.srName)){
    //multer settings
    var storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, '_uploads/');
      },
      filename: function (req, file, cb) {
        crypto.pseudoRandomBytes(16, function (err, raw) {
          cb(null, raw.toString('hex') + Date.now() + '.' + mime.extension(file.mimetype));
        });
      }
    });
    var upload = multer({storage:storage}).any();
    upload(req,res, function(err){
      if(err){
        res.status(500);
        console.log(err);
        res.send(err);
      }
      else{
        Subreddit.findOne({subredditName:req.params.srName},function(err, sr){
          var highRes=false;
          if(sr.options){
            if(sr.options.highRes){
              highRes=true;
            }
          }
          req.files.forEach(function(file){
            var newFile = new Sprite({
              league:req.body.league,
              teamName:"",
              fileName: file.filename,
              subredditName:req.params.srName
            }).save(function(err, ns){
              if (err){console.log(err);}
              else{
                var bufferSize = 12 - ns._id.toString().length + 1;
                var spriteID = new Array(bufferSize).join(0).concat(ns._id);
                Sprite.findByIdAndUpdate(ns.id, {$set:{cssClass:"flair-logo-"+ns.id, paddedID:spriteID}},function(err,s){
                  console.log(s.paddedID);
                  new Queue({
                    fileName:ns.fileName,
                    subreddit:req.params.srName,
                    highRes:highRes,
                    includedFaded:false,
                    spriteID:spriteID,
                    dateAdded:new Date()
                  }).save(function(err, qi){
                    if(err){console.log(err)}
                    else{console.log("queue item created");}
                    });
                  });
                };
              });
            })
          })
        }
      })

        //end of upload

        res.status(200);
        res.send('okay');
      }
  else{
    next();
  }
},unauthorizedAccess())

/* GET home page. */
router.get('/:subredditName?', ensureLoggedIn(), function(req, res) {
  if(req.params.subredditName && req.user.associatedSubreddits.includes(req.params.subredditName)){
    Sprite.find({dateDeleted:null, subredditName:req.params.subredditName}, function(err,sprites){
      if(err){
        res.send("error");
      }
      else{
        res.render('sprite',
        {
          title: 'Sam the Flair Man',
          sprites:sprites,
          user:req.user,
          oneSubreddit:req.params.subredditName,
          sessionSR: req.session.subredditName
        });
      }
    })
  }
  else{
    Sprite.find({dateDeleted:null, subredditName:{"$in": req.user.associatedSubreddits}}, function(err,sprites){
      if(err){
        res.send("error");
      }
      else{
        res.render('sprite',
        {
          title: 'Sam the Flair Man',
          sprites:sprites,
          user:req.user,
          sessionSR: req.session.subredditName
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

function unauthorizedAccess(){
  return function(req,res,next){
    res.status(401).send({
      success: false,
      message: 'You are not authorized to access this page.'
    });
  }
}

module.exports = router;
