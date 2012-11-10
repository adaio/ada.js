var highkick = require('highkick');

exports.testPubsub     = highkick('./pubsub');
exports.testProperties = highkick('./properties');
exports.testObjects    = highkick('./objects');

process.on('uncaughtException', function (err) {
  if(!err.expected) throw err;
});
