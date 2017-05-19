var mongoose = require('mongoose'),
  autoIncrement= require('mongoose-auto-increment');

var spriteSchema = mongoose.Schema({
  league:String,
  teamName:String,
  filePath:String,
  fileName:String,
  cssClass:String,
  customCSSClass:String,
  subredditName:String,
  dateDeleted:Date
});

autoIncrement.initialize(mongoose.connection);
spriteSchema.plugin(autoIncrement.plugin,{model:'Sprite'});

module.exports = mongoose.model('Sprite', spriteSchema);
