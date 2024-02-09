declare const isIp: {
	/**
	Check if `string` is IPv4 or IPv6.

	@example
	```
	import isIp = require('is-ip');

	isIp('192.168.0.1');
	//=> true

	isIp('1:2:3:4:5:6:7:8');
	//=> true
	```
	*/
	(string: string): boolean;

	/**
	Check if `string` is IPv4.

	@example
	```
	import isIp = require('is-ip');

	isIp.v4('192.168.0.1');
	//=> true
	```
	*/
	v4(string: string): boolean;

	/**
	Check if `string` is IPv6.

	@example
	```
	import isIp = require('is-ip');

	isIp.v6('1:2:3:4:5:6:7:8');
	//=> true
	```
	*/
	v6(string: string): boolean;

	/**
	@returns `6` if `string` is IPv6, `4` if `string` is IPv4, or `undefined` if `string` is neither.

	@example
	```
	import isIp = require('is-ip');

	isIp.version('192.168.0.1');
	//=> 4

	isIp.version('1:2:3:4:5:6:7:8');
	//=> 6

	isIp.version('abc');
	//=> undefined
	```
	*/
	version(string: string): 4 | 6 | undefined;
};

export = isIp;
