var express = require('express');
var router = express.Router();
var generator = require('../util/cssGen.js');

router.post('/:subredditName', ensureLoggedIn(),function(req, res){
  if(req.params.subredditName && req.user.associatedSubreddits.includes(req.params.subredditName)){
    generator.generateCSS(true, true, "ConcreteEntree", function(err, css, markdown, flairLinks){
      if(err){
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render('error');
      }
      else{
        res.render('flair', {
          title: 'Sam the Flair Man',
          css: css,
          markdown:markdown,
          flairLinks:flairLinks,
          user:req.user});
        };
      })
    }
})

/* GET home page. */
router.get('/:subredditName?', ensureLoggedIn(), function(req, res, next) {
  if(req.params.subredditName && req.user.associatedSubreddits.includes(req.params.subredditName)){
    generator.generateCSS(true, false, req.params.subredditName, function(err, css, markdown, flairLinks){
      if(err){
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render('error',{user:req.user});
      }
      else{
        res.render('flair', {
          title: 'Sam the Flair Man',
          css: css,
          markdown:markdown,
          flairLinks:flairLinks,
          user:req.user});
        };
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
