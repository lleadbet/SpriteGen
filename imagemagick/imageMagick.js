module.exports={
  readQueueAndProcess: function(){
    const Queue = require('../models/queueModel.js');
    const fs = require('fs');
    const process = require('child_process');
    const path = require('path');
    var mkdirp = require('mkdirp');
    const zero = require('add-zero');

    Queue.find({markedAsComplete:null, markedAsErred:null}, null, {sort: "dateAdded"}, function(err, items){
      if(err){console.log(err);}
      else{
        var count = items.length;
        var dimensions='20x20';
        items.forEach(function(qi){
        if(qi.highRes){
          dimensions='30x30';
        }

          console.log("launching imagemagick for " + qi.fileName);
          var inputFile = appRoot+'/_uploads/'+ qi.fileName;
          var outputFile = appRoot + '/public/flair/'+qi.subreddit+'/sprites/flair-'+qi.spriteID+'.png'


          inputFile= path.normalize(inputFile);
          outputFile= path.normalize(outputFile);

          mkdirp(path.dirname(outputFile), function (err) {
            if (err) console.error(err)
          });


          process.exec('magick "'+inputFile+'" -background none -resize '+dimensions+' -gravity center -extent '+dimensions+' -quality 05 "'+ outputFile +'"', function(error, stdout, stderr){
               if (!error && qi.ncludeFaded==true){
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
                    if(module.exports.generateFlairSheet(qi.subreddit, qi.highRes)){
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
      const Sprite = require('../models/spriteModel');
      var mkdirp = require('mkdirp');

      var dimensions='20x20';

      if(highRes){
        dimensions='30x30';
      }
      else{
        dimensions='20x20';
      }

      var montageInputPath = path.normalize(appRoot + '/public/flair/'+subreddit+'/sprites/*.png');
      var montageOutputPath = path.normalize(appRoot + '/public/flair/'+subreddit+'/flairsheets/flair-%d.png');

      if (!fs.existsSync(path.dirname(montageOutputPath))){
        fs.mkdirSync(path.dirname(montageOutputPath));
      }

      console.log('montage '+montageInputPath+' -background none -quality 95 -tile 10x20 -geometry '+dimensions+' '+montageOutputPath);
      process.exec('montage '+montageInputPath+' -background none -quality 95 -tile 10x20 -geometry '+dimensions+' '+montageOutputPath, function(err, stdout, stderr){
        if(err){
          console.log(err)
          return false;
        }
        else{
          return true;
        }
      })
      Sprite.find({dateDeleted:null, subredditName:subreddit},null, {$sort:{_id:1}}, function(err, sprites){
        var flairInput=[];

        sprites.forEach(function(s){
          flairInput.push('\"'+montageInputPath+"flair-"+s._id+".png"+'\"');
        })

        var fi = flairInput.join(" ");

        fs.writeFile(montageInputPath+"list.txt", fi,'utf8',(err)=>{
          if(err){}
          else{

          }
        })
      });


    }
}
