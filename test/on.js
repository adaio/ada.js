var highkick = require('highkick'),
    ada      = require('./ada'),
    assert   = require('assert');

exports.testProperties = function(done){
    var a = ada.property(3),
        b = ada.property(1),
        c = ada.property(4),
        onChange = ada.on(a, b, c);

  var i = -1;
  onChange(function(changed){
    i++;

    if(i == 0){
      assert.equal(changed.length, 1);
      assert.equal(changed[0].pubsub, a);
      assert.equal(changed[0].params[0], 30);
      assert.equal(changed[0].params[1], 3);
      return;
    } else {
      assert.equal(changed.length, 2);
      assert.equal(changed[0].pubsub, b);
      assert.equal(changed[0].params[0], 10);
      assert.equal(changed[0].params[1], 1);
      assert.equal(changed[1].pubsub, c);
      assert.equal(changed[1].params[0], 40);
      assert.equal(changed[1].params[1], 4);
      done();
    }
  });

  a(30);

  setTimeout(function(){
    b(10);
    c(40);
  }, 0);
};

// TODO extend tests
