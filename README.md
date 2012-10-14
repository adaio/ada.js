Ak47 is a tiny JavaScript library for defining observable properties and objects that can interact with eachother.

# INSTALL

```bash
npm install ak47
```

# USAGE

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

## Objects Interacting with Eachother

```javascript

var mybike = ak47({ 'color': 'white', 'nickname': 'combat aircraft', 'price': 1100 }),
    mycar = ak47({ 'color': 'blue', 'brand': 'peugeot', 'price': 20000 }),
    myhouse = ak47({ 'neighborhood': 'oakland', 'price': 1300000 });

var myBikeView = ak47({
    model: mybike,
    html: 'I have a bike named {{ model.nickname }}. Its color is {{ model.color }}',
});

var myWealthView = ak47({
    mybike: myBikeView,
    total: ak47(myBikeView.model.price, mycar.price, myhouse.price, function(myBikePrice, myCarPrice, myHousePrice){
        return myBikePrice + myCarPrice + myHousePrice;
    }),
    html: 'My Wealth: {{ mybike }} . My total wealth is ${{ total }}'
});

myWealthView.total.subscribe(function(total){
    console.log(total); // 2321100
}):

myTotalWealth.total(); // 1321100

myhouse.price(2300000);
```

Testing
=======

```
npm test
```
