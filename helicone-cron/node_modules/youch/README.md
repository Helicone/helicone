# Youch!
> Pretty error reporting for Node.js :rocket:

<br />

<p>
  <a href="http://res.cloudinary.com/adonisjs/image/upload/v1485520687/Screen_Shot_2017-01-27_at_6.07.28_PM_blcaau.png">
    <img src="http://res.cloudinary.com/adonisjs/image/upload/v1485520687/Screen_Shot_2017-01-27_at_6.07.28_PM_blcaau.png" style="width: 600px;" />
  </a>
</p>

<br />

---

<br />

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Downloads Stats][npm-downloads]][npm-url]
[![Appveyor][appveyor-image]][appveyor-url]

[![Gitter Channel][gitter-image]][gitter-url]
[![Trello][trello-image]][trello-url]
[![Patreon][patreon-image]][patreon-url]

Youch is inspired by [Whoops](https://filp.github.io/whoops) but with a modern design. Reading stack trace of the console slows you down from active development. Instead **Youch** print those errors in structured HTML to the browser.

## Features
1. HTML reporter
2. JSON reporter, if request accepts a json instead of text/html.
3. Sorted frames of error stack.

> Checkout [youch terminal](https://github.com/poppinss/youch-terminal) to beautify errors on terminal.

## Installation
```bash
npm i --save youch
```

## Basic Usage
Youch is used by [AdonisJs](http://adonisjs.com), but it can be used by express or raw HTTP server as well.

```javascript
const Youch = require('youch')
const http = require('http')

http.createServer(function (req, res) {

  // PERFORM SOME ACTION
  if (error) {
    const youch = new Youch(error, req)

    youch
    .toHTML()
    .then((html) => {
      res.writeHead(200, {'content-type': 'text/html'})
      res.write(html)
      res.end()
    })
  }

}).listen(8000)
```

## Adding helpful links
Everytime an error occurs, we can help users we letting search for the error on Google, over even on the Github repo of our project. 

Youch let you define clickable links to redirect the user to a website with the error message.

```js
youch
.addLink(({ message }) => {
  const url = `https://stackoverflow.com/search?q=${encodeURIComponent(`[adonis.js] ${message}`)}`
  return `<a href="${url}" target="_blank" title="Search on stackoverflow">Search stackoverflow</a>`
})
.toHTML()
``` 

Also you can make use of [Font awesome brands icons](https://fontawesome.com/icons?d=gallery&s=brands&m=free) to display icons. 

**If you will use fontawesome icons, then Youch will automatically load the CSS files from the font awesome CDN for you.**

```js
youch
.addLink(({ message }) => {
  const url = `https://stackoverflow.com/search?q=${encodeURIComponent(`[adonis.js] ${message}`)}`
  return `<a href="${url}" target="_blank" title="Search on stackoverflow"><i class="fab fa-stack-overflow"></i></a>`
})
.toHTML()
```

## Release History
Checkout [CHANGELOG.md](CHANGELOG.md) file for release history.

## Meta
Checkout [LICENSE.md](LICENSE.md) for license information
Harminder Virk (Aman) - [https://github.com/thetutlage](https://github.com/thetutlage)


[appveyor-image]: https://ci.appveyor.com/api/projects/status/github/poppinss/youch?branch=master&svg=true&passingText=Passing%20On%20Windows
[appveyor-url]: https://ci.appveyor.com/project/thetutlage/youch

[npm-image]: https://img.shields.io/npm/v/youch.svg?style=flat-square
[npm-url]: https://npmjs.org/package/youch

[travis-image]: https://img.shields.io/travis/poppinss/youch/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/poppinss/youch

[gitter-url]: https://gitter.im/adonisjs/adonis-framework
[gitter-image]: https://img.shields.io/badge/gitter-join%20us-1DCE73.svg?style=flat-square

[trello-url]: https://trello.com/b/yzpqCgdl/adonis-for-humans
[trello-image]: https://img.shields.io/badge/trello-roadmap-89609E.svg?style=flat-square

[patreon-url]: https://www.patreon.com/adonisframework
[patreon-image]: https://img.shields.io/badge/patreon-support%20AdonisJs-brightgreen.svg?style=flat-square

[npm-downloads]: https://img.shields.io/npm/dm/youch.svg?style=flat-square
