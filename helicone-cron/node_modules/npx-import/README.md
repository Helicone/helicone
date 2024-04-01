# 🧙‍♂️ `npx-import` 🧙‍♀️

### Runtime dependencies, installed _as if by magic_ ✨

[![twitter](https://img.shields.io/badge/@glenmaddern-blue.svg?style=flat&logo=twitter&label=​)](https://twitter.com/glenmaddern)&nbsp; [![GitHub last commit](https://img.shields.io/github/last-commit/geelen/npx-import?logo=github&style=flat&label=​)](https://github.com/geelen/npx-import)&nbsp; [![npm](https://img.shields.io/npm/v/npx-import?label=​&logo=npm)](https://www.npmjs.com/package/npx-import) 

`npx-import` can be used as a drop-in replacement for [dynamic `import()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import):

```ts
import { npxImport } from 'npx-import'

// If big-dep isn't installed locally, npxImport will try
// to download, install & load it, completely seamlessly.
const dependency = await npxImport('big-dep')
```

It's exactly like [`npx`](https://docs.npmjs.com/cli/v8/commands/npx), but for `import()`! <sub><sub><sup>(hence the name)</sup></sub></sub>

Is this a good idea? See [FAQ](#faq) below.

## Usage

`npx-import` is ideal for deferring installation for dependencies that are unexpectedly large, require native compilation, or not used very often (or some combination thereof), for example:

```ts
// Statically import small/common deps as normal
import textRenderer from 'tiny-text-renderer'

// Use npxImport to defer
import { npxImport } from 'npx-import'

export async function writeToFile(report: Report, filename: string) {

  if (filename.endsWith('.png')) {
    console.log(`This is a PNG! We'll have to compile imagemagick!`)
    const { default: magick } = await npxImport('imagemagick-utils@^1.1.0')
    await magick.renderToPNG(report, filename)

  } else if (filename.endsWith('.pdf')) {
    console.log(`Argh, a PDF!? Go make a cuppa, this'll take a while...`)
    const { default: pdfBoi } = await npxImport('chonk-pdf-boi@3.1.4')
    await pdfBoi.generate(report, filename)

  } else {
    console.log(`Writing to ${filename}...`)
    await textRenderer.write(report, filename)
  }
  console.log(`Done!`)
}
```

When run, `npx-import` will log out some explanation, as well as instructions for installing the dependency locally & skipping this step in future:

```
❯ node ./index.js --filename=image.png

This is a PNG! We'll have to compile imagemagick!
[NPXI] imagemagick-utils not available locally. Attempting to use npx to install temporarily.
[NPXI] Installing... (npx -y -p imagemagick-utils@^1.1.0)
[NPXI] Installed into /Users/glen/.npm/_npx/8cac855b1579fd07/node_modules.
[NPXI] To skip this step in future, run: pnpm add -D imagemagick-utils@^1.1.0
Done!
```

For some types of dependencies, this is a much better UX than the alternatives:

- You either add `imagemagick-utils` & `chonk-pdf-boi` as dependencies, slowing down initial install.
- The first time a user tries to export a PNG/PDF, you error out with instructions to install the relevant package and retry.
- You pause, prompt the user for confirmation, then try to detect which package manager they're using and auto-install the dependency for them.

The last of these generally works well but `npx-import` has slightly different properties:

- The user doesn't need to be prompted—if the dependency can be sourced, installed & transparently included, the program doesn't need to be interrupted.
- Your user's current project directory is never altered as a side-effect of running a program.

Most importantly, though, **it's compatible with `npx`!** For example, `npx some-cli --help` can be super fast but `npx some-cli export --type=pdf` can transparently download the required dependencies during execution. It's super neat!

## Installation

```
npm install --save npx-import
pnpm add -P npx-import
yarn add npx-import
```

## Typescript

Just like `import()`, the return type default to `any`. But you can import the types of a devDependency without any consumers of your package needing to download it at installation time.

```
pnpm add -D big-dep
```

```ts
import { npxImport } from 'npx-import'
type BigDepType = typeof import('big-dep')

const bigDep = await npxImport<BigDepType>('big-dep')
```

## API

* Since package versions are no longer tracked in your `package.json`, we recommend being explicit:

```ts
const lazyDep = await npxImport('left-pad@1.3.0')
```

Any package specifier that's valid in `package.json` will work here: e.g. `^1.0.0`, `~2.3.0`, `>4.0.0`, `@latest`, `@next`, etc.

Note: there is a speed benefit from using exact versions. `npxImport(pkg-a@1.2.3)` will run `npx --prefer-offline` under the hood, making it faster after the first run (since it doesn't first check the NPM registry for newer versions).

* You can also install multiple packages at once:

```ts
const [depA, depB] = await npxImport(['dep-a@7.8.2', 'dep-b@7.8.2'])
```

`npx-import` also takes a third argument, which lets you customise, or silence, the log output. Each line that would normally be printed is passed to the logger function:

```ts
const grayLog = (line: string) => console.log(chalk.gray(line))
const [depA, depB] = await npxImport(['dep-a@7.8.2', 'dep-b@7.8.2'], grayLog)
```

* Use `npxResolve` instead of `require.resolve` to get the path (local or temporary)

```ts
export function getSQLiteNativeBindingLocation() {
  return path.resolve(
    path.dirname(npxResolve("better-sqlite3")),
    "../build/Release/better_sqlite3.node"
  );
}
```

Note, `npxResolve` requires that you'd previously called `npxImport` for the same package.

## FAQ

### 🤔 Isn't this, like, a heroically bad idea?

Nah it's good actually.

### 🤨 No but seriously, isn't using `npx` a big security hole?

Initially, `npx` didn't prompt before downloading and executing a package, which was _definitely_ a security risk. But that's been [fixed since version 7](https://github.com/npm/npx/issues/9#issuecomment-786940691). Now, if you're intending to write `npx prettier` to format your code and accidentally type `npx prettomghackmycomputerpls`, you'll get a helpful prompt:

```
❯ npx prettier@latest
Need to install the following packages:
  prettomghackmycomputerpls@6.6.6
Ok to proceed? (y)
```

This gives the user a chance to see their mistake and prevent being hacked to bits.

### 😠 But hang on, you're never prompting the user to confirm!

Ah yes, that seems to go against the previous point. But `npx-import` isn't being triggered from a potentially clumsy human on a keyboard, it's running inside some source code you've (by definition) already authorised to run on your machine.

`npx-import` is an alternative to publishing these as normal dependencies of your project and having your users download them at install time. `npm install` doesn't prompt the user to approve every transitive dependency of what's being installed/run, so `npx-import` doesn't either.

### 🧐 What if the user has already installed the dependency somewhere?

Then `npxImport` short-circuits, returning the local version without logging anything out. This is what the user is instructed to do to "skip this step in future". In other words, `npxImport()` first tries to call your native `import()`, and only does anything if that fails.

Note that this also works for multiple dependencies, `npxImport(['pkg-a', 'pkg-b', 'pkg-c'])` will only fetch & install those that are missing.

### 🤪 Doesn't this mean dependencies gets repeatedly downloaded & installed?

No! `npx` maintains a cache in the user's home directory. If a cached package is found, `npx` will (by default) hit NPM to check if there's any new versions for that specifier, and if not, return the cache. `npxImport` adds a small optimisation—if you specify an exact package version (e.g. `@7.8.2`), it'll run `npx --prefer-offline` to skip the NPM check.

So new packages are only downloaded & installed when:

* It's the first time a particular package/version combo is seen (see next section)
* No locked version was provided and there's a new version on NPM

### 😵‍💫 What about multiple projects? Doesn't the cache mean projects can clobber/overwrite/conflict with each other?

As it turns out, no! While I wasn't paying attention, `npx` got really smart! To understand why, we need to look at how `npx` works:

For starters, `npx some-pkg` is a shorthand for `npx -p some-pkg <command>`, where `<command>` is whatever `bin` that `some-pkg` declares. Often, the `<command>` and the package name are the same (e.g. `npx prettier`), but it's the `bin` field inside the package that's really being used. Otherwise, scoped packages (like `npx @11ty/eleventy`) would never work. If there's no `bin` field declared (e.g. for `chokidar`, you need `npx chokidar-cli`), or if there's more than one (e.g. for `typescript`, you need `npx -p typescript tsc`), you have to use the expanded form.

But there's no requirement that `<command>` is a `bin` inside the package at all! It can be any command (at least for `npx`, `pnpm dlx` and `yarn dlx` have different restrictions), for example, we can inject a `node -e` command and start to learn about what's going on:

```
❯ npx -y -p is-odd node -e 'console.log(process.env.PATH.split(":"))' | grep .npm/_npx
  '/Users/glen/.npm/_npx/e1b5bd0eb9f99fbc/node_modules/.bin',
```

Using `process.env.PATH` and searching for `.npm/_npx` is, on OSX with NPX v8+, a reliable way to find out where `npx` is installing these temporary packages. Let's look inside:

```
❯ ll2 /Users/glen/.npm/_npx/e1b5bd0eb9f99fbc/
drwxr-xr-x    - glen  4 Aug 11:07  /Users/glen/.npm/_npx/e1b5bd0eb9f99fbc
drwxr-xr-x    - glen  4 Aug 11:07 ├──  node_modules
.rw-r--r--  780 glen  4 Aug 11:07 │  ├──  .package-lock.json
drwxr-xr-x    - glen  4 Aug 11:07 │  ├──  is-number
drwxr-xr-x    - glen  4 Aug 11:07 │  └──  is-odd
.rw-r--r-- 1.4k glen  4 Aug 11:07 ├──  package-lock.json
.rw-r--r--   51 glen  4 Aug 11:07 └──  package.json

❯ cat /Users/glen/.npm/_npx/e1b5bd0eb9f99fbc/package.json
{
  "dependencies": {
    "is-odd": "^3.0.1"
  }
}
```

That looks like a pretty normal project directory to me!

> Aside, `ll2` is my super rad alias for `exa --icons -laTL 2`. See [exa](https://github.com/ogham/exa).

Now, the crucial bit: **every time `npx` runs for some unique set of packages it creates a new directory**. That goes for installing multiple deps at once but also for different named/pinned versions/tags for individual packages:

```
❯ export LOG_NPX_DIR="node -e 'console.log(process.env.PATH.split(\":\").filter(p => p.match(/\.npm\/_npx/)))'"

❯ npx -y -p is-odd $LOG_NPX_DIR
[ '/Users/glen/.npm/_npx/e1b5bd0eb9f99fbc/node_modules/.bin' ]

❯ npx -y -p is-odd@latest $LOG_NPX_DIR
[ '/Users/glen/.npm/_npx/ecc6e2260c717fec/node_modules/.bin' ]

❯ npx -y -p is-odd@3.0.1 $LOG_NPX_DIR
[ '/Users/glen/.npm/_npx/c41e9ab9d1d9c43f/node_modules/.bin' ]

❯ npx -y -p is-odd@\^3.0.1 $LOG_NPX_DIR
[ '/Users/glen/.npm/_npx/e86896689f5aebbb/node_modules/.bin' ]
```

Note that **every one of these commands downloaded the same version of `is-odd`**, but because they were referenced using different identifiers, `_` vs `latest` vs `3.0.1` vs `>3.0.1`, `npx` played it safe and made a new temporary directory.

For multiple packages, the same rule applies, although order is not important:

```
❯ npx -y -p is-odd -p is-even $LOG_NPX_DIR
[ '/Users/glen/.npm/_npx/f9af4fded130fd33/node_modules/.bin' ]

❯ npx -y -p is-even -p is-odd $LOG_NPX_DIR
[ '/Users/glen/.npm/_npx/f9af4fded130fd33/node_modules/.bin' ]

❯ ll2 /Users/glen/.npm/_npx/f9af4fded130fd33
drwxr-xr-x    - glen  4 Aug 11:37  /Users/glen/.npm/_npx/f9af4fded130fd33
drwxr-xr-x    - glen  4 Aug 11:37 ├──  node_modules
.rw-r--r-- 2.6k glen  4 Aug 11:37 │  ├──  .package-lock.json
drwxr-xr-x    - glen  4 Aug 11:37 │  ├──  is-buffer
drwxr-xr-x    - glen  4 Aug 11:37 │  ├──  is-even
drwxr-xr-x    - glen  4 Aug 11:37 │  ├──  is-number
drwxr-xr-x    - glen  4 Aug 11:37 │  ├──  is-odd
drwxr-xr-x    - glen  4 Aug 11:37 │  └──  kind-of
.rw-r--r-- 4.8k glen  4 Aug 11:37 ├──  package-lock.json
.rw-r--r--   76 glen  4 Aug 11:37 └──  package.json

❯ cat /Users/glen/.npm/_npx/f9af4fded130fd33/package.json
{
  "dependencies": {
    "is-even": "^1.0.0",
    "is-odd": "^3.0.1"
  }
}
```

So `npx` is doing exactly the same as an `npm install`, with a `package.json`, `package-lock.json`, `node_modules` etc. It's just dynamically creating directories based on some hash of its inputs. So the only way two projects can use the same package in the cache is if they _both_ ask for _exactly_ the same packages & versions. It's super clever!

### 😐 But what about transitive deps? Won't you get duplication?

Sadly, yes. If both your package `main-pkg` and `util-a` depend on `util-b`, then calling `npxImport('util-a')` from within `main-pkg` will create a new directory with a second copy of `util-b`. If there are globals in that package, or if the version specifiers are slightly different, you could potentially have problems.

It's probably possible to [detect this in future](https://github.com/geelen/npx-import/issues/2) and warn/error out. But for now, I recommend using `npxImport` for mostly self-contained dependencies.

### 🫤 What about version mismatch with local files?

If a user has `pkg-a` version `1.0.0` installed, but one of their packages calls `npxImport('pkg-a@^2.0.0')`, `npxImport` isn't smart enough ([yet](https://github.com/geelen/npx-import/issues/3)) to know that the local version of `pkg-a` doesn't match the version range specified (since it's using native `import()` under the hood). Without `npxImport`, the `npm install` step would have had a chance to bump the installed version of `pkg-a` to meet the requirements of _all_ packages being used, but we're bypassing that.

This will be fixed in a future version.

### 🫠 What kind of packages would you use this for?

- Anything with native extensions needing building (do that when you need it)
- Packages with large downloads (e.g. puppeteer, sqlite-node)
- CLI packages that want to make `npx my-cli --help` or `npx my-cli init` really fast and dependency-free, but also allow `npx my-cli <cmd>` to pull in arbitrary deps on-demand, without forcing the user to stop, create a local directory, and install dev dependencies.
- Anything already making heavy use of `npx`. You're in the jungle, baby.

---

Built with <3 during a massive yak shave by Glen Maddern.
