var highkick = require('highkick'),
    ak47     = require('../'),
    assert   = require('assert');

exports.testTemplating = function(done){

  var vars = { foo: 'span', bar: 'eggs', qux: 'corge' },
      a    = ak47('hello {{foo}}', vars),
      b    = ak47('hello {{bar}} foo: {{foo}} qux: {{qux}}', vars),
      c    = ak47('hello {{ foo }}', vars);

  assert.equal(a, 'hello span');
  assert.equal(b, 'hello eggs foo: span qux: corge');
  assert.equal(c, 'hello {{ foo }}');

  done();

};

