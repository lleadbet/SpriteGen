var mongoose = require('mongoose'),
  findOrCreate = require('mongoose-findorcreate'),
  autoIncrement= require('mongoose-auto-increment');

var subredditSchema = mongoose.Schema({
  subredditName:String,
  settings:Object,
  moderators:Array,
  dateDeleted:Date
});

autoIncrement.initialize(mongoose.connection);
subredditSchema.plugin(findOrCreate);
subredditSchema.plugin(autoIncrement.plugin,{model:'Subreddit'});

module.exports = mongoose.model('Subreddit', subredditSchema);
