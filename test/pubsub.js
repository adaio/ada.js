var highkick = require('highkick'),
    ak47     = require('../'),
    assert   = require('assert');

var mybike = ak47({
  'color'    : 'white',
  'nickname' : 'combat aircraft',
  'price'    : ak47.property(1100, function(price){
    return price * 10;
  })
});

exports.testBasic = function(_done){

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
