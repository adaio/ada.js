var ak47 = (function(undefined){

  var nextTick = typeof process != 'undefined' && process.nextTick || function nextTick(fn){
    return setTimeout(fn, 0);
  };

  function ak47(){
    var args = Array.prototype.slice.call(arguments),
        fn;

    /**
     * shortcut to 'newObject'
     *
     * @param {Object}
     * @return {Object}
     */
    if(args.length == 1 && typeof args[0] == 'object' && args[0].constructor == Object){
      fn = newObject;

    /**
     * shortcut to 'subscribeTo'
     *
     * @param {Ak47Property...} to
     * @param {Function} callback
     * @param {Function} setter <optional>
     * @return {Ak47Property}
     */
    } else if(args.length > 1 && args.slice(0, args.length - 2).every(isObservable) && typeof args[ args.length - 2 ] == 'function' && typeof args[ args.length - 1 ] == 'function'){
      fn = subscribeTo;

    /**
     * shortcut to 'pubsub'
     *
     * @param {Array}
     * @return {Ak47Pubsub}
     */
    } else if(args.length == 1 && Array.isArray(args[0])) {
      fn = pubsub;

    /**
     * shortcut to 'property'
     *
     * @param {Anything} <optional>
     * @param {Function} getter <optional>
     * @param {Function} setter <optional>
     * @return {Ak47Property}
     */
    } else if(args.length) {
      fn = property;
      args = args.slice(0, 1);

    /**
     * shortcut to 'pubsub'
     *
     * @return {Ak47Pubsub}
     */
    } else {
      fn = pubsub;
    }

    return fn.apply(undefined, args);
  }

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

    var args = Array.prototype.slice.call(arguments, 1),
        newValue, oldValue;

    from.subscribers.forEach(function(cb, i){
      if( !cb || typeof cb.callback != 'function' ) return;

      /**
       * Callbacks subscribed via `subscribe` method.
       */
      if( !cb.isAk47Subscriber ){

        try {
          cb.callback.apply(undefined, args);
        } catch(exc) {
          setTimeout(function(){ throw exc; }, 0);
        }

        return;
      }

      /**
       * Functions subscribed via `subscribeTo`
       * (equivalent of ak47(properties..., function(){});
       * are marked as ak47Subscriber.
       */
      cb.harvest[cb.column] = args[0];
      oldValue              = cb.harvest.value;

      if(!cb.batch()){
        if(cb.getter){
          newValue = cb.harvest.value = cb.getter.apply(undefined, cb.harvest);
          cb.pubsub.publish(newValue, oldValue);
        } else {
          cb.pubsub.publish.apply(undefined, cb.harvest);
        }
        return;
      }

      if(cb.harvest.call != undefined){
        clearTimeout(cb.harvest.call);
        cb.call = undefined;
      }

      cb.harvest.call = setTimeout(function(){
        if(cb.getter){
          newValue = cb.harvest.value = cb.getter.apply(undefined, cb.harvest);
          cb.harvest.call = undefined;
          cb.pubsub.publish(newValue, oldValue);
        } else {
          cb.pubsub.publish.apply(undefined, cb.harvest);
        }
      }, 0);

    });
  }

  /**
   * Create a new pub/sub channel
   *
   * @param {Any} customProxy (optional)
   * @return {Function}
   */
  function pubsub(customProxy){
    var proxy = customProxy || function pubsubProxy(){
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
   * @param {Anything} rawValue (optional)
   * @param {Function} getter (optional)
   * @param {Function} setter (optional)
   * @return {Ak47Property}
   */
  function property(rawValue, getter, setter){
    var value = undefined,
        proxy = propertyProxy;

    function get(){
      return getter ? getter(value) : value;
    }

    function propertyProxy(update){
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

    function set(update, options){
      var old = !(options && options.skipPublishing) ? get() : undefined;
      value = setter ? setter(update, value) : update;

      !(options && options.skipPublishing) && publish(proxy, get(), old);

      return value;
    }

    pubsub(proxy);

    proxy.isAK47Property = true;
    proxy.raw            = raw;

    proxy.publish = function publishProperty(){
      var args = [proxy, get()].concat(Array.prototype.slice.call(arguments));
      return publish.apply(undefined, args);
    };

    set(rawValue, { skipPublishing: true });

    return proxy;
  }

  /**
   * Subscribe callback to given pubsub object.
   *
   * @param {Pubsub} to
   * @param {Function} callback
   */
  function subscribe(to, callback){
    if(!callback) throw new Error('Invalid callback: '+ callback);
    to.subscribers.push(typeof callback == 'function' ? { callback: callback } : callback);
  }

  /**
   * Subscribe to all given properties
   *
   * @param {Property...} to
   * @param {Ak47Pubsub, Function} subscriber
   * @param {Function} setter
   * @return {Ak47Property}
   */
  function subscribeTo(){
    var harvest    = [],

        setter     = arguments.length < 3 ||  isObservable(arguments[ arguments.length - 2]) ? undefined : arguments[ arguments.length - 1 ],
        subscriber = arguments[ arguments.length - ( setter ? 2 : 1 ) ],

        batch      = true,

        proxy, callback, getter;

    function accessor(){
      if(arguments.length){
        return setter.apply(undefined, arguments);
      }
      return getter.apply(undefined, harvest);
    }

    function subscribe(){
      var i = -1, col = harvest.length, to = arguments, prop;

      while( ++i < to.length ){
        prop = to[i];

        harvest[ col + i ] = prop.isAK47Property ? prop() : prop;

        prop.subscribe({
          isAk47Subscriber : true,
          callback         : callback,
          getter           : getter,
          setter           : setter,
          pubsub           : proxy,
          harvest          : harvest,
          column           : i,
          batch            : toBatch
        });
      }
    }

    function toBatch(){
      return batch;
    }

    if(subscriber.extendsAk47Pubsub){
      proxy = subscriber;
      getter = undefined;
      callback = subscriber.publish;
    } else {
      proxy = pubsub(accessor);
      getter = subscriber;
      callback = subscriber;
    }

    proxy.sync = function sync(){
      batch = false;
      return proxy;
    };

    proxy.isAK47Property = true;
    subscribe.apply(null, Array.prototype.slice.call(arguments, 0, arguments.length - ( setter ? 2 : 1 )));

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
