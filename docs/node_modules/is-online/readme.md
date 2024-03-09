# is-online

> Check if the internet connection is up

Works in Node.js and the browser *(with a bundler)*.

In the browser, there is already [`navigator.onLine`](https://developer.mozilla.org/en-US/docs/Web/API/NavigatorOnLine.onLine), but it's useless as it only tells you if there's a local connection, and not whether the internet is accessible.

## Install

```sh
npm install is-online
```

## Usage

```js
import isOnline from 'is-online';

console.log(await isOnline());
//=> true
```

## API

### isOnline(options?)

#### options

Type: `object`

##### timeout

Type: `number`\
Default: `5000`

Milliseconds to wait for a server to respond.

##### ipVersion

Type: `number`\
Values: `4 | 6`\
Default: `4`

The [Internet Protocol version](https://en.wikipedia.org/wiki/Internet_Protocol#Version_history) to use.

This is an advanced option that is usually not necessary to be set, but it can prove useful to specifically assert IPv6 connectivity.

## How it works

The following checks are run in parallel:

- Retrieve [icanhazip.com](https://github.com/major/icanhaz) (or [ipify.org](https://www.ipify.org) as fallback) via HTTPS.
- Query `myip.opendns.com` and `o-o.myaddr.l.google.com` DNS entries. *(Node.js only)*
- Retrieve Apple's Captive Portal test page (this is what iOS does). *(Node.js only)*

When any check succeeds, the returned Promise is resolved to `true`.

## Proxy support

To make it work through proxies, you need to set up [`global-agent`](https://github.com/gajus/global-agent).

## Maintainers

- [Sindre Sorhus](https://github.com/sindresorhus)
- [silverwind](https://github.com/silverwind)

## Related

- [is-online-cli](https://github.com/sindresorhus/is-online-cli) - CLI for this module
- [is-reachable](https://github.com/sindresorhus/is-reachable) - Check if servers are reachable
