Ak47 is a lightweight JavaScript library for defining observable properties that can interact with eachother. See examples and the code itself for documentation.

* Example App: http://jsfiddle.net/azer/AC6GL
* Performance Comparison with Backbone and Ember: http://jsfiddle.net/azer/TaADd/

# INSTALL

```bash
npm install ak47 # or wget https://raw.github.com/azer/ak47/master/ak47.min.js
```

# USAGE EXAMPLES

The simpliest usage would be:

```js
> var greeting = ak47('Hello World');
> greeting.subscribe(console.log);
> greeting()
"Hello World"
> greeting("what's up?")
"what's up?"
> "what's up?", "Hello World" // see 2nd line
```

## Bindings, Observable Properties

```js

var foo = ak47({ 'bar': 3.14 });

foo.bar(); // 3.14
foo.bar(3.14159); // 3.14159

foo.bar.subscribe(function(update, old){ // or ak47(foo.bar, function(update){
  console.log(update, old); // puts whatever Math.PI is and 3.14159
});

foo.bar(Math.PI);
```

```javascript
var bike  = ak47({ model: 'giant', price: 1000 }),
    car   = ak47({ model: 'peugeot', price: 10000 }),
    total = ak47(bike.price, car.price, function(bikePrice, carPrice){
        return bikePrice + carPrice;
    });

console.log(total()); // puts 11000

total.subscribe(function(newTotalPrice, oldTotalPrice){
    console.log(totalPrice, ); // puts 15000, 11000
    console.log(total()); // puts 15000.
});

bike.price(5000);
```

## Getters and Setters

```javascript
function getter(str){
    return str.toUpperCase();
}

function setter(newValue, oldValue){
    return '~' + newValue;
}

var color = ak47.property('white', getter, setter);

console.log( color() ); // puts "~WHITE"

color('red');

console.log( color() ); // puts "~RED"

console.log( color.raw() ): // puts "red"
```

## PubSub

Extending AK47's PubSub:

```js
var foo = ak47.pubsub({});

foo.subscribe(function(a, b, c){
    console.log(a, b, c); // puts 3, 1, 4
});

foo.publish(3, 1, 4);
```

Creating a new PubSub Object:

```js
var bar = ak47.pubsub(); // or ak47();

bar(function(a, b, c){ // or bar.subscribe(function ..
  console.log(a, b, c); // puts 3, 1, 4
});

bar.publish(3, 1, 4);
```

## Observing Arrays

```js
var fibs = ak47([0, 1, 1, 2, 3, 5]);

console.log(fibs); // puts [0, 1, 1, 2, 3, 5]

fibs.subscribe(function(a, b){
  console.log(a, b); // puts "publishing", "manually"
});

fibs.publish('publishing', 'manually');

```

## Observing Other Data Tyeps

```js

var pi = ak47(3.14);

pi.subscribe(function(update, old){
  console.log(update, old); // puts 3.14156, 3.14
});

pi(3.14156);
```

Testing
=======

```
npm test
```

License
=======

WTFPL
