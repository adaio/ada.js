var ak47 = require('../ak47'),
    EventEmitter = require('events').EventEmitter;

var start = (console.profile || console.time).bind(console),
    end = (console.profileEnd || console.timeEnd).bind(console);

function b(name, fn){
  start(name);

  var i = 99999;
  while(i-->0){
    fn();
  }

  end(name);
}

b('plain', function(){

  var obj = {
    foo: 123,
    bar: 456,
    qux: undefined
  };

  obj.qux = obj.foo;

});

b('accessors', function(){

   var foo = 123,
       bar = 456,
       qux = undefined; 

  function getFoo(){
    return foo;
  }

  function setFoo(newValue){
    return foo = newValue;
  }

  function getBar(){
    return bar;
  }

  function setBar(newValue){
    return bar = newValue;
  }

  function getQux(){
    return qux;
  }

  function setQux(newValue){
    return qux = newValue;
  }

  var obj = {
    getFoo: getFoo,
    setFoo: setFoo,
    getBar: getBar,
    setBar: setBar,
    getQux: getQux,
    setQux: setQux
  };

  obj.setQux(obj.getFoo());

});

b('pubsub', function(){

   var foo = 123,
       bar = 456,
       qux = undefined; 

  var eventEmitter = new EventEmitter();

  function getFoo(){
    return foo;
  }

  function setFoo(newValue){
    return foo = newValue;
  }

  function getBar(){
    return bar;
  }

  function setBar(newValue){
    return bar = newValue;
  }

  function getQux(){
    return qux;
  }

  function setQux(newValue){
    var oldValue = qux;
    qux = newValue;
    eventEmitter.emit('quxChange', newValue, oldValue);
  }

  var obj = {
    getFoo: getFoo,
    setFoo: setFoo,
    getBar: getBar,
    setBar: setBar,
    getQux: getQux,
    setQux: setQux
  };

  obj.setQux(obj.getFoo());

  eventEmitter.on('quxChange', function(){});

});

b('ak47-accessors', function(){

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

});

b('ak47-subAll', function(){
  var obj = ak47({
    foo: 123,
    bar: 456,
    qux: undefined
  });

  ak47(obj.qux, function(){
  
  });

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
