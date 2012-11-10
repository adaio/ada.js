var highkick = require('highkick'),
    ak47     = require('../'),
    assert   = require('assert');

function combat(){
  return {
    'color': 'white',
    'nickname': 'combat aircraft',
    'price': 1100
  };
}

exports.testBasic = function(done){

  var mybike = ak47(combat());

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

  bike = ak47(bike);

  assert.equal(bike.foo, pi);
  assert.equal(bike.foo(), pi());

  done();

  function pi(){
    return 3.14;
  };

};

exports.testGetterSetter = function(done){

  var bike = combat();
  bike.color = ak47.property('white', function(color){
    return color.toUpperCase();
  });

  var oldPrice = undefined;
  bike.price = ak47.property(1100, null, function(update, old){
    assert.equal(old, oldPrice);
    return update * 100;
  });

  var mybike = ak47(bike);

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

exports.testPubsub = function(_done){

  var mybike = ak47(combat());
  mybike.price = ak47.property(1100, function(price){
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

exports.testSubscribeAll = function(done){

  var mybike = ak47(combat()),
      values = [['red', 2000, 'foo'], ['blue', 2000, 'quux']],
      y = 0;

  function observer(color, price, name){

    assert.equal(color, values[y][0]);
    assert.equal(price, values[y][1]);
    assert.equal(name, values[y][2]);

    y++;

    if(y==2) done();
  }

  ak47(mybike.color, mybike.price, mybike.nickname, observer).batch();

  mybike.nickname('foo');
  mybike.price(2000);
  mybike.color('red');

  setTimeout(function(){
    mybike.nickname('quux');
    mybike.color('blue');
  }, 100);

};

exports.testSubscribeAllSetter = function(done){

  var foo = ak47(3),
      bar = ak47(14),

      qux = ak47(foo, bar, function(foo, bar){
        return foo + bar; 
      }, foo),

      corge = ak47(qux, function(qux){
        return qux * 10; 
      }).setter(qux);


  assert.equal(qux(), 17);
  assert.equal(corge(), 170);

  qux(6);

  assert.equal(qux(), 20);
  assert.equal(corge(), 200);

  corge(8);

  assert.equal(qux(), 22);
  assert.equal(corge(), 220);

  done();
}

exports.testSubscribeAllTree = function(done){

  var foo = ak47(3),

      bar = ak47(foo, function(foo){
        return foo * 10;
      }),

      qux = ak47(bar, function(bar){
        return bar * 2;
      }),

      corge = ak47(qux, function(qux){
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
}

exports.testDate = function(done){
  var mybike = combat(),
      date = new Date;

  mybike.date = date;

  mybike = ak47(mybike);

  assert.equal(mybike.date(), date);

  done();
}

exports.testFunction = function(done){

  // FIXME
  return done();

  function f(){ return 3.14; };

  var foo = ak47(f),
      bar = ak47.property(f);

  assert.equal(foo(), 3.14);
  assert.equal(bar(), 3.14);

  done();
};

exports.testCreateViaProxy = function(done){
  var foo = ak47(3.14);
  assert.equal(foo(), 3.14);
  assert(foo.isAK47Property);
  done();
}
