var ak47 = (function(undef, undefined){

  function ak47(){
    var args = Array.prototype.slice.call(arguments),
        fn;

    /**
     * shortcut to 'newObject'
     *
     * @param {Object}
     * @return {Object}
     */
    if( (args.length == 1 || Array.isArray(args[1]) ) && typeof args[0] == 'object' && args[0].constructor == Object){
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

    return fn.apply(undef, args);
  }

  ak47.pubsub      = pubsub;
  ak47.property    = property;
  ak47.subscribeTo = subscribeTo;

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
      obj[key] = ( !Array.isArray(exceptions) || exceptions.indexOf(key) == -1 )
        && ( typeof val != 'object' || val.constructor != Object )
        && ( typeof val != 'function' )
        ? ( Array.isArray(val) && pubsub || property) (val)
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
          cb.callback.apply(undef, args);
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
      if(from.extendsAk47Pubsub && !from.hasCustomProxy && args.length > 1){
        Array.prototype.splice.apply(cb.harvest, [cb.column, args.length].concat(args));
      } else {
        cb.harvest[cb.column] = args[0];
      }

      oldValue = cb.harvest.value;

      if(!cb.batch()){
        cb.harvest.sync();

        if(cb.getter){
          newValue = cb.harvest.value = cb.getter.apply(undef, cb.harvest);
          cb.pubsub.publish(newValue, oldValue);
        } else {
          cb.pubsub.publish.apply(undef, cb.harvest);
        }
        return;
      }

      if(cb.harvest.call != undef){
        clearTimeout(cb.harvest.call);
        cb.call = undef;
      }

      cb.harvest.call = setTimeout(function(){
        cb.harvest.sync();

        if(cb.getter){
          newValue = cb.harvest.value = cb.getter.apply(undef, cb.harvest);
          cb.harvest.call = undef;
          cb.pubsub.publish(newValue, oldValue);
        } else {
          cb.pubsub.publish.apply(undef, cb.harvest);
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
      arguments.length && sub.apply(undef, arguments);
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
      publish.apply(undef, args);
    }

    proxy.subscribers       = [];
    proxy.subscribe         = sub;
    proxy.unsubscribe       = unsub;
    proxy.publish           = pub;
    proxy.extendsAk47Pubsub = true;
    proxy.hasCustomProxy    = !!customProxy;

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
    var value = undef,
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
      var old = !(options && options.skipPublishing) ? get() : undef;
      value = setter ? setter(update, value) : update;

      !(options && options.skipPublishing) && publish(proxy, get(), old);

      return value;
    }

    pubsub(proxy);

    proxy.isAK47Property = true;
    proxy.raw            = raw;

    proxy.publish = function publishProperty(){
      var args = [proxy, get()].concat(Array.prototype.slice.call(arguments));
      return publish.apply(undef, args);
    };

    rawValue !== value && set(rawValue, { skipPublishing: true });

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
    var args          = arguments,
        harvest       = [],
        subscriptions = [],
        setter        = args.length < 3 ||  isObservable(args[ args.length - 2]) ? undef : args[ args.length - 1 ],
        subscriber    = args[ args.length - ( setter ? 2 : args[args.length-1].extendsAk47Pubsub ? 0 : 1 ) ],
        batch         = true,
        proxy, callback, getter;

    function accessor(){
      if(arguments.length){
        return setter.apply(undef, arguments);
      }

      harvest.sync();

      return getter.apply(undef, harvest);
    }

    function loop(){
      var i   = -1,
          col = harvest.length,
          to  = arguments,
          len = to.length,
          prop;

      while( ++i < len ){
        prop = to[i];

        harvest[ col + i ]       = undef;
        subscriptions[ col + i ] = prop.isAK47Property ? prop : undef;

        prop.subscribe({
          isAk47Subscriber : true,
          callback         : callback,
          getter           : getter,
          setter           : setter,
          pubsub           : proxy,
          harvest          : harvest,
          column           : col + i,
          batch            : toBatch
        });
      }
    }

    function toBatch(){
      return batch;
    }

    if (!subscriber) {
      proxy = pubsub();
      getter = undef;
      callback = proxy.publish;
    } else {
      proxy = pubsub(accessor);
      getter = subscriber;
      callback = subscriber;
    }

    proxy.harvest        = harvest;
    proxy.isAK47Property = true;
    proxy.isAK47Callback = true;
    proxy.subscribeTo    = loop;
    proxy.subscriptions  = subscriptions;

    proxy.setter = function(){
      setter = arguments[0];
      return proxy;
    };

    proxy.sync = function sync(){
      batch = false;
      return proxy;
    };

    harvest.sync = function(){
      var i = -1, len = subscriptions.length;
      while( ++i < len ){
        if(harvest[i] != undef || !subscriptions[i]) continue;
        harvest[i] = subscriptions[i]();
      }
    };

    loop.apply(null, Array.prototype.slice.call(arguments, 0, arguments.length - ( setter ? 2 : subscriber ? 1 : 0 )));

    return proxy;
  };

  /**
   * Unsubscribe callback to given pubsub object.
   *
   * @param {Pubsub} to
   * @param {Function} callback
   */
  function unsubscribe(to, callback){
    var i = to.subscribers.length;

    while(i--){
      if(to.subscribers[i] && to.subscribers[i].callback == callback){
        to.subscribers[i] = undef;

        return i;
      }
    }

    return false;
  }

  return ak47;

}());

if(typeof module != 'undefined' && module.exports){
  module.exports = ak47;
}
