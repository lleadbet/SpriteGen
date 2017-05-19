module.exports = {

  initWatchDog: function(){
    //required packages
    var hound = require('hound'),
        fs = require ('fs'),
        path = require('path'),
        cssGen = require('../util/cssGen.js'),
        imageMagick = require('../imagemagick/imageMagick.js'),
        reddit = require('../reddit/reddit.js');

    //necessary models
    var Sprite = require('../models/spriteModel.js');
    var Queue = require('../models/queueModel.js');
    //utils
    var watcher = hound.watch('./_uploads');

    setInterval(function(){
      imageMagick.readQueueAndProcess(false,true);
      },
      5000
    );

    //start checking for messages
    reddit.checkMessages();

    watcher.on('create', function(file,stats){
      var prevSize=-1;
      var intervalTimer = setInterval(function(){
        if(stats.size==prevSize){
          clearInterval(intervalTimer);
          var extension=path.extname(file).split('.').join("").toUpperCase();
          if(extension=="PNG"){
            var newFile = new Sprite({
              league:"",
              teamName:"",
              fileName: path.basename(file)
            }).save(function(err, ns){
              if (err){console.log(err);}
              else{
                Sprite.findByIdAndUpdate(ns.id, {$set:{cssClass:"flair-logo-"+ns.id}},function(){
                  new Queue({
                    fileName:ns.fileName,
                    spriteID:ns.id,
                    dateAdded:new Date()
                  }).save(function(err, qi){
                    if(err){console.log(err)}
                    else{console.log("queue item created");}
                  });
                });
              };
            });
          }
        }
        else{
          prevSize = stats.size;
        }
      }, 3000);
      console.log(stats);
    });

    watcher.on('change', function(file, stats){

    });

    watcher.on('delete', function(file, stats){
      cssGen.generateCSS();
    });
  },

  closeWatchDog: function(){

  }
}
