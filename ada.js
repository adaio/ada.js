var ada = (function(undef, undefined){

  function ada(){
    var args = Array.prototype.slice.call(arguments),
        fn;

    /**
     * shortcut to 'newObject'
     *
     * @param {Object}
     * @return {Object}
     */
    if( (args.length == 1 || Array.isArray(args[1]) ) && args[0] && typeof args[0] == 'object' && args[0].constructor == Object){
      fn = newObject;

    /**
     * shortcut to 'subscribeTo'
     *
     * @param {AdaProperty...} to
     * @param {Function} callback
     * @param {Function} setter <optional>
     * @return {AdaProperty}
     */
    } else if(args.length > 1 && args.slice(0, args.length - 2).every(isObservable) && typeof args[ args.length - 2 ] == 'function' && typeof args[ args.length - 1 ] == 'function'){
      fn = subscribeTo;

    /**
     * shortcut to 'pubsub'
     *
     * @param {Array}
     * @return {AdaPubsub}
     */
    } else if(args.length == 1 && Array.isArray(args[0])) {
      fn = pubsub;

    /**
     * shortcut to 'property'
     *
     * @param {Anything} <optional>
     * @param {Function} getter <optional>
     * @param {Function} setter <optional>
     * @return {AdaProperty}
     */
    } else if(args.length) {
      fn = property;
      args = args.slice(0, 1);

    /**
     * shortcut to 'pubsub'
     *
     * @return {AdaPubsub}
     */
    } else {
      fn = pubsub;
    }

    return fn.apply(undef, args);
  }

  ada.pubsub        = pubsub;
  ada.property      = property;
  ada.subscribeTo   = subscribeTo;
  ada.unsubscribeTo = unsubscribeTo;

  /**
   * Determine if given parameter is observable
   *
   * @param {Any} el
   * @return {Boolean}
   */
  function isObservable(el){
    return el && el.extendsAdaPubsub;
  }

  /**
   * Clone given object by converting its content to ada properties.
   * Pass property, names in "exceptions" to move properties without converting.
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
        && ( typeof val != 'object' || !val || val.constructor != Object )
        && ( typeof val != 'function' )
        ? ( Array.isArray(val) && pubsub || property) (val)
        : val;
    }

    return obj;
  }

  /**
   * Publish "from" by applying given args
   *
   * @param {Object, Function} options, from
   * @param {...Any} args
   */
  function publish(options){
    var from;

    if(options.from){
      from = options.from;
    } else {
      from = options;
      options = {};
    }

    if(from && from.subscribers && from.subscribers.length == 0) {
      return;
    }

    var args = Array.prototype.slice.call(arguments, 1),
        newValue, oldValue;

    if(args[args.length - 1] && args[args.length - 1].isAdaChangeList){
      args = args.slice(0, args.length - 1);
    }

    from.subscribers.forEach(function(cb, i){
      if( !cb || typeof cb.callback != 'function' || cb.callback == options.skipPublishingTo ) return;

      /**
       * Callbacks subscribed via `subscribe` method.
       */
      if( !cb.isAdaSubscriber ){

        try {
          cb.callback.apply(undef, args);
        } catch(exc) {
          setTimeout(function(){ throw exc; }, 0);
        }

        return;
      }

      /**
       * Functions subscribed via `subscribeTo`
       * (equivalent of ada(properties..., function(){});
       * are marked as adaSubscriber.
       */
      if(from.extendsAdaPubsub && !from.hasCustomProxy && args.length > 1){
        Array.prototype.splice.apply(cb.harvest, [cb.column, args.length].concat(args));
      } else {
        cb.harvest[cb.column] = args[0];
        !cb.harvest.changed && ( cb.harvest.changed = [], cb.harvest.changed.isAdaChangeList = true );
        cb.harvest.changed.push(cb.column);
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

        var params = cb.harvest, passChangedList = true, i, sub;
        if(cb.harvest.changed){
          i = cb.pubsub.subscriptions.length;

          while( i-->0 ){
            sub = cb.pubsub.subscriptions[i];
            if(sub && sub.extendsAdaPubsub && !sub.hasCustomProxy){
              passChangedList = false;
              break;
            }
          }

          if(passChangedList){
            params = params.slice();
            params.push(cb.harvest.changed);
            cb.harvest.changed = undefined;
          }
        }

        if(cb.getter){
          newValue = cb.harvest.value = cb.getter.apply(undef, params);
          cb.harvest.call = undef;
          cb.pubsub.publish(newValue, oldValue);
        } else {
          cb.pubsub.publish.apply(undef, params);
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

    proxy.subscribers      = [];
    proxy.subscribe        = sub;
    proxy.unsubscribe      = unsub;
    proxy.publish          = pub;
    proxy.extendsAdaPubsub = true;
    proxy.hasCustomProxy   = !!customProxy;

    return proxy;
  }

  /**
   * Create and return a new property.
   *
   * @param {Anything} rawValue (optional)
   * @param {Function} getter (optional)
   * @param {Function} setter (optional)
   * @return {AdaProperty}
   */
  function property(rawValue, getter, setter){
    var value = undef,
        proxy = propertyProxy;

    function get(){
      return getter ? getter(value) : value;
    }

    function propertyProxy(update, options){
      if( arguments.length > 0 ){
        set(update, options);
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

      !(options && options.skipPublishing) && publish({ from: proxy, skipPublishingTo: options && options.skipPublishingTo }, get(), old);

      return value;
    }

    pubsub(proxy);

    proxy.isAdaProperty = true;
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
   * @param {AdaPubsub, Function} subscriber
   * @param {Function} setter
   * @return {AdaProperty}
   */
  function subscribeTo(){
    var args          = arguments,
        harvest       = [],
        subscriptions = [],
        setter        = args.length < 3 ||  isObservable(args[ args.length - 2]) ? undef : args[ args.length - 1 ],
        subscriber    = args[ args.length - ( setter ? 2 : args[args.length-1].extendsAdaPubsub ? 0 : 1 ) ],
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
        subscriptions[ col + i ] = prop.isAdaProperty ? prop : undef;

        prop.subscribe({
          isAdaSubscriber  : true,
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

    proxy.harvest       = harvest;
    proxy.isAdaProperty = true;
    proxy.isAdaCallback = true;
    proxy.subscribeTo   = loop;
    proxy.subscriptions = subscriptions;

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
        to.subscribers[i] = null;

        return i;
      }
    }

    return false;
  }

  /**
   * Unsubscribe to all given properties
   * @param {Property...} to
   * @param {AdaPubsub, Function} subscriber
   * @return {Boolean}
   */
  function unsubscribeTo(){
    var to         = Array.prototype.slice.call(arguments, 0, arguments.length - 1),
        subscriber = arguments[arguments.length - 1],
        result     = false;

    var i = to.length;
    while(i--){
      result = unsubscribe(to[i], subscriber) || result;
    }

    return result;
  }

  return ada;

}());

if(typeof module != 'undefined' && module.exports){
  module.exports = ada;
}
