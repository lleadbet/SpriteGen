module.exports ={
  generateCSS: function(highRes=true, postToReddit=false, subredditName, cb){
    const glob = require('glob');
    const fs = require('fs');
    const path = require('path');
    const Sprite = require('../models/spriteModel.js');
    const Subreddit = require('../models/subredditModel.js');
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
    Sprite.find({dateDeleted:null, subredditName:subredditName},null, {$sort:{_id:1}}, function(err, sprites){
      if (err){return err}
      else{
        Subreddit.findOne({subredditName:subredditName},function(err, sr){
          if(err){return err;}
          else{
            var prepend=false;
            if(sr.options){
              if(sr.options.prependCustom){
                prepend=true;
              }
            }
            var count = sprites.length +1;
            var i=0;
            sprites.forEach(function(s){
              var obj = {};
              obj._id=flairFile+'-'+i;
              obj.teamName=s.teamName;
              obj.fileName=s.fileName;
              obj.league=s.league;
              storeSprites.push(obj);
              if(i % 10 == 0 && i!=0){
                pixRow+=dimensions;
                pixColumn=0;
              }
              if (i % 200 == 0 && i!=0){
                pixRow=0;
                pixColumn=0;
                flairFile +=1;
                css+='.flair[class*='+flairFile+'-]:before, a[href^="#flair-'+flairFile+'"]:before {background-image: url(%%flair-'+flairFile+'%%);}\n';
              }

              var custom='';
              if(s.customCSSClass){
                var customClass = "flair-"+ flairFile + '-' + s.customCSSClass;
                if(!prepend){
                  customClass = s.customCSSClass;
                }
                custom= ", a[href*='#"+ customClass+"']:before, ." + customClass +":before";
              }

              css = css + "a[href*='#flair-"+ flairFile + '-' + i +"']:before, .flair-" + flairFile + '-' + i +":before"+(custom || '')+"{background-position:-" + pixColumn + "px -" + pixRow + "px;}\n";
              //console.log(css);
              pixColumn=pixColumn + dimensions;
              i++;
              finish();
              //console.log(flairFile);
            })

            finish();
            function finish(){
              count--;
              if(count==0){
                  css += "/* STAN'S DOMAIN DO NOT TOUCH ABOVE THIS LINE */";
                  if(err){console.log(err)}
                  else{
                    console.log("okay");
                    glob(appRoot+'/public/flair/'+subredditName+'/flairsheets/flair*', function(err, flairFiles){
                        console.log(flairFiles);
                        flairFiles.forEach(function(sheet){
                          console.log('there are files');
                          //flairLinks.push("/flair/0/flairsheets/"+path.basename(appRoot+sheet));
                          flairLinks.push({name: path.basename(sheet, '.png'), path:sheet, linkPath:"/flair/"+subredditName+"/flairsheets/"+path.basename(sheet)});
                        })
                        module.exports.postToReddit(subredditName, postToReddit, flairLinks, css, storeSprites, function(err, newCSS, markDown, flairLinks){
                          if(err){
                            cb(err,null,null,null);
                          }
                          else{
                            cb(err, newCSS, markDown,flairLinks);
                          }
                        });
                    });
                  }
                }
              }
            }
        })
      }
    });
  },
  postToReddit: function(subredditName, postToReddit, flairLinks, css, storeSprites, cb){
    const reddit = require('../reddit/reddit.js');
    console.log('calling flair');
    reddit.updateFlairImage(subredditName,flairLinks,postToReddit,function(err){
        if(err){
          //cb(err,null,null,null);
          console.log(err);
        }
        else{
          console.log('calling ss');
          reddit.updateStylesheet(subredditName,css,postToReddit,function(err, newCSS){
            if(err){
              //cb(err,null,null,null);
              console.log(err);
            }
            else{
              console.log('calling wiki');
              reddit.updateWiki(subredditName,storeSprites,postToReddit,function(err, markDown){
                if(err){
                  //cb(err,null,null,null);
                  console.log(err);
                }
                else{
                  cb(err, newCSS, markDown,flairLinks);
                }
              });
            }
          });
        }
    });
  }
}
