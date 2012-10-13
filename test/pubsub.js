var highkick = require('highkick'),
    ak47     = require('../'),
    assert   = require('assert');

exports.testSubscribe = function(_done){

  var onfoo = ak47.pubsub(),
      ab = [[3,1], [4, 1]],
      x = 0,
      y = 0;

  function done(){
    x == 4 && y == 2 && _done();
  }

  onfoo(function(a, b){
    assert.equal(a, ab[y][0]);
    assert.equal(b, ab[y][1]);

    x++;

    done();
  });

  onfoo.subscribe(function(a, b){
    assert.equal(a, ab[y][0]);
    assert.equal(b, ab[y][1]);

    x++;
    y++;

    done();
  });

  onfoo.publish(3, 1);
  onfoo.publish(4, 1);
};

exports.testUnsubscribe = function(done){
  var onfoo = ak47.pubsub(), failed = false;

  function cb(){
    done(new Error('unsubscribed callback has been called'));
    failed = true;
  }

  onfoo(function(){
    if(failed) return;

    done();
  });

  onfoo.publish();
};
