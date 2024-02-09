# public-ip

> Get your public IP address - very fast!

In Node.js, it queries the DNS records of OpenDNS, Google DNS, and HTTPS services to determine your IP address. In browsers, it uses the excellent [icanhaz](https://github.com/major/icanhaz) and [ipify](https://ipify.org) services through HTTPS.

## Install

```sh
npm install public-ip
```

## Usage

```js
import publicIp from 'public-ip';

console.log(await publicIp.v4());
//=> '46.5.21.123'

console.log(await publicIp.v6());
//=> 'fe80::200:f8ff:fe21:67cf'
```

## API

### publicIp.v4(options?)
### publicIp.v6(options?)

Returns a `Promise<string>` with your public IPv4 or IPv6 address. Rejects on error or timeout. A `.cancel()` method is available on the promise, which can be used to cancel the request.

#### options

Type: `object`

##### onlyHttps

Type: `boolean`\
Default: `false`

Use a HTTPS check using the [icanhazip.com](https://github.com/major/icanhaz) service instead of the DNS query. [ipify.org](https://www.ipify.org) is used as a fallback if `icanhazip.com` fails. This check is much more secure and tamper-proof, but also a lot slower. **This option is only available in the Node.js version**. The default behaviour is to check against DNS before using HTTPS fallback. If set to `true`, it will *only* check against HTTPS.

##### fallbackUrls

Type: `string[]`\
Default: `[]`

Add your own custom HTTPS endpoints to get the public IP from. They will only be used if everything else fails. Any service used as fallback *must* return the IP as a plain string.

```js
import publicIp from 'public-ip';

await publicIp.v6({
	fallbackUrls: [
		'https://ifconfig.co/ip'
	]
});
```

##### timeout

Type: `number`\
Default: `5000`

The time in milliseconds until a request is considered timed out.

### IpNotFoundError

Error thrown when the public IP address could not be found.

### CancelError

Error thrown when the operation was canceled.

## Maintainers

- [Sindre Sorhus](https://github.com/sindresorhus)
- [silverwind](https://github.com/silverwind)

## Related

- [public-ip-cli](https://github.com/sindresorhus/public-ip-cli) - CLI for this module
- [internal-ip](https://github.com/sindresorhus/internal-ip) - Get your internal IP address
