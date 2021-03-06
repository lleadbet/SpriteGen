module.exports = {
  authorizeReddit:function(){
    const Snoowrap = require('snoowrap');
    const CONFIG = require('../config.json');
    const r = new Snoowrap({
      userAgent: 'nodejs:flairbot 5000:v0.1 by /u/ConcreteEntree',
      clientId: CONFIG.REDDIT_CLIENT_ID,
      clientSecret: CONFIG.REDDIT_CLIENT_SECRET,
      refreshToken: CONFIG.REDDIT_REFRESH_TOKEN
      });
      r.config({
        requestDelay:100,
        continueAfterRatelimitError:true
      });
    return r;
  },

  checkMessages:function(){
    const r = module.exports.authorizeReddit();
    //r.getInbox().then(console.log);
    r.getInbox({options:{filter:"messages"}}).then(function(a){
      var count = a.length + 1;
      a.forEach(function(ai){
        if(ai.subject.includes('flair-id:')){
          r.getUser(ai.author.name).assignFlair({subredditName:ai.subject.replace("flair-id:","") , text:'', cssClass:ai.body}).then(function(){
            ai.markAsRead().reply("Your flair has been adjusted. Everyone can always use more flair!").then(function(){
                ai.deleteFromInbox().then(function(){
                  finish();
                });
            });
          });
        }
        else{
          ai.markAsRead().deleteFromInbox().then(function(){
            finish();
          });
        }
      });
      finish();
      function finish(){
        count--;
        if(count==0){
          setTimeout(module.exports.checkMessages, 10000);
        }
      }
    });
  },

  updateWiki:function(subredditName, sprites, postToReddit=false, cb){
    const r = module.exports.authorizeReddit();
    const Sprite = require('../models/spriteModel.js');
    var markDown = `#Flair by League\n`
    Sprite.find({dateDeleted:null,subredditName:subredditName}).distinct('league', function(err, s){
      s.forEach(function(st){
        markDown+='##' + st +"\n";
        markDown+=`Flair | Team | Request
-----|------|-------\n`;
        sprites.forEach(function(sprite){
          if(sprite.league == st){
            markDown += `[](#flair-`+sprite._id+`)| `+sprite.teamName+`| [Request Flair](http://www.reddit.com/message/compose/?to=StanTheFlairMan&subject=flair-id:`+subredditName+`&message=`+sprite._id+`)\n`;
          }
        })
      })

      if(subredditName && sprites){
        if(postToReddit){
          r.getSubreddit(subredditName).getWikiPage('flair').edit({text:markDown,reason:"zug zug"}).then(function(){
            cb(null,markDown);
          });
        }
        else{
          cb(null,markDown);
        }
      }
    })
  },

  updateFlairImage: function(subredditName, flairSheets, postToReddit=false, cb){
    const fs = require('fs');
    const r = module.exports.authorizeReddit();
    if(subredditName && flairSheets){
      if(postToReddit){
        var count = flairSheets.length+1;
        flairSheets.forEach(function(sheet){
          var readable = fs.createReadStream(sheet.path);
          r.getSubreddit(subredditName).uploadStylesheetImage({name:sheet.name, file:readable}).then(function(){
            finish();
          });
        })
        finish();

        function finish(){
          count--;
          if(count==0){
            cb();
          }
        }
      }
      else{
        cb();
      }
    }
  },

  updateStylesheet: function(subredditName, css, postToReddit=false, cb){
    const r = module.exports.authorizeReddit();
    const Entities = require('html-entities').AllHtmlEntities;
    const entities= new Entities();

    if(subredditName && css){
      r.rawRequest({baseUrl:'https://www.reddit.com/', uri:'r/'+subredditName+'/about/stylesheet.json', method:'get'}).then(function(oldCss){
        oldCss=JSON.parse(oldCss);
        var match=oldCss.data.stylesheet.match(/\/\*\ STAN'S\ DOMAIN\ DO\ NOT\ TOUCH\ BELOW\ THIS\ LINE\ \*\/[\S\s]*\/\*\ STAN'S\ DOMAIN\ DO\ NOT\ TOUCH\ ABOVE\ THIS\ LINE\ \*\//);
        if(match==null){
          cb(new Error("Appears that your stylesheet isn't configured properly. Make sure you have the proper tags entered in the spreadsheet. For more information, see the Getting Started Guide."),null);
        }
        else{
          var updatedCSS=oldCss.data.stylesheet.replace(/\/\*\ STAN'S\ DOMAIN\ DO\ NOT\ TOUCH\ BELOW\ THIS\ LINE\ \*\/[\S\s]*\/\*\ STAN'S\ DOMAIN\ DO\ NOT\ TOUCH\ ABOVE\ THIS\ LINE\ \*\//, css);
          updatedCSS=entities.decode(updatedCSS);
          var size = Buffer.byteLength(updatedCSS,'utf8')/1000;
          if(size>100){
            cb(new Error("CSS will be too large (greater than 100KB). Reduce size by deleting flair or removing other classes. Your current CSS file would currently be "+size+" KB."),null);
          }
          //console.log(updatedCSS);
          if(subredditName && css){
            if(postToReddit){
              r.getSubreddit(subredditName).updateStylesheet({css:updatedCSS, reason:"bleep bloop adding more flair bleep bloop"});
              cb(null, updatedCSS);
            }
            else{
              cb(null,updatedCSS);
            }
          }
        }
      });
    }
  },

  getModeratorList:function(accessToken,cb){
    const Snoowrap = require('snoowrap');
    const r = new Snoowrap({
      userAgent: 'nodejs:flairbot 5000:v0.1 by /u/ConcreteEntree',
      accessToken: accessToken
    });

    r.getModeratedSubreddits().then(function(data){
      cb(null, data);
    });
  }
}
