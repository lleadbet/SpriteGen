var express = require('express');
var router = express.Router();
const Subreddit = require('../models/subredditModel.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  Subreddit.find({dateDeleted:null}, function(err,subreddits){
    if(err){
      res.send("error");
    }
    else{
      res.render('subreddit',
      {
        title: 'Sam the Flair Man',
        subreddits:subreddits
      });
    }
  })
});


module.exports = router;
