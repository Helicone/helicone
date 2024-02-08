var gcd = require('gcd');

module.exports = function lcm (a, b) {
    if (b === 0) return 0;
    return a * b / gcd(a, b);
};