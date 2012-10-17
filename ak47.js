var ak47 = (function(undefined){

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
    } else if(args.length > 1 && args.slice(0, args.length - 1).every(isProperty)){
      fn = subscribeAll;
    }

    return fn.apply(undefined, arguments);
  }

  ak47.nextTick   = nextTick;
  ak47.pubsub     = pubsub;
  ak47.property   = property;
  ak47.templating = templating;

  /**
   * Determine if given object is an ak47 propert
   *
   * @param {Any} el
   * @return {Boolean}
   */
  function isProperty(el){
    return el && el.isAK47Property;
  }

  /**
   * Clone given object by converting its content to ak47 properties.
   * Pass property names in "exceptions" to move properties without converting.
   *
   * @param {Object} raw
   * @param {Array} exceptions (optional)
   * @return {Object}
   */
  function newObject(raw, exceptions){
    var obj = {}, key, val;

    for(key in raw){
      val = raw[key];
      obj[key] = ( !Array.isArray(exceptions) || ! key in exceptions )
        && ( typeof val != 'function' || !val.isAK47Property )
        ? property(val)
        : val;
    }

    return obj;
  }

  /**
   * Publish "from" by applying given args
   *
   * @param {Pubsub} from
   * @param {...Any} args
   */
  function publish(from){
    var args = Array.prototype.slice.call(arguments, 1);

    nextTick(function(){
      from.subscribers.forEach(function(cb){
        if( !cb || typeof cb.fn != 'function' ) return;

        var allArgs = args;

        if( cb.updateOnly ){
          cb.harvest[cb.column] = allArgs[0];
          cb.harvest.counter++;

          if(cb.harvest.call != undefined){
            clearTimeout(cb.harvest.call);
            cb.call = undefined;
          }

          cb.harvest.call = setTimeout(function(){
            allArgs = cb.harvest.splice(0);

            cb.fn.apply(undefined, allArgs);
          }, 0);

          return;
        }

        nextTick(function(){
          cb.fn.apply(undefined, allArgs);
        });
      });
    });
  }

  /**
   * Create a new pub/sub channel
   *
   * @param {Any} customProxy (optional)
   * @return {Function}
   */
  function pubsub(customProxy){
    var proxy = customProxy || function proxy(){
      return sub.apply(undefined, arguments);
    };

    var sub   = subscribe.bind(undefined, proxy),
        unsub = unsubscribe.bind(undefined, proxy),
        pub   = publish.bind(undefined, proxy);

    proxy.subscribers = [];
    proxy.subscribe   = sub;
    proxy.unsubscribe = unsub;
    proxy.publish     = pub;

    return proxy;
  }

  /**
   * Create and return a new property.
   *
   * @param {Anything} rawValue
   * @param {Function} getter (optional)
   * @param {Function} setter (optional)
   */
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

      !noEmit && publish(proxy, get(), old);

      return value;
    }

    pubsub(proxy);

    proxy.isAK47Property = true;
    proxy.raw            = raw;

    proxy.publish = function publishProperty(){
      var args = [proxy, get()].concat(Array.prototype.slice.call(arguments));
      return publish.apply(undefined, args);
    };

    set(rawValue, true);

    return proxy;
  }

  /**
   * Subscribe callback to given pubsub object.
   *
   * @param {Pubsub} to
   * @param {Function} callback
   */
  function subscribe(to, callback){
    to.subscribers.push(typeof callback == 'function' ? { fn: callback } : callback);
  }

  /**
   * Subscribe callback to all given properties
   *
   * @param {...Property} to
   * @param {Function} callback
   */
  function subscribeAll(){
    var to      = Array.prototype.slice.call(arguments, 0, arguments.length - 1),
        harvest = [],
        cb      = arguments[arguments.length - 1];

    harvest.counter = 0;
    harvest.expected   = to.length;

    to.forEach(function(property, column){
      property.subscribe({ fn: cb, updateOnly: true, harvest: harvest, column: column });
    });
  };

  /**
   * Unsubscribe callback to given pubsub object.
   *
   * @param {Pubsub} to
   * @param {Function} callback
   */
  function unsubscribe(to, callback){
    var callbacks = to.subscribers;
    callbacks[ callbacks.indexOf(callback) ] = undefined;
  }

  /**
   * A tiny templating implementation.
   *
   * @param {String} template
   * @param {Object} vars
   * @return {String}
   */
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
