var highkick = require('highkick'),
    ak47     = require('./ak47'),
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

exports.testCreatingViaProxy = function(done){
  var onfoo = ak47();

  assert(onfoo.subscribe);
  assert(onfoo.extendsAk47Pubsub);

  onfoo(function(a, b, c){
    assert.equal(a, 3);
    assert.equal(b, 1);
    assert.equal(c, 4);
    done();
  });

  onfoo.publish(3, 1, 4);
};

exports.testSyncPublishing = function(done){

  var foo = ak47(3),
      bar = ak47(14),

      qux = ak47(foo, bar, function(foo, bar){
        assert.deepEqual([foo, bar], expected[i]);

        return foo + bar;
      }).sync(true),

      expected = [[6, 14], [6, 159]],
      i = 0;

  foo(6);
  i++;
  bar(159);
  i++;

  done();
};

exports.testErrorHandling = function(done){

  var foo = ak47();

  foo.subscribe(function(){
    var err = new Error;
    err.expected = true;
    throw err;
  });

  ak47(foo, function(){
    var err = new Error;
    err.expected = true;
    throw err;
  });

  foo.subscribe(function(){
    done();
  });

  foo.publish();

};

process.on('uncaughtException', function (err) {
  if(!err.expected) throw err;
});
