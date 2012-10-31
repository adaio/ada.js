var ak47 = (function(undefined){

  var nextTick = typeof process != 'undefined' && process.nextTick || function(fn){
    setTimeout(function(){ fn(); }, 0);
  };

  function ak47(){
    var args = Array.prototype.slice.call(arguments),
        fn;

    if(args.length == 1 && typeof args[0] == 'object' && args[0].constructor == Object){
      fn = newObject;
    } else if(args.length > 1 && args.slice(0, args.length - 1).every(isObservable)){
      fn = subscribeAll;
    } else if(args.length == 1 && Array.isArray(args[0])) {
      fn = pubsub;
    } else if(args.length) {
      fn = property;
      args = args.slice(0, 1);
    } else {
      fn = pubsub;
    }

    return fn.apply(undefined, args);
  }

  ak47.nextTick   = nextTick;
  ak47.pubsub     = pubsub;
  ak47.property   = property;

  /**
   * Determine if given parameter is observable
   *
   * @param {Any} el
   * @return {Boolean}
   */
  function isObservable(el){
    return el && el.extendsAk47Pubsub;
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
        && ( typeof val != 'object' || val.constructor != Object )
        && ( typeof val != 'function' )
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
    if(from && from.subscribers && from.subscribers.length == 0) return;

    var args = Array.prototype.slice.call(arguments, 1);

    nextTick(function(){

      from.subscribers.forEach(function(cb, i){
        if( !cb || typeof cb.fn != 'function' ) return;

        if( cb.ak47Subscriber ){
          cb.harvest[cb.column] = args[0];

          if(cb.harvest.call != undefined){
            clearTimeout(cb.harvest.call);
            cb.call = undefined;
          }

          cb.harvest.call = setTimeout(function(){
            cb.harvest.call = undefined;

            var oldValue = cb.harvest.value;
            cb.harvest.value = cb.fn.apply(undefined, cb.harvest),

            cb.property.publish(cb.harvest.value, oldValue);
          }, 0);

          return;
        }

        nextTick(function(){
          cb.fn.apply(undefined, args);
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

    function sub(callback){
      subscribe(proxy, callback);
    }

    function unsub(callback){
      unsubscribe(proxy, callback);
    }

    function pub(){
      var args = [proxy];
      Array.prototype.push.apply(args, arguments);
      publish.apply(undefined, args);
    }

    proxy.subscribers       = [];
    proxy.subscribe         = sub;
    proxy.unsubscribe       = unsub;
    proxy.publish           = pub;
    proxy.extendsAk47Pubsub = true;

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


    var i = -1, property;
    while( ++i < to.length ){
      property = to[i];
      harvest[i] = typeof property == 'function' ? property() : property;
      property.subscribe({ fn: cb, property: proxy, ak47Subscriber: true, harvest: harvest, column: i });
    }

    function proxy(){
      return cb.apply(this, harvest);
    };

    pubsub(proxy);
    proxy.isAK47Property = true;
    proxy.raw            = proxy;

    return proxy;
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

  return ak47;

}());

if(typeof module != 'undefined' && module.exports){
  module.exports = ak47;
}
