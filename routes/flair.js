var express = require('express');
var router = express.Router();
var generator = require('../util/cssGen.js');
/* GET home page. */
router.get('/', function(req, res, next) {
  generator.generateCSS(true, false, "ConcreteEntree",function(err, css, markdown, flairLinks){
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
});

router.post('/', function(req, res){
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
})

router.get('/', function(req, res, next) {
  generator.generateCSS(true, false, "ConcreteEntree",function(err, css, markdown, flairLinks){
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
});

module.exports = router;
