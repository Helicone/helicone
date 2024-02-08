# is-ip [![Build Status](https://travis-ci.org/sindresorhus/is-ip.svg?branch=master)](https://travis-ci.org/sindresorhus/is-ip)

> Check if a string is an IP address


## Install

```
$ npm install is-ip
```


## Usage

```js
const isIp = require('is-ip');

isIp('192.168.0.1');
//=> true

isIp('1:2:3:4:5:6:7:8');
//=> true

isIp.v4('1:2:3:4:5:6:7:8');
//=> false
```


## API

### isIp(string)

Check if `string` is IPv4 or IPv6.

### isIp.v4(string)

Check if `string` is IPv4.

### isIp.v6(string)

Check if `string` is IPv6.

### isIp.version(string)

Returns `6` if `string` is IPv6, `4` if `string` is IPv4, or `undefined` if `string` is neither.

```js
isIp.version('192.168.0.1');
//=> 4

isIp.version('1:2:3:4:5:6:7:8');
//=> 6

isIp.version('abc');
//=> undefined
```


## Related

- [ip-regex](https://github.com/sindresorhus/ip-regex) - Regular expression for matching IP addresses
- [is-cidr](https://github.com/silverwind/is-cidr) - Check if a string is an IP address in CIDR notation
- [cidr-regex](https://github.com/silverwind/cidr-regex) - Regular expression for matching IP addresses in CIDR notation


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
