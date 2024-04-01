# rollup-plugin-inject

Scan modules for global variables and inject `import` statements where necessary

## Archived (Migration to Mono-Repo In-Process)

This repository has been archived and is in the process of being migrated to a new monorepo. Please bear with us as we make this transition. More information to follow.

## Installation

```bash
npm install --save-dev rollup-plugin-inject
```


## Usage

```js
import { rollup } from 'rollup';
import inject from 'rollup-plugin-inject';

rollup({
  entry: 'main.js',
  plugins: [
    inject({
      // control which files this plugin applies to
      // with include/exclude
      include: '**/*.js',
      exclude: 'node_modules/**',

      /* all other options are treated as modules...*/

      // use the default – i.e. insert
      // import $ from 'jquery'
      $: 'jquery',

      // use a named export – i.e. insert
      // import { Promise } from 'es6-promise'
      Promise: [ 'es6-promise', 'Promise' ],

      // use a namespace import – i.e. insert
      // import * as fs from 'fs'
      fs: [ 'fs', '*' ],

      // use a local module instead of a third-party one
      'Object.assign': path.resolve( 'src/helpers/object-assign.js' ),

      /* ...but if you want to be careful about separating modules
         from other options, supply `options.modules` instead */

      modules: {
        $: 'jquery',
        Promise: [ 'es6-promise', 'Promise' ],
        'Object.assign': path.resolve( 'src/helpers/object-assign.js' )
      }
    })
  ]
}).then(...)
```
