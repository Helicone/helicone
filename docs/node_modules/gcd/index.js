module.exports = function gcd (a, b) {
    if (b === 0) return a;
    return gcd(b, a % b);
};
