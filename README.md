Ak47 is a lightweight JavaScript library for defining observable properties that can interact with eachother. See examples and the code itself for documentation.

* Example App: http://jsfiddle.net/azer/AC6GL
* Performance Comparison with Backbone and Ember: http://jsfiddle.net/azer/TaADd/
* OOP W/ AK47: https://gist.github.com/4136102

![](https://pbs.twimg.com/media/A4QpVg8CcAAALMY.jpg)

# INSTALL

```bash
npm install ak47 # or wget https://raw.github.com/azer/ak47/master/ak47.min.js
```

# USAGE EXAMPLES

The simpliest usage would be:

```js
> var greeting = ak47('Hello'),
      name     = ak47('Kitty'),
      message  = ak47(greeting, name, function(greeting, name){ // or: ak47.subscribeTo( ...
        return greeting + ' ' + name + '!';
      });

> message();
"Hello Kitty!"

> message.subscribe(function(newMsg, oldMsg){
    console.log("[LOG] New message: " + newMsg);
  });

> greeting('Hi') & name('Azer');
> [LOG] New message: Hi Azer!

> message();
Hi Azer!
```

## Objects

```javascript
var bike  = ak47({ model: 'giant', price: 1000 }),
    car   = ak47({ model: 'peugeot', price: 10000 }),

    total = ak47(bike.price, car.price, function(bikePrice, carPrice){ // gets called when bike.price and/or car.price are updated
        return bikePrice + carPrice;
    });

console.log(total()); // puts 11000

total.subscribe(function(newTotalPrice, oldTotalPrice){
    console.log(totalPrice, oldTotalPrice); // puts 15000, 11000
    console.log(total()); // puts 15000.
});

bike.price(5000);
```

## OOP

```js

function Person(firstName, lastName){
  var obj = ak47({
    firstName: firstName,
    lastName: lastName
  });

  obj.fullName = ak47(obj.firstName, obj.lastName, function(first, last){
    return first + ' ' + last;
  });

  obj.onChange = ak47(obj.firstName, obj.lastName);

  return obj;
}

var john = Person('John', 'Lennon');

john.onChange(function(firstName, lastName){
  console.log('John has been updated: ', firstName, lastName);
});

assert.equal( john.fullName(), 'John Lennon');

john.firstName('John Winston'); // sets name as "John Winston"

assert.equal( john.fullName(), 'John Winston Lennon');
```

A more detailed example located here; https://gist.github.com/4136102

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
var foo = ak47();

foo(function(a, b, c){
    console.log(a, b, c); // puts 3, 1, 4
});

foo.publish(3, 1, 4);
```

```
var onFoo = ak47.pubsub(),
    onBar = ak47.pubsub(),
    onAny = ak47(onFoo, onBar);

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
