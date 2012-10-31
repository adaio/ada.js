var start = (/*console.profile || */console.time).bind(console),
    end = (/*console.profileEnd || */ console.timeEnd).bind(console);

function b(name, fn){
  start(name);

  var i = 33333;
  while(i-->0){
    fn();
  }

  end(name);
}

b('backbone-model', function(){

  var M = Backbone.Model.extend({
    defaults: {
      foo: 123,
      bar: 456,
      qux: undefined
    }
  });

  var o = new M();

  o.on('change:qux', function(model){
  });

  o.set({ qux: o.get('bar') });

}); 

b('ember-plain', function(){

  var obj = Ember.Object.create({
    foo: 123,
    bar: 456,
    qux: undefined
  });

  obj.set('qux', obj.get('foo'));

});

b('ember-plain-observing', function(){

  var obj = Ember.Object.create({
    foo: 123,
    bar: 456,
    qux: undefined
  });

  obj.addObserver('qux', function(){
  });

  obj.set('qux', obj.get('foo'));

});

b('ember-model', function(){

  var M = Ember.Object.extend({
    foo: 123,
    bar: 456,
    qux: undefined
  });

  var o = M.create();

  o.addObserver('qux', function(){
  });

  o.set('qux', o.get('foo'));

});

b('ak47-plain', function(){

  var obj = ak47({
    foo: 123,
    bar: 456,
    qux: undefined
  });

  obj.qux(obj.foo);

});

b('ak47-sub', function(){
  var obj = ak47({
    foo: 123,
    bar: 456,
    qux: undefined
  });

  obj.qux.subscribe(function(){
  });

  obj.qux(obj.foo());

});

b('ak47-subAll', function(){
  var obj = ak47({
    foo: 123,
    bar: 456,
    qux: undefined
  });

  ak47(obj.qux, function(){
  });

  obj.qux(obj.foo());

});

b('ak47-pubsub', function(){
  var obj = ak47({
    foo: 123,
    bar: 456,
    qux: undefined
  });

  obj.qux.subscribe(function(){
  });

  obj.qux(obj.foo());

});


b('ak47-model', function(){

  function M(){
    return ak47({
      foo: 123,
      bar: 456,
      qux: undefined
    });
  }

  var o = M(); 
  o.qux.subscribe(function(){
  });
  o.qux(o.foo());


});
