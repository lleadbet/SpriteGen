module.exports={
  readQueueAndProcess: function(includeFaded=false, highRes=false){
    const Queue = require('../models/queueModel.js');
    const fs = require('fs');
    const process = require('child_process');
    const path = require('path');
    var mkdirp = require('mkdirp');

    Queue.find({markedAsComplete:null, markedAsErred:null}, null, {sort: "dateAdded"}, function(err, items){
      if(err){console.log(err);}
      else{
        var count = items.length;
        var dimensions='20x20';

        if(highRes){
          dimensions='30x30';
        }
        else{
          dimensions='20x20';
        }

        items.forEach(function(qi){

          console.log("launching imagemagick for " + qi.fileName);
          var inputFile = appRoot+'/_uploads/'+ qi.fileName;
          var outputFile = appRoot + '/public/flair/'+qi.subreddit+'/sprites/flair-'+qi.spriteID+'.png'


          inputFile= path.normalize(inputFile);
          outputFile= path.normalize(outputFile);

          mkdirp(path.dirname(outputFile), function (err) {
            if (err) console.error(err)
          });

          process.exec('magick "'+inputFile+'" -background none -resize '+dimensions+' -gravity center -extent '+dimensions+' -quality 05 "'+ outputFile +'"', function(error, stdout, stderr){
               if (!error && includeFaded==true){
                 //process faded images
                 process.exec('magick "'+inputFile+'" -alpha set -channel A -evaluate Divide 3 -background none -resize '+dimensions+' -gravity center -extent '+dimensions+' -quality 05 "'+ outputFile +'"', function(error, stdout, stderr){
                    if (!error){
                      var date = new Date();
                      Queue.findByIdAndUpdate(qi.id, {$set:{markedAsComplete:date}},function(err, doc){
                        if(err){
                          console.log("error "+ err);
                          finish();
                        }
                        else{
                          console.log('success' + doc.markedAsComplete);
                          finish();
                        }
                      });
                    }
                    else{
                      console.log("error "+ err);
                      finish();
                    }
                  });
                  }
               else if(!error){
                   var date = new Date();
                   Queue.findByIdAndUpdate(qi.id, {$set:{markedAsComplete:date}},function(err, doc){
                     if(err){
                       console.log("error "+ err);
                       finish();
                     }
                     else{
                       console.log('success ' + doc.markedAsComplete);
                       finish();
                     }
                   });
                 }
               else{
                 Queue.findByIdAndUpdate(qi.id, {$set:{markedAsErred:date}},function(err, doc){
                   if(err){
                     console.log("error "+ err);
                     finish();
                   }
                 });
               }
            //end of processing
            });

            function finish(){
              count--;
              if(count==0){
                  if(err){console.log(err)}
                  else{
                    if(module.exports.generateFlairSheet(qi.subreddit, highRes)){
                      console.log(true);
                    }
                    else{
                      console.log(false);
                    }
                  }
                }
              }
          });
        }
      });
    },

    generateFlairSheet: function(subreddit,highRes=true){
      const fs = require('fs');
      const process = require('child_process');
      const path = require('path');
      var mkdirp = require('mkdirp');

      var dimensions='20x20';

      if(highRes){
        dimensions='30x30';
      }
      else{
        dimensions='20x20';
      }
      var montageInputPath = path.normalize(appRoot + '/public/flair/'+subreddit+'/sprites/');
      var montageOutputPath = path.normalize(appRoot + '/public/flair/'+subreddit+'/flairsheets/flair-%d.png');

      if (!fs.existsSync(path.dirname(montageOutputPath))){
        fs.mkdirSync(path.dirname(montageOutputPath));
      }

      console.log('montage '+montageInputPath+'flair-*.png -background none -tile 10x20 -geometry '+dimensions+' '+montageOutputPath);
      process.exec('montage '+montageInputPath+'flair-*.png -background none -tile 10x20 -geometry '+dimensions+' '+montageOutputPath, function(err, stdout, stderr){
        if(err){
          console.log(err)
          return false;
        }
        else{
          return true;
        }
      })
    }
}
