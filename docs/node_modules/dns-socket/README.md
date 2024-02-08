# dns-socket
[![](https://img.shields.io/npm/v/dns-socket.svg?style=flat)](https://www.npmjs.org/package/dns-socket) [![](https://img.shields.io/npm/dm/dns-socket.svg)](https://www.npmjs.org/package/dns-socket) [![](https://api.travis-ci.org/mafintosh/dns-socket.svg?style=flat)](https://travis-ci.org/mafintosh/dns-socket)

Make low-level DNS requests with retry and timeout support.

```
npm install dns-socket
```

## Usage

``` js
const dnsSocket = require('dns-socket')
const socket = dnsSocket()

socket.query({
  questions: [{
    type: 'A',
    name: 'google.com'
  }]
}, 53, '8.8.8.8', (err, res) => {
  console.log(err, res) // prints the A record for google.com
})
```

## API

#### `var socket = dns([options])`

Create a new DNS socket instance. The `options` object includes:

- `retries` *Number*: Number of total query attempts made during `timeout`. Default: 5.
- `socket` *Object*: A custom dgram socket. Default: A `'udp4'` socket.
- `timeout` *Number*: Total timeout in milliseconds after which a `'timeout'` event is emitted. Default: 7500.
- `maxQueries` *Number*: Each request has an id, this is stored as static sized array. maxQueries is the size of this array, limiting the max number of inflight requests. Default: 10000.
- `maxRedirects` *Number*: If you query for a single `A` record and get back `CNAME`, the lib will try to follow the chain and resolve the `CNAME` to A. The maximum number of steps is defined by the `maxRedirects`. Default: 0
- `timeoutChecks` *Number*: Timeouts are checked each `timeoutChecks` ms, for large number of parallel request, you might want to increase this number. Default: `timeout` / 10

#### `socket.on('query', query, port, host)`

Emitted when a dns query is received. The query is a [dns-packet](https://github.com/mafintosh/dns-packet)

#### `socket.on('response', response, port, host)`

Emitted when a dns response is received. The response is a [dns-packet](https://github.com/mafintosh/dns-packet)

#### `var id = socket.query(query, port, [host], [callback])`

Send a dns query. If host is omitted it defaults to `127.0.0.1`. When the remote replies the callback is called with `(err, response, query)` and an response is emitted as well. If the query times out the callback is called with an error.
The `host` parameter can be an array, during resolve the lib will randomly select one host.

Returns the query id

#### `socket.response(query, response, port, [host])`

Send a response to a query.

#### `socket.cancel(id)`

Cancel a query

#### `socket.bind([port][, address][, onlistening])`
#### `socket.bind(options, [onlistening])`

Bind the underlying udp socket to a specific port. Takes the same arguments as [socket#bind](https://nodejs.org/docs/latest/api/dgram.html#dgram_socket_bind_port_address_callback).

#### `socket.destroy([onclose])`

Destroy the socket.

#### `socket.inflight`

Number of inflight queries.

## License

MIT
