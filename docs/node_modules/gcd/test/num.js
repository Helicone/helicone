var test = require('tape');
var gcd = require('../');

test('sanity values ripped from wikipedia', function (t) {
    t.equal(gcd(48, 18), 6);
    t.equal(gcd(54, 24), 6);
    t.equal(gcd(48, 180), 12);
    t.end();
});
