var highkick = require('highkick'),
    ada     = require('./ada'),
    assert   = require('assert');

function combat(){
  return {
    'color': 'white',
    'nickname': 'combat aircraft',
    'price': 1100
  };
}

exports.testBasic = function(done){

  var mybike = ada(combat());

  assert.equal(typeof mybike.color, 'function');
  assert.equal(mybike.color(), 'white');
  assert.equal(mybike.nickname(), 'combat aircraft');
  assert.equal(mybike.price(), 1100);

  mybike.price(2500);

  assert.equal(mybike.price(), 2500);

  done();
};

exports.testMethods = function(done){


  var bike = combat();
  bike.foo = pi;

  bike = ada(bike);

  assert.equal(bike.foo, pi);
  assert.equal(bike.foo(), pi());

  done();

  function pi(){
    return 3.14;
  };

};

exports.testGetterSetter = function(done){

  var bike = combat();
  bike.color = ada.property('white', function(color){
    return color.toUpperCase();
  });

  var oldPrice = undefined;
  bike.price = ada.property(1100, null, function(update, old){
    assert.equal(old, oldPrice);
    return update * 100;
  });

  var mybike = ada(bike);

  assert.equal(mybike.color.raw(), 'white');
  assert.equal(mybike.color(), 'WHITE');

  mybike.color('red');
  assert.equal(mybike.color(), 'RED');

  oldPrice = mybike.price();

  assert.equal(mybike.price(), oldPrice);

  mybike.price(12);
  assert.equal(mybike.price(), 1200);

  oldPrice = 1200;

  mybike.price(13);
  assert.equal(mybike.price(), 1300);

  done();

};

exports.testRaw = function(done){

  var foo = ada.property(500, function(f){ return f * 10; }, function(f){ return f / 2; });

  assert.equal(foo(), 5000);
  assert.equal(foo.raw(), 500);

  foo(10);
  assert.equal(foo(), 50);

  foo.raw(10);
  assert.equal(foo(), 100);

  done();

};

exports.testPubsub = function(_done){

  var mybike = ada(combat());
  mybike.price = ada.property(1100, function(price){
    return price * 10;
  });

  function done(){
    c == 2 && p == 2 && _done();
  }

  var colorUpdates = [], c = 0, priceUpdates = [], p = 0;

  mybike.color.subscribe(function(update, old){
    colorUpdates.push([update, old]);
  });

  mybike.color.subscribe(function(update, old){
    c++;

    colorUpdates.push([update, old]);

    c == 2 && assert.deepEqual(colorUpdates, [['red', 'white'], ['red', 'white'], ['red', undefined], ['red', undefined]]);

    done();
  });

  mybike.price.subscribe(function(update, old){
    priceUpdates.push([update, old]);
  });

  mybike.price.subscribe(function(update, old){
    p++;

    priceUpdates.push([update, old]);
    p == 2 && assert.deepEqual(priceUpdates, [[100, 11000], [100, 11000], [100, undefined], [100, undefined]]);

    done();
  });

  mybike.color('red');
  mybike.price(10);

  mybike.color.publish();
  mybike.price.publish();

};

exports.testSubscribeTo = function(done){
  var foo = ada(3),
      bar = ada(foo, function(f){
        assert(f == 14 || f == 24);
        return f * 10;
      });

  foo(14);
  assert.equal(bar(), 140);

  foo(24);
  assert.equal(bar(), 240);

  done();

};

exports.testUnsubscribeTo = function(done){
  var foo = ada(3),
      bar = ada(4);

  function cb(){
    throw new Error('callback shouldnt have been called');
  };

  ada.subscribeTo(foo, bar, cb);
  ada.unsubscribeTo(foo, bar, cb);

  assert(foo.subscribers.every(function(el){ return el == null; }));
  assert(bar.subscribers.every(function(el){ return el == null; }));

  foo(5);
  bar(6);

  done();
};

exports.testUnsubscribeToAll = function(done){
  var foo = ada(3),
      bar = ada(4),
      qux = ada(5);

  function cb(){
    throw new Error('callback shouldnt have been called');
  };

  var a = ada(foo, bar, qux, cb);

  a.unsubscribeToAll();

  assert(foo.subscribers.every(function(el){ return el == null; }));
  assert(bar.subscribers.every(function(el){ return el == null; }));
  assert(qux.subscribers.every(function(el){ return el == null; }));

  foo(5);
  bar(6);
  qux(7);

  done();
};

