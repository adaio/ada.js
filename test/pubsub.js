var highkick = require('highkick'),
    map      = require('./map'),
    assert   = require('assert');

exports.testSubscribe = function(_done){

  var onfoo = map.pubsub(),
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
  var onfoo = map.pubsub(), failed = false, calledOnce = false;

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
  var onfoo = map();

  assert(onfoo.subscribe);
  assert(onfoo.extendsMapPubsub);

  onfoo(function(a, b, c){
    assert.equal(a, 3);
    assert.equal(b, 1);
    assert.equal(c, 4);
    done();
  });

  onfoo.publish(3, 1, 4);
};

exports.testSyncPublishing = function(done){

  var foo = map(3),
      bar = map(14),

      qux = map(foo, bar, function(foo, bar){
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

  var foo = map();

  foo.subscribe(function(){
    var err = new Error;
    err.ignore = true;
    throw err;
  });

  map(foo, function(){
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
  var a = map.pubsub(),
      b = map.pubsub(function(){}),
      c = map.pubsub({});

  assert.equal(a.hasCustomProxy, false);
  assert.equal(b.hasCustomProxy, true);
  assert.equal(c.hasCustomProxy, true);

  done();
};


exports.testObservingManualPublishes = function(done){
  var number = map(3.14),
      string = map('foo'),
      array  = map([3.14, 156]),
      bool = map(false);

  assert.equal(number(), 3.14);
  assert.equal(string(), 'foo');
  assert.deepEqual(array.length, 2);
  assert.deepEqual(array[0], 3.14);
  assert.deepEqual(array[1], 156);
  assert.equal(bool(), false);

  map(number, string, array, bool, function(a, b, c, d){
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
  var n = map(10),
      r = map(20),
      q = map(30),
      x = map(q, function(q){
        return q * 2;
      }),
      t = map(n, r, function(n, r, q, x){

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

  var n = map(10),
      p = map(n, function(n){
        return n * n;
      }, setter),
      q = map(n, function(n){
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

  var n = map(10),
      t = map(n, function(n){
        return n * n;
      }),
      k = map(n, function(n){
        return n * 2;
      }),
      q = map(t, k, function(t, k){
        return t * t + k + k + 5;
      }),
      r = map(q, function(q){
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
  var n = map(10),
      r = map(20),
      onChange = map(n, r);

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
  var n        = map(10),
      r        = map(20);

  var p = map(n, r);

  var expected = [[10, 200], [600, 200]], i = 0;

  map(p, function(n, r){
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
  var n        = map(10),
      r        = map(20),
      onChange = map(n, r),
      onFoo    = map.pubsub(),
      onBar    = map.pubsub();

  var expected = [[10, 200], [600, 200]], i = 0;

  map(onChange, onFoo, onBar, function(n, r, foo, bar){
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
      n1       = map(10),
      n2       = map(20),
      onChange = map(n1, n2),
      onFoo    = map(),
      onBar    = map(),
      sum      = map(onChange, onFoo, onBar, function(n1, n2, foo, bar){

        if(changed){
          assert.equal(n1, 20);
          assert.equal(n2, 30);
          assert.equal(foo, undefined);
          assert.equal(bar, undefined);
        }

        return n1 + n2;
      }),
      sumPlus10 = map(sum, function(sum){
        return sum + 10;
      });

  n1(20);
  n2(30);

  changed = true;

  sumPlus10.subscribe(function(newSum, oldSum){
    assert.equal(newSum, 60);
    assert.equal(oldSum, undefined);

    done();
  });

};

exports.testEventCombination = function(done){
  var foo = map(),
      bar = map(),
      qux = map(),
      corge = map(foo, bar, qux);

  corge.subscribe(function(foo, bar, qux){
    assert.equal(bar, 'bar');
    assert.equal(qux, 'qux');
    assert.equal(foo, 'foo');

    done();
  });

  bar.publish('bar');
  qux.publish('qux');
  foo.publish('foo');
};

exports.testEventCombinationWithMultipleArgs = function(done){
  console.warn('fix me: event combination with multiple args');
  return done();

  var foo = map(),
      bar = map(),
      qux = map(),
      corge = map(foo, bar, qux, map());

  corge.subscribe(function(fo, o, bar, q, u, x){
    assert.equal(fo, 'fo');
    assert.equal(o, 'o');
    assert.equal(bar, 'bar');
    assert.equal(q, 'q');
    assert.equal(u, 'u');
    assert.equal(x, 'x');

    done();
  });

  bar.publish('bar');
  qux.publish('q', 'u', 'x');
  foo.publish('fo', 'o');
};

process.on('uncaughtException', function (err) {
  if(!err.ignore) throw err;
});
