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

    function set(update){
      value = setter ? setter(update, value, document) : update;
      // document.id && document.id.schema.publish.withoutUpdate(document, fieldName);
    }

    proxy.raw = raw;

    set(rawValue);

    return proxy;
  }

  /*
   * Below function is stolen from: https://gist.github.com/1347239
   */
  function templating(a,b) {
    return(a+'').replace(/\{\{([^{}]+)}}/g, function(c,d) {
      return d in (b||{}) ? (/^f/.test(typeof b[d]) ? b[d]() :b[d] ) : c;
    });
  };

  return exports;

}());

if(typeof module != 'undefined' && module.exports){
  module.exports = ak47;
}
