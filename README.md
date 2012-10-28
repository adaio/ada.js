Ak47 is a tiny JavaScript library for defining observable properties and objects that can interact with eachother.

# INSTALL

```bash
npm install ak47
```

# USAGE EXAMPLES

## Observable Properties

```javascript

var foo = ak47({ 'bar': 3.14 });

foo.bar(); // 3.14
foo.bar(3.14159); // 3.14159

foo.bar.subscribe(function(update, old){ // or ak47(foo.bar, function(update){
  console.log(update, old); // puts whatever Math.PI is and 3.14159
});

foo.bar(Math.PI);
```

## Observable Objects

```javascript
var bike = ak47({ model: 'giant', price: 1000 }),
    car  = ak47({ model: 'peugeot', price: 10000 }),
    total: ak47(bike.price, car.price, function(bikePrice, carPrice){
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

```js
var foo = pubsub({});

foo.subscribe(function(a, b, c){
    console.log(a, b, c); // puts 3, 1, 4
});

foo.publish(3, 1, 4);
```

## Observing Arrays

```js


Testing
=======

```
npm test
```
