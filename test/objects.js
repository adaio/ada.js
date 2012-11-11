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

    wealth.subscribe(function(newValue, oldValue){
      assert.equal(oldValue, 2055000);
      assert.equal(newValue, 3055000);

      done();
    });

    house.price(3000000);

  }, 100);

};

exports.testObservingCustomPubSubs = function(done){
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
  }).batch();

  number(156);
  string('bar');

  array[1] = 0;
  array.publish(array);

  bool(true);
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
