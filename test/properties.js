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

