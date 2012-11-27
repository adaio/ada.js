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
  var onfoo = ak47.pubsub(), failed = false, calledOnce = false;

  function cb(){
    if(calledOnce){
      done(new Error('unsubscribed callback has been called'));
      failed = true;
    }

    calledOnce = true;
    onfoo.unsubscribe(cb);

    onfoo(function(){
      if(failed) return;

      done();
    });

    onfoo.publish();
  }

  onfoo(cb);
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
    err.ignore = true;
    throw err;
  });

  ak47(foo, function(){
    var err = new Error;
    err.ignore = true;
    throw err;
  });

  foo.subscribe(function(){
    done();
  });

  foo.publish();

};

exports.testHasCustomProxy = function(done){
  var a = ak47.pubsub(),
      b = ak47.pubsub(function(){}),
      c = ak47.pubsub({});

  assert.equal(a.hasCustomProxy, false);
  assert.equal(b.hasCustomProxy, true);
  assert.equal(c.hasCustomProxy, true);

  done();
};


exports.testObservingManualPublishes = function(done){
  var number = ak47(3.14),
      string = ak47('foo'),
      array  = ak47([3.14, 156]),
      bool = ak47(false);

  assert.equal(number(), 3.14);
  assert.equal(string(), 'foo');
  assert.deepEqual(array.length, 2);
  assert.deepEqual(array[0], 3.14);
  assert.deepEqual(array[1], 156);
  assert.equal(bool(), false);

  ak47(number, string, array, bool, function(a, b, c, d){
    assert.equal(a, 156);
    assert.equal(b, 'bar');
    assert.deepEqual(c.length, 2);
    assert.deepEqual(c[0], 3.14);
    assert.deepEqual(c[1], 0);
    assert.equal(d, true);

    done();
  });

  number(156);
  string('bar');

  array[1] = 0;
  array.publish(array);

  bool(true);
};

exports.testSubscribeTo = function(done){
  var n = ak47(10),
      r = ak47(20),
      q = ak47(30),
      x = ak47(q, function(q){
        return q * 2;
      }),
      t = ak47(n, r, function(n, r, q, x){

        assert.equal(n, 100);
        assert.equal(r, 200);
        assert.equal(q, 300);
        assert.equal(x, 600);

        return n + r + q + x;
      });

  t.subscribeTo(q, x);

  assert.equal(t.subscriptions.length, 4);
  assert.equal(t.subscriptions[0], n);
  assert.equal(t.subscriptions[1], r);
  assert.equal(t.subscriptions[2], q);
  assert.equal(t.subscriptions[3], x);

  t.subscribe(function(newValue, oldValue){
    assert.equal(newValue, 1200);
    assert.equal(oldValue, undefined);

    done();
  });

  n(100);
  r(200);
  q(300);
};

exports.testSubscribeToSetter = function(done){

  var n = ak47(10),
      p = ak47(n, function(n){
        return n * n;
      }, setter),
      q = ak47(n, function(n){
        return n + n;
      }).setter(setter);

  function setter(newValue){
    n(newValue * 10);
  };

  p(5);

  assert.equal(n(), 50);
  assert.equal(p(), 2500);
  assert.equal(q(), 100);

  q(3);

  assert.equal(n(), 30);
  assert.equal(p(), 900);
  assert.equal(q(), 60);

  done();

};

exports.testSubscribingObservationTree = function(_done){
  function done(){
    if(done.q && done.r) _done();
  };

  var n = ak47(10),
      t = ak47(n, function(n){
        return n * n;
      }),
      k = ak47(n, function(n){
        return n * 2;
      }),
      q = ak47(t, k, function(t, k){
        return t * t + k + k + 5;
      }),
      r = ak47(q, function(q){
        assert.equal(q, 650);
        return q / 10;
      });

  q.subscribe(function(q){
    assert.equal(q, 650);
    done.q = true;
    done();
  });

  r.subscribe(function(r){
    assert.equal(r, 65);
    done.r = true;
    done();
  });

  n(5);
};

exports.testSubscribePubsub = function(done){
  var n = ak47(10),
      r = ak47(20),
      onChange = ak47.pubsub();

  ak47(n, r, onChange);

  onChange.subscribe(function(n, r){
    assert.equal(n, 300);
    assert.equal(r, 200);
    done();
  });

  n(500);
  n(300);
  r(200);
};

exports.testSubscribeToPubsub = function(done){
  var n        = ak47(10),
      r        = ak47(20),
      onChange = ak47.pubsub();

  var p = ak47(n, r, onChange);

  var expected = [[10, 200], [600, 200]], i = 0;

  ak47(onChange, function(n, r){
    assert.equal(n, expected[i][0]);
    assert.equal(r, expected[i][1]);
    i == 1 && done();
    i++;
  });

  r(200);

  setTimeout(function(){
    n(600);
  }, 250);

};

exports.testSubscribeToPubsubs = function(done){
  var n        = ak47(10),
      r        = ak47(20),
      onChange = ak47.pubsub(),
      onFoo    = ak47.pubsub(),
      onBar    = ak47.pubsub();

  ak47(n, r, onChange);

  var expected = [[10, 200], [600, 200]], i = 0;

  ak47(onChange, onFoo, onBar, function(n, r, foo, bar){
    assert.equal(n, expected[i][0]);
    assert.equal(r, expected[i][1]);
    assert.equal(foo, undefined);
    assert.equal(bar, undefined);

    i == 1 && done();
    i++;
  });

  r(200);

  setTimeout(function(){
    n(600);
  }, 250);

};

exports.testObservingPubsubTree = function(done){
  var changed  = false,
      n1       = ak47(10),
      n2       = ak47(20),
      onChange = ak47(),
      onFoo    = ak47(),
      onBar    = ak47(),
      sum      = ak47(onChange, onFoo, onBar, function(n1, n2, foo, bar){

        if(changed){
          assert.equal(n1, 20);
          assert.equal(n2, 30);
          assert.equal(foo, undefined);
          assert.equal(bar, undefined);
        }

        return n1 + n2;
      }),
      sumPlus10 = ak47(sum, function(sum){
        return sum + 10;
      });

  ak47(n1, n2, onChange);

  n1(20);
  n2(30);

  changed = true;

  sumPlus10.subscribe(function(newSum, oldSum){
    assert.equal(newSum, 60);
    assert.equal(oldSum, undefined);

    done();
  });

};

process.on('uncaughtException', function (err) {
  if(!err.ignore) throw err;
});
