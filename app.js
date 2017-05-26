var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer');
var methodOverride = require('method-override');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var mongoose = require('mongoose');
var passport = require('passport');
var util = require('util');
var crypto = require('crypto');
var RedditStrategy = require('passport-reddit').Strategy;
var imageMagick = require('./imagemagick/imageMagick.js');
var reddit = require('./reddit/reddit.js');
var Snoowrap = require('snoowrap');
const glob = require('glob');

var index = require('./routes/index');
var flair = require('./routes/flair');
var sprite = require('./routes/sprite');
var subreddit = require('./routes/subreddit');
var auth = require('./routes/auth');

var REDDIT_CONSUMER_KEY_WEB = "eI-JGOJSgVzEKQ";
var REDDIT_CONSUMER_SECRET_WEB = "p0uUVwI0qWdXWy4D9_tFGfhvmGY";

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Use the RedditStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Reddit
//   profile), and invoke a callback with a user object.
const User = require('./models/userModel.js');
const Reddit = require('./reddit/reddit.js');
const Subreddit = require('./models/subredditModel.js');
passport.use(new RedditStrategy({
    clientID: REDDIT_CONSUMER_KEY_WEB,
    clientSecret: REDDIT_CONSUMER_SECRET_WEB,
    callbackURL: "http://127.0.0.1:3000/auth/reddit/callback",
    scope:['identity','mysubreddits']
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOrCreate({redditUserID: profile.id, username:profile.name}, function(err,user){
      Reddit.getModeratorList(accessToken,function(error2, data){
        var subs=[];
        data.forEach(function(sr){
            subs.push(sr.display_name);
            Subreddit.findOrCreate({subredditName:sr.display_name}, function(err, sub){
              if(err){return done(err,null)}
              if(sub.moderators.indexOf(user.username)==-1){
                sub.moderators.push(user.username);
                sub.save();
              }
            })
        })
        user.associatedSubreddits = subs;
        user.save(function(er){
          if(er){res.send("err")}
          return done(err,user);
        })
      })
    })
  }
));

var app = express();


//define app root
global.appRoot = path.resolve(__dirname);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(methodOverride());

//establish connnection to local mongoDB instance
mongoose.connect('mongodb://localhost/spriteGen');
var db = mongoose.connection;

//on error, do something (probably quit the app)
db.on('error', function(){
  process.exit(1);
});

//on success, try to start photoshop and the watchdog.
db.on('open', function(){
  console.log("connected");
  setInterval(function(){
    imageMagick.readQueueAndProcess(false,true);
    },
    5000
  );
  //start checking for messages
  reddit.checkMessages();
});

app.use(session({
  state: 'whyIsntThisWorkingAllTheTime',
  name: "cookiesTasteGood",
  secret: 'keyboard cat',
  subredditName:'',
  resave:true,
  saveUninitialized:true,
  store: new MongoStore({mongooseConnection:mongoose.connection})
 }));

 app.use(express.static(path.join(__dirname, 'public')));
 app.use(passport.initialize());
 app.use(passport.session());

app.use('/', index);
app.use('/flair', flair);
app.use('/sprites', sprite);
app.use('/subreddits', subreddit);
app.use('/auth', auth);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
