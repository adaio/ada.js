var highkick = require('highkick'),
    ada      = require('./ada'),
    assert   = require('assert');

exports.testExtend = function(done){

  var ret = ada.extend({
    'ada': {
      'foo': 3.14,
      'bar': 156,
      'qux': {
        'corge': 333
      }
    }
  });

  assert.equal(ada.foo, 3.14);
  assert.equal(ada.bar, 156);
  assert.equal(ada.qux.corge, 333);

  assert.equal(ret, ada);

  done();

};
