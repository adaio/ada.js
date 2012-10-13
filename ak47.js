var ak47 = (function(undefined){

  var exports = {
    // 'pubsub': pubsub,
    'nextTick': nextTick,
    'property': property,
    'templating': templating
  };

  var nextTick = typeof process != 'undefined' && process.nextTick || function(fn){
    setTimeout(function(){ fn(); }, 0);
  };

  function ak47(){
    var args = Array.prototype.slice.call(arguments),
        fn;

    if(args.length == 1 && typeof args[0] == 'object'){
      fn = newObject;
    } else if( args.length == 2 && typeof args[0] == 'string' && typeof args[1] == 'object'){
      fn = templating;
    }

    return fn.apply(undefined, arguments);
  }

  ak47.nextTick   = nextTick;
  ak47.property   = property;
  ak47.templating = templating;

  function newObject(raw){
    var obj = {}, key, val;

    for(key in raw){
      val = raw[key];
      obj[key] = ( typeof val != 'function' || !val.isAK47Property ) ? property(val) : val;
    }

    return obj;
  }

  function emitUpdate(property, update, old){
    nextTick(function(){
      property.subscribers.forEach(function(cb){
        if( !cb || typeof cb.fn != 'function' ) return;

        nextTick(function(){
          cb.fn.call(undefined, update, old);
        });
      });
    });
  }

  function publish(property){
    emitUpdate(property, property());
  }

  function property(rawValue, getter, setter){
    var value = undefined;

    function get(){
      return getter ? getter(value) : value;
    }

    function proxy(update){
      if( arguments.length > 0 ){
        set(update);
      }

      return get();
    };

    function raw(update){
      if( arguments.length ){
        value = update;
      }

      return value;
    }

    function set(update, noEmit){
      var old = !noEmit ? get() : undefined;

      value = setter ? setter(update, value) : update;

      !noEmit && emitUpdate(proxy, get(), old);

      return value;
    }

    proxy.isAK47Property = true;
    proxy.publish = publish.bind(undefined, proxy);
    proxy.raw = raw;
    proxy.subscribers = [];
    proxy.subscribe = subscribe.bind(undefined, proxy);
    proxy.unsubscribe = unsubscribe.bind(undefined, proxy);

    set(rawValue, true);

    return proxy;
  }

  function subscribe(property, callback){
    property.subscribers.push({ fn: callback });
  }

  function unsubscribe(property, callback){
    var callbacks = property.subscribers;
    callbacks[ callbacks.indexOf(callback) ] = undefined;
  }

  function templating(template, vars) {
    return (template+'').replace(/\{\{([^{}]+)}}/g, function(tag, name) {
      return name in (vars || {}) ? (typeof vars[name] == 'function' ? vars[name]() : vars[name] ) : tag;
    });
  };

  return ak47;

}());

if(typeof module != 'undefined' && module.exports){
  module.exports = ak47;
}
