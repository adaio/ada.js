var highkick = require('highkick'),
    ak47     = require('../'),
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
