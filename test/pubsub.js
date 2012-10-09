var highkick = require('highkick'),
    ak47     = require('../'),
    assert   = require('assert');

var mybike = ak47({
  'color'    : 'white',
  'nickname' : 'combat aircraft',
  'price'    : 1100
});

exports.testBasic = function(done){

  var colorUpdates = [], c = 0, priceUpdates = [], p = 0;

  mybike.color.subscribe(function(update, old){
    c++;
    assert.equal( c,  1 );
    colorUpdates.push([update, old]);
  });

  mybike.color.subscribe(function(update, old){
    c++;
    assert.equal( c, 2 );
    colorUpdates.push([update, old]);

    assert.deepEqual(colorUpdates, [['red', 'white'], ['red', 'white']]);

    p == 2 && done();
  });

  mybike.price.subscribe(function(update, old){
    p++;
    assert.equal( p, 1 );
    priceUpdates.push([update, old]);
  });

  mybike.price.subscribe(function(update, old){
    p++;
    assert.equal( p, 2 );
    priceUpdates.push([update, old]);

    assert.deepEqual(priceUpdates, [[10, 1100], [10, 1100]]);

    c == 2 && done();
  });

  mybike.color('red');
  mybike.price(10);

};
