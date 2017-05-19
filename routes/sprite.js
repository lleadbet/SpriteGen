const express = require('express');
const router = express.Router();
const Sprite = require('../models/spriteModel.js');
const fs = require('fs');
const path = require('path');
const im = require('../imagemagick/imageMagick.js');

/* GET home page. */
router.get('/', function(req, res) {
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

module.exports = router;
