'use strict'

const dgram = require('dgram')
const util = require('util')
const packet = require('dns-packet')
const events = require('events')

module.exports = DNS

function DNS (opts) {
  if (!(this instanceof DNS)) {
    return new DNS(opts)
  }
  if (!opts) {
    opts = {}
  }

  events.EventEmitter.call(this)

  const self = this

  this.retries = opts.retries !== undefined ? opts.retries : 5
  this.timeout = opts.timeout || 7500
  this.timeoutChecks = opts.timeoutChecks || (this.timeout / 10)
  this.destroyed = false
  this.inflight = 0
  this.maxQueries = opts.maxQueries || 10000
  this.maxRedirects = opts.maxRedirects || 0
  this.socket = opts.socket || dgram.createSocket('udp4')
  this._id = Math.ceil(Math.random() * this.maxQueries)
  this._queries = new Array(this.maxQueries).fill(null)
  this._interval = null

  this.socket.on('error', onerror)
  this.socket.on('message', onmessage)
  if (isListening(this.socket)) onlistening()
  else this.socket.on('listening', onlistening)
  this.socket.on('close', onclose)

  function onerror (err) {
    if (err.code === 'EACCES' || err.code === 'EADDRINUSE') {
      self.emit('error', err)
    } else {
      self.emit('warning', err)
    }
  }

  function onmessage (message, rinfo) {
    self._onmessage(message, rinfo)
  }

  function ontimeoutCheck () {
    self._ontimeoutCheck()
  }

  function onlistening () {
    self._interval = setInterval(ontimeoutCheck, self.timeoutChecks)
    self.emit('listening')
  }

  function onclose () {
    self.emit('close')
  }
}

util.inherits(DNS, events.EventEmitter)

DNS.RECURSION_DESIRED = DNS.prototype.RECURSION_DESIRED = packet.RECURSION_DESIRED
DNS.RECURSION_AVAILABLE = DNS.prototype.RECURSION_AVAILABLE = packet.RECURSION_AVAILABLE
DNS.TRUNCATED_RESPONSE = DNS.prototype.TRUNCATED_RESPONSE = packet.TRUNCATED_RESPONSE
DNS.AUTHORITATIVE_ANSWER = DNS.prototype.AUTHORITATIVE_ANSWER = packet.AUTHORITATIVE_ANSWER
DNS.AUTHENTIC_DATA = DNS.prototype.AUTHENTIC_DATA = packet.AUTHENTIC_DATA
DNS.CHECKING_DISABLED = DNS.prototype.CHECKING_DISABLED = packet.CHECKING_DISABLED

DNS.prototype.address = function () {
  return this.socket.address()
}

DNS.prototype.bind = function (...args) {
  const onlistening = args.length > 0 && args[args.length - 1]
  if (typeof onlistening === 'function') {
    this.once('listening', onlistening)
    this.socket.bind(...args.slice(0, -1))
  } else {
    this.socket.bind(...args)
  }
}

DNS.prototype.destroy = function (onclose) {
  if (onclose) {
    this.once('close', onclose)
  }
  if (this.destroyed) {
    return
  }
  this.destroyed = true
  clearInterval(this._interval)
  this.socket.close()

  for (let i = 0; i < this.maxQueries; i++) {
    const q = this._queries[i]
    if (q) {
      q.callback(new Error('Socket destroyed'))
      this._queries[i] = null
    }
  }
  this.inflight = 0
}

DNS.prototype._ontimeoutCheck = function () {
  const now = Date.now()
  for (let i = 0; i < this.maxQueries; i++) {
    const q = this._queries[i]

    if ((!q) || (now - q.firstTry < (q.tries + 1) * this.timeout)) {
      continue
    }

    if (q.tries > this.retries) {
      this._queries[i] = null
      this.inflight--
      this.emit('timeout', q.query, q.port, q.host)
      q.callback(new Error('Query timed out'))
      continue
    }
    q.tries++
    this.socket.send(q.buffer, 0, q.buffer.length, q.port, Array.isArray(q.host) ? q.host[Math.floor(q.host.length * Math.random())] : q.host || '127.0.0.1')
  }
}

