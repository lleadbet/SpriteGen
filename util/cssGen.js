module.exports ={
  generateCSS: function(highRes=true, postToReddit=false, subredditName, cb){
    const glob = require('glob');
    const fs = require('fs');
    const path = require('path');
    const Sprite = require('../models/spriteModel.js');
    const reddit = require('../reddit/reddit.js');
    const iMagick = require('../imagemagick/imageMagick.js');

    //defining the default settings here.
    var row = 0;
    var column = 0;
    var pixRow = 0;
    var pixColumn = 0;
    var dimensions = 20;
    if(highRes){
      dimensions=30;
    }
    var flairFile =0;

    //first bits of CSS that are relevant
    var css = "/* STAN'S DOMAIN DO NOT TOUCH BELOW THIS LINE */\n.flair:before, a[href^=\"#f\"]:before {content:'';height:"+dimensions+"px;width:"+dimensions+"px;display: inline-block;background-repeat: no-repeat;background-image: url(%%flair-"+flairFile+"%%);vertical-align: top;margin-right: 4px}\n.flair {box-sizing:initial;width:"+dimensions+"px;height:"+dimensions+"px;line-height: 16px;overflow: hidden;vertical-align: middle;font-size: inherit;background-color: transparent;color: #222;padding: 2px;margin-right: 3px;border-width: 0;border-radius: 3px}\n";

    //generating the arrays that are used for the various Reddit updates
    var flairLinks=[];
    var storeSprites=[];
    Sprite.find({dateDeleted:null, subredditName:subredditName},null, {sort: {cssClass:1}}, function(err, sprites){
      if(err){return err;}
      else{
        var i=0;
        sprites.forEach(function(s){
          var obj = {};
          obj._id=i;
          obj.teamName=s.teamName;
          obj.league=s.league;
          storeSprites.push(obj);
          console.log(i);
          if(i % 10 == 0 && i!=0){
            pixRow+=dimensions;
            pixColumn=0;
          }
          if (i % 200 == 0 && i!=0){
            pixRow=0;
            pixColumn=0;
            flairFile +=1;
          }
          var custom='';
          if(s.customCSSClass){
            custom= ", a[href*='#flair-"+s.customCSSClass+"']:before, .flair-" + s.customCSSClass +":before";
          }

          css = css + "a[href*='#flair-"+i+"']:before, .flair-" + i +":before"+(custom || '')+"{background-position:-" + pixColumn + "px -" + pixRow + "px;}\n";
          //console.log(css);
          pixColumn=pixColumn + dimensions;
          i++;
          //console.log(flairFile);
        })
        css += "/* STAN'S DOMAIN DO NOT TOUCH ABOVE THIS LINE */";
      }
    });

    glob(appRoot+'/public/flair/'+subredditName+'/flairsheets/flair*.png', function(err, flairFiles){
        flairFiles.forEach(function(sheet){
          //flairLinks.push("/flair/0/flairsheets/"+path.basename(appRoot+sheet));
          flairLinks.push({name: path.basename(sheet, '.png'), path:sheet, linkPath:"/flair/"+subredditName+"/flairsheets/"+path.basename(sheet)});
        })
    });

    var oldDir="./public/flair/"+subredditName+"/sprites/flair-*";
    glob('', function(err, files){
        for(file in files){
          if(file % 10 == 0 && file!=0){
            pixRow+=dimensions;
            pixColumn=0;
          }
          if (file % 200 == 0 && file!=0){
            pixRow=0;
            pixColumn=0;
            flairFile +=1;
          }
          //var id = files[file].substring(16, files[file].length - 4);
          var id = path.basename(appRoot+files[file]).match(/\d+/g);
          flair.push({id:id, name: path.basename(appRoot+files[file], '.png'), path:appRoot+files[file]});
          console.log(flair);
          //css = css + "a[href*='#flair-"+id+"']:before, .flair-" + id +":before{background-position:-" + pixColumn + "px -" + pixRow + "px;}\n";
          pixColumn=pixColumn + dimensions;
          //console.log(flairFile);
        }
        //css += "/* STAN'S DOMAIN DO NOT TOUCH ABOVE THIS LINE */";
    })


    fs.writeFile("./css/main.css", css, function(err){
      if(err){
        console.log(err);
      }
      else{
        //console.log(css);
        reddit.updateFlairImage(subredditName,flairLinks,postToReddit,function(err){
            if(err){console.log(err)}
            else{
              reddit.updateStylesheet(subredditName,css,postToReddit,function(err, newCSS){
                if(err){
                  cb(err,null,null,null);
                }
                else{
                  reddit.updateWiki(subredditName,storeSprites,postToReddit,function(err, markDown){
                    if(err){console.log(err)}
                    else{
                      cb(err, newCSS, markDown,flairLinks);
                    }
                  });
                }
              });
            }
        });
      }
    })
  }
}
