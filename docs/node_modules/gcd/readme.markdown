# gcd

Compute the greatest common divisor using
[Euclid's algorithm](https://en.wikipedia.org/wiki/Greatest_common_divisor#Using_Euclid.27s_algorithm).

[![testling badge](https://ci.testling.com/substack/node-gcd.png)](https://ci.testling.com/substack/node-gcd)

[![build status](https://secure.travis-ci.org/substack/node-gcd.png)](http://travis-ci.org/substack/node-gcd)

# example

``` js
var gcd = require('gcd');
var n = gcd(121,44);
console.log(n);
```

***

```
11
```

# methods

``` js
var gcd = require('gcd')
```

## gcd(a, b)

Return the greatest common divisor of the integers `a` and `b` using Euclid's
algorithm.

# install

With [npm](http://npmjs.org) do:

```
npm install gcd
```

# license

MIT
