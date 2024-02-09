var test = require('tape');
var lcm = require('../');

test('sanity values ripped from wikipedia', function (t) {
    t.equal(lcm(21, 6), 42);
    t.equal(lcm(4, 6), 12);
    t.equal(lcm(18, 10), 90);
    t.end();
});