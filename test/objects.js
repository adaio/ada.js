var highkick = require('highkick'),
    ak47     = require('./ak47'),
    assert   = require('assert');

exports.testBasic = function(done){
  var bike   = ak47({ model: 'giant', price: 1000 }),
      car    = ak47({ model: 'peugeot', price: 30000 }),
      garage = ak47({
        bike: bike,
        car: car,
        wealth: ak47(bike.price, car.price, function(bikePrice, carPrice){
          return bikePrice + carPrice;
        })
      });

  assert.equal(garage.bike, bike);
  assert.equal(garage.bike.price(), 1000);
  assert.equal(garage.car, car);
  assert.equal(garage.car.price(), 30000);
  assert.equal(garage.wealth(), 31000);

  bike.price(5000);

  setTimeout(function(){
    assert.equal(garage.wealth(), 35000);
    done();

  }, 100);

};

exports.testHarvestAccumulation = function(done){

  var bike   = ak47({ model: 'giant', price: undefined }),
      car    = ak47({ model: 'peugeot', price: 30000 }),
      house  = ak47({ district: 'oakland', price: 1000000 }),

      wealth = ak47(house.price, bike.price, car.price, function(housePrice, bikePrice, carPrice){
        return housePrice + ( bikePrice || 0 ) + carPrice;
      });

  assert.equal(wealth(), 1030000);

  bike.price(5000);
  house.price(2000000);

  setTimeout(function(){
    assert.equal(wealth(), 2035000);
    done();

  }, 100);

};

exports.testHarvestChaining = function(done){
  var bike   = ak47({ model: 'giant', price: undefined }),
      car    = ak47({ model: 'peugeot', price: 30000 }),
      house  = ak47({ district: 'oakland', price: 1000000 }),
      garage = ak47({
        bike: bike,
        car: car,
        total: ak47(bike.price, car.price, function(bikePrice, carPrice){
          return ( bikePrice || 0 ) + carPrice;
        })
      }),
      wealth = ak47(house.price, garage.total, function(housePrice, garageTotal){
        return ( housePrice || 0 ) + garageTotal;
      });

  assert.equal( garage.total(), 30000);
  assert.equal( house.price(), 1000000);
  assert.equal( wealth(), 1030000);

  bike.price(5000);
  car.price(50000);
  house.price(2000000);

  setTimeout(function(){
    assert.equal(garage.total(), 55000);
    assert.equal(wealth(), 2055000);

    wealth.subscribe(function(newValue){
      assert.equal(newValue, 3055000);

      done();
    });

    house.price(3000000);

  }, 100);

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
      onChange = ak47(n, r);

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
      onChange = ak47(n, r);

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
      onChange = ak47(n, r),
      onFoo    = ak47.pubsub(),
      onBar    = ak47.pubsub();

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
      onChange = ak47(n1, n2),
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

  n1(20);
  n2(30);

  changed = true;

  sumPlus10.subscribe(function(newSum, oldSum){
    assert.equal(newSum, 60);
    assert.equal(oldSum, undefined);

    done();
  });

};

exports.testDateObjects = function(done){

  var now = new Date,
      date = ak47(now);

  assert.equal(date(), now);

  date.subscribe(function(update){
    assert.equal(update, now);
    done();
  });

  setTimeout(function(){

    date(now = new Date);

  }, 100);
};

exports.testArray = function(done){

  var arr1 = [],
      arr2 = [],
      foo = ak47({
        bar: arr1
      });

  assert.equal(foo.bar.extendsAk47Pubsub, true);
  assert.equal(foo.bar, arr1);
  assert.equal(foo.bar, arr1);

  assert.equal(ak47(arr2), arr2);
  assert.equal(arr2.extendsAk47Pubsub, true);

  done();
};
