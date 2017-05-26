var express = require('express');
var router = express.Router();
var generator = require('../util/cssGen.js');
const Subreddit = require('../models/subredditModel');

router.post('/:subredditName?', ensureLoggedIn(),function(req, res,next){
  console.log('posting');
  if(req.params.subredditName && req.user.associatedSubreddits.includes(req.params.subredditName)){
    Subreddit.findOne({subredditName:req.params.subredditName}, function(err, sr){
      if(err){
        console.log('erring out');
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render('error',{
          user:req.user,
          sessionSR: req.session.subredditName
        });
      }
      else{
        console.log('pre-gen');
        generator.generateCSS(sr.options.highRes, true, req.params.subredditName, function(err, css, markdown, flairLinks){
          console.log('called gen');
          if(err){
            console.log('erring out');
            res.locals.message = err.message;
            res.locals.error = req.app.get('env') === 'development' ? err : {};

            // render the error page
            res.status(err.status || 500);
            res.render('error',{
              user:req.user,
              sessionSR: req.session.subredditName
            });
          }
          else{
            console.log('Succeeded?');
            res.render('flair', {
              title: 'Stan the Flair Man',
              css: css,
              markdown:markdown,
              flairLinks:flairLinks,
              user:req.user,
              sessionSR: req.session.subredditName
            });
          };
        })
      }
    })
  }
  else{
    res.send('err');
  }
})

/* GET home page. */
router.get('/:subredditName?', ensureLoggedIn(), function(req, res, next) {
  if(req.params.subredditName && req.user.associatedSubreddits.includes(req.params.subredditName)){
    Subreddit.findOne({subredditName:req.params.subredditName}, function(err, sr){
      if(err){
        console.log('erring out');
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render('error',{
          user:req.user,
          sessionSR: req.session.subredditName
        });
      }
      else{
        generator.generateCSS(sr.options.highRes, false, req.params.subredditName, function(err, css, markdown, flairLinks){
          if(err){
            res.locals.message = err.message;
            res.locals.error = req.app.get('env') === 'development' ? err : {};

            // render the error page
            res.status(err.status || 500);
            res.render('error',{
              user:req.user,
              sessionSR: req.session.subredditName
            });
          }
          else{
            res.render('flair', {
              title: 'Sam the Flair Man',
              css: css,
              markdown:markdown,
              flairLinks:flairLinks,
              user:req.user,
              sessionSR: req.session.subredditName
            });
          };
        })
      }
    })
  }
  else{
    next();
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