exports.testSubscribeToBatching = function(done){

  var mybike = ada(combat()),
      values = [['red', 2000, 'foo'], ['blue', 2000, 'quux']],
      y = 0;

  function observer(color, price, name){

    assert.equal(color, values[y][0]);
    assert.equal(price, values[y][1]);
    assert.equal(name, values[y][2]);

    y++;

    if(y==2) done();
  }

  ada(mybike.color, mybike.price, mybike.nickname, observer);

  mybike.nickname('foo');
  mybike.price(2000);
  mybike.color('red');

  setTimeout(function(){
    mybike.nickname('quux');
    mybike.color('blue');
  }, 100);

};


exports.testSubscribeToTree = function(done){

  var foo = ada(3),

      bar = ada(foo, function(foo){
        return foo * 10;
      }),

      qux = ada(bar, function(bar){
        return bar * 2;
      }),

      corge = ada(qux, function(qux){
        return qux * 5;
      });

  assert.equal(foo(), 3);
  assert.equal(bar(), 30);
  assert.equal(qux(), 60);
  assert.equal(corge(), 300);

  foo(10);
  assert.equal(foo(), 10);

  setTimeout(function(){
    assert.equal(bar(), 100);
    assert.equal(qux(), 200);

    setTimeout(function(){
      assert.equal(corge(), 1000);

      done();

    }, 0);
  }, 0);
};


exports.testSubscribeToWithSetter = function(done){
  var foo = ada(3),
      bar = ada(14),

      qux = ada(foo, bar, function(foo, bar){
        return foo + bar;
      }, foo),

      corge = ada(qux, function(qux){
        return qux * 10;
      }, qux);

  assert.equal(qux(), 17);
  assert.equal(corge(), 170);

  qux(6);

  setTimeout(function(){

    assert.equal(qux(), 20);
    assert.equal(corge(), 200);

    corge(8);

    setTimeout(function(){

      assert.equal(qux(), 22);
      assert.equal(corge(), 220);

      done();

    }, 0);

  }, 0);

};

exports.testPubsubSubscribesToProperties = function(done){
  var n1 = ada(3),
      n2 = ada(6),
      onChange = ada(n1, n2);

  onChange(function(n1, n2){
    assert.equal(n1, 30);
    assert.equal(n2, 60);

    done();
  });

  n1(30);
  n2(60);
};

exports.testPubsubSubscribesToSyncProperties = function(done){
  var n1 = ada(3),
      n2 = ada(6),
      onChange = ada(n1, n2).sync();

  var n = [[30, 6], [30, 60]], i=0;

  onChange(function(n1, n2){
    assert.equal(n1, n[i][0]);
    assert.equal(n2, n[i][1]);

    i == 1 && done();
    i++;
  });

  n1(30);
  n2(60);
};

exports.testDate = function(done){
  var mybike = combat(),
      date = new Date;

  mybike.date = date;

  mybike = ada(mybike);

  assert.equal(mybike.date(), date);

  done();
}

exports.testFunction = function(done){

  // FIXME
  return done();

  function f(){ return 3.14; };

  var foo = ada(f),
      bar = ada.property(f);

  assert.equal(foo(), 3.14);
  assert.equal(bar(), 3.14);

  done();
};

exports.testCreateViaProxy = function(done){
  var foo = ada(3.14);
  assert.equal(foo(), 3.14);
  assert(foo.isAdaProperty);
  done();
};

exports.testSkipSettingDefaultValue = function(done){
  var failed = false;
  var foo = ada(undefined, undefined, function(){
    failed = true;
    done(new Error('setter shouldnt have been called'));
  });

  !failed && done();
};

exports.testNull = function(done){
  var n = ada(null),
      on = ada({ n: null });

  assert.equal(n(), null);
  assert.equal(on.n(), null);
  done();
};

exports.testSkipPublishingTo = function(done){
  var foo = ada.property();

  function shouldBeCalled(){
    done();
  }

  function shouldNotBeCalled(){
    throw new Error('this subscriber should ve been skipped!!');
  }

  foo.subscribe(shouldNotBeCalled);
  foo.subscribe(shouldBeCalled);

  foo(314, { skipPublishingTo: shouldNotBeCalled });
};

exports.testChanged = function(done){
  var foo = ada(3),
      bar = ada(4),
      qux = ada(foo, bar, function(foo, bar, changed){
        assert.deepEqual(changed, { 0: 0, isAdaChangeList: true });
        return foo + bar + 10;
      }),
      quux = ada(5),
      span = ada(9),
      corge = ada(qux, quux, span, function(qux, quux, span, changed){
        if(first){
          assert.deepEqual(changed, { 0: 2, 1: 0, isAdaChangeList: true });
          first = false;
        } else {
          assert.deepEqual(changed, { 0: 1, isAdaChangeList: true });
          done();
        }
        return qux + quux;
      }),
      first = true;

  foo(7);
  span(10);

  setTimeout(function(){ quux(100); }, 250);
};