DNS.prototype._shouldRedirect = function (q, result) {
  // no redirects, no query, more than 1 questions, has any A record answer
  if (this.maxRedirects <= 0 || (!q) || (q.query.questions.length !== 1) || result.answers.filter(e => e.type === 'A').length > 0) {
    return false
  }

  // no more redirects left
  if (q.redirects > this.maxRedirects) {
    return false
  }

  const cnameresults = result.answers.filter(e => e.type === 'CNAME')
  if (cnameresults.length === 0) {
    return false
  }

  const id = this._getNextEmptyId()
  if (id === -1) {
    q.callback(new Error('Query array is full!'))
    return true
  }

  // replace current query with a new one
  q.query = {
    id: id + 1,
    flags: packet.RECURSION_DESIRED,
    questions: [{
      type: 'A',
      name: cnameresults[0].data
    }]
  }
  q.redirects++
  q.firstTry = Date.now()
  q.tries = 0
  q.buffer = packet.encode(q.query)
  this._queries[id] = q
  this.socket.send(q.buffer, 0, q.buffer.length, q.port, Array.isArray(q.host) ? q.host[Math.floor(q.host.length * Math.random())] : q.host || '127.0.0.1')
  return true
}

DNS.prototype._onmessage = function (buffer, rinfo) {
  let message

  try {
    message = packet.decode(buffer)
  } catch (err) {
    this.emit('warning', err)
    return
  }

  if (message.type === 'response' && message.id) {
    const q = this._queries[message.id - 1]
    if (q) {
      this._queries[message.id - 1] = null
      this.inflight--

      if (!this._shouldRedirect(q, message)) {
        q.callback(null, message)
      }
    }
  }

  this.emit(message.type, message, rinfo.port, rinfo.address)
}

DNS.prototype.unref = function () {
  this.socket.unref()
}

DNS.prototype.ref = function () {
  this.socket.ref()
}

DNS.prototype.response = function (query, response, port, host) {
  if (this.destroyed) {
    return
  }

  response.type = 'response'
  response.id = query.id
  const buffer = packet.encode(response)
  this.socket.send(buffer, 0, buffer.length, port, host)
}

DNS.prototype.cancel = function (id) {
  const q = this._queries[id]
  if (!q) return

  this._queries[id] = null
  this.inflight--
  q.callback(new Error('Query cancelled'))
}

DNS.prototype.setRetries = function (id, retries) {
  const q = this._queries[id]
  if (!q) return
  q.firstTry = q.firstTry - this.timeout * (retries - q.retries)
  q.retries = this.retries - retries
}

DNS.prototype._getNextEmptyId = function () {
  // try to find the next unused id
  let id = -1
  for (let idtries = this.maxQueries; idtries > 0; idtries--) {
    const normalizedId = (this._id + idtries) % this.maxQueries
    if (this._queries[normalizedId] === null) {
      id = normalizedId
      this._id = (normalizedId + 1) % this.maxQueries
      break
    }
  }
  return id
}

DNS.prototype.query = function (query, port, host, cb) {
  if (this.destroyed) {
    cb(new Error('Socket destroyed'))
    return 0
  }

  this.inflight++
  query.type = 'query'
  query.flags = typeof query.flags === 'number' ? query.flags : DNS.RECURSION_DESIRED

  const id = this._getNextEmptyId()
  if (id === -1) {
    cb(new Error('Query array is full!'))
    return 0
  }

  query.id = id + 1
  const buffer = packet.encode(query)

  this._queries[id] = {
    callback: cb || noop,
    redirects: 0,
    firstTry: Date.now(),
    query: query,
    tries: 0,
    buffer: buffer,
    port: port,
    host: host
  }
  this.socket.send(buffer, 0, buffer.length, port, Array.isArray(host) ? host[Math.floor(host.length * Math.random())] : host || '127.0.0.1')
  return id
}

function noop () {
}

function isListening (socket) {
  try {
    return socket.address().port !== 0
  } catch (err) {
    return false
  }
}
