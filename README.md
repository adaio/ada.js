Ak47 is a JavaScript library for creating objects that can interact with eachother.

# Install

```bash
npm install ak47
```

# Usage Example

```javascript

var mybike = ak47({ 'color': 'white', 'nickname': 'combat aircraft', 'price': 1100 }),
    mycar = ak47({ 'color': 'blue', 'brand': 'peugeot', 'price': 20000 }),
    myhouse = ak47({ 'neighborhood': 'oakland', 'price': 1300000 });

Object.keys(mybike); // color, nickname, price
mybike.color(); // white

mybike.color.subscribe(function(newValue, oldValue){ // or ak47(mybike.color, function(newValue){
    console.log(oldValue, newValue); // combat aircraft, public enemy
});

mybike.nickname('public enemy'); // public enemy

var myBikeView = ak47({
    model: mybike,
    html: 'I have a bike named {{ model.nickname }}. It's color is {{ model.color }}',
});

var myWealthView = ak47({
    mybike: myBikeView,
    total: ak47(mycar.price, myhouse.price, function(self, myCarPrice, myHousePrice){
        return self.model.price() + myCarPrice + myHousePrice;
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
