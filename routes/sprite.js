const express = require('express');
const router = express.Router();
const Sprite = require('../models/spriteModel.js');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const im = require('../imagemagick/imageMagick.js');
const crypto = require('crypto');
const mime = require('mime');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'test/')
  },
  filename: function (req, file, cb) {
    crypto.pseudoRandomBytes(16, function (err, raw) {
      cb(null, raw.toString('hex') + Date.now() + '.' + mime.extension(file.mimetype));
    });
  }
});

console.log(global.appRoot);

var upload = multer({storage:storage}).any();

router.get('/delete/:id', function(req,res){
  Sprite.findOne({_id:req.params.id}, function(err,sprite){
    if(err){
      res.send("error");
    }
    else{
      res.render('deleteSprite',
      {
        title: 'Express',
        sprite:sprite,
        user:req.user
      });
    }
  })
});

router.post('/delete/:id', function(req,res){
  Sprite.findOneAndUpdate({_id:req.params.id}, {dateDeleted:new Date()}, function(err, s){
    if(err){console.log(err)}
    else{
      fs.unlink(path.normalize(appRoot+"/public/flair/0/sprites/flair-"+s.id+".png"));
      im.generateFlairSheet(true);
      res.redirect('/sprites?=succesful');
    }
  })
});

router.get('/update/:id', function(req,res){
  Sprite.findOne({_id:req.params.id}, function(err,sprite){
    if(err){
      res.send("error");
    }
    else{
      res.render('updateSprite',
      {
        title: 'Express',
        sprite:sprite,
        user:req.user
      });
    }
  })
});

router.post('/update/:id', function(req,res, next){
  if(!isNaN(req.params.id)){
    Sprite.findOne({_id:req.params.id}, function(err,sprite){
      if(err){
        res.send("error");
      }
      else{
        sprite.league=req.body.league;
        sprite.teamName=req.body.team;
        sprite.customCSSClass=req.body.customCSSClass;
        sprite.save(function(err, updatedSprite){
          if(err){res.redirect('/sprites?=' + err)}
          else{res.redirect('/sprites?=succesful')}
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
    res.render('newSprite',
    {
      title: 'Stan',
      user:req.user,
      sub:req.params.srName
    });
  }
  else{
    res.render('error');
  }
})

router.post('/new/:srName', ensureLoggedIn(), function(req,res){
  upload(req,res, function(err){
    console.log(req.files);
    if(err){
      res.status(500);
      res.send(err);
    }
    else{
      console.log(req.files);
      res.send(req.files);
    }
  })
})

/* GET home page. */
router.get('/:id?', function(req, res) {
  Sprite.find({dateDeleted:null}, function(err,sprites){
    if(err){
      res.send("error");
    }
    else{
      res.render('sprite',
      {
        title: 'Sam the Flair Man',
        sprites:sprites,
        user:req.user
      });
    }
  })
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
