var mongoose = require('mongoose');

var queueSchema = mongoose.Schema({
  fileName:String,
  spriteID:String,
  markedAsComplete:Date,
  markedAsErred:Date,
  dateAdded:Date
})

module.exports = mongoose.model('Queue', queueSchema);
