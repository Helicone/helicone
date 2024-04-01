**💛 You can help the author become a full-time open-source maintainer by [sponsoring him on GitHub](https://github.com/sponsors/egoist).**

---

# parse-package-name

[![npm version](https://badgen.net/npm/v/parse-package-name)](https://npm.im/parse-package-name) [![npm downloads](https://badgen.net/npm/dm/parse-package-name)](https://npm.im/parse-package-name)

## Install

```bash
npm i parse-package-name
```

## Usage

```ts
import { parse } from 'parse-package-name'

parse('@egoist/foo@1.0.0/bar.js')
//=>
// {name:'@egoist/foo', version:'1.0.0', path:'bar.js'}
```

`version` defaults to `latest` if not specified, `path` defaults to an empty string if not specified.

## Sponsors

[![sponsors](https://sponsors-images.egoist.sh/sponsors.svg)](https://github.com/sponsors/egoist)

## License

MIT &copy; [EGOIST](https://github.com/sponsors/egoist)
