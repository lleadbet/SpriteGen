var mongoose = require('mongoose'),
  findOrCreate = require('mongoose-findorcreate');

var userSchema = mongoose.Schema({
  username:String,
  redditUserID:String,
  associatedSubreddits:Object
});

userSchema.plugin(findOrCreate);
module.exports = mongoose.model('User', userSchema);
