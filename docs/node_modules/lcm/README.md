# lcm

Compute the least common multiple using
[Euclid's algorithm](http://en.wikipedia.org/wiki/Euclidean_algorithm).

[![Build Status](https://travis-ci.org/nickleefly/node-lcm.svg?branch=master)](https://travis-ci.org/nickleefly/node-lcm)

# example

``` js
var lcm = require('lcm');
var n = lcm(21, 6);
console.log(n);
```

***

```
42
```

# methods

``` js
var lcm = require('lcm')
```

## lcm(a, b)

Return the least common multiple of the integers `a` and `b` using Euclid's
algorithm.

# install

With [npm](http://npmjs.org) do:

```
npm install lcm
```

# license

MIT
